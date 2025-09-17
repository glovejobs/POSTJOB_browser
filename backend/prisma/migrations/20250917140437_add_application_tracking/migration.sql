-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_id" TEXT NOT NULL,
    "candidate_name" TEXT NOT NULL,
    "candidate_email" TEXT NOT NULL,
    "candidate_phone" TEXT,
    "resume_url" TEXT,
    "cover_letter" TEXT,
    "portfolio" TEXT,
    "linkedin_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "score" INTEGER,
    "notes" TEXT,
    "applied_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "postjob_jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_communications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "application_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_communications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_job_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "post_url" TEXT NOT NULL,
    "selectors" TEXT NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_job_boards" ("base_url", "created_at", "enabled", "id", "name", "post_url", "selectors", "updated_at") SELECT "base_url", "created_at", "enabled", "id", "name", "post_url", "selectors", "updated_at" FROM "job_boards";
DROP TABLE "job_boards";
ALTER TABLE "new_job_boards" RENAME TO "job_boards";
CREATE TABLE "new_postjob_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "company" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "employment_type" TEXT,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payment_intent_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "postjob_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "postjob_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_postjob_jobs" ("company", "contact_email", "created_at", "department", "description", "employment_type", "id", "location", "payment_intent_id", "payment_status", "salary_max", "salary_min", "status", "title", "updated_at", "user_id") SELECT "company", "contact_email", "created_at", "department", "description", "employment_type", "id", "location", "payment_intent_id", "payment_status", "salary_max", "salary_min", "status", "title", "updated_at", "user_id" FROM "postjob_jobs";
DROP TABLE "postjob_jobs";
ALTER TABLE "new_postjob_jobs" RENAME TO "postjob_jobs";
CREATE INDEX "postjob_jobs_user_id_idx" ON "postjob_jobs"("user_id");
CREATE INDEX "postjob_jobs_status_idx" ON "postjob_jobs"("status");
CREATE TABLE "new_postjob_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "full_name" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "email_preferences" TEXT,
    "stripe_customer_id" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expires" DATETIME,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_postjob_users" ("api_key", "created_at", "email", "email_verification_token", "email_verified", "full_name", "id", "password", "reset_password_expires", "reset_password_token", "stripe_customer_id", "updated_at") SELECT "api_key", "created_at", "email", "email_verification_token", "email_verified", "full_name", "id", coalesce("password", '') AS "password", "reset_password_expires", "reset_password_token", "stripe_customer_id", "updated_at" FROM "postjob_users";
DROP TABLE "postjob_users";
ALTER TABLE "new_postjob_users" RENAME TO "postjob_users";
CREATE UNIQUE INDEX "postjob_users_email_key" ON "postjob_users"("email");
CREATE UNIQUE INDEX "postjob_users_api_key_key" ON "postjob_users"("api_key");
CREATE UNIQUE INDEX "postjob_users_reset_password_token_key" ON "postjob_users"("reset_password_token");
CREATE UNIQUE INDEX "postjob_users_email_verification_token_key" ON "postjob_users"("email_verification_token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "applications_job_id_idx" ON "applications"("job_id");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_candidate_email_idx" ON "applications"("candidate_email");

-- CreateIndex
CREATE INDEX "application_communications_application_id_idx" ON "application_communications"("application_id");
