import { jobApplications } from '../db/schema';

// Drizzle's internal type for database operations
export type NewApplication = typeof jobApplications.$inferInsert & {
  userId?: number | null;
  skills?: string[];
};

// Interface for the data coming from Frontend (Multipart Form)
export interface ApplicationFormInput {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  jobId: string;
  consentGiven: string | boolean;
  skills?: any; // optional skill array from frontend
  savedResumeName?: string | null;
}
// We extend the form input and ensure resumeUrl is included
export interface ApplicationTokenPayload extends ApplicationFormInput {
  resumeUrl: string;
  skills?: string[];
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