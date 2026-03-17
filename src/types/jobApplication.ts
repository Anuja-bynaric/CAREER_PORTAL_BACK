import { jobApplications } from '../db/schema';

// Type for inserting into the database via Drizzle
export type NewApplication = typeof jobApplications.$inferInsert;

// Interface for data validation/incoming request body
export interface ApplicationFormInput {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  resumeUrl: string;
  jobId: number;
  consentGiven: boolean;
}