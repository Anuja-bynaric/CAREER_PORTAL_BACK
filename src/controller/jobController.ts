import { Request, Response } from 'express';
import { db } from '../db'; // Your db connection
import { jobOpenings } from '../db/schema';
import { desc } from 'drizzle-orm';

import { ilike, and, or } from 'drizzle-orm';

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