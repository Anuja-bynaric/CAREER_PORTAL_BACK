CREATE TYPE "public"."interview_type" AS ENUM('Online', 'Face to Face', 'Calendly');--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "interview_type" "interview_type" DEFAULT 'Online' NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "location" varchar(500);--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "job_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_job_id_unique" UNIQUE("job_id");