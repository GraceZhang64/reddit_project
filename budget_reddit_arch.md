# Reddit Project - Budget Architecture (50 Users)

> **Scale**: 50 users | **Focus**: AI-powered discussion summaries | **Infrastructure**: Minimal & Cost-Effective

```mermaid
graph TB
    %% User
    User["👤 User<br/>Views Post"]

    %% Frontend + Backend Combined
    subgraph SERVER["🖥️ SINGLE SERVER (All-in-One)"]
        NextJS["Next.js Full-Stack App<br/>React + TypeScript<br/>API Routes + Server Components<br/><br/>📍 Single VPS or Vercel Free Tier<br/>2 vCPU, 4GB RAM"]
        
        subgraph SERVICES["💼 Business Logic"]
            PostSvc["📝 Post Service"]
            CommentSvc["💬 Comment Service"]
            VoteSvc["⬆️ Vote Service"]
            AISvc["🤖 AI Service"]
        end
        
        NextJS --> PostSvc
        NextJS --> CommentSvc
        NextJS --> VoteSvc
        NextJS --> AISvc
    end

    %% Single Database
    subgraph DATABASE["🗄️ DATABASE"]
        Postgres["PostgreSQL<br/>Single Instance<br/><br/>• All Data<br/>• Built-in Cache<br/>• File Storage in DB<br/><br/>📍 Same VPS or<br/>Free Supabase/Railway"]
    end

    %% External Services
    subgraph EXTERNAL["🌐 EXTERNAL API"]
        OpenAI["OpenAI API<br/>GPT-4o-mini<br/><br/>Budget: $10-30/month<br/>Cached summaries"]
    end

    %% ============================================
    %% MAIN FLOW: View Post with AI Summary
    %% ============================================
    
    User -->|"1️⃣ GET /posts/123"| NextJS
    NextJS -->|"2️⃣ Auth Check<br/>(JWT in cookie)"| NextJS
    
    NextJS -->|"3️⃣ Query Cached Summary<br/>SELECT ai_summary FROM posts<br/>WHERE id = 123"| Postgres
    
    Postgres -.->|"❌ No Summary"| AISvc
    Postgres -->|"✅ Has Summary"| PostSvc
    
    AISvc -->|"4️⃣ Fetch Post + Comments"| Postgres
    Postgres -->|"Post + Top 10 Comments"| AISvc
    
    AISvc -->|"5️⃣ Generate Summary<br/>(if needed)"| OpenAI
    OpenAI -->|"6️⃣ AI Summary Text"| AISvc
    
    AISvc -->|"7️⃣ Store Summary<br/>UPDATE posts<br/>SET ai_summary = '...'<br/>WHERE id = 123"| Postgres
    
    PostSvc -->|"8️⃣ Combined Data<br/>{post, comments,<br/>aiSummary, votes}"| NextJS
    
    NextJS -->|"9️⃣ Render Page<br/>• Post Content<br/>• AI Summary<br/>• Comments"| User

    %% ============================================
    %% STYLING
    %% ============================================
    
    style User fill:#FF6B6B,stroke:#C92A2A,stroke-width:3px,color:#FFF,font-weight:bold
    
    style SERVER fill:#4ECDC4,stroke:#0A9396,stroke-width:3px,color:#FFF
    style NextJS fill:#26A69A,stroke:#00897B,stroke-width:2px,color:#FFF
    
    style SERVICES fill:#3498DB,stroke:#2471A3,stroke-width:2px,color:#FFF
    style PostSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#000
    style CommentSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#000
    style VoteSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#000
    style AISvc fill:#F39C12,stroke:#CA6F1E,stroke-width:2px,color:#FFF,font-weight:bold
    
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

### **1. Single Server (All-in-One)**

**What**: Next.js full-stack application handling everything

**Tech Stack**:
- **Frontend**: Next.js 14+ App Router
- **Backend**: Next.js API Routes (replaces Express)
- **Runtime**: Node.js 20+

**Responsibilities**:
- Serve frontend React components
- Handle API requests via `/app/api/*` routes
- Authenticate users (JWT in httpOnly cookies)
- Rate limiting with in-memory store
- Business logic (posts, comments, votes, AI)

**Why Next.js Full-Stack?**
- No separate backend server needed
- Built-in API routes
- Server-side rendering for SEO
- Single deployment (simpler)
- Free hosting on Vercel

**Deployment Options**:

| Option | Cost | Specs | Best For |
|--------|------|-------|----------|
| **Vercel Free Tier** | $0 | Serverless, auto-scale | Development + light production |
| **Railway** | $5/month | 512MB RAM, shared CPU | Simple deployment |
| **DigitalOcean Droplet** | $12/month | 2GB RAM, 1 vCPU | Full control |
| **Hetzner VPS** | €4/month (~$4) | 2GB RAM, 1 vCPU | Best value |

**Recommended**: Start with **Vercel Free Tier** → upgrade to Railway/Hetzner if you hit limits.

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