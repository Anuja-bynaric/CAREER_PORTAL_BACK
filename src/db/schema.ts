import { pgTable, serial, varchar, text, timestamp, boolean, integer, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';


export const userRoleEnum = pgEnum('user_role', ['admin', 'hr', 'candidate', 'interviewer', 'user']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'shortlisted', 'rejected', 'hired']);
export const interviewStatusEnum = pgEnum('interview_status', ['scheduled', 'completed', 'cancelled']);

export const jobOpenings = pgTable('job_openings', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  experience: varchar('experience', { length: 50 }),
  jobType: varchar('job_type', { length: 50 }),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  
  // NEW COLUMNS ADDED BELOW
  description: text('description'),
  
  // Use .array() for PostgreSQL text arrays
  requirements: text('requirements').array(), 
  responsibilities: text('responsibilities').array(),
  
  about: text('about'),
});

export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobOpenings.id, { onDelete: 'cascade' }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  resumeUrl: text('resume_url').notNull(),
  consentGiven: boolean('consent_given').default(false).notNull(),
  appliedAt: timestamp('applied_at').defaultNow(),
  status: applicationStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
}, (table) => ({
  // Unique constraint: one candidate can only apply to each job once
  uniqueApplicationPerJob: uniqueIndex('unique_application_per_job').on(table.email, table.jobId),
}));

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }), // Optional: filled in when candidate/HR/interviewer is created
  isVerified: boolean('is_verified').default(false).notNull(),
  role: userRoleEnum('role').default('candidate').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  jobApplicationId: integer('job_application_id').references(() => jobApplications.id, { onDelete: 'cascade' }).notNull(),
  interviewerId: integer('interviewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status: interviewStatusEnum('status').default('scheduled').notNull(),
  meetingLink: text('meeting_link'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});