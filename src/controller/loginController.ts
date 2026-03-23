import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, jobApplications, jobOpenings } from '../db/schema'; // Import the correct tables
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const foundUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (foundUsers.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = foundUsers[0];

    // 2. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // 3. FETCH REAL APPLICATION HISTORY
    const userHistory = await db
      .select({
        jobId: jobApplications.jobId,
        jobTitle: jobOpenings.title,
        appliedDate: jobApplications.appliedAt,
        status: jobApplications.status,
      })
      .from(jobApplications)
      .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.id))
      .where(eq(jobApplications.email, email));

    const appliedIds = userHistory.map(app => app.jobId);

    // 4. Return data WITHOUT generating a new token
    res.status(200).json({
      success: true,
      // Removed jwt.sign logic here
      user: {
        name: user.name,
        email: user.email,
        appliedJobIds: appliedIds,
        applications: userHistory.map(app => ({
          jobTitle: app.jobTitle || "Unknown Position",
          appliedDate: app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A',
          status: app.status
        }))
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // The token is extracted from cookies by a middleware (see below)
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Fetch fresh user data from DB
    const foundUsers = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);

    if (foundUsers.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = foundUsers[0];

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};