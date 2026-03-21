import { Request, Response } from 'express';
import { db } from '../db';
import { jobApplications, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

import {
  ApplicationFormInput,
  ApplicationTokenPayload,
  FinalizeApplicationInput,
  DownloadParams,
  NewApplication
} from '../types/jobApplication';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

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

    // console.log("Request Body:", body);
    // console.log("Request File:", req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Resume file is missing." });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, body.emailAddress)).limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please login and apply."
      });
    }

    // if Email Aleady Exists in user then what

    

    // Prevent duplicate applications: same email + same jobId
    const existingApplication = await db
      .select()
      .from(jobApplications)
      .where(and(
        eq(jobApplications.email, body.emailAddress),
        eq(jobApplications.jobId, String(body.jobId))
      ))
      .limit(1);

    if (existingApplication.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job."
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
          <p>Thank you for applying. To complete your application, please set your account password:</p>
          <a href="${setupLink}" style="background: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Click here to set your password</a>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: "Verification email sent!",
      token: token
    });

  } catch (error: any) {
    console.error("Application Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const finalizeApplication = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as FinalizeApplicationInput;


    const decoded = jwt.verify(token, JWT_SECRET) as ApplicationTokenPayload;

    const hashedPassword = await bcrypt.hash(password, 10);



    const newAppData: NewApplication = {
      jobId: String(decoded.jobId),
      fullName: decoded.fullName,
      email: decoded.emailAddress,
      phoneNumber: decoded.phoneNumber,
      resumeUrl: decoded.resumeUrl,
      consentGiven: decoded.consentGiven === 'true' || decoded.consentGiven === true,
    };

    const result = await db.transaction(async (tx) => {

      await tx.insert(users).values({
        name: decoded.fullName,
        email: decoded.emailAddress,
        password: hashedPassword,
        phoneNumber: decoded.phoneNumber,
        role: 'candidate',
      });


      const appEntry = await tx.insert(jobApplications).values(newAppData).returning();

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

export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'shortlisted', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const updatedApp = await db.update(jobApplications)
      .set({ status, notes })
      .where(eq(jobApplications.id, Number(id)))
      .returning();

    if (updatedApp.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.status(200).json({ success: true, message: `Application status updated to ${status}`, data: updatedApp[0] });
  } catch (error) {
    console.error("Update Application Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update application status." });
  }
};