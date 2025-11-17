-- Create saved_posts table
CREATE TABLE IF NOT EXISTS "saved_posts" (
    "id" SERIAL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "post_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
    CONSTRAINT "saved_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "saved_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
);

-- Add unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS "saved_posts_user_id_post_id_key" ON "saved_posts"("user_id", "post_id");

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_saved_posts_user" ON "saved_posts"("user_id");
CREATE INDEX IF NOT EXISTS "idx_saved_posts_post" ON "saved_posts"("post_id");

-- Enable Row Level Security
ALTER TABLE "saved_posts" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own saved posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can save posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can unsave their own posts" ON "saved_posts";

-- RLS Policy: Users can view their own saved posts
CREATE POLICY "Users can view their own saved posts"
ON "saved_posts"
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can save posts
CREATE POLICY "Users can save posts"
ON "saved_posts"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can unsave their own posts
CREATE POLICY "Users can unsave their own posts"
ON "saved_posts"
FOR DELETE
USING (auth.uid() = user_id);
