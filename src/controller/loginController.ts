import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db'; // Your database connection
import { users } from '../db/schema'; // Your Drizzle/ORM schema
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { emailAddress, password } = req.body;

    // 1. Find user by email
    const foundUsers = await db.select().from(users).where(eq(users.email, emailAddress)).limit(1);

    if (foundUsers.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = foundUsers[0];

    // 2. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // 3. Generate Token (Optional but recommended for session persistence)
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // 4. Return user data (matching the keys your frontend expects)
    res.status(200).json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};