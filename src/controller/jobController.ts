import { Request, Response } from 'express';
import { db } from '../db'; // Your db connection
import { jobOpenings } from '../db/schema';
import { desc } from 'drizzle-orm';

import { ilike, and, or, eq } from 'drizzle-orm';

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, location, experience, jobType, category, description, requirements, responsibilities, about } = req.body;

    if (!title || !location) {
      return res.status(400).json({ success: false, message: "Title and location are required." });
    }

    const newJob = await db.insert(jobOpenings).values({
      title,
      jobId: `job_${Date.now()}`, // Generate a unique job ID
      location,
      experience,
      jobType,
      category,
      description,
      requirements,
      responsibilities,
      about
    }).returning();

    res.status(201).json({ success: true, message: "Job created successfully", data: newJob[0] });
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).json({ success: false, message: "Failed to create job opening." });
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    // Fetch all jobs, sorting by newest first
    const jobs = await db
      .select()
      .from(jobOpenings)
      .orderBy(desc(jobOpenings.createdAt));

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error("Fetch Jobs Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch job openings." 
    });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const job = await db.select().from(jobOpenings).where(eq(jobOpenings.id, Number(id))).limit(1);
    console.log("Fetched Job:", job);

    if (job.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json({ success: true, data: job[0] });
  } catch (error) {
    console.error("Fetch Job Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job opening." });
  }
};

export const searchJobs = async (req: Request, res: Response) => {
  try {
    const { keyword, location } = req.query;

    const filters = [];

    if (keyword) {
      filters.push(
        or(
          ilike(jobOpenings.title, `%${keyword}%`),
          ilike(jobOpenings.category, `%${keyword}%`)
        )
      );
    }

    if (location && location !== "") {
      filters.push(ilike(jobOpenings.location, `%${location}%`));
    }

    const results = await db
      .select()
      .from(jobOpenings)
      .where(and(...filters));

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedJob = await db.update(jobOpenings)
      .set(updateData)
      .where(eq(jobOpenings.id, Number(id)))
      .returning();

    if (updatedJob.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json({ success: true, message: "Job updated successfully", data: updatedJob[0] });
  } catch (error) {
    console.error("Update Job Error:", error);
    res.status(500).json({ success: false, message: "Failed to update job opening." });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedJob = await db.delete(jobOpenings)
      .where(eq(jobOpenings.id, Number(id)))
      .returning();

    if (deletedJob.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete job opening." });
  }
};