import { Request, Response } from 'express';
import { db } from '../config/db';
import { jobApplications, users, interviews } from '../db/schema';
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

const parseSkills = (skills: any): string[] => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills.map(String);
  }

  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch (err) {
      // Non-JSON string like 'JavaScript,React'
      return skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const body = req.body as ApplicationFormInput;

    // 1. Identify if a user is logged in
    const authHeader = req.headers.authorization;
    let loggedInUser: any = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        loggedInUser = jwt.verify(token, JWT_SECRET);
      } catch (err) { /* invalid token */ }
    }

    // 2. DUPLICATE CHECK: Has this email applied for THIS job already?
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

    // 3. ACCOUNT CHECK: CRITICAL FIX - MOVE THIS ABOVE EVERYTHING ELSE
    const existingUser = await db.select().from(users).where(eq(users.email, body.emailAddress)).limit(1);

    // If account exists BUT the user is NOT logged in (no token), stop them here!
    if (existingUser.length > 0 && !loggedInUser) {
      return res.status(403).json({
        success: false,
        message: "This email is already registered. Please login to your account to apply."
      });
    }

    // 4. VALIDATION
    if (!req.file && !body.savedResumeName) {
      return res.status(400).json({ success: false, message: "Resume file is missing." });
    }

    const finalResumeUrl = req.file ? req.file.filename : body.savedResumeName;

    const newAppData: NewApplication = {
      jobId: String(body.jobId),
      userId: loggedInUser ? loggedInUser.id : null,
      fullName: body.fullName,
      email: body.emailAddress,
      phoneNumber: body.phoneNumber,
      resumeUrl: finalResumeUrl as string,
      consentGiven: String(body.consentGiven) === 'true' || body.consentGiven === true,
      skills: parseSkills(req.body.skills),
    };

    // 5. BRANCHING LOGIC
    if (loggedInUser) {
      // LOGGED IN FLOW
      const result = await db.insert(jobApplications).values(newAppData).returning();
      return res.status(201).json({
        success: true,
        message: "Application submitted successfully!",
        data: result[0]
      });
    } else {

      if (!req.file) {
        return res.status(400).json({ success: false, message: "Please upload a resume." });
      }
      // NEW GUEST FLOW (Only runs if email doesn't exist in 'users' table)
      const tokenData: ApplicationTokenPayload = { ...body, resumeUrl: req.file.filename };
      const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '1h' });
      const setupLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password?token=${token}`;

      await transporter.sendMail({
        from: `"Bynaric Careers" <${process.env.EMAIL_USER}>`,
        to: body.emailAddress,
        subject: 'Complete your application - Set Password',
        html: `<p>Please <a href="${setupLink}">click here</a> to set your password.</p>`
      });

      return res.status(200).json({
        success: true,
        message: "Verification email sent!",
        token: token
      });
    }

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
        skills: parseSkills(decoded.skills),
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
        userId: jobApplications.userId,
        fullName: jobApplications.fullName,
        email: jobApplications.email,
        phoneNumber: jobApplications.phoneNumber,
        resumeUrl: jobApplications.resumeUrl,
        consentGiven: jobApplications.consentGiven,
        appliedAt: jobApplications.appliedAt,
        status: jobApplications.status,
        notes: jobApplications.notes,
        jobId: jobApplications.jobId,
        skills: jobApplications.skills,
      })
      .from(jobApplications)
      .where(eq(jobApplications.jobId, jobId as string)) 
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
        eq(jobApplications.jobId, jobId as string),
        eq(jobApplications.id, Number(id))
      ))
      .limit(1);

    if (application.length === 0) {
      return res.status(404).json({ success: false, message: "Candidate not found for this job." });
    }

    // Fetch associated interviews (Rounds)
    const associatedInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.jobApplicationId, Number(id)))
      .orderBy(interviews.scheduledAt);
    
    res.status(200).json({
      success: true,
      message: `Candidate details for job ${jobId} and candidate ${id}`,
      data: {
        ...application[0],
        interviews: associatedInterviews
      }
    });
  } catch (error) {
    console.error("Get Candidate by JobId and CandidateId Error:", error);

    res.status(500).json({ success: false, message: "Failed to fetch candidate details." });
  }
};

export const getMyApplications = async (req: any, res: Response) => {
  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, message: "User not authenticated or email missing." });
    }

    const applications = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.email, userEmail));

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error("Get My Applications Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your applications." });
  }
};
