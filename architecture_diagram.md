# Reddit Project - Production Architecture

> **Scale**: 100 users → 10,000+ users | **Focus**: AI-powered discussion summaries | **Infrastructure**: AWS (Simple & Scalable)

```mermaid
graph TB
    %% User
    User["👤 User<br/>Views Post"]

    %% Frontend
    subgraph FRONTEND["🎨 FRONTEND TIER"]
        NextJS["Next.js Application<br/>React + TypeScript<br/>Server & Client Components<br/><br/>📍 Vercel / AWS Amplify"]
    end

    %% Backend API
    subgraph BACKEND["⚙️ API TIER"]
        API["Express API Server<br/>TypeScript + Node.js<br/>Port 5000<br/><br/>📍 AWS App Runner<br/>Auto-scales 1-10 instances"]
        Auth["🔐 Auth Middleware<br/>JWT Validation"]
        RateLimit["⏱️ Rate Limiter<br/>Prevent Abuse"]
        
        API --> Auth
        API --> RateLimit
    end

    %% Services Layer
    subgraph SERVICES["💼 BUSINESS LOGIC"]
        direction LR
        PostSvc["📝 Post Service<br/>CRUD + Pagination"]
        CommentSvc["💬 Comment Service<br/>Nested Threads"]
        VoteSvc["⬆️ Vote Service<br/>Upvote/Downvote"]
        AISvc["🤖 AI Service<br/>Summary Generation"]
        
        PostSvc -.-> AISvc
        CommentSvc -.-> AISvc
    end

    %% Cache Layer
    subgraph CACHE["⚡ CACHE LAYER"]
        Redis["Redis Cache<br/>ElastiCache<br/><br/>• Session Store<br/>• AI Summaries (24hr TTL)<br/>• Hot Posts (5min TTL)<br/>• API Responses"]
    end

    %% Database
    subgraph DATABASE["🗄️ DATABASE TIER"]
        PG_Primary["PostgreSQL Primary<br/>AWS RDS<br/><br/>✍️ All Writes<br/>📖 Critical Reads"]
        PG_Replica["PostgreSQL Replica<br/>Read-Only<br/><br/>📖 List Posts<br/>📖 Search<br/>📖 Analytics"]
        
        PG_Primary -.->|"Streaming<br/>Replication"| PG_Replica
    end

    %% Storage
    subgraph STORAGE["📦 STORAGE"]
        S3["AWS S3 Bucket<br/><br/>• Post Images<br/>• User Avatars<br/>• Attachments<br/><br/>🌐 CloudFront CDN"]
    end

    %% External Services
    subgraph EXTERNAL["🌐 EXTERNAL APIs"]
        OpenAI["OpenAI API<br/>GPT-4o<br/><br/>Generates summaries from<br/>post + top comments"]
    end

    %% Monitoring (Simplified)
    subgraph MONITORING["📊 MONITORING"]
        CloudWatch["AWS CloudWatch<br/><br/>• Logs<br/>• Metrics<br/>• Alarms"]
    end

    %% ============================================
    %% MAIN USE CASE FLOW: View Post with AI Summary
    %% ============================================
    
    User -->|"1️⃣ GET /posts/123"| NextJS
    NextJS -->|"2️⃣ API Request<br/>+ JWT Token"| API
    API -->|"3️⃣ Validate Token"| Auth
    Auth -->|"✅ Authorized"| PostSvc
    
    PostSvc -->|"4️⃣ Check Cache<br/>GET post:123"| Redis
    Redis -.->|"❌ Cache Miss"| PostSvc
    
    PostSvc -->|"5️⃣ Query Post Data<br/>SELECT * FROM posts<br/>WHERE id = 123"| PG_Replica
    PG_Replica -->|"6️⃣ Post + Comments"| PostSvc
    
    PostSvc -->|"7️⃣ Check AI Cache<br/>GET ai_summary:123"| Redis
    Redis -.->|"❌ No Summary"| AISvc
    
    AISvc -->|"8️⃣ Generate Prompt<br/>Post: 'Why is the sky blue?'<br/>Top 10 Comments: [...]"| OpenAI
    OpenAI -->|"9️⃣ AI Summary<br/>'Discussion explores Rayleigh<br/>scattering with scientific<br/>consensus...'"| AISvc
    
    AISvc -->|"🔟 Cache Summary<br/>SET ai_summary:123<br/>TTL: 24 hours"| Redis
    
    PostSvc -->|"1️⃣1️⃣ Cache Post Data<br/>SET post:123<br/>TTL: 5 minutes"| Redis
    
    PostSvc -->|"1️⃣2️⃣ Combined Response<br/>{post, comments,<br/>aiSummary, votes}"| API
    API -->|"1️⃣3️⃣ JSON Response"| NextJS
    NextJS -->|"1️⃣4️⃣ Render UI<br/>• Post Content<br/>• AI Summary Sidebar<br/>• Comment Thread"| User

    %% Other Important Flows (Secondary)
    NextJS -.->|"Upload Image"| S3
    S3 -.->|"CDN Delivery"| NextJS
    VoteSvc -.->|"Write Vote"| PG_Primary
    PG_Primary -.->|"Replicate"| PG_Replica
    
    %% Monitoring Connections
    API -.->|"Logs & Metrics"| CloudWatch
    Redis -.->|"Performance Metrics"| CloudWatch
    PG_Primary -.->|"Query Stats"| CloudWatch

    %% ============================================
    %% STYLING - Clean & Modern
    %% ============================================
    
    style User fill:#FF6B6B,stroke:#C92A2A,stroke-width:3px,color:#FFF,font-weight:bold
    
    style FRONTEND fill:#4ECDC4,stroke:#0A9396,stroke-width:3px,color:#FFF
    style NextJS fill:#26A69A,stroke:#00897B,stroke-width:2px,color:#FFF
    
    style BACKEND fill:#9B59B6,stroke:#7D3C98,stroke-width:3px,color:#FFF
    style API fill:#8E44AD,stroke:#6C3483,stroke-width:2px,color:#FFF
    style Auth fill:#A569BD,stroke:#7D3C98,stroke-width:2px,color:#FFF
    style RateLimit fill:#AF7AC5,stroke:#7D3C98,stroke-width:2px,color:#FFF
    
    style SERVICES fill:#3498DB,stroke:#2471A3,stroke-width:3px,color:#FFF
    style PostSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#FFF
    style CommentSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#FFF
    style VoteSvc fill:#5DADE2,stroke:#2E86C1,stroke-width:2px,color:#FFF
    style AISvc fill:#F39C12,stroke:#CA6F1E,stroke-width:3px,color:#FFF,font-weight:bold
    
    style CACHE fill:#E67E22,stroke:#D35400,stroke-width:3px,color:#FFF
    style Redis fill:#DC7633,stroke:#BA4A00,stroke-width:2px,color:#FFF
    
    style DATABASE fill:#1ABC9C,stroke:#148F77,stroke-width:3px,color:#FFF
    style PG_Primary fill:#16A085,stroke:#117A65,stroke-width:2px,color:#FFF
    style PG_Replica fill:#48C9B0,stroke:#148F77,stroke-width:2px,color:#FFF
    
    style STORAGE fill:#E74C3C,stroke:#C0392B,stroke-width:3px,color:#FFF
    style S3 fill:#EC7063,stroke:#C0392B,stroke-width:2px,color:#FFF
    
    style EXTERNAL fill:#F39C12,stroke:#D68910,stroke-width:3px,color:#FFF
    style OpenAI fill:#F8C471,stroke:#D68910,stroke-width:2px,color:#000,font-weight:bold
    
    style MONITORING fill:#95A5A6,stroke:#7F8C8D,stroke-width:3px,color:#FFF
    style CloudWatch fill:#BDC3C7,stroke:#7F8C8D,stroke-width:2px,color:#000
```

---

## 🎯 System Overview (2-Minute Walkthrough)

### **Scope & Purpose**
A Reddit-style discussion forum where **AI automatically summarizes post discussions**, helping users quickly understand debates without reading hundreds of comments.

### **Scale Target**
- **Initial**: 100 users, ~500 posts
- **Growth**: 10,000+ users, ~10,000 posts
- **Workload**: Read-heavy (10:1 read-to-write ratio)

### **Key External Dependencies**
- **OpenAI API** (GPT-4o) - Core AI summary generation
- **AWS Services** - Hosting infrastructure (managed services, no Kubernetes)
- **CloudFront CDN** - Fast image delivery worldwide

---

## 🏗️ Architecture Components

### **1. Frontend Tier** (Next.js)
**What**: React application with Server Components for optimal performance

**Where**: Vercel (or AWS Amplify)

**Responsibilities**:
- Server-side render post pages (SEO + speed)
- Display AI summaries in sidebar
- Handle user authentication (JWT)
- Upload images directly to S3 (presigned URLs)

**Why Next.js?**
- Built-in SSR/SSG for fast page loads
- App Router for modern React patterns
- Automatic code splitting
- Zero-config deployment to Vercel

---

### **2. API Tier** (Express)
**What**: RESTful API server handling all business logic

**Where**: AWS App Runner (or ECS Fargate)
- **Why App Runner?** Simple container deployment, auto-scales, no Kubernetes complexity
- **Scaling**: 1 instance (idle) → 10 instances (peak load)
- **Cost**: Pay only for what you use (~$25-50/month at 100 users)

**Responsibilities**:
- Validate JWT tokens (authentication)
- Rate limiting (prevent abuse)
- Route requests to services
- Handle errors gracefully

**Middleware Stack**:
```
Request → CORS → Helmet (security) → JWT Auth → Rate Limit → Router → Response
```

---

### **3. Business Logic Services**
**What**: Modular services handling specific domains

**Services**:
1. **Post Service** - Create, read, update, delete posts
2. **Comment Service** - Nested comment threads (Reddit-style)
3. **Vote Service** - Upvote/downvote posts & comments
4. **AI Service** - ⭐ **Core differentiator** - Generate summaries

**AI Service Workflow**:
```
1. Receive request for post #123
2. Check Redis cache for existing summary
3. If cached → return immediately (fast!)
4. If not cached:
   a. Fetch post + top 10 comments from database
   b. Build prompt: "Summarize this discussion: [post + comments]"
   c. Call OpenAI API (GPT-4o)
   d. Cache summary in Redis (24-hour TTL)
   e. Return summary
```

**Why Cache AI Summaries?**
- OpenAI API costs: ~$0.03 per summary
- With 10,000 views/day, caching saves ~$300/day!
- Response time: 3-5 seconds → <100ms

---

### **4. Cache Layer** (Redis)
**What**: In-memory data store for hot data

**Where**: AWS ElastiCache (managed Redis)

**What's Cached?**
| Data Type | TTL | Purpose |
|-----------|-----|---------|
| AI Summaries | 24 hours | Expensive to regenerate |
| Post Lists | 5 minutes | High-traffic pages (homepage) |
| User Sessions | 15 minutes | JWT token validation |
| Vote Counts | 10 minutes | Frequently accessed |

**Cache Strategy**:
```
API Request
    ↓
Check Redis Cache
    ↓
  Hit? → Return cached data (1-2ms) ✅
    ↓
  Miss? → Query database → Cache result → Return
```

**Performance Impact**:
- **Without cache**: Every request hits database (50-100ms)
- **With cache** (85% hit rate): 85% of requests served in <2ms

---

### **5. Database Tier** (PostgreSQL)
**What**: Primary data store for users, posts, comments, votes

**Where**: AWS RDS PostgreSQL

**Architecture**:
- **Primary** (Write + critical reads)
  - All INSERT, UPDATE, DELETE operations
  - Real-time data (user's own posts)
  - Connection pool: 20 connections
  
- **Read Replica** (Read-only)
  - List all posts (homepage)
  - Search functionality
  - Analytics queries
  - Reduces load on primary by 70-80%

**Replication**: Automatic streaming replication (<1 second lag)

**Schema Highlights**:
```sql
-- Posts with full-text search
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT,
    author_id INT REFERENCES users(id),
    community_id INT REFERENCES communities(id),
    created_at TIMESTAMP DEFAULT NOW(),
    search_vector TSVECTOR -- Full-text search
);
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_posts_community ON posts(community_id, created_at DESC);

-- Comments with nested replies
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    parent_comment_id INT REFERENCES comments(id), -- NULL = top-level
    author_id INT REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_comments_post ON comments(post_id, created_at);

-- Votes (idempotent - one vote per user per item)
CREATE TABLE votes (
    user_id INT REFERENCES users(id),
    target_type VARCHAR(20) CHECK (target_type IN ('post', 'comment')),
    target_id INT NOT NULL,
    value SMALLINT CHECK (value IN (-1, 1)), -- downvote or upvote
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, target_type, target_id)
);
```

**Scaling Strategy**:
- Start: Single RDS instance (db.t3.small, $25/month)
- Growth: Add read replica when CPU >70% (db.t3.medium, $50/month)
- 10,000 users: 1 primary + 1-2 replicas (~$150/month)

---

### **6. Storage Tier** (S3 + CloudFront)
**What**: Object storage for user-uploaded content

**Where**: AWS S3 with CloudFront CDN

**Workflow** (Secure Direct Upload):
```
1. User clicks "Upload Image" in frontend
2. Frontend requests presigned URL from API
3. API generates presigned S3 URL (valid for 5 minutes)
4. Frontend uploads directly to S3 (bypasses API)
5. Frontend submits post with S3 image URL
6. CloudFront caches images globally (fast delivery)
```

**Why Direct Upload?**
- API doesn't handle large files (no memory issues)
- Faster uploads (direct to S3)
- Cheaper (no API bandwidth costs)

**S3 Bucket Structure**:
```
reddit-app-uploads/
├── avatars/
│   └── user_{id}/avatar.webp
├── posts/
│   └── {year}/{month}/{post_id}_image.webp
└── attachments/
    └── {post_id}/file.pdf
```

**Configuration**:
- **Private bucket** (no public access)
- **Presigned URLs** for uploads (5-min expiry)
- **CloudFront CDN** for reads (public access)
- **Lifecycle policy**: Delete incomplete uploads after 7 days
- **Versioning**: Disabled (saves costs for simple use case)

---

### **7. External Services** (OpenAI API)
**What**: LLM API for generating discussion summaries

**Why OpenAI?**
- State-of-the-art summarization (GPT-4o)
- Reliable API with 99.9% uptime
- Good rate limits (10,000 requests/min on paid tier)

**Integration Details**:
```typescript
// AI Service - Generate Summary
async function generateSummary(postId: number) {
  const post = await db.post.findUnique({ where: { id: postId } });
  const comments = await db.comment.findMany({
    where: { postId },
    orderBy: { votes: 'desc' },
    take: 10 // Top 10 comments only
  });

  const prompt = `
    Summarize this Reddit discussion in 3-4 sentences:
    
    Post: "${post.title}"
    ${post.body}
    
    Top Comments:
    ${comments.map(c => `- ${c.body}`).join('\n')}
    
    Focus on: main viewpoints, consensus, key debates.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.3 // Low temperature for consistent summaries
  });

  const summary = response.choices[0].message.content;
  
  // Cache for 24 hours
  await redis.setex(`ai_summary:${postId}`, 86400, summary);
  
  return summary;
}
```

**Error Handling**:
- API timeout? Return graceful message: "Summary unavailable, please try again"
- Rate limited? Show cached summary from yesterday or skip
- Cost control: Max 1,000 summaries/day (~$30/day limit)

**Cost Optimization**:
- Only summarize posts with >5 comments
- Cache summaries for 24 hours
- Limit prompt size (top 10 comments, not all)
- Use cheaper model for simple posts (GPT-4o-mini)

---

### **8. Monitoring** (CloudWatch)
**What**: Basic observability for debugging and alerts

**What We Monitor**:
1. **Logs**: All API requests, errors, warnings
2. **Metrics**: 
   - API response times (avg, p95, p99)
   - Database query times
   - Redis hit rate
   - OpenAI API errors
3. **Alarms**:
   - Error rate >5% (critical)
   - API latency >2 seconds (warning)
   - Database CPU >80% (warning)
   - Redis memory >90% (critical)

**Alerting**: CloudWatch → SNS → Email/SMS

**Why Just CloudWatch?**
- Integrated with all AWS services (no setup)
- Free tier: 10 custom metrics, 10 alarms
- Simple dashboard for key metrics
- Good enough for 10,000 users

*Later, you can add APM tools (Datadog, New Relic) if needed*

---

## 🎬 Main Use Case Walkthrough

### **Scenario**: User views post #123 titled "Why is the sky blue?"

**Flow** (follow the numbered steps in diagram):

1️⃣ **User clicks post** → Frontend (Next.js) receives request

2️⃣ **Frontend → API**: `GET /api/posts/123` with JWT token in header

3️⃣ **API validates JWT**: Checks user is authenticated, rate limit OK

4️⃣ **Post Service checks Redis**: `GET post:123`
   - **Cache hit?** Return immediately (2ms) ✅
   - **Cache miss?** Continue...

5️⃣ **Query Database** (read replica): Fetch post + comments
   ```sql
   SELECT * FROM posts WHERE id = 123;
   SELECT * FROM comments WHERE post_id = 123 ORDER BY votes DESC;
   ```

6️⃣ **Database returns data**: Post + 23 comments

7️⃣ **AI Service checks cache**: `GET ai_summary:123`
   - **Cached summary exists?** Use it ✅
   - **No summary?** Generate new one...

8️⃣ **Call OpenAI API**: 
   ```
   Prompt: "Summarize this discussion about why the sky is blue. 
            Post has 23 comments discussing Rayleigh scattering..."
   ```

9️⃣ **OpenAI returns summary**: 
   ```
   "Discussion explores Rayleigh scattering as primary cause. 
    Scientific consensus established with several users providing 
    detailed physics explanations. Minor debate about sunset colors."
   ```

🔟 **Cache AI summary**: `SET ai_summary:123 = "..." TTL 24h`

1️⃣1️⃣ **Cache post data**: `SET post:123 = {post, comments} TTL 5min`

1️⃣2️⃣ **API returns JSON**:
   ```json
   {
     "post": { "title": "Why is the sky blue?", ... },
     "comments": [...],
     "aiSummary": "Discussion explores Rayleigh scattering...",
     "votes": { "upvotes": 156, "downvotes": 12 }
   }
   ```

1️⃣3️⃣ **Frontend receives data**: Parse JSON response

1️⃣4️⃣ **Render UI**:
   - Main content: Post title, body, author
   - Right sidebar: AI summary (highlighted)
   - Below: Comment thread
   - User can upvote/downvote

**Total Time**:
- **First request** (no cache): 3-5 seconds (waiting for OpenAI)
- **Subsequent requests** (cached): 50-100ms ⚡

---

## 📊 Performance & Scale

### **Current Capacity** (Single instance)
- **API Server**: 1,000 requests/sec
- **Database**: 5,000 queries/sec (with replica)
- **Redis**: 100,000 operations/sec
- **Total**: ~500-1,000 concurrent users

### **Scaling Path** (to 10,000 users)

| Users | API Instances | Database | Redis | Monthly Cost |
|-------|---------------|----------|-------|--------------|
| 100 | 1 | db.t3.small | cache.t3.micro | ~$100 |
| 1,000 | 2 | db.t3.small + replica | cache.t3.small | ~$200 |
| 5,000 | 3-5 | db.t3.medium + replica | cache.t3.medium | ~$400 |
| 10,000 | 5-10 | db.t3.large + 2 replicas | cache.t3.medium | ~$700 |

**Auto-Scaling Trigger** (AWS App Runner):
- Scale up when: CPU >70% or Memory >80%
- Scale down when: CPU <30% for 5 minutes
- Min instances: 1
- Max instances: 10

---

## 🔐 Security Highlights

### **Authentication**
- JWT tokens (RS256 asymmetric encryption)
- Access token: 15-minute expiry
- Refresh token: 7-day expiry
- Tokens stored in httpOnly cookies (prevent XSS)

### **Authorization**
```typescript
// Example: Only post author can edit
async function updatePost(userId: number, postId: number, data: any) {
  const post = await db.post.findUnique({ where: { id: postId } });
  if (post.authorId !== userId) {
    throw new ForbiddenError("Not your post");
  }
  return db.post.update({ where: { id: postId }, data });
}
```

### **Rate Limiting**
- Anonymous users: 20 requests/min
- Authenticated users: 100 requests/min
- AI summary generation: 10 requests/hour per user
- Implemented in API middleware (Redis-backed)

### **Input Validation**
```typescript
// Zod schema for post creation
const CreatePostSchema = z.object({
  title: z.string().min(3).max(300),
  body: z.string().max(40000),
  communityId: z.number().int().positive()
});

// Validate in API route
app.post('/posts', async (req, res) => {
  const data = CreatePostSchema.parse(req.body); // Throws if invalid
  // ... create post
});
```

### **Data Protection**
- Database: Encrypted at rest (AES-256)
- API: HTTPS everywhere (TLS 1.3)
- S3: Private bucket, presigned URLs only
- Passwords: bcrypt hashed (cost factor 12)

---

## 💰 Cost Breakdown (Monthly)

### **At 1,000 Active Users**

| Service | Spec | Cost |
|---------|------|------|
| **Vercel** (Frontend) | Pro plan | $20 |
| **AWS App Runner** (API) | 2 instances, 1 vCPU each | $50 |
| **RDS PostgreSQL** | db.t3.small + replica | $60 |
| **ElastiCache Redis** | cache.t3.small | $40 |
| **S3 + CloudFront** | 100GB storage, 1TB transfer | $30 |
| **OpenAI API** | ~1,000 summaries/day @ $0.03 | $900 |
| **CloudWatch** | Basic monitoring | $10 |
| **Total** | | **~$1,110/month** |

**Cost Optimization Tips**:
1. **AI is the biggest cost** - Cache aggressively (24hr TTL saves 95% of API calls)
2. Use GPT-4o-mini for simple summaries ($0.01 vs $0.03)
3. Only generate summaries for posts with >5 comments
4. Reserved instances for RDS/ElastiCache (save 30-40%)

---

## 🚀 Deployment Guide

### **1. Initial Setup** (One-time)

```bash
# 1. Set up AWS infrastructure with Terraform (or ClickOps)
# - RDS PostgreSQL database
# - ElastiCache Redis cluster
# - S3 bucket for uploads
# - CloudFront distribution
# - App Runner service for API

# 2. Set environment variables in App Runner
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/reddit
REDIS_URL=redis://elasticache-endpoint:6379
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
AWS_S3_BUCKET=reddit-app-uploads

# 3. Deploy frontend to Vercel
vercel --prod

# 4. Run database migrations
npm run prisma:migrate deploy
```

### **2. Deploy API Updates** (CI/CD with GitHub Actions)

```yaml
# .github/workflows/deploy-api.yml
name: Deploy API to AWS App Runner

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          cd server
          docker build -t reddit-api:${{ github.sha }} .
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag reddit-api:${{ github.sha }} $ECR_REGISTRY/reddit-api:latest
          docker push $ECR_REGISTRY/reddit-api:latest
      
      - name: Deploy to App Runner
        run: |
          aws apprunner start-deployment --service-arn $APP_RUNNER_SERVICE_ARN
```

### **3. Monitoring Dashboard** (CloudWatch)

Key metrics to track:
- API response time (avg, p95, p99)
- Database connection pool utilization
- Redis hit rate
- OpenAI API call count & errors
- S3 upload success rate

---

## 🎯 Why This Architecture?

### ✅ **Simplicity**
- No Kubernetes complexity
- Managed AWS services (less ops burden)
- Standard tech stack (Next.js, Express, PostgreSQL)

### ✅ **Cost-Effective**
- Start small: ~$100/month for 100 users
- Pay-as-you-grow: Auto-scaling prevents over-provisioning
- Aggressive caching reduces expensive LLM API calls

### ✅ **Scalable**
- Stateless API tier → easy horizontal scaling
- Database read replicas handle read-heavy workload
- Redis cache eliminates 85% of database queries
- Can handle 10,000+ users without major changes

### ✅ **Performant**
- Sub-100ms response time for cached data
- CDN for fast image delivery worldwide
- Database indexes for fast queries
- AI summaries cached for 24 hours

### ✅ **Maintainable**
- Clear separation of concerns (services)
- TypeScript for type safety
- Simple deployment (Docker + App Runner)
- Basic monitoring with CloudWatch

---

## 🔮 Future Enhancements (When You Need Them)

### **At 10,000+ Users**
- [ ] Add API load balancer (AWS ALB) for high availability
- [ ] Database connection pooler (PgBouncer) for more concurrent connections
- [ ] Advanced monitoring (Datadog/New Relic) for better observability
- [ ] Database partitioning for old posts (archive after 1 year)

### **New Features**
- [ ] Real-time notifications (WebSockets or Server-Sent Events)
- [ ] Full-text search with Elasticsearch (if PostgreSQL search insufficient)
- [ ] Image processing workers (resize, optimize, generate thumbnails)
- [ ] Email notifications (AWS SES) for comments on your posts
- [ ] Recommendation engine (ML-based post suggestions)

### **Advanced AI Features**
- [ ] Sentiment analysis of comments (positive/negative/neutral)
- [ ] Debate detection (identify conflicting viewpoints)
- [ ] Misinformation flagging (fact-checking controversial claims)
- [ ] Personalized summaries (based on user interests)

---

## 📋 Quick Reference

### **Key URLs**
- Frontend: `https://your-app.vercel.app`
- API: `https://your-api.us-east-1.awsapprunner.com`
- Database: `your-db.us-east-1.rds.amazonaws.com:5432`
- Redis: `your-cache.us-east-1.cache.amazonaws.com:6379`

### **Important Endpoints**
```
POST   /api/auth/register     - Create account
POST   /api/auth/login        - Login (get JWT)
GET    /api/posts             - List posts (paginated)
GET    /api/posts/:id         - Get post + AI summary
POST   /api/posts             - Create post
POST   /api/comments          - Add comment
POST   /api/votes             - Upvote/downvote
GET    /api/communities       - List communities
```

### **Database Connection Strings**
```bash
# Primary (writes)
postgresql://user:pass@primary.rds.amazonaws.com:5432/reddit

# Replica (reads)
postgresql://user:pass@replica.rds.amazonaws.com:5432/reddit
```

### **Cache Keys**
```
post:{id}              → Full post data (5min TTL)
ai_summary:{id}        → AI summary (24hr TTL)
posts_list:{page}      → Homepage post list (5min TTL)
user_session:{token}   → JWT session (15min TTL)
vote_count:{type}:{id} → Vote totals (10min TTL)
```

---

**This architecture scales from 100 to 10,000+ users without major rewrites!** 🚀
