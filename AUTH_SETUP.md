# Authentication Setup Guide

## The Issue

You're seeing this error when trying to create comments:
```
Foreign key constraint violated: `comments_author_id_fkey (index)`
```

This happens because **you're not authenticated**. The app requires a logged-in user to create posts and comments.

## Quick Fix for Development

### Option 1: Create a Test User (Recommended)

Run this script to create a test user:

```bash
cd server
npx ts-node src/scripts/create-test-user.ts
```

This creates a user with:
- Username: `testuser`
- Email: `test@example.com`
- A UUID that you can use for testing

### Option 2: Use Existing User from Seed

The seed script already created users. To find their IDs:

```bash
cd server
npx prisma studio
```

Then:
1. Open the `users` table
2. Copy a user's ID (UUID)
3. Use that ID for authentication

## Setting Up Authentication

### Backend is Ready

The backend already has authentication middleware at:
- `server/src/middleware/auth.ts`
- Uses JWT tokens
- Requires Supabase Auth

### Frontend Needs Implementation

You need to add:

1. **Login/Signup Pages**
   ```
   client/src/pages/LoginPage.tsx
   client/src/pages/SignupPage.tsx
   ```

2. **Auth Context**
   ```
   client/src/contexts/AuthContext.tsx
   ```

3. **Protected Routes**
   ```typescript
   import { Navigate } from 'react-router-dom';
   
   function ProtectedRoute({ children }) {
     const { user } = useAuth();
     return user ? children : <Navigate to="/login" />;
   }
   ```

4. **Auth Service**
   ```typescript
   // client/src/services/auth.ts
   import { supabase } from './supabase';
   
   export const authService = {
     async login(email: string, password: string) {
       const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
       return { data, error };
     },
     
     async signup(email: string, password: string, username: string) {
       const { data, error } = await supabase.auth.signUp({
         email,
         password,
         options: {
           data: { username }
         }
       });
       return { data, error };
     },
     
     async logout() {
       await supabase.auth.signOut();
     },
     
     async getCurrentUser() {
       const { data } = await supabase.auth.getSession();
       return data.session?.user || null;
     }
   };
   ```

## Temporary Workaround (Development Only)

For testing without full auth, you can modify the comment creation route to use a test user:

```typescript
// server/src/routes/comments.ts
router.post('/', async (req: Request, res: Response) => {
  // For development: use test user if not authenticated
  let authorId = req.user?.id;
  
  if (!authorId && process.env.NODE_ENV === 'development') {
    authorId = process.env.TEST_USER_ID || 'get-from-database';
    console.log('⚠️  Using test user for development');
  }
  
  if (!authorId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // ... rest of the route
});
```

## Why This Matters (Security)

### ✅ Current Implementation is Secure
- Requires authentication for creating content
- Prevents anonymous spam
- Validates user exists before allowing actions
- Uses JWT tokens for stateless auth

### ❌ Don't Do This in Production
- Never allow unauthenticated writes
- Never use hardcoded test users
- Always validate JWT tokens
- Always check user permissions

## Full Auth Implementation Plan

### Phase 1: Basic Auth ✅ (Already Done)
- [x] JWT middleware
- [x] Supabase integration
- [x] Protected routes on backend

### Phase 2: Frontend Auth (To Do)
- [ ] Login page
- [ ] Signup page
- [ ] Auth context/provider
- [ ] Token storage (localStorage/cookies)
- [ ] Protected routes
- [ ] User menu/profile

### Phase 3: Enhanced Features (Future)
- [ ] Email verification
- [ ] Password reset
- [ ] OAuth (Google, GitHub, etc.)
- [ ] Session management
- [ ] Remember me
- [ ] 2FA

## Quick Commands

```bash
# Create test user
cd server && npx ts-node src/scripts/create-test-user.ts

# View all users in database
cd server && npx prisma studio

# Check current user in Supabase
# Go to: https://supabase.com/dashboard -> Authentication -> Users

# Test API with authentication
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "body": "Test comment",
    "postId": 26
  }'
```

## Error Messages Explained

### "Foreign key constraint violated: comments_author_id_fkey"
- **Cause**: The `author_id` doesn't exist in the `users` table
- **Fix**: Either log in as a real user or use a test user ID that exists

### "Authentication required"
- **Cause**: No JWT token in request headers
- **Fix**: Add `Authorization: Bearer <token>` header

### "User not found. Please log in again."
- **Cause**: JWT token contains a user ID that doesn't exist
- **Fix**: Log in again or create the user in database

## Next Steps

1. **Short term**: Create test user and use for development
2. **Medium term**: Build login/signup UI
3. **Long term**: Implement full auth flow with email verification

## Questions?

Check these files:
- `server/src/middleware/auth.ts` - Auth middleware
- `server/src/routes/comments.ts` - Comment creation
- `server/prisma/schema.prisma` - User model

