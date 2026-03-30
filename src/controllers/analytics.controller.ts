import { Request, Response } from "express";
import { interviews, jobApplications, users, jobOpenings } from "../db/schema";
import { db } from "../config/db";
import { eq, count } from "drizzle-orm";

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const [applicationCount] = await db.select({ value: count() }).from(jobApplications);
        const [jobCount] = await db.select({ value: count() }).from(jobOpenings);
        const [interviewCount] = await db.select({ value: count() }).from(interviews);
        const [interviewerCount] = await db.select({ value: count() }).from(users).where(eq(users.role, 'interviewer'));
        // const [hrAdminCount] = await db.select({ value: count() }).from(users).where(eq(users.role, 'hr'));
        const [candidateCount] = await db.select({ value: count() }).from(users).where(eq(users.role, 'candidate'));
        const [shortlistedApplications] = await db.select({ value: count() }).from(jobApplications).where(eq(jobApplications.status, 'shortlisted'));
        const [rejectedApplications] = await db.select({ value: count() }).from(jobApplications).where(eq(jobApplications.status, 'rejected'));
        // const [interviewScheduledApplications] = await db.select({ value: count() }).from(jobApplications).where(eq(jobApplications.status, 'scheduled'));
        const [hiredApplications] = await db.select({ value: count() }).from(jobApplications).where(eq(jobApplications.status, 'hired'));
        const [pendingApplications] = await db.select({ value: count() }).from(jobApplications).where(eq(jobApplications.status, 'pending'));
        const [totalInterviewsScheduled] = await db.select({ value: count() }).from(interviews).where(eq(interviews.status, 'scheduled'));
        const [totalInterviewsCompleted] = await db.select({ value: count() }).from(interviews).where(eq(interviews.status, 'completed'));
        const [totalInterviewsCancelled] = await db.select({ value: count() }).from(interviews).where(eq(interviews.status, 'cancelled'));  
        const [totalInterviewsRoundI] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewMode, 'Round-I'));
        const [totalInterviewsRoundII] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewMode, 'Round-II'));
        const [totalInterviewsRoundIII] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewMode, 'Round-III'));
        const [totalInterviewsOnline] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewType, 'Online'));
        const [totalInterviewsFaceToFace] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewType, 'Face to Face'));
        const [ClosedJobs] = await db.select({ value: count() }).from(jobOpenings).where(eq(jobOpenings.status, 'closed'));
        const [OpenJobs] = await db.select({ value: count() }).from(jobOpenings).where(eq(jobOpenings.status, 'open'));

        res.status(200).json({
            success: true,
            data: {
                totalApplications: applicationCount.value,
                shortlistedApplications: shortlistedApplications.value,
                rejectedApplications: rejectedApplications.value,
                // interviewScheduledApplications: interviewScheduledApplications.value,
                hiredApplications: hiredApplications.value,
                pendingApplications: pendingApplications.value,
                totalJobs: jobCount.value,
                totalInterviews: interviewCount.value,
                totalInterviewers: interviewerCount.value,
                totalInterviewsScheduled: totalInterviewsScheduled.value,
                totalInterviewsCompleted: totalInterviewsCompleted.value,
                totalInterviewsCancelled: totalInterviewsCancelled.value,   
                totalInterviewsRoundI: totalInterviewsRoundI.value,
                totalInterviewsRoundII: totalInterviewsRoundII.value,
                totalInterviewsRoundIII: totalInterviewsRoundIII.value, 
                totalInterviewsOnline: totalInterviewsOnline.value,
                totalInterviewsFaceToFace: totalInterviewsFaceToFace.value,
                ClosedJobs: ClosedJobs.value,
                OpenJobs: OpenJobs.value,
                // totalHRAdmins: hrAdminCount.value,
                totalCandidates: candidateCount.value,
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const getAnalyticsOfInterviewer = async (req: Request, res: Response) => {
    try {
        const {interviewerId} = req.params;
        const [totalInterviewsScheduled] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId ));
        const [totalInterviewsCompleted] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId));
        const [totalInterviewsCancelled] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId));
        const [totalInterviewsRoundI] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId));
        const [totalInterviewsRoundII] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId));
        const [totalInterviewsRoundIII] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId));
        const [totalInterviewsOnline] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId));
        const [totalInterviewsFaceToFace] = await db.select({ value: count() }).from(interviews).where(eq(interviews.interviewerId, interviewerId));

        res.status(200).json({
            success: true,
            data: {
                totalInterviewsScheduled: totalInterviewsScheduled.value,
                totalInterviewsCompleted: totalInterviewsCompleted.value,
                totalInterviewsCancelled: totalInterviewsCancelled.value,
                totalInterviewsRoundI: totalInterviewsRoundI.value,
                totalInterviewsRoundII: totalInterviewsRoundII.value,
                totalInterviewsRoundIII: totalInterviewsRoundIII.value,
                totalInterviewsOnline: totalInterviewsOnline.value,
                totalInterviewsFaceToFace: totalInterviewsFaceToFace.value,
            }
        });
    // 
    } catch(error){
        console.error("Analytics Error:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
        return; 
    }

}