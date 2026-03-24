import { Request, Response } from 'express';
import { db } from '../db';
import { interviews, jobApplications, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createGoogleEvent } from "../services/googleCalendar";
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

// Helper: parse incoming date/time as IST (Asia/Kolkata), if no timezone is provided
const parseIST = (value: string | Date): Date => {
  if (value instanceof Date) return value;

  let parsed = value;

  // Add seconds for ISO standard if missing
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(parsed)) {
    parsed += ':00';
  }

  // if timezone not present, assume IST
  if (!parsed.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(parsed)) {
    parsed += '+05:30';
  }

  return new Date(parsed);
};

export const scheduleInterview = async (req: Request, res: Response) => {
  try {
    const {
      jobApplicationId,
      interviewerId,
      scheduledAt,
      durationMinutes = 30,
      notes,
      candidateEmail,
      interviewerEmails, // Changed from interviewerEmail to interviewerEmails (array)
      googleUserId = 1,
      interviewType = 'Online',
      interviewMode = 'Round-I', // New field with default
      location,
    } = req.body;

    if (!jobApplicationId || !interviewerId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jobApplicationId, interviewerId, scheduledAt',
      });
    }

    // Validate interviewerEmails is an array
    if (!Array.isArray(interviewerEmails) || interviewerEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'interviewerEmails must be a non-empty array',
      });
    }

    const jobApplication = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, Number(jobApplicationId)))
      .limit(1);

    if (!jobApplication || jobApplication.length === 0) {
      return res.status(404).json({ success: false, message: 'Job application not found.' });
    }

    // Get interviewer name
    const interviewer = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(interviewerId)))
      .limit(1);

    if (!interviewer || interviewer.length === 0) {
      return res.status(404).json({ success: false, message: 'Interviewer not found.' });
    }

    const scheduledDate = parseIST(scheduledAt);

    // Include candidate email and all interviewer emails in attendees
    const attendees = [candidateEmail, ...interviewerEmails];

    const event = await createGoogleEvent(
      {
        title: 'Interview',
        scheduledAt: scheduledDate,
        durationMinutes,
        attendees: attendees,
        description: notes,
      },
      Number(googleUserId)
    );

    const createdInterview = await db
      .insert(interviews)
      .values({
        jobApplicationId: Number(jobApplicationId),
        jobApplicantName: jobApplication[0].fullName,
        interviewerId: Number(interviewerId),
        interviewerName: interviewer[0].name,
        scheduledAt: scheduledDate,
        interviewType,
        interviewMode,
        location,
        meetingLink: event.meetingLink,
        status: 'scheduled',
        notes,
      })
      .returning();

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: {
        ...createdInterview[0],
        resumeUrl: jobApplication[0].resumeUrl,
      },
      meetingLink: event.meetingLink,
      eventId: event.eventId,
      resumeUrl: jobApplication[0].resumeUrl,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rescheduleInterview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scheduledAt, durationMinutes = 30, notes, googleUserId = 1, interviewerEmails, interviewMode } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'scheduledAt is required to reschedule.' });
    }

    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, Number(id)))
      .limit(1);

    if (!interview || interview.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const interviewData = interview[0];

    const jobApplication = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, interviewData.jobApplicationId))
      .limit(1);

    const candidateEmail = jobApplication?.[0]?.email;

    // Use provided interviewerEmails or fall back to the single interviewer from DB
    let attendees: string[] = [candidateEmail];
    
    if (Array.isArray(interviewerEmails) && interviewerEmails.length > 0) {
      attendees = attendees.concat(interviewerEmails);
    } else {
      // Fallback to single interviewer from database
      const interviewer = await db
        .select()
        .from(users)
        .where(eq(users.id, interviewData.interviewerId))
        .limit(1);
      
      const interviewerEmail = interviewer?.[0]?.email;
      if (interviewerEmail) {
        attendees.push(interviewerEmail);
      }
    }

    const scheduledDate = parseIST(scheduledAt);

    const event = await createGoogleEvent(
      {
        title: 'Interview (Rescheduled)',
        scheduledAt: scheduledDate,
        durationMinutes,
        attendees: attendees.filter(Boolean),
        description: notes || interviewData.notes || 'Interview rescheduled',
      },
      Number(googleUserId)
    );

    const updatedInterview = await db
      .update(interviews)
      .set({
        scheduledAt: scheduledDate,
        ...(interviewMode && { interviewMode }),
        notes: notes ? `${interviewData.notes || ''}\nRESCHEDULED: ${notes}` : interviewData.notes,
        status: 'scheduled',
        meetingLink: event.meetingLink,
      })
      .where(eq(interviews.id, Number(id)))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Interview rescheduled successfully',
      data: {
        ...updatedInterview[0],
        meetingLink: event.meetingLink,
        eventId: event.eventId,
      },
    });
  } catch (error: any) {
    console.error('Reschedule Interview Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reschedule interview.' });
  }
};

export const updateInterviewStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks, interviewMode } = req.body;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updateData: any = { status, notes: remarks };
    if (interviewMode) {
      updateData.interviewMode = interviewMode;
    }

    const updatedInterview = await db
      .update(interviews)
      .set(updateData)
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
    const { cancellationReason, interviewerEmails } = req.body;

    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, Number(id)))
      .limit(1);

    if (interview.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const interviewData = interview[0];

    const jobApplication = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, interviewData.jobApplicationId))
      .limit(1);

    const updatedInterview = await db
      .update(interviews)
      .set({
        status: 'cancelled',
        notes: cancellationReason ? `CANCELLED: ${cancellationReason}` : 'Interview cancelled'
      })
      .where(eq(interviews.id, Number(id)))
      .returning();

    // Create Google Calendar event for cancellation
    let cancellationEvent = null;
    try {
      const candidateEmail = jobApplication?.[0]?.email;
      
      // Use provided interviewerEmails or fall back to the single interviewer from DB
      let attendees: string[] = [candidateEmail];
      
      if (Array.isArray(interviewerEmails) && interviewerEmails.length > 0) {
        attendees = attendees.concat(interviewerEmails);
      } else {
        // Fallback to single interviewer from database
        const interviewer = await db
          .select()
          .from(users)
          .where(eq(users.id, interviewData.interviewerId))
          .limit(1);
        
        const interviewerEmail = interviewer?.[0]?.email;
        if (interviewerEmail) {
          attendees.push(interviewerEmail);
        }
      }

      cancellationEvent = await createGoogleEvent(
        {
          title: 'Interview Cancelled',
          scheduledAt: interviewData.scheduledAt,
          durationMinutes: 30, // Use default duration for cancelled event
          attendees: attendees.filter(Boolean),
          description: `Interview has been cancelled. ${cancellationReason ? `Reason: ${cancellationReason}` : ''}`,
        },
        1 // Default googleUserId, you might want to make this configurable
      );
    } catch (eventError) {
      console.error('Cancel Interview Google Event Error:', eventError);
      // Continue with email sending even if calendar event fails
    }

    // Send cancellation email to candidate and interviewers
    try {
      const candidateEmail = jobApplication?.[0]?.email;
      const subject = 'Interview Cancelled';
      const body = `Hi,<br/><br/>Your interview scheduled for <strong>${formatDate(new Date(interviewData.scheduledAt))} at ${formatTime(new Date(interviewData.scheduledAt))}</strong> has been cancelled.<br/>${cancellationReason ? `<br/><strong>Reason:</strong> ${cancellationReason}<br/>` : ''}<br/>Thanks,<br/>HR Team`;

      if (candidateEmail) {
        await transporter.sendMail({
          from: `"Bynaric Careers" <${process.env.EMAIL_USER}>`,
          to: candidateEmail,
          subject,
          html: body,
        });
      }

      // Send to all interviewers
      let interviewersToEmail: string[] = [];
      
      if (Array.isArray(interviewerEmails) && interviewerEmails.length > 0) {
        interviewersToEmail = interviewerEmails;
      } else {
        // Fallback to single interviewer from database
        const interviewer = await db
          .select()
          .from(users)
          .where(eq(users.id, interviewData.interviewerId))
          .limit(1);
        
        if (interviewer?.[0]?.email) {
          interviewersToEmail = [interviewer[0].email];
        }
      }

      for (const interviewerEmail of interviewersToEmail) {
        await transporter.sendMail({
          from: `"Bynaric Careers" <${process.env.EMAIL_USER}>`,
          to: interviewerEmail,
          subject,
          html: body,
        });
      }
    } catch (mailError) {
      console.error('Cancel Interview Email Error:', mailError);
    }

    res.status(200).json({
      success: true,
      message: 'Interview cancelled successfully',
      data: updatedInterview[0],
      ...(cancellationEvent && {
        cancellationEvent: {
          eventId: cancellationEvent.eventId,
          meetingLink: cancellationEvent.meetingLink,
        },
      }),
    });
  } catch (error) {
    console.error('Cancel Interview Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel interview.' });
  }
};
