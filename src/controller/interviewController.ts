import { Request, Response } from 'express';
import { db } from '../db';
import { interviews, jobApplications, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const scheduleInterview = async (req: Request, res: Response) => {
  try {
    const { jobApplicationId, interviewerId, scheduledAt, meetingLink, notes } = req.body;

    if (!jobApplicationId || !interviewerId || !scheduledAt) {
      return res.status(400).json({ success: false, message: "jobApplicationId, interviewerId, and scheduledAt are required." });
    }

    // Check if application exists
    const appRef = await db.select().from(jobApplications).where(eq(jobApplications.id, jobApplicationId)).limit(1);
    if (appRef.length === 0) {
      return res.status(404).json({ success: false, message: "Job Application not found." });
    }

    // Check if interviewer exists
    const interRef = await db.select().from(users).where(eq(users.id, interviewerId)).limit(1);
    if (interRef.length === 0) {
      return res.status(404).json({ success: false, message: "Interviewer not found." });
    }

    const newInterview = await db.insert(interviews).values({
      jobApplicationId,
      interviewerId,
      scheduledAt: new Date(scheduledAt),
      meetingLink,
      notes,
      status: 'scheduled'
    }).returning();

    res.status(201).json({ success: true, message: "Interview scheduled successfully.", data: newInterview[0] });
  } catch (error) {
    console.error("Schedule Interview Error:", error);
    res.status(500).json({ success: false, message: "Failed to schedule interview." });
  }
};

export const updateInterviewStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const updatedInterview = await db.update(interviews)
      .set({ status, notes: remarks }) // storing remarks in notes map
      .where(eq(interviews.id, Number(id)))
      .returning();

    if (updatedInterview.length === 0) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }

    res.status(200).json({ success: true, message: `Interview status updated to ${status}`, data: updatedInterview[0] });
  } catch (error) {
    console.error("Update Interview Error:", error);
    res.status(500).json({ success: false, message: "Failed to update interview status." });
  }
};

export const getInterviews = async (req: Request, res: Response) => {
  try {
    const allInterviews = await db.select().from(interviews);
    res.status(200).json({ success: true, count: allInterviews.length, data: allInterviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch interviews." });
  }
};
