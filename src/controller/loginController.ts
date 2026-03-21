import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db'; // Your database connection
import { users } from '../db/schema'; // Your Drizzle/ORM schema
import { eq } from 'drizzle-orm';

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
    // console.log(isMatch);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // 3. Generate Token (Optional but recommended for session persistence)
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    // 4. Set token in cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'strict', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // 5. Return user data (without token in response)
    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};