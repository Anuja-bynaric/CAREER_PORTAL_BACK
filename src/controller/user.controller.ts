import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { db } from '../db';
import { Request, Response } from 'express';
import { transporter } from '../utils/mailer';


export const applyJob = async (req: Request, res: Response) => {
    const { name, email } = req.body;

    try {
        // 1. Check karein user pehle se exist karta hai ya nahi
        const existingUser = await db.select().from(users).where(eq(users.email, email));

        if (existingUser.length > 0) {
            // Case: Already account asel tr (Login requirement)
            return res.status(200).json({
                message: "User exists. Please login to auto-fill details.",
                user: existingUser[0]
            });
        }


        // Case: New candidate asel tr (Directly register with no password yet)
        const newUser = await db.insert(users).values({
            name,
            email,
            isVerified: false
        }).returning();

        // 2. Email Link taiyar karein (Frontend URL)
        // Local testing ke liye: http://localhost:3000/user/set-password?email=abc@gmail.com
        const setPasswordLink = `http://localhost:5000/user/set-password?email=${email}`;

        // 3. Mail Options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Complete Your Job Application - Set Password',
            html: `
        <h3>Hello ${name},</h3>
        <p>Thank you for applying! To complete your registration, please set your password.</p>
        <a href="${setPasswordLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Click here to set your password
        </a>
        <p>If the button doesn't work, copy-paste this link: ${setPasswordLink}</p>
      `,
        };

        // 4. Send Mail
        await transporter.sendMail(mailOptions);

        return res.status(201).json({ message: "Email sent successfully!" });

        // return res.status(201).json({
        //     message: "Application submitted. Check email to set password.",
        //     user: newUser[0]
        // });

    } catch (error) {
        res.status(500).json({ error: error });
    }
};

export const setPassword = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // Password hash required
    await db.update(users)
        .set({ password: password, isVerified: true })
        .where(eq(users.email, email));

    res.json({ message: "Password set successfully. Registration complete!" });
};