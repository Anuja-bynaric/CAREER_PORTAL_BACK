import { google } from "googleapis";
import oauth2Client from "../../config/google";
import { db } from "../db";
import { googleTokens } from "../db/schema";
import { eq } from "drizzle-orm";

const calendar = google.calendar({
  version: "v3",
  auth: oauth2Client,
});

// 🔐 Load tokens
const setGoogleCredentials = async (userId: number) => {
  const token = await db
    .select()
    .from(googleTokens)
    .where(eq(googleTokens.userId, userId))
    .limit(1);

  if (!token.length) throw new Error("Google not connected");

  currentGoogleUserId = userId;

  oauth2Client.setCredentials({
    access_token: token[0].accessToken,
    refresh_token: token[0].refreshToken,
    expiry_date: Number(token[0].expiryDate),
  });
};

// Track which user currently has the active credentials for refresh loop
let currentGoogleUserId: number | null = null;

// 🔁 Auto refresh save
oauth2Client.on("tokens", async (tokens) => {
  if (!currentGoogleUserId) return;

  const updateData: any = {};
  if (tokens.access_token) updateData.accessToken = tokens.access_token;
  if (tokens.refresh_token) updateData.refreshToken = tokens.refresh_token;
  if (tokens.expiry_date) updateData.expiryDate = tokens.expiry_date;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(googleTokens)
      .set(updateData)
      .where(eq(googleTokens.userId, currentGoogleUserId));
  }
});

// 📅 Create Event
export const createGoogleEvent = async (data: any, userId: number) => {
  await setGoogleCredentials(userId);

  const start = new Date(data.scheduledAt);
  const end = new Date(start.getTime() + data.durationMinutes * 60000);

  const event = {
    summary: data.title,
    description: data.description,
    start: {
      dateTime: start.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: "Asia/Kolkata",
    },
    attendees: data.attendees.map((email: string) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: "meet-" + Date.now(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  return {
    meetingLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri || null,
    eventId: response.data.id,
  };
};