# BlueIt - Actual Architecture Documentation

> **Current Implementation**: React SPA + Express API | **Scale**: 50-100 users | **Focus**: AI-powered discussion summaries

# 📊 Architecture Overview

```mermaid
graph LR
    User[User Browser] -->|HTTP Requests| Vite[Vite Dev Server<br/>Port 3000]
    Vite -->|Proxy /api/*| Express[Express Server<br/>Port 5000]
    Express --> Prisma[Prisma ORM]
    Prisma --> Supabase[(PostgreSQL<br/>Supabase)]
    Express --> OpenAI[OpenAI API<br/>GPT-4o-mini]
    Express --> Cache[In-Memory Cache]
    Express --> RateLimiter[Rate Limiter]
```

# 🏗️ Tech Stack

## Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State**: React Context (Theme)
- **Styling**: Custom CSS

## Backend
- **Framework**: Express.js 4
- **Language**: TypeScript + Node.js
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase JWT validation
- **AI**: OpenAI GPT-4o-mini
- **Caching**: Custom in-memory cache (5000 entries, TTL-based)
- **Rate Limiting**: Custom in-memory implementation

# 📁 Project Structure

```
reddit_project/
├── client/                          # Frontend SPA
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── HomePage.tsx         # Main feed
│   │   │   ├── PostPage.tsx         # Post detail + AI summary
│   │   │   ├── CommunityPage.tsx    # Community posts
│   │   │   ├── CommunitiesPage.tsx  # Community list
│   │   │   ├── AuthPage.tsx         # Login/Register
│   │   │   ├── SearchPage.tsx       # Search
│   │   │   ├── UserProfilePage.tsx  # User profile
│   │   │   ├── SavedPostsPage.tsx   # Saved posts
│   │   │   └── SettingsPage.tsx     # User settings
│   │   ├── components/              # Reusable components
│   │   │   ├── PostCard.tsx         # Post in feed
│   │   │   ├── PostFeed.tsx         # List of posts
│   │   │   ├── VoteButtons.tsx      # Voting UI
│   │   │   ├── CommentItem.tsx      # Comment display
│   │   │   ├── CommunityCard.tsx    # Community card
│   │   │   ├── CreatePostForm.tsx   # New post form
│   │   │   └── SearchBar.tsx        # Search input
│   │   ├── services/
│   │   │   ├── api.ts               # Axios API client
│   │   │   └── auth.ts              # Auth service
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   ├── context/
│   │   │   └── ThemeContext.tsx     # Light/dark theme
│   │   └── App.tsx                  # Main app component
│   ├── vite.config.ts               # Vite config with proxy
│   └── package.json
│
└── server/                          # Backend API
    ├── src/
    │   ├── index.ts                 # Express app entry
    │   ├── routes/
    │   │   ├── auth.ts              # Auth endpoints
    │   │   ├── posts.ts             # Post CRUD + voting
    │   │   ├── comments.ts          # Comment CRUD
    │   │   ├── communities.ts       # Community management
    │   │   ├── votes.ts             # Generic voting
    │   │   ├── users.ts             # User profiles
    │   │   ├── polls.ts             # Poll voting
    │   │   ├── follows.ts           # User follows
    │   │   └── savedPosts.ts        # Saved posts
    │   ├── middleware/
    │   │   ├── auth.ts              # JWT validation
    │   │   ├── rateLimiter.ts       # Rate limiting
    │   │   ├── compression.ts       # Response compression
    │   │   └── requestValidator.ts  # Input validation
    │   ├── services/
    │   │   ├── aiService.ts         # OpenAI integration
    │   │   └── postService.ts       # Post business logic
    │   ├── utils/
    │   │   ├── slugify.ts           # URL slugs
    │   │   ├── mentions.ts          # @mention parsing
    │   │   └── validators.ts        # Validation helpers
    │   ├── config/
    │   │   └── supabase.ts          # Supabase client
    │   └── lib/
    │       ├── prisma.ts            # Prisma client
    │       └── cache.ts             # In-memory cache
    ├── prisma/
    │   ├── schema.prisma            # Database schema
    │   └── migrations/              # DB migrations
    └── package.json
```

# 🔌 API Endpoints

## Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

## Posts (`/api/posts`)
- `GET /api/posts` - List posts (with sorting)
- `GET /api/posts/hot` - Hot posts
- `GET /api/posts/search?q=query` - Search posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/vote` - Vote on post
- `GET /api/posts/:id/summary` - Get AI summary

## Comments (`/api/comments`)
- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## Communities (`/api/communities`)
- `GET /api/communities` - List communities
- `GET /api/communities/:slug` - Get community
- `POST /api/communities` - Create community
- `GET /api/communities/:slug/posts` - Get community posts
- `POST /api/communities/:id/join` - Join community
- `DELETE /api/communities/:id/leave` - Leave community

## Votes (`/api/votes`)
- `POST /api/votes` - Cast vote (generic)
- `DELETE /api/votes` - Remove vote
- `GET /api/votes/:targetType/:targetId` - Get vote count
- `GET /api/votes/user/:targetType/:targetId` - Get user's vote

## Users (`/api/users`)
- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/posts` - Get user's posts
- `GET /api/users/:username/comments` - Get user's comments
- `GET /api/users/:username/communities` - Get user's communities
- `PUT /api/users/profile` - Update profile

## Follows (`/api/follows`)
- `POST /api/follows/:username` - Follow user
- `DELETE /api/follows/:username` - Unfollow user
- `GET /api/follows/check/:username` - Check if following
- `GET /api/follows/followers/:username` - Get followers
- `GET /api/follows/following/:username` - Get following
- `GET /api/follows/feed` - Get feed from followed users

## Saved Posts (`/api/saved-posts`)
- `GET /api/saved-posts` - List saved posts
- `POST /api/saved-posts/:postId` - Save post
- `DELETE /api/saved-posts/:postId` - Unsave post
- `GET /api/saved-posts/check/:postId` - Check if saved
- `POST /api/saved-posts/check-multiple` - Batch check (allows anonymous)

## Polls (`/api/polls`)
- `GET /api/polls/post/:postId` - Get poll for post
- `POST /api/polls/vote` - Vote on poll
- `GET /api/polls/:pollId/user-vote` - Get user's poll vote

# 🔐 Authentication Flow

```
1. User registers/logs in → Supabase creates user
2. Backend receives Supabase JWT token
3. Frontend stores token in localStorage
4. Frontend sends token in Authorization header: Bearer <token>
5. Backend middleware validates token with Supabase
6. Requests proceed if token is valid
```

**Implementation**:
```typescript
// server/src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Auth error' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      req.user = user;
    } catch (error) {
      // Proceed without user
    }
  }
  
  next();
};
```

# 🤖 AI Summary System

## Architecture
```
Post has comments → Check if summary needed →
  If yes: Fetch top 10 comments → Generate OpenAI prompt →
  Call GPT-4o-mini → Store summary in DB →
  Cache for 24 hours
```

## Implementation
```typescript
// server/src/services/aiService.ts
import OpenAI from 'openai';

export class AIService {
  async generatePostSummary(postData: PostData): Promise<string> {
    // 1. Sort comments by vote count
    const topComments = postData.comments
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10);

    // 2. Build prompt
    const prompt = `Summarize this Reddit-style discussion in 2-3 sentences.
    
Title: ${postData.title}
Body: ${postData.body}

Top Comments:
${topComments.map((c, i) => `${i+1}. ${c.body} (${c.voteCount} votes)`).join('\n')}

Focus on main points, consensus, and key debates.`;

    // 3. Call OpenAI
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.3
    });

    return response.choices[0].message.content || '';
  }
}
```

## Caching Strategy
- Summary stored in `posts.ai_summary` column
- Timestamp in `posts.ai_summary_generated_at`
- Regenerate if > 24 hours old OR comment count changed significantly
- Cost: ~$0.001-0.002 per summary

# 💾 Database Schema (Key Tables)

## Posts
```prisma
model Post {
  id                        Int       @id @default(autoincrement())
  slug                      String?   @unique
  title                     String
  body                      String?
  post_type                 PostType  @default(text)
  authorId                  String    @db.Uuid
  communityId               Int
  ai_summary                String?
  ai_summary_generated_at   DateTime?
  ai_summary_comment_count  Int?      @default(0)
  createdAt                 DateTime? @default(now())
  
  author                    User      @relation(fields: [authorId])
  community                 Community @relation(fields: [communityId])
  comments                  Comment[]
  polls                     Poll[]
  savedBy                   SavedPost[]
}
```

## Votes
```prisma
model Vote {
  id          Int       @id @default(autoincrement())
  userId      String    @db.Uuid
  value       Int       // 1 (upvote), -1 (downvote), 0 (neutral)
  postId      Int?
  commentId   Int?
  createdAt   DateTime? @default(now())
  
  user        User      @relation(fields: [userId])
  
  @@unique([userId, postId])
  @@unique([userId, commentId])
}
```

## Communities
```prisma
model Community {
  id           Int       @id @default(autoincrement())
  name         String    @unique
  slug         String    @unique
  description  String?
  creator_id   String?   @db.Uuid
  memberCount  Int       @default(0)
  createdAt    DateTime? @default(now())
  
  posts        Post[]
  memberships  CommunityMembership[]
}
```

# 🚀 Running the Application

## Development Setup

1. **Install Dependencies**
```bash
# Frontend
cd client
npm install

# Backend
cd server
npm install
```

2. **Environment Variables**

`server/.env`:
```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
OPENAI_API_KEY="sk-..."
PORT=5000
```

`client/.env` (optional):
```
VITE_API_URL=http://localhost:5000
```

3. **Database Setup**
```bash
cd server
npx prisma generate
npx prisma migrate deploy
npx prisma db seed  # Optional
```

4. **Run Development Servers**
```bash
# Terminal 1 - Backend
cd server
npm run dev  # Starts on port 5000

# Terminal 2 - Frontend
cd client
npm run dev  # Starts on port 3000
```

5. **Access Application**
- Frontend: http://localhost:3000
- API: http://localhost:5000/api
- API Docs: http://localhost:5000 (shows endpoint list)

# 📦 Deployment

## Frontend (Static SPA)
Can be deployed to any static host:
- Vercel
- Netlify
- GitHub Pages
- S3 + CloudFront
- Any web server (Nginx, Apache)

Build command:
```bash
cd client
npm run build
# Outputs to client/dist/
```

## Backend (Node.js API)
Can be deployed to:
- Railway
- Render
- Heroku
- DigitalOcean App Platform
- VPS (with PM2)

# 💰 Cost Estimate

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| **Frontend Hosting** | Vercel Free / Netlify Free | $0 |
| **Backend Hosting** | Railway Hobby | $5 |
| **Database** | Supabase Free | $0 |
| **OpenAI API** | GPT-4o-mini (~100 summaries/day) | $10-15 |
| **Domain** | Optional | $1-2 |
| **Total** | | **$15-22/month** |

# 🔧 Key Features

✅ **Posts**: Create, edit, delete, vote, search, sort
✅ **Comments**: Nested threads, voting, mentions
✅ **Communities**: Create, join, browse, post to
✅ **AI Summaries**: Automatic discussion summaries
✅ **User Profiles**: Post history, karma, followers
✅ **Saved Posts**: Bookmark posts for later
✅ **Polls**: Create and vote on polls
✅ **Search**: Full-text search across posts
✅ **Dark Mode**: Theme switching
✅ **Responsive**: Mobile-friendly UI

# 📈 Performance Optimizations

1. **In-Memory Caching**: 5000-entry cache with TTL
2. **Vote Aggregation**: Computed on read, cached
3. **AI Summary Caching**: 24-hour cache in database
4. **Lazy Loading**: Comments loaded on demand
5. **Optimistic UI**: Instant feedback on votes
6. **Image Compression**: Sharp for image processing
7. **Response Compression**: Gzip middleware

# 🔐 Security Features

- Supabase JWT validation
- Rate limiting (per-IP, in-memory)
- Input validation (Zod-like validators)
- SQL injection protection (Prisma ORM)
- XSS protection (React auto-escaping)
- CORS configuration
- Optional authentication for public endpoints

---

**Last Updated**: December 2, 2025
**Version**: 1.0.0 (Production)
