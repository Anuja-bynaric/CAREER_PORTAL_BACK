import { eq, or, and } from 'drizzle-orm';
import { users } from '../db/schema';
import { db } from '../db';
import { Request, Response } from 'express';
import { transporter } from '../utils/mailer';
import bcrypt from 'bcrypt';

// export const applyJob = async (req: Request, res: Response) => {
//     const { name, email } = req.body;

//     try {
//         // 1. Check karein user pehle se exist karta hai ya nahi
//         const existingUser = await db.select().from(users).where(eq(users.email, email));

//         if (existingUser.length > 0) {
//             // Case: Already account asel tr (Login requirement)
//             return res.status(200).json({
//                 message: "User exists. Please login to auto-fill details.",
//                 user: existingUser[0]
//             });
//         }


//         // Case: New candidate asel tr (Directly register with no password yet)
//         const newUser = await db.insert(users).values({
//             name,
//             email,
//             password:"",
//             isVerified: false
//         }).returning();

//         // 2. Email Link taiyar karein (Frontend URL)
//         // Local testing ke liye: http://localhost:3000/user/set-password?email=abc@gmail.com
//         const setPasswordLink = `http://localhost:5000/user/set-password?email=${email}`;

//         // 3. Mail Options
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Complete Your Job Application - Set Password',
//             html: `
//         <h3>Hello ${name},</h3>
//         <p>Thank you for applying! To complete your registration, please set your password.</p>
//         <a href="${setPasswordLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
//           Click here to set your password
//         </a>
//         <p>If the button doesn't work, copy-paste this link: ${setPasswordLink}</p>
//       `,
//         };

//         // 4. Send Mail
//         await transporter.sendMail(mailOptions);

//         return res.status(201).json({ message: "Email sent successfully!" });

//         // return res.status(201).json({
//         //     message: "Application submitted. Check email to set password.",
//         //     user: newUser[0]
//         // });

//     } catch (error) {
//         res.status(500).json({ error: error });
//     }
// };

export const setPassword = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.update(users)
            .set({ password: hashedPassword, isVerified: true })
            .where(eq(users.email, email));

        res.json({ message: "Password set successfully. Registration complete!" });
    } catch (error) {
        console.error("Set Password Error:", error);
        res.status(500).json({ error: "Failed to set password." });
    }
};

export const createAdminOrHR = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, phoneNumber } = req.body;

        if (!role || (role !== 'admin' && role !== 'hr')) {
            return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'hr'." });
        }

        // Check if ANY admin or hr already exists
        const existingHRs = await db.select()
            .from(users)
            .where(or(eq(users.role, 'hr'), eq(users.role, 'admin')));

        if (existingHRs.length > 0) {
            return res.status(400).json({ message: "An Admin/HR user already exists. Only one is allowed." });
        }

        // Check if email is already taken
        const existingEmail = await db.select().from(users).where(eq(users.email, email));
        if (existingEmail.length > 0) {
            return res.status(400).json({ message: "Email is already in use by another user." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            phoneNumber: phoneNumber || null,
            role: role,
            isVerified: true
        }).returning();

        return res.status(201).json({
            message: `${role.toUpperCase()} account created successfully.`,
            user: { id: newUser[0].id, name: newUser[0].name, email: newUser[0].email, phoneNumber: newUser[0].phoneNumber, role: newUser[0].role }
        });

    } catch (error) {
        console.error("Create Admin/HR Error:", error);
        return res.status(500).json({ error: "Failed to create Admin/HR user." });
    }
};

export const createInterviewer = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phoneNumber } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email is already in use." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            phoneNumber: phoneNumber || null,
            role: 'interviewer',
            isVerified: true
        }).returning();

        return res.status(201).json({
            message: "Interviewer account created successfully.",
            user: { id: newUser[0].id, name: newUser[0].name, email: newUser[0].email, phoneNumber: newUser[0].phoneNumber, role: newUser[0].role }
        });

    } catch (error) {
        console.error("Create Interviewer Error:", error);
        return res.status(500).json({ error: "Failed to create Interviewer." });
    }
};

export const getAllInterviewers = async (req: Request, res: Response) => {
    try {
        const interviewersList = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            isVerified: users.isVerified,
            createdAt: users.createdAt
        }).from(users).where(eq(users.role, 'interviewer'));

        return res.status(200).json({ success: true, count: interviewersList.length, data: interviewersList });
    } catch (error) {
        console.error("Fetch Interviewers Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch interviewers." });
    }
};

export const updateInterviewer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const updatedUser = await db.update(users)
            .set({ name, email })
            .where(and(eq(users.id, Number(id)), eq(users.role, 'interviewer')))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role
            });

        if (updatedUser.length === 0) {
            return res.status(404).json({ success: false, message: "Interviewer not found" });
        }

        return res.status(200).json({ success: true, message: "Interviewer updated successfully", data: updatedUser[0] });
    } catch (error) {
        console.error("Update Interviewer Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update Interviewer." });
    }
};

export const deleteInterviewer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const deletedUser = await db.delete(users)
            .where(and(eq(users.id, Number(id)), eq(users.role, 'interviewer')))
            .returning();

        if (deletedUser.length === 0) {
            return res.status(404).json({ success: false, message: "Interviewer not found" });
        }

        return res.status(200).json({ success: true, message: "Interviewer deleted successfully" });
    } catch (error) {
        console.error("Delete Interviewer Error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete Interviewer." });
    }
};