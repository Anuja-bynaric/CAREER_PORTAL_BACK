import { Request, Response } from 'express';
import { db } from '../db';
import { jobApplications } from '../db/schema';

export const createApplication = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Check if job_id is provided
    if (!data.jobId) {
      return res.status(400).json({ success: false, error: "Job ID is required." });
    }

    const result = await db
      .insert(jobApplications)
      .values({
        jobId: data.jobId,
        fullName: data.fullName,
        emailAddress: data.emailAddress,
        phoneNumber: data.phoneNumber,
        resumeUrl: data.resumeUrl,
        consentGiven: data.consentGiven ?? false,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      data: result[0],
    });
  } catch (error: any) {
    console.error("Database Error:", error);
    
    // Specific error handling for Foreign Key violations
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: `Job ID ${req.body.jobId} does not exist in the database. Please seed job_openings first.`
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to submit application. Internal Server Error.",
    });
  }
};