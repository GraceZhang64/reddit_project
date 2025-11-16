-- AlterTable
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "ai_summary_comment_count" INTEGER DEFAULT 0;

