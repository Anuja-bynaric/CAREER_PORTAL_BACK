import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    email: string;
  };
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const userResult = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    if (!userResult || userResult.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token user' });
    }

    req.user = {
      userId: userResult[0].id,
      role: userResult[0].role,
      email: userResult[0].email
    };

    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const isHRAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Treat HR as Admin
  if (req.user.role === 'admin' || req.user.role === 'hr') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden: Requires HR/Admin privileges' });
  }
};

export const isInterviewer = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // HR/Admin and Interviewers can access interviewer routes
  if (req.user.role === 'admin' || req.user.role === 'hr' || req.user.role === 'interviewer') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden: Requires Interviewer or HR/Admin privileges' });
  }
};

export const isCandidate = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // HR/Admin and Candidates can access candidate routes
  if (req.user.role === 'admin' || req.user.role === 'hr' || req.user.role === 'candidate') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden: Requires Candidate or HR/Admin privileges' });
  }
};
