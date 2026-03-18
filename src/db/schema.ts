import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const jobOpenings = pgTable('job_openings', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  experience: varchar('experience', { length: 50 }),
  jobType: varchar('job_type', { length: 50 }),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobOpenings.id, { onDelete: 'cascade' }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  emailAddress: varchar('email_address', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  resumeUrl: text('resume_url').notNull(),
  consentGiven: boolean('consent_given').default(false).notNull(),
  appliedAt: timestamp('applied_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'), // Ye starting mein null rahega jab tak mail se set na ho
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});