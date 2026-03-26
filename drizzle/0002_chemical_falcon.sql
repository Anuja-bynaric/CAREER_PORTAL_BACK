CREATE TYPE "public"."application_status" AS ENUM('pending', 'shortlisted', 'rejected', 'hired');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'hr' BEFORE 'user';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'candidate' BEFORE 'user';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'interviewer' BEFORE 'user';--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_application_id" integer NOT NULL,
	"interviewer_id" integer NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"status" "interview_status" DEFAULT 'scheduled' NOT NULL,
	"meeting_link" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'candidate';--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "status" "application_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "requirements" text[];--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "responsibilities" text[];--> statement-breakpoint
ALTER TABLE "job_openings" ADD COLUMN "about" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_job_application_id_job_applications_id_fk" FOREIGN KEY ("job_application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_application_per_job" ON "job_applications" USING btree ("email","job_id");--> statement-breakpoint
ALTER TABLE "job_applications" DROP COLUMN "email_address";