import { jobApplications } from '../db/schema';

// Drizzle's internal type for database operations
export type NewApplication = typeof jobApplications.$inferInsert;

// Interface for the data coming from the Frontend/Postman via Multipart Form
export interface ApplicationFormInput {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  jobId: string | number; 
  consentGiven: string | boolean; 
}

// Data preserved in the email link (JWT)
export interface ApplicationTokenPayload extends ApplicationFormInput {
  resumeUrl: string;
}

// Data for the final step
export interface FinalizeApplicationInput {
  token: string;
  password: string;
}

export interface DownloadParams {
  filename: string;
}