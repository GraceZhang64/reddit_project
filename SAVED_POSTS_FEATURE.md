# Saved Posts Feature

This document describes the implementation of the Saved Posts feature for the BlueIt Reddit clone application.

## Overview

The Saved Posts feature allows authenticated users to bookmark posts they want to revisit later. Users can save/unsave posts from anywhere in the app and view all their saved posts in a dedicated page.

## Features Implemented

### 1. Database Schema

**Location:** `server/prisma/migrations/manual_add_saved_posts/migration.sql`

- Created `saved_posts` table with the following structure:
  - `id` (SERIAL PRIMARY KEY)
  - `user_id` (UUID, references auth.users)
  - `post_id` (INTEGER, references posts)
  - `created_at` (TIMESTAMPTZ)
- Added unique constraint on `(user_id, post_id)` to prevent duplicate saves
- Added indexes on `user_id` and `post_id` for performance
- Implemented Row Level Security (RLS) policies:
  - Users can view their own saved posts
  - Users can save posts (insert)
  - Users can unsave their own posts (delete)

**To apply the migration:**

```bash
cd server
# Run the migration SQL directly in your Supabase SQL editor
# OR use Prisma if you've updated the schema
npx prisma db push
```

### 2. Backend API Routes

**Location:** `server/src/routes/savedPosts.ts`

Implemented RESTful endpoints:

- `GET /api/saved-posts` - Get all saved posts with pagination
- `POST /api/saved-posts/:postId` - Save a post
- `DELETE /api/saved-posts/:postId` - Unsave a post
- `GET /api/saved-posts/check/:postId` - Check if a post is saved
- `POST /api/saved-posts/check-multiple` - Check multiple posts at once (batch operation)

All endpoints require authentication and include:

- Proper error handling
- Validation
- Pagination support
- Vote counts and user vote status
- Full post details with author and community info

**Updated:** `server/src/index.ts` to register the saved posts router

### 3. Frontend API Service

**Location:** `client/src/services/api.ts`

Added `savedPostsApi` service with methods:

- `getSavedPosts(page, limit)` - Fetch paginated saved posts
- `savePost(postId)` - Save a post
- `unsavePost(postId)` - Remove a saved post
- `checkIfSaved(postId)` - Check if a single post is saved
- `checkMultipleSaved(postIds)` - Batch check multiple posts

All methods use the configured axios instance with automatic authentication token injection.

### 4. UI Components

#### PostCard Component Updates

**Location:** `client/src/components/PostCard.tsx` & `PostCard.css`

- Added a "Save" button to each post card
- Visual states:
  - 📑 "Save" - Unsaved state
  - 🔖 "Saved" - Saved state (highlighted in blue)
  - ⏳ - Loading state during save/unsave operation
- Optimistic UI updates
- Error handling with user feedback
- Disabled state while saving/unsaving

#### PostFeed Component Updates

**Location:** `client/src/components/PostFeed.tsx`

- Batch fetches saved status for all posts in the feed
- Passes saved status to individual PostCard components
- Handles save/unsave state updates across the feed

#### SavedPostsPage

**Location:** `client/src/pages/SavedPostsPage.tsx` & `SavedPostsPage.css`

A dedicated page for viewing saved posts with:

- List of all saved posts with full post cards
- Empty state with helpful messaging
- Pagination controls
- Loading states
- Error handling with retry button
- Smooth animations when unsaving posts
- Responsive design

#### PostPage Updates

**Location:** `client/src/pages/PostPage.tsx` & `PostPage.css`

- Added save button to the detailed post view
- Fetches and displays current saved status
- Matches styling with other action buttons

### 5. Routing & Navigation

**Location:** `client/src/App.tsx`

- Added route: `/saved` → `SavedPostsPage`
- Added "📑 Saved" link to main navigation bar
- Protected route requiring authentication

## User Experience Flow

### Saving a Post

1. User clicks the "Save" button on any post
2. Button shows loading state (⏳)
3. API request saves the post to the database
4. Button updates to "Saved" state (🔖) with blue highlight
5. Post is added to user's saved posts collection

### Unsaving a Post

1. User clicks the "Saved" button on a saved post
2. Button shows loading state (⏳)
3. API request removes the post from saved collection
4. Button returns to "Save" state (📑)
5. On SavedPostsPage, post fades out and is removed from the list

### Viewing Saved Posts

1. User clicks "📑 Saved" in the navigation
2. App fetches all saved posts from the API
3. Posts are displayed with full details (voting, comments, etc.)
4. User can unsave posts directly from this page
5. Pagination available for large collections

## Technical Implementation Details

### State Management

- **Local state** in PostCard for save/unsave operations
- **Optimistic updates** for better UX
- **Batch API calls** to check saved status for multiple posts
- **Conflict handling** for duplicate save attempts (409 status)

### Performance Optimizations

1. **Batch Status Checks:** Single API call checks multiple posts at once
2. **Database Indexes:** Fast lookups on user_id and post_id
3. **Unique Constraints:** Prevents duplicate saves at database level
4. **Pagination:** Limits data transferred for large saved collections

### Error Handling

- Network errors with retry options
- 401 Unauthorized - Redirects to login
- 404 Not Found - Post doesn't exist
- 409 Conflict - Post already saved (handled gracefully)
- User-friendly error messages
- Rollback on failed operations

### Security

- **Authentication required** for all endpoints
- **Row Level Security (RLS)** in Supabase
- Users can only access their own saved posts
- Validation of post IDs and user IDs
- Protection against SQL injection via Prisma

## Testing the Feature

### Manual Testing Steps

1. **Start the servers:**

   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

2. **Apply the migration:**

   - Open Supabase SQL Editor
   - Run the migration from `server/prisma/migrations/manual_add_saved_posts/migration.sql`

3. **Test saving posts:**

   - Navigate to the home page
   - Click "Save" on any post
   - Verify button changes to "Saved" with blue highlight
   - Check browser console for any errors

4. **Test saved posts page:**

   - Click "📑 Saved" in navigation
   - Verify saved posts appear
   - Test unsaving posts
   - Test pagination if you have many saved posts

5. **Test persistence:**

   - Save some posts
   - Refresh the page
   - Verify posts remain saved
   - Navigate away and return
   - Verify state is maintained

6. **Test edge cases:**
   - Try to save the same post twice
   - Test with no saved posts (empty state)
   - Test saving while offline (error handling)
   - Test rapid clicking (loading states)

### API Testing with cURL

```bash
# Get access token from localStorage after logging in
TOKEN="your_access_token_here"

# Save a post
curl -X POST http://localhost:5000/api/saved-posts/1 \
  -H "Authorization: Bearer $TOKEN"

# Check if post is saved
curl http://localhost:5000/api/saved-posts/check/1 \
  -H "Authorization: Bearer $TOKEN"

# Get all saved posts
curl http://localhost:5000/api/saved-posts?page=1&limit=20 \
  -H "Authorization: Bearer $TOKEN"

# Unsave a post
curl -X DELETE http://localhost:5000/api/saved-posts/1 \
  -H "Authorization: Bearer $TOKEN"

# Check multiple posts at once
curl -X POST http://localhost:5000/api/saved-posts/check-multiple \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postIds": [1, 2, 3, 4, 5]}'
```

## Future Enhancements

Possible improvements for the future:

1. **Collections/Folders:** Organize saved posts into categories
2. **Notes:** Add personal notes to saved posts
3. **Export:** Export saved posts to JSON/CSV
4. **Search:** Search within saved posts
5. **Filters:** Filter saved posts by community, date, type
6. **Saved Comments:** Extend feature to save individual comments
7. **Sync Indicator:** Show sync status in offline scenarios
8. **Keyboard Shortcuts:** Quick save with 'S' key
9. **Bulk Operations:** Select and unsave multiple posts at once
10. **Share Collections:** Share your saved post collections with others

## Files Modified/Created

### Backend

- ✅ `server/prisma/migrations/manual_add_saved_posts/migration.sql` (new)
- ✅ `server/src/routes/savedPosts.ts` (new)
- ✅ `server/src/index.ts` (modified)

### Frontend

- ✅ `client/src/services/api.ts` (modified)
- ✅ `client/src/components/PostCard.tsx` (modified)
- ✅ `client/src/components/PostCard.css` (modified)
- ✅ `client/src/components/PostFeed.tsx` (modified)
- ✅ `client/src/pages/SavedPostsPage.tsx` (new)
- ✅ `client/src/pages/SavedPostsPage.css` (new)
- ✅ `client/src/pages/PostPage.tsx` (modified)
- ✅ `client/src/pages/PostPage.css` (modified)
- ✅ `client/src/App.tsx` (modified)

## Troubleshooting

### Posts not saving

- Check browser console for errors
- Verify you're logged in (check localStorage for token)
- Ensure backend server is running on port 5000
- Check that migration has been applied to database

### Saved status not showing

- Check network tab for API call to `/api/saved-posts/check-multiple`
- Verify authentication token is being sent
- Check backend logs for errors

### Database errors

- Ensure Supabase is running and accessible
- Verify DATABASE_URL in server/.env
- Check that migration was applied successfully
- Verify RLS policies are enabled

### Navigation link not appearing

- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check that you're logged in

## Support

For issues or questions:

1. Check browser console for errors
2. Check server logs for backend errors
3. Review this documentation
4. Check the code comments in the implementation files

---

**Implementation Date:** November 2025  
**Status:** ✅ Complete and Ready for Testing
