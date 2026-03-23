import express from "express";
import oauth2Client from "../../config/google";
import { db } from "../db";
import { googleTokens } from "../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

const scopes = [
  "https://www.googleapis.com/auth/calendar",
];

// 👉 LOGIN
router.get("/google", (req, res) => {
  // Pass userId in state from frontend or fallback to 1
  const userId = Number(req.query.userId) || 1;

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: JSON.stringify({ userId }),
  });

  res.redirect(url);
});

// 👉 CALLBACK
router.get("/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state ? JSON.parse(req.query.state as string) : {};
  const userId = Number(state.userId || 1);

  const { tokens } = await oauth2Client.getToken(code);

  console.log("TOKENS:", tokens);

  oauth2Client.setCredentials(tokens);

  const existing = await db.select().from(googleTokens).where(eq(googleTokens.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db
      .update(googleTokens)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || existing[0].refreshToken,
        expiryDate: tokens.expiry_date,
      })
      .where(eq(googleTokens.userId, userId));
  } else {
    await db
      .insert(googleTokens)
      .values({
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      });
  }

  res.send("Google Connected Successfully");
});

export default router;