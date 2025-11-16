# 🔐 Authentication Error - Quick Fix Guide

## The Error You're Seeing

```
Foreign key constraint violated: `comments_author_id_fkey (index)`
```

## What This Means

**You need to be logged in to create comments.** The app is secure by design and requires authentication.

## ✅ Immediate Solutions

### Solution 1: Login/Signup UI (Full Solution - Recommended)

The backend is ready for authentication, but the **frontend needs login/signup pages**. 

**What's needed:**
1. Login page (`/login`)
2. Signup page (`/signup`)
3. Store JWT token in localStorage
4. Send token with API requests

### Solution 2: Development Mode (Quick Workaround)

For testing without building the full auth UI, use the test user we just created.

**Step 1: Get Test User Credentials**

From the output above:
```
ID: dbeda9cc-d42a-418d-8fa5--d0e1016b27e8
Username: testuser
Email: test@example.com
```

**Step 2: Create a Mock Auth Token**

Add this to your frontend temporarily for development:

```typescript
// client/src/services/api.ts

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Supabase client for auth
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Axios instance
const axiosInstance = axios.create({
  baseURL: '/api'
});

// Add auth token to all requests
axiosInstance.interceptors.request.use(async (config) => {
  // Get session from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

export default axiosInstance;
```

**Step 3: Use the interceptor in your API**

Update `client/src/services/api.ts`:

```typescript
import axiosInstance from './axiosInstance';

export const commentsApi = {
  async create(data: CreateCommentData): Promise<Comment> {
    const response = await axiosInstance.post<Comment>('/comments', data);
    return response.data;
  },
  // ... other methods
};
```

### Solution 3: Disable Auth for Development (NOT RECOMMENDED)

**⚠️ ONLY for local development, NEVER in production:**

Modify `server/src/routes/comments.ts`:

```typescript
router.post('/', async (req: Request, res: Response) => {  // Remove authenticateToken
  try {
    // Use test user ID for development
    const authorId = req.user?.id || 'dbeda9cc-d42a-418d-8fa5-d0e1016b27e8';
    
    if (!authorId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // ... rest of code
  }
});
```

## 🎯 Recommended Approach

### Build the Authentication UI

**1. Create Login Page** (`client/src/pages/LoginPage.tsx`):

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
    } else if (data.session) {
      // Store session info
      localStorage.setItem('supabase.auth.token', data.session.access_token);
      navigate('/');
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
```

**2. Create Supabase Client** (`client/src/services/supabase.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**3. Add to `.env` in client**:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**4. Add Route** in `client/src/App.tsx`:

```typescript
import LoginPage from './pages/LoginPage';

<Route path="/login" element={<LoginPage />} />
```

**5. Add Login Button** to header:

```typescript
<Link to="/login" className="login-btn">Login</Link>
```

## 📝 Summary

| Solution | Difficulty | Security | Time |
|----------|-----------|----------|------|
| Build Auth UI | Medium | ✅ Secure | 2-4 hours |
| Use Supabase Auth | Easy | ✅ Secure | 1-2 hours |
| Development Workaround | Easy | ⚠️ Dev Only | 15 mins |
| Disable Auth | Very Easy | ❌ Insecure | 5 mins |

## 🔍 Debugging

### Check if user exists:
```bash
cd server
npx prisma studio
# Open 'users' table
```

### Test authentication manually:
```bash
# Get auth token from Supabase
curl -X POST https://your-project.supabase.co/auth/v1/token \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","password":"testpassword"}'

# Use token to create comment
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"body":"Test comment","postId":26}'
```

## Next Steps

1. ✅ Test user created
2. ⏳ Choose authentication solution
3. ⏳ Implement login/signup UI
4. ⏳ Add auth state management
5. ⏳ Protect routes that need auth

See `AUTH_SETUP.md` for full implementation guide.

