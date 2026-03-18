import { Request, Response } from 'express';
import { db } from '../db';
import { jobApplications, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  ApplicationFormInput, 
  NewApplication, 
  DownloadParams, 
  ApplicationTokenPayload, 
  FinalizeApplicationInput 
} from '../types/jobApplication';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const createApplication = async (req: Request, res: Response) => {
  try {
    const body = req.body as ApplicationFormInput;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Resume file is missing." });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, body.emailAddress)).limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "Mail already exist..Please login and apply" 
      });
    }

    const tokenData: ApplicationTokenPayload = {
      ...body,
      resumeUrl: req.file.filename
    };

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '1h' });
    const setupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password?token=${token}`;

    await transporter.sendMail({
      from: `"Bynaric Careers" <${process.env.EMAIL_USER}>`,
      to: body.emailAddress,
      subject: 'Complete your application - Set Password',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2>Hello ${body.fullName},</h2>
          <p>Thank you for applying. To complete your application, please set your account password by clicking the button below:</p>
          <a href="${setupLink}" style="background: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Click here to set your password</a>
          <p style="margin-top: 20px; color: #666;">This link will expire in 1 hour.</p>
        </div>
      `
    });

    // UPDATED: Sending the token back to the frontend
    res.status(200).json({ 
      success: true, 
      message: "Verification email sent!",
      token: token // <--- Pass this to frontend
    });

  } catch (error: any) {
    console.error("Application Error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const finalizeApplication = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as FinalizeApplicationInput;

    // 1. Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET) as ApplicationTokenPayload;

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Database Transaction: Create User + Save Application
    const result = await db.transaction(async (tx) => {
      // Create User
      await tx.insert(users).values({
        name: decoded.fullName,
        email: decoded.emailAddress,
        password: hashedPassword,
        role: 'user', // Default role
      });

      // Create Application
      const appEntry = await tx.insert(jobApplications).values({
        jobId: Number(decoded.jobId),
        fullName: decoded.fullName,
        emailAddress: decoded.emailAddress,
        phoneNumber: decoded.phoneNumber,
        resumeUrl: decoded.resumeUrl,
        consentGiven: decoded.consentGiven === 'true' || decoded.consentGiven === true,
      }).returning();

      return appEntry[0];
    });

    res.status(201).json({
      success: true,
      message: "Password set and application submitted successfully!",
      data: result
    });

  } catch (error: any) {
    console.error("Finalize Error:", error);
    res.status(400).json({ success: false, error: "Invalid or expired token." });
  }
};

export const downloadResume = (req: Request<DownloadParams>, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads/resumes', filename);

  res.download(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, message: "File not found." });
    }
  });
};