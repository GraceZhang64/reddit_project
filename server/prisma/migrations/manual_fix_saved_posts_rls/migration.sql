-- Disable Row Level Security on saved_posts table
-- This is necessary because we're using Prisma with direct database connection
-- which doesn't set auth.uid() context, causing RLS policies to fail

ALTER TABLE "saved_posts" DISABLE ROW LEVEL SECURITY;

-- Drop the RLS policies (they won't be used anymore)
DROP POLICY IF EXISTS "Users can view their own saved posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can save posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can unsave their own posts" ON "saved_posts";
