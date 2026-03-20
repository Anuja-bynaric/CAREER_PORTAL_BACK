import Nylas from 'nylas';

// Initialize Nylas client
const nylas = new Nylas({
  apiKey: process.env.NYLAS_CLIENT_SECRET || '',
  apiUri: process.env.NYLAS_API_URI || 'https://api.nylas.com',
});

// Store access tokens (in production, use encrypted database)
let nylasAccessToken: string | null = null;

export const setNylasAccessToken = (token: string) => {
  nylasAccessToken = token;
};

export const getNylasAccessToken = () => nylasAccessToken;

export const getNylasClient = () => nylas;

export const getNylasAuthUrl = () => {
  const clientId = process.env.NYLAS_CLIENT_ID;
  const redirectUri = process.env.NYLAS_SCHEDULER_REDIRECT_URI || 'http://localhost:3000/auth/callback';

  if (!clientId) {
    throw new Error('NYLAS_CLIENT_ID not configured');
  }

  return `https://api.nylas.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scopes=calendar`;
};

interface CreateNylasEventParams {
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  attendeeEmails: string[];
  description?: string;
  location?: string;
}

/**
 * Creates a calendar event using Nylas API
 * @param params - Event parameters
 * @returns Event details including ID and any conference data
 */
export const createNylasEvent = async (params: CreateNylasEventParams) => {
  try {
    if (!nylasAccessToken) {
      throw new Error('Nylas access token not set. Please connect your calendar first.');
    }

    const { title, scheduledAt, durationMinutes, attendeeEmails, description, location } = params;

    // Calculate end time
    const endTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

    // Prepare attendees
    const attendees = attendeeEmails.map(email => ({
      email,
      name: email.split('@')[0], // Simple name extraction
    }));

    // Create event object
    const eventData = {
      title,
      description: description || 'Interview scheduled through Career Portal',
      location: location || undefined,
      when: {
        start_time: Math.floor(scheduledAt.getTime() / 1000), // Unix timestamp
        end_time: Math.floor(endTime.getTime() / 1000),
      },
      participants: attendees,
      calendar_id: 'primary', // Use primary calendar
      busy: true,
      read_only: false,
    };

    console.log('📅 Creating Nylas calendar event...', eventData);

    // Create the event
    const event: any = await nylas.events.create({
      identifier: nylasAccessToken,
      requestBody: eventData as any,
    } as any);

    console.log('✅ Nylas event created successfully:', event.id);

    return {
      eventId: event.id,
      calendarId: event.calendar_id,
      htmlLink: event.html_link,
      status: event.status,
      conferenceData: event.conference_data,
    };
  } catch (error: any) {
    console.error('❌ Error creating Nylas event:', error.message);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
};

/**
 * Exchange OAuth code for access token
 * @param code - OAuth authorization code
 * @returns Access token and other auth details
 */
export const exchangeCodeForToken = async (code: string) => {
  try {
    const clientId = process.env.NYLAS_CLIENT_ID;
    const clientSecret = process.env.NYLAS_CLIENT_SECRET;
    const redirectUri = process.env.NYLAS_SCHEDULER_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      throw new Error('Nylas credentials not configured');
    }

    const response = await nylas.auth.exchangeCodeForToken({
      clientId,
      clientSecret,
      code,
      redirectUri: redirectUri || 'http://localhost:3000/auth/callback',
    });

    console.log('✅ Nylas token exchange successful');
    return response;
  } catch (error: any) {
    console.error('❌ Error exchanging code for token:', error.message);
    throw new Error(`Failed to authenticate with Nylas: ${error.message}`);
  }
};

/**
 * Get calendar list for the authenticated user
 * @returns List of available calendars
 */
export const getCalendars = async () => {
  try {
    if (!nylasAccessToken) {
      throw new Error('Nylas access token not set');
    }

    const calendars = await nylas.calendars.list({
      identifier: nylasAccessToken,
    });

    return calendars;
  } catch (error: any) {
    console.error('❌ Error fetching calendars:', error.message);
    throw new Error(`Failed to fetch calendars: ${error.message}`);
  }
};

/**
 * Check if calendar is connected
 * @returns Connection status
 */
export const checkConnection = async () => {
  try {
    if (!nylasAccessToken) {
      return { connected: false, message: 'No access token found' };
    }

    // Try to fetch calendars to verify connection
    await getCalendars();
    return { connected: true, message: 'Calendar connected successfully' };
  } catch (error: any) {
    return { connected: false, message: error.message };
  }
};

/**
 * Update an existing event
 * @param eventId - ID of the event to update
 * @param updates - Fields to update
 */
export const updateNylasEvent = async (eventId: string, updates: Partial<CreateNylasEventParams>) => {
  try {
    if (!nylasAccessToken) {
      throw new Error('Nylas access token not set');
    }

    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.location) updateData.location = updates.location;

    if (updates.scheduledAt && updates.durationMinutes) {
      const endTime = new Date(updates.scheduledAt.getTime() + updates.durationMinutes * 60000);
      updateData.when = {
        start_time: Math.floor(updates.scheduledAt.getTime() / 1000),
        end_time: Math.floor(endTime.getTime() / 1000),
      };
    }

    if (updates.attendeeEmails) {
      updateData.participants = updates.attendeeEmails.map(email => ({
        email,
        name: email.split('@')[0],
      }));
    }

    const updatedEvent: any = await nylas.events.update({
      identifier: nylasAccessToken,
      eventId,
      requestBody: updateData,
      queryParams: {},
    } as any);

    console.log('✅ Nylas event updated successfully:', eventId);
    return updatedEvent;
  } catch (error: any) {
    console.error('❌ Error updating Nylas event:', error.message);
    throw new Error(`Failed to update event: ${error.message}`);
  }
};

/**
 * Delete an event
 * @param eventId - ID of the event to delete
 */
export const deleteNylasEvent = async (eventId: string) => {
  try {
    if (!nylasAccessToken) {
      throw new Error('Nylas access token not set');
    }

    await nylas.events.destroy({
      identifier: nylasAccessToken,
      eventId,
      queryParams: {},
    } as any);

    console.log('✅ Nylas event deleted successfully:', eventId);
  } catch (error: any) {
    console.error('❌ Error deleting Nylas event:', error.message);
    throw new Error(`Failed to delete event: ${error.message}`);
  }
};