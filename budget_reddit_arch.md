# Reddit Project - Budget Architecture (50 Users)

> **Scale**: 50 users | **Focus**: AI-powered discussion summaries | **Infrastructure**: Minimal & Cost-Effective

```mermaid
graph TB
    %% User
    User["User<br/>Views Post"]

    %% Frontend Layer
    subgraph FRONTEND["FRONTEND LAYER"]
        NextJS["Next.js Application<br/>React + TypeScript<br/>Server Components<br/><br/>Vercel Free Tier or VPS<br/>2 vCPU, 4GB RAM"]
    end

    %% Backend API Layer
    subgraph BACKEND["BACKEND API LAYER"]
        API["Next.js API Routes<br/>TypeScript + Node.js<br/><br/>Same server as Frontend"]
        
        Auth["Auth Middleware<br/>JWT Validation<br/>Session Check"]
        RateLimit["Rate Limiter<br/>In-Memory Store<br/>Prevent Abuse"]
        
        API --> Auth
        API --> RateLimit
    end

    %% Business Logic Services
    subgraph SERVICES["BUSINESS LOGIC SERVICES"]
        PostSvc["Post Service<br/>CRUD + Pagination"]
        CommentSvc["Comment Service<br/>Nested Threads"]
        VoteSvc["Vote Service<br/>Upvote/Downvote"]
        AISvc["AI Service<br/>Summary Generation<br/>(Core Feature)"]
    end

    %% Single Database
    subgraph DATABASE["DATABASE TIER"]
        Postgres["PostgreSQL<br/>Single Instance<br/><br/>All Data Storage<br/>AI Summary Cache<br/>Session Storage<br/>Image Storage (base64)<br/><br/>Supabase/Railway"]
    end

    %% External Services
    subgraph EXTERNAL["EXTERNAL SERVICES"]
        OpenAI["OpenAI API<br/>GPT-4o-mini<br/><br/>Cost: $10-30/month<br/>Summaries Cached 24hr"]
    end

    %% ============================================
    %% MAIN FLOW: View Post with AI Summary
    %% ============================================
    
    User -->|"1. GET /posts/123"| NextJS
    NextJS -->|"2. Server-side render<br/>Fetch data"| API
    
    API -->|"3. Validate JWT<br/>(from cookie)"| Auth
    Auth -->|"Authorized"| PostSvc
    
    PostSvc -->|"4. Query Post<br/>SELECT * FROM posts<br/>WHERE id = 123"| Postgres
    
    Postgres -->|"5. Post data +<br/>ai_summary field"| PostSvc
    
    PostSvc -->|"6. Check if summary<br/>exists & fresh"| PostSvc
    PostSvc -.->|"No summary or stale"| AISvc
    
    AISvc -->|"7. Fetch top comments"| Postgres
    Postgres -->|"8. Top 10 comments"| AISvc
    
    AISvc -->|"9. Generate prompt<br/>Call OpenAI"| OpenAI
    OpenAI -->|"10. AI Summary"| AISvc
    
    AISvc -->|"11. Store summary<br/>UPDATE posts<br/>SET ai_summary = '...'"| Postgres
    
    PostSvc -->|"12. Return combined data<br/>{post, comments,<br/>aiSummary, votes}"| API
    
    API -->|"13. JSON response"| NextJS
    NextJS -->|"14. Render UI<br/>Post + AI Summary<br/>+ Comments"| User

    %% Secondary Flows
    VoteSvc -.->|"Write votes"| Postgres
    CommentSvc -.->|"Write comments"| Postgres

    %% ============================================
    %% STYLING
    %% ============================================
    
    style User fill:#2C3E50,stroke:#1A252F,stroke-width:3px,color:#FFF,font-weight:bold
    
    style FRONTEND fill:#4ECDC4,stroke:#0A9396,stroke-width:3px,color:#FFF
    style NextJS fill:#26A69A,stroke:#00897B,stroke-width:2px,color:#FFF
    
    style BACKEND fill:#9B59B6,stroke:#7D3C98,stroke-width:3px,color:#FFF
    style API fill:#8E44AD,stroke:#6C3483,stroke-width:2px,color:#FFF
    style Auth fill:#A569BD,stroke:#7D3C98,stroke-width:2px,color:#FFF
    style RateLimit fill:#AF7AC5,stroke:#7D3C98,stroke-width:2px,color:#FFF
    
    style SERVICES fill:#3498DB,stroke:#2471A3,stroke-width:3px,color:#FFF
    style PostSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#000
    style CommentSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#000
    style VoteSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#000
    style AISvc fill:#F39C12,stroke:#CA6F1E,stroke-width:2px,color:#000,font-weight:bold
    
    style DATABASE fill:#1ABC9C,stroke:#148F77,stroke-width:3px,color:#FFF
    style Postgres fill:#16A085,stroke:#117A65,stroke-width:2px,color:#FFF
    
    style EXTERNAL fill:#F39C12,stroke:#D68910,stroke-width:3px,color:#FFF
    style OpenAI fill:#F8C471,stroke:#D68910,stroke-width:2px,color:#000,font-weight:bold
```

---

## 🎯 System Overview

### **Scope & Purpose**
A Reddit-style discussion forum with **AI-powered summaries** - optimized for 50 users with minimal infrastructure costs.

### **Key Changes from Original**
- ❌ **Removed**: Redis, S3, CloudFront, Read Replicas, App Runner
- ✅ **Kept**: AI summaries, full Reddit functionality
- 💰 **Cost**: ~$15-45/month (vs $1,110/month)

### **Scale Target**
- **Users**: 50 concurrent users
- **Posts**: ~1,000 posts
- **Performance**: <200ms response time for cached content

---

## 🏗️ Architecture Components

### **1. Frontend Layer (Next.js App Router)**

**What**: Modern React application with Server and Client Components

**Tech Stack**:
- **Framework**: Next.js 14+ App Router
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS (recommended for rapid development)
- **State Management**: React Context + Server Components (no Redux needed!)
- **Data Fetching**: Native fetch with Server Components

**Project Structure**:
```
app/
├── (auth)/                    # Auth route group
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── register/
│   │   └── page.tsx          # Registration page
│   └── layout.tsx            # Minimal layout (no nav)
├── (main)/                   # Main app route group
│   ├── layout.tsx            # Main layout with nav
│   ├── page.tsx              # Homepage (post feed)
│   ├── communities/
│   │   ├── page.tsx          # Community list
│   │   └── [slug]/
│   │       └── page.tsx      # Community detail
│   └── posts/
│       ├── new/
│       │   └── page.tsx      # Create post
│       └── [id]/
│           └── page.tsx      # Post detail with AI summary
├── api/                      # API routes (backend)
│   └── [...routes]           # See Backend section
└── components/
    ├── Post.tsx              # Post card component
    ├── Comment.tsx           # Comment component
    ├── AISummary.tsx         # ⭐ AI summary sidebar
    ├── VoteButtons.tsx       # Upvote/downvote
    └── Navbar.tsx            # Navigation bar
```

**Key Features**:

1. **Server Components (Performance Boost)**
   - Render on server by default (less JavaScript sent to client)
   - Direct database access in page components
   - Automatic code splitting

   ```tsx
   // app/(main)/posts/[id]/page.tsx (Server Component)
   import { db } from '@/lib/db';
   
   export default async function PostPage({ params }: { params: { id: string } }) {
     // Fetch directly in component - runs on server!
     const post = await db.post.findUnique({
       where: { id: parseInt(params.id) },
       include: {
         author: true,
         comments: {
           include: { author: true },
           orderBy: { createdAt: 'desc' }
         }
       }
     });
   
     return (
       <div className="max-w-7xl mx-auto">
         <div className="grid grid-cols-3 gap-6">
           {/* Main content - 2/3 width */}
           <div className="col-span-2">
             <PostContent post={post} />
             <CommentSection comments={post.comments} />
           </div>
           
           {/* AI Summary Sidebar - 1/3 width */}
           <aside className="col-span-1">
             <AISummarySidebar postId={post.id} summary={post.ai_summary} />
           </aside>
         </div>
       </div>
     );
   }
   ```

2. **Client Components (Interactive UI)**
   - Use "use client" directive for interactive elements
   - Voting, commenting, real-time updates

   ```tsx
   // components/VoteButtons.tsx (Client Component)
   'use client';
   
   import { useState } from 'react';
   
   export function VoteButtons({ postId, initialVotes }: Props) {
     const [votes, setVotes] = useState(initialVotes);
     const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
   
     async function handleVote(direction: 'up' | 'down') {
       const response = await fetch('/api/votes', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           targetType: 'post',
           targetId: postId,
           value: direction === 'up' ? 1 : -1
         })
       });
   
       if (response.ok) {
         const newVote = userVote === direction ? null : direction;
         setUserVote(newVote);
         // Update vote count optimistically
         setVotes(prev => prev + (newVote === 'up' ? 1 : newVote === 'down' ? -1 : 0));
       }
     }
   
     return (
       <div className="flex flex-col items-center">
         <button onClick={() => handleVote('up')} className={userVote === 'up' ? 'text-orange-500' : ''}>
           ▲
         </button>
         <span className="font-bold">{votes}</span>
         <button onClick={() => handleVote('down')} className={userVote === 'down' ? 'text-blue-500' : ''}>
           ▼
         </button>
       </div>
     );
   }
   ```

3. **AI Summary Component (Core Feature)**
   ```tsx
   // components/AISummary.tsx
   'use client';
   
   import { useState } from 'react';
   
   export function AISummarySidebar({ postId, summary }: Props) {
     const [aiSummary, setAiSummary] = useState(summary);
     const [loading, setLoading] = useState(false);
   
     async function generateSummary() {
       setLoading(true);
       try {
         const res = await fetch(`/api/posts/${postId}/summary`, { method: 'POST' });
         const data = await res.json();
         setAiSummary(data.summary);
       } catch (error) {
         console.error('Failed to generate summary', error);
       } finally {
         setLoading(false);
       }
     }
   
     return (
       <div className="sticky top-4 p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg shadow-lg border border-orange-200">
         <div className="flex items-center gap-2 mb-3">
           <span className="text-2xl">🤖</span>
           <h3 className="text-lg font-bold text-gray-800">AI Summary</h3>
         </div>
         
         {aiSummary ? (
           <p className="text-gray-700 leading-relaxed">{aiSummary}</p>
         ) : (
           <div>
             <p className="text-gray-600 mb-3">No summary yet for this discussion.</p>
             <button
               onClick={generateSummary}
               disabled={loading}
               className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
             >
               {loading ? 'Generating...' : 'Generate Summary'}
             </button>
           </div>
         )}
         
         {aiSummary && (
           <button
             onClick={generateSummary}
             className="mt-3 text-sm text-orange-600 hover:underline"
           >
             Regenerate
           </button>
         )}
       </div>
     );
   }
   ```

**Deployment Options**:

| Option | Cost | Specs | Best For |
|--------|------|-------|----------|
| **Vercel Free Tier** | $0 | Serverless, auto-scale | Development + light production |
| **Railway** | $5/month | 512MB RAM, shared CPU | Simple deployment |
| **DigitalOcean Droplet** | $12/month | 2GB RAM, 1 vCPU | Full control |
| **Hetzner VPS** | €4/month (~$4) | 2GB RAM, 1 vCPU | Best value |

**Recommended**: Start with **Vercel Free Tier** → upgrade to Railway/Hetzner if you hit limits.

---

### **2. Backend Layer (Next.js API Routes)**

**What**: RESTful API built with Next.js API Routes (no separate Express server needed!)

**Why API Routes?**
- Co-located with frontend (single codebase)
- Automatic API endpoints from file structure
- TypeScript end-to-end
- Serverless-ready (Vercel)
- Simpler than separate backend

**API Structure**:
```
app/api/
├── auth/
│   ├── login/route.ts           # POST /api/auth/login
│   ├── register/route.ts        # POST /api/auth/register
│   ├── logout/route.ts          # POST /api/auth/logout
│   └── me/route.ts              # GET /api/auth/me (current user)
├── posts/
│   ├── route.ts                 # GET /api/posts (list), POST /api/posts (create)
│   └── [id]/
│       ├── route.ts             # GET /api/posts/123, PATCH /api/posts/123, DELETE /api/posts/123
│       └── summary/route.ts     # POST /api/posts/123/summary (generate AI summary)
├── comments/
│   ├── route.ts                 # POST /api/comments (create)
│   └── [id]/route.ts            # PATCH, DELETE comments
├── votes/route.ts               # POST /api/votes (upvote/downvote)
└── communities/
    ├── route.ts                 # GET /api/communities, POST /api/communities
    └── [slug]/route.ts          # GET /api/communities/programming
```

**API Route Example (Full CRUD)**:
```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/posts - List posts with pagination
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const communitySlug = searchParams.get('community');

  const posts = await db.post.findMany({
    where: communitySlug ? { community: { slug: communitySlug } } : undefined,
    include: {
      author: { select: { id: true, username: true, avatarData: true } },
      community: { select: { id: true, name: true, slug: true } },
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit
  });

  const total = await db.post.count({
    where: communitySlug ? { community: { slug: communitySlug } } : undefined
  });

  return NextResponse.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}

// POST /api/posts - Create new post
const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  body: z.string().max(40000).optional(),
  communityId: z.number().int().positive(),
  imageData: z.string().optional() // base64 encoded image
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 10, 60000)) { // 10 posts per minute
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    // 2. Authentication
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Validate input
    const body = await req.json();
    const data = CreatePostSchema.parse(body);

    // 4. Validate image size if present
    if (data.imageData) {
      const sizeInBytes = (data.imageData.length * 3) / 4; // Base64 to bytes
      if (sizeInBytes > 2 * 1024 * 1024) { // 2MB limit
        return NextResponse.json(
          { error: 'Image too large (max 2MB)' },
          { status: 400 }
        );
      }
    }

    // 5. Create post
    const post = await db.post.create({
      data: {
        title: data.title,
        body: data.body,
        imageData: data.imageData,
        authorId: user.id,
        communityId: data.communityId
      },
      include: {
        author: { select: { id: true, username: true } },
        community: { select: { id: true, name: true, slug: true } }
      }
    });

    return NextResponse.json(post, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Middleware for Auth & Security**:
```typescript
// lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from './db';

export async function getCurrentUser(req: NextRequest) {
  try {
    // 1. Get token from cookie
    const token = req.cookies.get('session')?.value;
    if (!token) return null;

    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    // 3. Check if session exists in database
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  } catch (error) {
    return null;
  }
}

// Middleware wrapper for protected routes
export function withAuth(handler: Function) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Attach user to request (not directly possible, pass as param)
    return handler(req, user);
  };
}
```

**Error Handling Pattern**:
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Usage in API route
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) throw new UnauthorizedError();

    const post = await db.post.findUnique({ where: { id: parseInt(params.id) } });
    if (!post) throw new NotFoundError('Post');

    if (post.authorId !== user.id) {
      throw new ForbiddenError('You can only delete your own posts');
    }

    await db.post.delete({ where: { id: post.id } });
    return NextResponse.json({ success: true });
    
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### **3. Authentication System (JWT + Database Sessions)**

**Architecture**: Hybrid approach combining JWT tokens with database session validation

**Why This Approach?**
- **JWT**: Fast validation without database hit (stateless)
- **Database Sessions**: Ability to revoke tokens (logout, ban users)
- **Best of Both Worlds**: Performance + control

**Auth Flow**:

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                         │
└─────────────────────────────────────────────────────────────┘
1. User submits: { username, email, password }
2. Validate: unique username/email, strong password
3. Hash password: bcrypt with cost factor 12
4. Create user in database
5. Create session entry
6. Generate JWT token
7. Set httpOnly cookie with token
8. Return user profile

┌─────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                              │
└─────────────────────────────────────────────────────────────┘
1. User submits: { username, password }
2. Find user by username
3. Compare password with bcrypt
4. If valid:
   a. Create new session in database
   b. Generate JWT token with userId
   c. Set httpOnly cookie
   d. Return user profile
5. If invalid: Return 401 error

┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION CHECK                        │
└─────────────────────────────────────────────────────────────┘
1. Extract token from httpOnly cookie
2. Verify JWT signature
3. Check session exists in database
4. Check session not expired
5. Return user if all checks pass
```

**Implementation**:

```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '@/lib/db';

const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 
    'Username can only contain letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // 1. Check if username or email already exists
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Username or email already taken' },
        { status: 400 }
      );
    }

    // 2. Hash password (bcrypt cost factor 12 = good security/performance balance)
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 3. Create user
    const user = await db.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: hashedPassword
      }
    });

    // 4. Create session
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // 5. Set httpOnly cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }, { status: 201 });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting (prevent brute force)
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 5, 60000)) { // 5 attempts per minute
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    // 2. Find user
    const user = await db.user.findUnique({
      where: { username }
    });

    if (!user) {
      // Generic error to prevent username enumeration
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // 3. Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // 4. Create session
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    await db.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // 5. Set cookie and return user
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('session')?.value;

    if (token) {
      // Delete session from database
      await db.session.delete({
        where: { token }
      }).catch(() => {}); // Ignore if session doesn't exist
    }

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

```typescript
// app/api/auth/me/route.ts - Get current user
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  });
}
```

**Frontend Auth Context**:
```tsx
// app/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: number;
  username: string;
  email: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Usage in Components**:
```tsx
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      router.push('/'); // Redirect to homepage
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-3xl font-bold mb-6">Login</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 font-medium"
        >
          Login
        </button>
      </form>
    </div>
  );
}
```

**Security Best Practices**:

✅ **Password Security**
- Minimum 8 characters with complexity requirements
- bcrypt with cost factor 12 (optimal security/performance)
- Never log or store plaintext passwords

✅ **JWT Security**
- Signed with HS256 algorithm
- Short expiration (7 days, can reduce to 24 hours for higher security)
- Store in httpOnly cookies (not localStorage - prevents XSS)

✅ **Session Management**
- Database sessions allow instant revocation
- Cleanup expired sessions with cron job
- One-to-many user-sessions (multiple devices supported)

✅ **Rate Limiting**
- Login: 5 attempts per minute per IP
- Registration: 3 accounts per hour per IP
- Prevents brute force and spam accounts

✅ **CSRF Protection**
- SameSite=Lax cookie attribute
- Next.js automatic CSRF protection for API routes

✅ **Input Validation**
- Zod schemas validate all inputs
- Sanitize user-generated content
- Prevent SQL injection (Prisma handles this)

---

### **2. Database (PostgreSQL)**

**What**: Single PostgreSQL database storing everything

**Schema Additions** (vs original):
```sql
-- Add AI summary column to posts table
ALTER TABLE posts ADD COLUMN ai_summary TEXT;
ALTER TABLE posts ADD COLUMN ai_summary_generated_at TIMESTAMP;

-- Add index for faster summary checks
CREATE INDEX idx_posts_needs_summary 
ON posts(id) 
WHERE ai_summary IS NULL AND comment_count >= 5;

-- Store small images as base64 in database (budget approach)
ALTER TABLE posts ADD COLUMN image_data TEXT; -- base64 encoded
ALTER TABLE users ADD COLUMN avatar_data TEXT; -- base64 encoded

-- Session storage (replaces Redis)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

**Caching Strategy** (Database-Based):
```sql
-- Materialized view for hot posts (refresh every 5 minutes)
CREATE MATERIALIZED VIEW hot_posts AS
SELECT 
    p.*,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT v.user_id) as vote_count
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN votes v ON v.target_type = 'post' AND v.target_id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.id
ORDER BY (vote_count + comment_count * 2) DESC
LIMIT 100;

CREATE UNIQUE INDEX ON hot_posts(id);

-- Refresh in background (cron job or Next.js API route)
REFRESH MATERIALIZED VIEW CONCURRENTLY hot_posts;
```

**Deployment Options**:

| Option | Cost | Storage | Best For |
|--------|------|---------|----------|
| **Supabase Free Tier** | $0 | 500MB, paused after 7 days inactive | Development |
| **Railway** | $5/month | 1GB | Simple setup |
| **Render** | $7/month | 1GB | Good performance |
| **Hetzner VPS** | Included in VPS | Unlimited* | Full control |

**Recommended**: 
- **If using Vercel**: Supabase Free (dev) → Railway ($5) when ready
- **If using VPS**: PostgreSQL on same server (free!)

---

### **3. Business Logic Services**

Same as original architecture, but implemented as **Next.js API routes**:

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts       # POST /api/auth/login
│   │   └── register/route.ts    # POST /api/auth/register
│   ├── posts/
│   │   ├── route.ts             # GET /api/posts (list)
│   │   ├── [id]/route.ts        # GET /api/posts/123
│   │   └── [id]/summary/route.ts # POST /api/posts/123/summary
│   ├── comments/route.ts         # POST /api/comments
│   └── votes/route.ts            # POST /api/votes
├── lib/
│   ├── services/
│   │   ├── post.service.ts
│   │   ├── comment.service.ts
│   │   ├── vote.service.ts
│   │   └── ai.service.ts
│   └── db.ts                     # Prisma client
```

**AI Service** (Budget-Optimized):

```typescript
// app/lib/services/ai.service.ts
import OpenAI from 'openai';
import { db } from '../db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSummary(postId: number) {
  // 1. Check if summary already exists
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { 
      id: true, 
      title: true, 
      body: true, 
      ai_summary: true,
      ai_summary_generated_at: true 
    }
  });

  // Return cached summary if less than 24 hours old
  if (post.ai_summary && post.ai_summary_generated_at) {
    const hoursSinceGeneration = 
      (Date.now() - post.ai_summary_generated_at.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceGeneration < 24) {
      return post.ai_summary;
    }
  }

  // 2. Fetch top comments (only if post has 5+ comments)
  const commentCount = await db.comment.count({ 
    where: { post_id: postId } 
  });
  
  if (commentCount < 5) {
    return null; // Don't waste API calls on posts with few comments
  }

  const comments = await db.comment.findMany({
    where: { post_id: postId },
    orderBy: { created_at: 'desc' },
    take: 10,
    select: { body: true }
  });

  // 3. Build prompt (keep it short to save tokens)
  const prompt = `Summarize this discussion in 2-3 sentences:

Title: ${post.title}
${post.body ? `Body: ${post.body.substring(0, 500)}` : ''}

Top Comments:
${comments.map((c, i) => `${i+1}. ${c.body.substring(0, 200)}`).join('\n')}

Focus on: main points, consensus, key debates.`;

  // 4. Call OpenAI (use cheaper model)
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cheaper! $0.15 per 1M input tokens
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150, // Keep response short
    temperature: 0.3
  });

  const summary = response.choices[0].message.content;

  // 5. Store in database (cache)
  await db.post.update({
    where: { id: postId },
    data: {
      ai_summary: summary,
      ai_summary_generated_at: new Date()
    }
  });

  return summary;
}
```

**Cost Optimization**:
- Use **GPT-4o-mini** instead of GPT-4o (10x cheaper)
- Only summarize posts with 5+ comments
- Limit prompt size (top 10 comments, 200 chars each)
- Cache summaries in database for 24 hours
- **Estimated cost**: 100 summaries/day × $0.0015 = **$4.50/month**

---

### **4. File Storage (Database-Based)**

**Approach**: Store small images as base64 in PostgreSQL

**Why?**
- No S3 costs ($0 vs $5-10/month)
- No CloudFront costs ($0 vs $10-20/month)
- Simpler architecture
- Fine for 50 users with small images

**Implementation**:

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get('image') as File;
  
  // Validate image
  if (image) {
    if (image.size > 2 * 1024 * 1024) { // 2MB limit
      return NextResponse.json(
        { error: 'Image too large (max 2MB)' },
        { status: 400 }
      );
    }
    
    // Convert to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const imageData = `data:${image.type};base64,${base64}`;
    
    // Store in database
    await db.post.create({
      data: {
        title: formData.get('title'),
        body: formData.get('body'),
        image_data: imageData, // Stored in DB
        author_id: userId
      }
    });
  }
}
```

**Limitations**:
- Max image size: 2MB (enforced in frontend)
- Storage limit: ~5GB for free tier databases
- Slower than CDN, but acceptable for 50 users

**Alternative** (if you need more storage later):
- Cloudinary Free Tier: 25GB storage, 25GB bandwidth/month
- Imgur API: Free image hosting

---

### **5. Authentication & Sessions**

**Approach**: JWT tokens stored in httpOnly cookies + database session table

**Why not Redis?**
- PostgreSQL can handle session storage for 50 users
- No extra service to manage
- No extra cost

**Implementation**:

```typescript
// app/lib/auth.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function createSession(userId: number) {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  
  // Store in database
  await db.session.create({
    data: {
      user_id: userId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  // Set cookie
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60
  });
  
  return token;
}

export async function validateSession(token: string) {
  // Check database
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!session || session.expires_at < new Date()) {
    return null;
  }
  
  return session.user;
}

// Cleanup expired sessions (run daily via cron)
export async function cleanupSessions() {
  await db.session.deleteMany({
    where: { expires_at: { lt: new Date() } }
  });
}
```

---

### **6. Rate Limiting**

**Approach**: In-memory Map (acceptable for single server)

```typescript
// app/lib/rate-limit.ts
const requests = new Map<string, number[]>();

export function rateLimit(identifier: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const userRequests = requests.get(identifier) || [];
  
  // Remove old requests outside time window
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  requests.set(identifier, recentRequests);
  
  return true;
}

// Middleware for API routes
export function withRateLimit(handler: Function, maxRequests = 100, windowMs = 60000) {
  return async (req: NextRequest) => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!rateLimit(ip, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    return handler(req);
  };
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  requests.forEach((times, key) => {
    const recent = times.filter(t => now - t < 3600000);
    if (recent.length === 0) {
      requests.delete(key);
    }
  });
}, 3600000);
```

---

## 🎬 Main Use Case Walkthrough

### **Scenario**: User views post #123 "Why is the sky blue?"

**Simplified Flow** (9 steps vs 14 in original):

1️⃣ **User clicks post** → Next.js server receives request

2️⃣ **Auth check**: Validate JWT from cookie (quick check, no external service)

3️⃣ **Query database**:
```sql
SELECT 
  p.*,
  p.ai_summary,
  p.ai_summary_generated_at,
  u.username as author_name,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT v.user_id) FILTER (WHERE v.value = 1) as upvotes
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN votes v ON v.target_type = 'post' AND v.target_id = p.id
WHERE p.id = 123
GROUP BY p.id, u.username;
```

4️⃣ **Check AI summary**:
- Has summary + fresh (<24hrs)? → Skip to step 8 ✅
- No summary or stale? → Continue...

5️⃣ **Fetch comments**: Get top 10 comments from database

6️⃣ **Call OpenAI API**: Generate summary (if needed)

7️⃣ **Store summary**: `UPDATE posts SET ai_summary = '...' WHERE id = 123`

8️⃣ **Prepare response**: Combine post, comments, AI summary, votes

9️⃣ **Render page**: Next.js Server Component renders full page with summary

**Total Time**:
- **First request** (generate summary): 2-4 seconds
- **Cached summary**: 50-150ms
- **Subsequent requests** (DB cache): 30-80ms

---

## 📊 Performance & Scale

### **Capacity (Single Server)**

| Metric | Capacity | Notes |
|--------|----------|-------|
| **Concurrent Users** | 50 active | Comfortable with 2GB RAM |
| **Requests/sec** | 100-200 | Enough for 50 users |
| **Database Queries/sec** | 1,000+ | PostgreSQL on same VPS |
| **Storage** | 5-50GB | Database + images |

### **Bottlenecks & Solutions**

| Bottleneck | When It Happens | Solution |
|------------|-----------------|----------|
| **OpenAI API cost** | >200 summaries/day | Cache for 48 hours, use GPT-4o-mini |
| **Database size** | >5GB on free tier | Upgrade to paid tier ($5-7/month) |
| **CPU usage** | >80% sustained | Upgrade VPS to 2 vCPU |
| **Image storage** | >2GB in DB | Move to Cloudinary free tier |

### **When to Upgrade Architecture**

Signal you've outgrown this setup:
- Consistently >100 concurrent users
- Database queries taking >500ms
- OpenAI API costs >$50/month
- Image storage >10GB

At that point, revisit original architecture with Redis, S3, read replicas.

---

## 🔒 Security

### **Same as Original, But Simpler**

✅ **JWT Authentication** (httpOnly cookies)
✅ **Rate Limiting** (in-memory, good enough for 1 server)
✅ **Input Validation** (Zod schemas)
✅ **SQL Injection Protection** (Prisma ORM)
✅ **XSS Protection** (React escapes by default)
✅ **HTTPS** (Vercel/Railway provide free SSL)

---

## 💰 Cost Breakdown

### **Monthly Costs (50 Users)**

| Service | Option | Cost |
|---------|--------|------|
| **Hosting** | Vercel Free | $0 |
| **Database** | Supabase Free | $0 |
| **OpenAI API** | ~100 summaries/day | $5-15 |
| **Domain** | Namecheap | $1 |
| **Total** | | **$6-16/month** |

### **Alternative Setups**

**Setup 1: Fully Free (Development)**
- Vercel Free Tier (hosting)
- Supabase Free Tier (database)
- OpenAI $5 credit (first month)
- **Total: $0-5/month**

**Setup 2: Self-Hosted (Best Value)**
- Hetzner VPS (€4/month)
- PostgreSQL on same VPS (free)
- OpenAI API ($5-15/month)
- **Total: $9-19/month**

**Setup 3: Managed Services (Easy)**
- Railway (hosting + DB, $5-10/month)
- OpenAI API ($5-15/month)
- **Total: $10-25/month**

### **Cost Comparison**

| | Original | Budget |
|---|----------|--------|
| **Monthly Cost** | $1,110 | $15 |
| **Savings** | - | **98.6%** |
| **Services** | 8 | 2-3 |
| **Complexity** | High | Low |
| **Users Supported** | 1,000+ | 50 |

---

## 🚀 Deployment Guide

### **Option A: Vercel + Supabase (Easiest)**

```bash
# 1. Create Supabase project (free tier)
# - Sign up at supabase.com
# - Create new project
# - Copy connection string

# 2. Clone your repo
git clone your-reddit-project
cd your-reddit-project

# 3. Set up database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
npx prisma migrate deploy

# 4. Configure environment variables
# Create .env.local:
DATABASE_URL=your-supabase-url
OPENAI_API_KEY=sk-...
JWT_SECRET=your-random-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# 5. Deploy to Vercel
npm install -g vercel
vercel --prod

# 6. Add environment variables in Vercel dashboard
# Settings > Environment Variables
```

### **Option B: Self-Hosted VPS (Best Value)**

```bash
# 1. Rent VPS (Hetzner, DigitalOcean, Linode)
# - Ubuntu 22.04
# - 2GB RAM, 1 vCPU
# - €4-12/month

# 2. SSH into server
ssh root@your-vps-ip

# 3. Install dependencies
apt update && apt upgrade -y
apt install -y nodejs npm postgresql nginx certbot

# 4. Set up PostgreSQL
sudo -u postgres psql
CREATE DATABASE reddit;
CREATE USER reddit_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE reddit TO reddit_user;
\q

# 5. Clone and build your app
git clone your-repo
cd your-reddit-project
npm install
npm run build

# 6. Set up environment variables
echo "DATABASE_URL=postgresql://reddit_user:your_password@localhost:5432/reddit" > .env.production
echo "OPENAI_API_KEY=sk-..." >> .env.production
echo "JWT_SECRET=your-secret" >> .env.production

# 7. Run migrations
npx prisma migrate deploy

# 8. Set up PM2 (process manager)
npm install -g pm2
pm2 start npm --name "reddit" -- start
pm2 startup
pm2 save

# 9. Configure Nginx reverse proxy
cat > /etc/nginx/sites-available/reddit <<EOF
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/reddit /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 10. Get SSL certificate
certbot --nginx -d your-domain.com
```

---

## 🎯 Why This Architecture?

### ✅ **Ultra Budget-Friendly**
- 98% cheaper than original ($15 vs $1,110/month)
- Can start completely free (Vercel + Supabase)
- No hidden costs (S3, CloudFront, ElastiCache)

### ✅ **Simpler to Manage**
- 2-3 services vs 8 services
- No separate backend server
- No Redis, no S3, no read replicas
- One codebase, one deployment

### ✅ **Still Fully Functional**
- AI summaries ✅
- Image uploads ✅
- Nested comments ✅
- Voting system ✅
- Authentication ✅
- Rate limiting ✅

### ✅ **Easy to Deploy**
- Vercel: Push to GitHub → auto-deploy
- VPS: One-command setup script
- No Kubernetes, no Docker compose

### ✅ **Good Performance**
- <200ms response time for most requests
- Database caching prevents repeated AI calls
- Materialized views for hot posts
- Acceptable for 50 users

---

## 📋 Quick Reference

### **Key URLs**
- App: `https://your-app.vercel.app` or `https://your-domain.com`
- Database: Direct connection (no separate endpoint)
- API: `https://your-app.vercel.app/api/*`

### **API Endpoints**
```
POST   /api/auth/register              - Create account
POST   /api/auth/login                 - Login
GET    /api/posts                      - List posts
GET    /api/posts/[id]                 - Get post + AI summary
POST   /api/posts                      - Create post
POST   /api/posts/[id]/summary         - Generate AI summary
POST   /api/comments                   - Add comment
POST   /api/votes                      - Vote
```

### **Database Tables**
```
users           - User accounts
posts           - Posts (with ai_summary column)
comments        - Nested comments
votes           - Upvotes/downvotes
communities     - Subreddit-style communities
sessions        - User sessions (replaces Redis)
```

### **Environment Variables**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/reddit
OPENAI_API_KEY=sk-...
JWT_SECRET=your-random-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🔮 Upgrade Path (When You Grow)

### **50 → 500 Users**
- [ ] Upgrade database to paid tier (Railway $7, Supabase $25)
- [ ] Add Redis for caching (Upstash free tier → $10/month)
- [ ] Move images to Cloudinary (still free tier)
- [ ] **Cost: ~$50/month**

### **500 → 5,000 Users**
- [ ] Separate backend API (Express on separate VPS)
- [ ] Add database read replica
- [ ] Use S3 for image storage
- [ ] Add CDN (CloudFront or Bunny CDN)
- [ ] **Cost: ~$200-300/month**

### **5,000+ Users**
- [ ] Use full original architecture
- [ ] Add load balancer
- [ ] Multiple API instances
- [ ] Advanced caching strategy
- [ ] **Cost: ~$500-1,000/month**

---

**Perfect for learning, side projects, and local communities!** 🚀

**Start free, scale when needed.**