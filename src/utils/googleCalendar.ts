import { google } from 'googleapis';



  console.log("privateKey:", process.env.GOOGLE_PRIVATE_KEY);
  console.log("serviceAccountEmail:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log("calendarId:", process.env.GOOGLE_CALENDAR_ID);
// Initialize the Google Calendar API with Service Account credentials
const getCalendarClient = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;


  if (!privateKey || !serviceAccountEmail || !calendarId) {
    throw new Error(
      'Missing Google Cloud credentials. Please set GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_CALENDAR_ID in .env'
    );
  }

  const impersonateEmail = process.env.GOOGLE_IMPERSONATE_EMAIL; // Optional for domain-wide delegation

  const authOptions: any = {
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: serviceAccountEmail,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  };

  if (impersonateEmail) {
    authOptions.clientOptions = { subject: impersonateEmail };
  }

  const auth = new google.auth.GoogleAuth(authOptions);

  return {
    calendar: google.calendar({ version: 'v3', auth }),
    calendarId,
  };
};

interface CreateMeetEventParams {
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  attendeeEmails: string[];
  description?: string;
}

/**
 * Creates a Google Calendar event with a real Google Meet link
 * @param params - Event parameters including title, date, attendees, etc.
 * @returns The generated Google Meet link URL
 */
export const createMeetEvent = async (params: CreateMeetEventParams): Promise<string> => {
  console.log('🔍 createMeetEvent called with params:', params);
  try {
    const { calendar, calendarId } = getCalendarClient();
    const { title, scheduledAt, durationMinutes, attendeeEmails, description } = params;

    // Calculate end time based on duration
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    // Create event with Google Meet conference
    const event = {
      summary: title,
      description: description || 'Interview scheduled through Career Portal',
      start: {
        dateTime: scheduledAt.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: attendeeEmails.map((email) => ({
        email,
        responseStatus: 'tentativeAccepted',
      })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            name: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'email',
            minutes: 24 * 60, // 24 hours before
          },
          {
            method: 'popup',
            minutes: 30, // 30 minutes before
          },
        ],
      },
    };

    // Insert event and request to generate Meet link
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send invitations to attendees
    });

    if (!response.data.conferenceData?.entryPoints) {
      throw new Error('Failed to generate Google Meet link. Conference data not returned.');
    }

    // Extract the Meet link from conference entry points
    const meetLink = response.data.conferenceData.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri;

    if (!meetLink) {
      throw new Error('Could not extract Google Meet link from conference data.');
    }

    console.log(`✅ Google Calendar event created with Meet link: ${meetLink}`);
    return meetLink;
  } catch (error: any) {
    const apiError = error.response?.data || error;
    console.error('❌ Error creating Google Meet event:', JSON.stringify(apiError, null, 2));

    // If we have detail errors, include them in the thrown message for better client logging.
    const detailedMessage = apiError?.error?.message || apiError?.message || 'Unknown error';
    const detailErrors = apiError?.error?.errors
      ? apiError.error.errors.map((e: any) => `[${e.domain}] ${e.reason}: ${e.message}`).join('; ')
      : '';

    throw new Error(`Failed to create Google Meet event: ${detailedMessage}${detailErrors ? ` (${detailErrors})` : ''}`);
  }
};

/**
 * Optional: Update an existing interview with the Meet link (in case of changes)
 */
export const updateEventLink = async (eventId: string, meetLink: string): Promise<void> => {
  try {
    const { calendar, calendarId } = getCalendarClient();

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        description: `Google Meet: ${meetLink}`,
      },
    });

    console.log(`✅ Event ${eventId} updated with Meet link.`);
  } catch (error: any) {
    const apiError = error.response?.data || error;
    console.error('❌ Error updating event:', apiError);
    throw new Error(`Failed to update event: ${error.response?.data?.error?.message || error.message}`);
  }
};
