/*
  Warnings:

  - You are about to drop the `jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `job_boards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `job_postings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_api_key_key";

-- DropIndex
DROP INDEX "users_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "jobs";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "users";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "postjob_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "password" TEXT,
    "full_name" TEXT,
    "stripe_customer_id" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expires" DATETIME,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "postjob_jobs" (
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
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_intent_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "postjob_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "postjob_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_job_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "post_url" TEXT NOT NULL,
    "selectors" JSON NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_job_boards" ("base_url", "enabled", "id", "name", "post_url", "selectors", "created_at", "updated_at") SELECT "base_url", "enabled", "id", "name", "post_url", "selectors", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "job_boards";
DROP TABLE "job_boards";
ALTER TABLE "new_job_boards" RENAME TO "job_boards";
CREATE TABLE "new_job_postings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "external_url" TEXT,
    "error_message" TEXT,
    "posted_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "job_postings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "postjob_jobs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_postings_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "job_boards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_job_postings" ("board_id", "created_at", "error_message", "external_url", "id", "job_id", "posted_at", "status", "updated_at") SELECT "board_id", "created_at", "error_message", "external_url", "id", "job_id", "posted_at", "status", CURRENT_TIMESTAMP FROM "job_postings";
DROP TABLE "job_postings";
ALTER TABLE "new_job_postings" RENAME TO "job_postings";
CREATE INDEX "job_postings_job_id_idx" ON "job_postings"("job_id");
CREATE INDEX "job_postings_board_id_idx" ON "job_postings"("board_id");
CREATE INDEX "job_postings_status_idx" ON "job_postings"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "postjob_users_email_key" ON "postjob_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "postjob_users_api_key_key" ON "postjob_users"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "postjob_users_reset_password_token_key" ON "postjob_users"("reset_password_token");

-- CreateIndex
CREATE UNIQUE INDEX "postjob_users_email_verification_token_key" ON "postjob_users"("email_verification_token");

-- CreateIndex
CREATE INDEX "postjob_jobs_user_id_idx" ON "postjob_jobs"("user_id");

-- CreateIndex
CREATE INDEX "postjob_jobs_status_idx" ON "postjob_jobs"("status");
