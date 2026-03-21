import { Request, Response } from 'express';
import { db } from '../db';
import { interviews, jobApplications, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { transporter } from '../utils/mailer';
import { createMeetEvent } from '../utils/googleCalendar';
import { createCalendlyEvent, formatCalendlyInviteUrl } from '../utils/calendly';
import { checkConnection, createNylasEvent } from '../utils/nylasCalendar';

// Helper: format date to readable string
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper: format time to readable string
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

export const scheduleInterview = async (req: Request, res: Response) => {
  try {
    const {
      jobApplicationId,
      interviewerId,
      scheduledAt,
      interviewType,   // "Online" | "Face to Face" | "Calendly"
      location,        // required if Face to Face
      notes,
      durationMinutes = 60, // Default 60 minutes for the interview
      calendlyEventUrl,
      calendlyEventTypeUrl,
    } = req.body;

    // Validate required fields
    if (!jobApplicationId || !interviewerId || !interviewType) {
      return res.status(400).json({
        success: false,
        message: 'jobApplicationId, interviewerId, and interviewType are required.',
      });
    }

    if (interviewType !== 'Calendly' && !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'scheduledAt is required for Online and Face to Face interviews.',
      });
    }

    if (!['Online', 'Face to Face', 'Calendly'].includes(interviewType)) {
      return res.status(400).json({
        success: false,
        message: "interviewType must be either 'Online', 'Face to Face', or 'Calendly'.",
      });
    }

    if (interviewType === 'Face to Face' && !location) {
      return res.status(400).json({
        success: false,
        message: 'location is required for Face to Face interviews.',
      });
    }

    if (interviewType === 'Calendly' && !calendlyEventUrl && !calendlyEventTypeUrl) {
      return res.status(400).json({
        success: false,
        message: 'One of calendlyEventUrl or calendlyEventTypeUrl is required for Calendly interviews.',
      });
    }

    // Fetch application details (to get candidate info)
    const appRef = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, Number(jobApplicationId)))
      .limit(1);

    if (appRef.length === 0) {
      return res.status(404).json({ success: false, message: 'Job Application not found.' });
    }
    const application = appRef[0];

    // Fetch interviewer details
    const interRef = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(interviewerId)))
      .limit(1);

    if (interRef.length === 0) {
      return res.status(404).json({ success: false, message: 'Interviewer not found.' });
    }
    const interviewer = interRef[0];

    const scheduledDate = interviewType === 'Calendly' && !scheduledAt ? new Date() : new Date(scheduledAt);
    const readableDate = formatDate(scheduledDate);
    const readableTime = formatTime(scheduledDate);

    let meetingLink: string | null = null;
    let nylasEventId: string | null = null;

    // ─── AUTO-GENERATE MEETING LINK ──────────────────────────────────────────────
    if (interviewType === 'Online') {
      // Check if Nylas is connected first (preferred for free tier)
      const nylasConnection = await checkConnection();

      if (nylasConnection.connected) {
        try {
          console.log('📅 Using Nylas for calendar integration...');
          const nylasEvent = await createNylasEvent({
            title: `Interview - ${application.fullName}`,
            scheduledAt: scheduledDate,
            durationMinutes,
            attendeeEmails: [application.email, interviewer.email],
            description: `Job position interview. Candidate: ${application.fullName}`,
          });

          nylasEventId = nylasEvent.eventId;
          meetingLink = nylasEvent.htmlLink || null;
          console.log('✅ Nylas event created with ID:', nylasEventId);
        } catch (nylasError: any) {
          console.warn('⚠️ Nylas failed, falling back to Google Calendar:', nylasError.message);
          // Fall back to Google Calendar if Nylas fails
          try {
            meetingLink = await createMeetEvent({
              title: `Interview - ${application.fullName}`,
              scheduledAt: scheduledDate,
              durationMinutes,
              attendeeEmails: [application.email, interviewer.email],
              description: `Job position interview. Candidate: ${application.fullName}`,
            });
            console.log('✅ Google Meet link generated as fallback:', meetingLink);
          } catch (googleError: any) {
            console.error('❌ Both Nylas and Google Calendar failed:', googleError.message);
            return res.status(500).json({
              success: false,
              message: `Failed to create calendar event. Nylas: ${nylasError.message}. Google: ${googleError.message}`,
            });
          }
        }
      } else {
        // Use Google Calendar if Nylas not connected
        try {
          console.log('📅 Using Google Calendar for Meet link generation...');
          meetingLink = await createMeetEvent({
            title: `Interview - ${application.fullName}`,
            scheduledAt: scheduledDate,
            durationMinutes,
            attendeeEmails: [application.email, interviewer.email],
            description: `Job position interview. Candidate: ${application.fullName}`,
          });
          console.log('✅ Google Meet link generated:', meetingLink);
        } catch (error: any) {
          console.error('❌ Google Meet generation failed:', error.message);
          return res.status(500).json({
            success: false,
            message: `Failed to generate meeting link: ${error.message}. Please check your Google Cloud credentials in .env`,
          });
        }
      }
    } else if (interviewType === 'Calendly') {
      try {
        if (calendlyEventUrl) {
          meetingLink = calendlyEventUrl;
        } else {
          const endTime = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000);
          const calendlyResult = await createCalendlyEvent({
            eventTypeUrl: calendlyEventTypeUrl,
            inviteeName: application.fullName,
            inviteeEmail: application.email,
            startTime: scheduledDate.toISOString(),
            endTime: endTime.toISOString(),
            timezone: 'Asia/Kolkata',
          });
          meetingLink = calendlyResult.publicUrl;
        }

        if (!meetingLink) {
          throw new Error('Unable to determine Calendly meeting link.');
        }

        meetingLink = formatCalendlyInviteUrl(meetingLink);
        console.log('✅ Calendly meeting link prepared:', meetingLink);
      } catch (calendlyError: any) {
        console.error('❌ Calendly scheduling failed:', calendlyError.message);
        return res.status(500).json({
          success: false,
          message: `Failed to create Calendly booking: ${calendlyError.message}`,
        });
      }
    }

    // Save interview to DB
    const newInterview = await db
      .insert(interviews)
      .values({
        jobApplicationId: Number(jobApplicationId),
        interviewerId: Number(interviewerId),
        scheduledAt: scheduledDate,
        interviewType,
        meetingLink: ['Online', 'Calendly'].includes(interviewType) ? meetingLink : null,
        location: interviewType === 'Face to Face' ? location : null,
        notes,
        status: 'scheduled',
      })
      .returning();

    // ─── SEND EMAIL NOTIFICATIONS ───────────────────────────────────────────

    if (interviewType === 'Face to Face') {
      // Email to Candidate
      const candidateMailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Interview Scheduled</h1>
          </div>
          <div style="padding: 28px;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${application.fullName}</strong>,</p>
            <p style="color: #6b7280;">We are pleased to inform you that your interview has been scheduled. Here are the details:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; width: 40%; border-bottom: 1px solid #e5e7eb;">📅 Date</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableDate}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">⏰ Time</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableTime} IST</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">🗂️ Type</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>Face to Face</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">📍 Location</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${location}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600;">🧑‍💼 Interviewer</td>
                <td style="padding: 12px 16px; color: #111827;"><strong>${interviewer.name}</strong></td>
              </tr>
            </table>

            ${notes ? `<p style="color: #6b7280; font-size: 14px;"><strong>Additional Notes:</strong> ${notes}</p>` : ''}

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 16px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⚠️ Please arrive <strong>10 minutes early</strong> and carry a valid ID proof.
              </p>
            </div>

            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
              If you have any questions, please reach out to us. We look forward to meeting you!
            </p>
            <p style="color: #374151;">Best regards,<br/><strong>Bynaric Careers Team</strong></p>
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 Bynaric Systems. All rights reserved.</p>
          </div>
        </div>
      `;

      // Email to Interviewer
      const interviewerMailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Interview Assignment</h1>
          </div>
          <div style="padding: 28px;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${interviewer.name}</strong>,</p>
            <p style="color: #6b7280;">You have been assigned to conduct a Face to Face interview. Here are the details:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; width: 40%; border-bottom: 1px solid #e5e7eb;">👤 Candidate</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${application.fullName}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">📅 Date</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableDate}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">⏰ Time</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableTime} IST</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600;">📍 Location</td>
                <td style="padding: 12px 16px; color: #111827;"><strong>${location}</strong></td>
              </tr>
            </table>

            ${notes ? `<p style="color: #6b7280; font-size: 14px;"><strong>Notes:</strong> ${notes}</p>` : ''}

            <p style="color: #374151; margin-top: 24px;">Best regards,<br/><strong>Bynaric HR Team</strong></p>
          </div>
        </div>
      `;

      // Send both emails (non-blocking)
      await Promise.all([
        transporter.sendMail({
          from: `"Bynaric Careers" <${process.env.EMAIL_USER}>`,
          to: application.email,
          subject: `Interview Scheduled - ${readableDate} at ${readableTime}`,
          html: candidateMailHtml,
        }),
        transporter.sendMail({
          from: `"Bynaric HR" <${process.env.EMAIL_USER}>`,
          to: interviewer.email,
          subject: `Interview Assignment - ${application.fullName} on ${readableDate}`,
          html: interviewerMailHtml,
        }),
      ]);
    }

    if (interviewType === 'Online') {
      // Simple notification email for Online interview
      const onlineCandidateMail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Online Interview Scheduled</h1>
          </div>
          <div style="padding: 28px;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${application.fullName}</strong>,</p>
            <p style="color: #6b7280;">Your online interview has been scheduled. Please join using the link below.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; width: 40%; border-bottom: 1px solid #e5e7eb;">📅 Date</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableDate}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">⏰ Time</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableTime} IST</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600;">🔗 Google Meet</td>
                <td style="padding: 12px 16px;"><a href="${meetingLink}" style="color: #e11d48; font-weight: bold; text-decoration: none;">Join Meeting</a></td>
              </tr>
            </table>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-top: 16px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                💡 A Google Calendar invitation has been sent to your email. The meeting link will also appear in your calendar.
              </p>
            </div>

            ${notes ? `<p style="color: #6b7280; margin-top: 16px;"><strong>Additional Notes:</strong> ${notes}</p>` : ''}
            <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">If you have any questions, please reach out to us.</p>
            <p style="color: #374151;">Best regards,<br/><strong>Bynaric Careers Team</strong></p>
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 Bynaric Systems. All rights reserved.</p>
          </div>
        </div>
      `;

      const onlineInterviewerMail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Online Interview Assignment</h1>
          </div>
          <div style="padding: 28px;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${interviewer.name}</strong>,</p>
            <p style="color: #6b7280;">You have been assigned to conduct an online interview. Here are the details:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; width: 40%; border-bottom: 1px solid #e5e7eb;">👤 Candidate</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${application.fullName}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">📅 Date</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableDate}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">⏰ Time</td>
                <td style="padding: 12px 16px; color: #111827; border-bottom: 1px solid #e5e7eb;"><strong>${readableTime} IST</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600;">🔗 Google Meet</td>
                <td style="padding: 12px 16px;"><a href="${meetingLink}" style="color: #e11d48; font-weight: bold; text-decoration: none;">Join Meeting</a></td>
              </tr>
            </table>

            ${notes ? `<p style="color: #6b7280; margin-top: 16px;"><strong>Notes:</strong> ${notes}</p>` : ''}

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-top: 16px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                💡 A Google Calendar invitation has been sent. The meeting will appear in your calendar.
              </p>
            </div>

            <p style="color: #374151; margin-top: 24px;">Best regards,<br/><strong>Bynaric HR Team</strong></p>
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 Bynaric Systems. All rights reserved.</p>
          </div>
        </div>
      `;

      await Promise.all([
        transporter.sendMail({
          from: `"Bynaric Careers" <${process.env.EMAIL_USER}>`,
          to: application.email,
          subject: `Online Interview Scheduled - ${readableDate} at ${readableTime}`,
          html: onlineCandidateMail,
        }),
        transporter.sendMail({
          from: `"Bynaric HR" <${process.env.EMAIL_USER}>`,
          to: interviewer.email,
          subject: `Interview Assignment - ${application.fullName} on ${readableDate}`,
          html: onlineInterviewerMail,
        }),
      ]);
    }

    if (interviewType === 'Calendly') {
      const calendlyCandidateMail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Interview Scheduling Link (Calendly)</h1>
          </div>
          <div style="padding: 28px;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${application.fullName}</strong>,</p>
            <p style="color: #6b7280;">Please complete your host-suggested scheduling by visiting the Calendly link below.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; width: 40%; border-bottom: 1px solid #e5e7eb;">🔗 Calendly Link</td>
                <td style="padding: 12px 16px;"><a href="${meetingLink}" style="color: #e11d48; font-weight: bold; text-decoration: none;">Book your slot</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">📋 Interviewer</td>
                <td style="padding: 12px 16px; color: #111827;"><strong>${interviewer.name}</strong></td>
              </tr>
            </table>

            ${notes ? `<p style="color: #6b7280; margin-top: 16px;"><strong>Additional Notes:</strong> ${notes}</p>` : ''}
            <p style="color: #374151; margin-top: 24px; font-size: 14px;">Once confirmed in Calendly, we will update your interview status.</p>
            <p style="color: #374151;">Best regards,<br/><strong>Bynaric Careers Team</strong></p>
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 Bynaric Systems. All rights reserved.</p>
          </div>
        </div>
      `;

      const calendlyInterviewerMail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Interview Assignment (Calendly)</h1>
          </div>
          <div style="padding: 28px;">
            <p style="color: #374151; font-size: 16px;">Dear <strong>${interviewer.name}</strong>,</p>
            <p style="color: #6b7280;">The candidate has been requested to select a slot via Calendly.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; width: 40%; border-bottom: 1px solid #e5e7eb;">🔗 Booking Link</td>
                <td style="padding: 12px 16px;"><a href="${meetingLink}" style="color: #e11d48; font-weight: bold; text-decoration: none;">View/Share</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">🗓️ Expected Date (placeholder)</td>
                <td style="padding: 12px 16px; color: #111827;"><strong>${readableDate} ${readableTime} IST</strong></td>
              </tr>
            </table>

            <p style="color: #374151; margin-top: 24px;">Best regards,<br/><strong>Bynaric HR Team</strong></p>
          </div>
          <div style="background: #f3f4f6; padding: 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2024 Bynaric Systems. All rights reserved.</p>
          </div>
        </div>
      `;

      await Promise.all([
        transporter.sendMail({
          from: `"Bynaric Careers" <${process.env.EMAIL_USER}>`,
          to: application.email,
          subject: `Calendly Interview Booking Request`,
          html: calendlyCandidateMail,
        }),
        transporter.sendMail({
          from: `"Bynaric HR" <${process.env.EMAIL_USER}>`,
          to: interviewer.email,
          subject: `Interview Assignment - ${application.fullName} (Calendly)`,
          html: calendlyInterviewerMail,
        }),
      ]);
    }

    res.status(201).json({
      success: true,
      message: `${interviewType} interview scheduled successfully. Email notifications sent.`,
      data: newInterview[0],
    });
  } catch (error) {
    console.error('Schedule Interview Error:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule interview.' });
  }
};

export const updateInterviewStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updatedInterview = await db
      .update(interviews)
      .set({ status, notes: remarks })
      .where(eq(interviews.id, Number(id)))
      .returning();

    if (updatedInterview.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Interview status updated to ${status}`,
      data: updatedInterview[0],
    });
  } catch (error) {
    console.error('Update Interview Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update interview status.' });
  }
};

export const getInterviews = async (req: Request, res: Response) => {
  try {
    const allInterviews = await db.select().from(interviews);
    res.status(200).json({ success: true, count: allInterviews.length, data: allInterviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch interviews.' });
  }
};

export const getInterviewById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, Number(id)))
      .limit(1);

    if (interview.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    res.status(200).json({ success: true, data: interview[0] });
  } catch (error) {
    console.error('Get Interview Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interview.' });
  }
};

export const getInterviewsByApplication = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    const applicationInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.jobApplicationId, Number(applicationId)))
      .orderBy(interviews.scheduledAt);

    res.status(200).json({
      success: true,
      count: applicationInterviews.length,
      data: applicationInterviews
    });
  } catch (error) {
    console.error('Get Interviews by Application Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interviews for application.' });
  }
};

export const cancelInterview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, Number(id)))
      .limit(1);

    if (interview.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const updatedInterview = await db
      .update(interviews)
      .set({
        status: 'cancelled',
        notes: cancellationReason ? `CANCELLED: ${cancellationReason}` : 'Interview cancelled'
      })
      .where(eq(interviews.id, Number(id)))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Interview cancelled successfully',
      data: updatedInterview[0]
    });
  } catch (error) {
    console.error('Cancel Interview Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel interview.' });
  }
};
