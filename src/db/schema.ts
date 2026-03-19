import { pgTable, serial, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';


export const userRoleEnum = pgEnum('user_role', ['admin',  'user']);

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
  emailAddress: varchar('email_address', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  resumeUrl: text('resume_url').notNull(),
  consentGiven: boolean('consent_given').default(false).notNull(),
  appliedAt: timestamp('applied_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(), // Store hashed passwords only
  isVerified: boolean('is_verified').default(false).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});