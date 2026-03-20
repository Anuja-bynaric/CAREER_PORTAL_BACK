// Uses global fetch API (Node 18+). If your runtime does not support fetch, install node-fetch and adjust this file.

interface CreateCalendlyEventParams {
  eventTypeUrl: string;
  inviteeName: string;
  inviteeEmail: string;
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
  timezone?: string;
}

interface CalendlyEventResult {
  publicUrl: string;
  scheduledEventUri?: string;
}

const CALENDLY_PAT = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN;

export const createCalendlyEvent = async (params: CreateCalendlyEventParams): Promise<CalendlyEventResult> => {
  if (!CALENDLY_PAT) {
    throw new Error('CALENDLY_PERSONAL_ACCESS_TOKEN not configured in environment variables');
  }

  const { eventTypeUrl, inviteeName, inviteeEmail, startTime, endTime, timezone = 'UTC' } = params;

  if (!eventTypeUrl) {
    throw new Error('eventTypeUrl is required for Calendly scheduling');
  }

  // A safe fallback in case user provides direct Calendly link
  const isLinkStyle = eventTypeUrl.startsWith('https://calendly.com');

  if (isLinkStyle) {
    return { publicUrl: eventTypeUrl };
  }

  // Calendly API request to create a scheduled event
  // Documentation: https://developer.calendly.com/docs/api-overview
  // Note: some Calendly endpoints may require ORGANIZATION URIs or event_type URIs.
  try {
    const response = await fetch('https://api.calendly.com/scheduled_events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CALENDLY_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventTypeUrl,
        start_time: startTime,
        end_time: endTime,
        timezone,
        invitees: [
          {
            email: inviteeEmail,
            name: inviteeName,
          },
        ],
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Calendly API error: ${response.status} ${response.statusText} - ${payload}`);
    }

    const payload = await response.json();

    const publicUrl = payload?.resource?.uri || payload?.resource?.location || eventTypeUrl;
    return {
      publicUrl,
      scheduledEventUri: payload?.resource?.uri,
    };
  } catch (error: any) {
    throw new Error(`Failed to create Calendly scheduled event: ${error.message}`);
  }
};

export const formatCalendlyInviteUrl = (eventTypeUrl: string): string => {
  if (!eventTypeUrl) {
    throw new Error('eventTypeUrl is required');
  }
  if (eventTypeUrl.startsWith('https://calendly.com')) {
    return eventTypeUrl;
  }
  // If raw event type URI is passed, attempt to return corresponding public scheduling page
  const match = eventTypeUrl.match(/event_types\/([a-zA-Z0-9-]+)/);
  if (match && match[1]) {
    return `https://calendly.com/${match[1]}`;
  }

  return eventTypeUrl;
};
