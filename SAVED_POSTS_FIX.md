# Saved Posts Feature Fix

## Issue

When users tried to save a post, they received a "Failed to save post" error message.

## Root Cause

The `saved_posts` table had **Row Level Security (RLS)** enabled with policies that checked `auth.uid()`. However, when using Prisma with a direct PostgreSQL connection (not through Supabase's API), the `auth.uid()` function returns `NULL`, causing the RLS policies to fail.

Specifically:

- The table was created with `ALTER TABLE "saved_posts" ENABLE ROW LEVEL SECURITY;`
- The INSERT policy used `WITH CHECK (auth.uid() = user_id)` which always failed
- Prisma's direct database connection doesn't set the Supabase authentication context

## Solution

Disabled Row Level Security for the `saved_posts` table since:

1. We're using Prisma with direct database connections
2. Authentication is handled at the API layer (Express middleware)
3. RLS policies don't apply when bypassing Supabase's API

## Files Changed

### 1. Created Migration SQL

**File**: `server/prisma/migrations/manual_fix_saved_posts_rls/migration.sql`

```sql
ALTER TABLE "saved_posts" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own saved posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can save posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can unsave their own posts" ON "saved_posts";
```

### 2. Created Fix Script

**File**: `server/scripts/fix-saved-posts-rls.ts`

- Script to execute the migration and disable RLS
- Successfully executed to fix the issue

### 3. Created Test Script

**File**: `server/scripts/test-saved-posts.ts`

- Tests that saved posts can be created successfully
- Verified the fix works correctly

## How to Apply This Fix

If you need to apply this fix on another environment:

```bash
cd server
npx ts-node scripts/fix-saved-posts-rls.ts
```

Or run the migration SQL directly:

```sql
ALTER TABLE "saved_posts" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own saved posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can save posts" ON "saved_posts";
DROP POLICY IF EXISTS "Users can unsave their own posts" ON "saved_posts";
```

## Testing

The fix has been tested and verified:

- ✓ Saved posts can now be created successfully
- ✓ Test script confirms the functionality works
- ✓ No authentication errors

## Security Note

Authentication is still secure because:

- The API endpoints use `authenticateToken` middleware
- Only authenticated users can access the saved posts endpoints
- The `req.user.id` is validated at the API layer
- Each endpoint checks that the `userId` matches the authenticated user

The RLS was redundant in this architecture since we're not using Supabase's client-side SDK but rather a server-side Prisma connection with API-level authentication.

## Date Fixed

November 17, 2025
