import { jobApplications } from '../db/schema';

// Drizzle's internal type for database operations
export type NewApplication = typeof jobApplications.$inferInsert;

// Interface for the data coming from Frontend (Multipart Form)
export interface ApplicationFormInput {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  jobId: string; 
  consentGiven: string | boolean; 
}

// Data preserved in the email link (JWT)
// We extend the form input and ensure resumeUrl is included
export interface ApplicationTokenPayload extends ApplicationFormInput {
  resumeUrl: string;
}

// Data for the final step (Password set)
export interface FinalizeApplicationInput {
  token: string;
  password: string;
}

// Params for the download route
export interface DownloadParams {
  filename: string;
}