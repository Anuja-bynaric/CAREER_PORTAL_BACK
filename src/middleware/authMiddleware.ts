import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // console.log(decoded)
    
    // Check if user still exists in database
    // console.log( decoded.id)
    const userResult = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    if (!userResult || userResult.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token user' });
    }

    req.user = {
      userId: userResult[0].id,
      role: userResult[0].role
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
