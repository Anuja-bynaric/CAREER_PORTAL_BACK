CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"full_name" varchar(255) NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"resume_url" text NOT NULL,
	"consent_given" boolean DEFAULT false NOT NULL,
	"applied_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_openings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"location" varchar(100) NOT NULL,
	"experience" varchar(50),
	"job_type" varchar(50),
	"category" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_job_openings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_openings"("id") ON DELETE cascade ON UPDATE no action;