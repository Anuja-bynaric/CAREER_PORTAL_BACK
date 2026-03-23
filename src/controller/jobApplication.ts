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

    // 1. DUPLICATE CHECK: Has this specific email applied for THIS specific job ID?
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

    // 2. SESSION CHECK: Is there a Bearer token in the headers?
    const authHeader = req.headers.authorization;
    let loggedInUser = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        loggedInUser = jwt.verify(token, JWT_SECRET) as any;
      } catch (err) {
        // Token invalid/expired - proceed as guest logic
      }
    }

    // 3. LOGIC FOR LOGGED-IN USERS (SKIP Verification)
    if (loggedInUser) {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Resume file is missing." });
      }

      const newAppData: NewApplication = {
        jobId: Number(body.jobId),
        userId: loggedInUser.id, // Set userId for logged-in users
        fullName: body.fullName,
        email: body.emailAddress,
        phoneNumber: body.phoneNumber,
        resumeUrl: req.file.filename,
        consentGiven: String(body.consentGiven) === 'true' || body.consentGiven === true,
      };

      const result = await db.insert(jobApplications).values(newAppData).returning();

      return res.status(201).json({
        success: true,
        message: "Application submitted successfully!",
        data: result[0]
      });
    }

    // 4. LOGIC FOR GUESTS (Runs ONLY if NOT logged in)
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Resume file is missing." });
    }

    // Check if user account exists to force them to login
    const existingUser = await db.select().from(users).where(eq(users.email, body.emailAddress)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please login and apply."
      });
    }

    // Guest verification flow
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

    const result = await db.transaction(async (tx) => {
      // Create user profile
      const newUser = await tx.insert(users).values({
        name: decoded.fullName,
        email: decoded.emailAddress,
        password: hashedPassword,
        phoneNumber: decoded.phoneNumber,
        role: 'candidate',
      }).returning();

      // Create job application with userId
      const newAppData: NewApplication = {
        jobId: String(decoded.jobId),
        userId: newUser[0].id, // Set userId for newly created user
        fullName: decoded.fullName,
        email: decoded.emailAddress,
        phoneNumber: decoded.phoneNumber,
        resumeUrl: decoded.resumeUrl,
        consentGiven: decoded.consentGiven === 'true' || decoded.consentGiven === true,
      };

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

export const getCandidatesByJobId = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ success: false, message: "jobId is required." });
    }

    // Fetch all applications for the given jobId
    const applications = await db
      .select({
        id: jobApplications.id,
        fullName: jobApplications.fullName,
        email: jobApplications.email,
        phoneNumber: jobApplications.phoneNumber,
        resumeUrl: jobApplications.resumeUrl,
        consentGiven: jobApplications.consentGiven,
        appliedAt: jobApplications.appliedAt,
        status: jobApplications.status,
        notes: jobApplications.notes,
        jobId: jobApplications.jobId
      })
      .from(jobApplications)
      .where(eq(jobApplications.jobId, jobId)) 
      .orderBy(jobApplications.appliedAt);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No candidates found for this job.",
        data: []
      });
    }

    res.status(200).json({
      success: true,
      message: `Found ${applications.length} candidate(s) for job ${jobId}`,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error("Get Candidates by JobId Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch candidates for this job." });
  }
};

export const getCandidateByJobIdById = async (req: Request, res: Response) => {
  try {
    const { jobId, id } = req.params;
    if (!jobId || !id) {
      return res.status(400).json({ success: false, message: "jobId and id are required." });
    }
    const application = await db
      .select()
      .from(jobApplications)
      .where(and(
        eq(jobApplications.jobId, jobId),
        eq(jobApplications.userId, Number(id))
      ))
      .limit(1);

    if (application.length === 0) {
      return res.status(404).json({ success: false, message: "Candidate not found for this job." });
    }
    
    res.status(200).json({
      success: true,
      message: `Candidate details for job ${jobId} and candidate ${id}`,
      data: application[0]
    });
  } catch (error) {
    console.error("Get Candidate by JobId and CandidateId Error:", error);

    res.status(500).json({ success: false, message: "Failed to fetch candidate details." });
  }
};