const { google } = require('googleapis');
require('dotenv').config();

async function testAuth() {
  // Debug: Pehle check karein variable load hua ya nahi
  if (!process.env.GOOGLE_PRIVATE_KEY) {
    console.log("❌ ERROR: .env file se GOOGLE_PRIVATE_KEY nahi mil rahi!");
    return;
  }

  try {
    const SCOPES = ['https://www.googleapis.com'];
    
    // Windows/Node compatibility ke liye key format fix karein
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      .replace(/\\n/g, '\n') // literal \n ko real newline banata hai
      .replace(/"/g, '')     // agar galti se double quotes string ke andar hain toh hatata hai
      .trim();

    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      privateKey, // Yahan clean key pass ho rahi hai
      SCOPES
    );

    console.log("Checking Authentication...");
    await auth.authorize();
    console.log("✅ Success! Token generated.");
    
    // Baaki ka calendar code yahan...
  } catch (err) {
    console.error("❌ Auth Failed!");
    console.error("Error Message:", err.message);
  }
}

testAuth();
