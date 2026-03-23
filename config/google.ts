import { google } from "googleapis";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ Missing Google OAuth credentials in .env file');
  console.error('Required environment variables:');
  console.error('  - GOOGLE_CLIENT_ID');
  console.error('  - GOOGLE_CLIENT_SECRET');
  console.error('  - GOOGLE_REDIRECT_URI');
  throw new Error('Google OAuth credentials not configured');
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export default oauth2Client;