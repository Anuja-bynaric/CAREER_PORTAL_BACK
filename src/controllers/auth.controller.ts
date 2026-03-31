import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
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

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    // 4. Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,        // MUST be true for cross-site cookies
      sameSite: 'none',    // REQUIRED for different domains (Localhost to Render)
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 5. FETCH REAL APPLICATION HISTORY (ONLY FOR CANDIDATES)
    if (user.role === 'candidate' || user.role === 'user') {
      const userHistory = await db
        .select({
          jobId: jobApplications.jobId,
          jobTitle: jobOpenings.title,
          appliedDate: jobApplications.appliedAt,
          status: jobApplications.status,
          phoneNumber: jobApplications.phoneNumber,
          skills: jobApplications.skills,
          resumeUrl: jobApplications.resumeUrl
        })
        .from(jobApplications)
        .leftJoin(jobOpenings, eq(jobApplications.jobId, jobOpenings.jobId))
        .where(eq(jobApplications.email, email));

      const lastApp = userHistory.length > 0 ? userHistory[userHistory.length - 1] : null;

      // 6a. Return data with token set in cookie for Candidates
      return res.status(200).json({
        success: true,
        token: token,
        user: {
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          phoneNumber: lastApp?.phoneNumber || '',
          skills: lastApp?.skills || [],
          savedResumeName: lastApp?.resumeUrl || null,
          appliedJobIds: userHistory.map(app => app.jobId).filter((id): id is string => !!id),
          applications: userHistory.map(app => ({
            jobTitle: app.jobTitle || "Unknown Position",
            appliedDate: app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A',
            status: app.status || 'pending'
          }))
        }
      });
    }

    // 6b. Return data with token set in cookie for Interviewers and HR/Admin
    return res.status(200).json({
      success: true,
      token: token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber || ''
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

    const lastApp = await db.select().from(jobApplications).where(eq(jobApplications.email, user.email)).limit(1);

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: lastApp[0]?.phoneNumber || '',
        skills: lastApp[0]?.skills || [],
        savedResumeName: lastApp[0]?.resumeUrl || null
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};