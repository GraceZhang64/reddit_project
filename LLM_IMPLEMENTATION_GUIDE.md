# LLM Implementation Setup Guide

## Overview
This implementation adds AI-powered post summarization to your Reddit clone using OpenAI's GPT-4o-mini model.

## Architecture
```
Frontend → Backend API → Database (PostgreSQL)
                ↓
         AI Service → OpenAI API
```

## Installation Steps

### 1. Install OpenAI Package
```bash
cd server
npm install openai
```

### 2. Set Up Environment Variables
Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/reddit_db?schema=public"
OPENAI_API_KEY="sk-your-actual-openai-api-key"
PORT=5000
```

**Get your OpenAI API key:**
- Visit https://platform.openai.com/api-keys
- Create a new secret key
- Copy and paste into `.env`

### 3. Set Up PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (if not installed)
# Then create database
createdb reddit_db

# Run Prisma migrations
cd server
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

**Option B: Use a cloud provider**
- Supabase (free tier): https://supabase.com
- Neon (free tier): https://neon.tech
- Railway: https://railway.app

Update `DATABASE_URL` in `.env` with your connection string.

### 4. Generate Prisma Client
```bash
cd server
npm run prisma:generate
```

### 5. Start the Backend Server
```bash
cd server
npm run dev
```

Server should start on http://localhost:5000

## API Endpoints

### GET /api/posts/:id/summary
Fetches a post with AI-generated summary

**Response:**
```json
{
  "post": {
    "id": 1,
    "title": "Post title",
    "body": "Post content",
    "author": "username",
    "communityName": "programming",
    "voteCount": 42,
    "commentCount": 5,
    "createdAt": "2025-11-04T..."
  },
  "comments": [
    {
      "id": 1,
      "body": "Comment text",
      "author": "commenter",
      "voteCount": 15,
      "createdAt": "2025-11-04T..."
    }
  ],
  "aiSummary": "This post discusses... The top-voted comments highlight... Community consensus shows..."
}
```

### GET /api/posts/:id
Fetches a post without AI summary (faster, no LLM cost)

## How It Works

### 1. Data Fetching
```typescript
// Prisma query fetches:
- Post (title, body, voteCount)
- All comments (sorted by voteCount DESC)
- Author information
```

### 2. Prompt Construction
```
POST TITLE: [title]
POST VOTES: [voteCount] (positive/negative reception)

POST CONTENT:
[body]

TOP COMMENTS (sorted by upvotes):

Comment 1 (45 votes) by user123:
[comment body]

Comment 2 (32 votes) by user456:
[comment body]

Please provide a concise summary highlighting:
1. Main topic and key points from the post
2. Most upvoted opinions from comments
3. Community consensus
4. Important disagreements (if highly upvoted)
```

### 3. LLM Processing
- **Model**: GPT-4o-mini (cost-effective)
- **Temperature**: 0.7 (balanced creativity)
- **Max tokens**: 300 (concise summaries)
- **System prompt**: Instructs model to focus on upvoted content

### 4. Cost Optimization
- **Input**: ~500-1000 tokens per request
- **Output**: 300 tokens max
- **Cost**: ~$0.0003 per summary (GPT-4o-mini pricing)
- **Recommendation**: Add caching in production

## Frontend Integration

Update your PostPage component to call the backend:

```typescript
// In PostPage.tsx
useEffect(() => {
  const fetchPostWithSummary = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/summary`);
      const data = await response.json();
      
      setPost(data.post);
      setComments(data.comments);
      setAiSummary(data.aiSummary);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  fetchPostWithSummary();
}, [postId]);
```

## Testing

### Test the API directly:
```bash
# Health check
curl http://localhost:5000/api/health

# Get post with AI summary (after seeding data)
curl http://localhost:5000/api/posts/1/summary
```

### Test with sample data:
```bash
# Seed the database first
npm run prisma:seed

# Then fetch a post
curl http://localhost:5000/api/posts/1/summary | json_pp
```

## File Structure

```
server/
├── src/
│   ├── index.ts                    # Main server file (updated)
│   ├── services/
│   │   └── aiService.ts           # LLM integration (NEW)
│   └── routes/
│       └── posts.ts               # Post endpoints (NEW)
├── prisma/
│   └── schema.prisma              # Database schema (existing)
├── .env                            # Environment variables
└── package.json                    # Dependencies
```

## Next Steps

1. **Add caching**: Store summaries in database to avoid re-generating
2. **Add rate limiting**: Prevent abuse of expensive LLM calls
3. **Error handling**: Graceful fallback if OpenAI API fails
4. **Loading states**: Show "Generating summary..." in frontend
5. **Optional feature**: Let users regenerate summaries

## Troubleshooting

**Error: Cannot find module 'openai'**
```bash
cd server
npm install openai
```

**Error: Database connection failed**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Test connection: `npm run prisma:studio`

**Error: OpenAI API key invalid**
- Verify key at https://platform.openai.com/api-keys
- Ensure no extra spaces in .env file
- Check you have API credits

**Slow response times**
- Normal: First request ~2-3 seconds (LLM processing)
- Implement caching to serve cached summaries instantly

## Cost Estimation

**Using GPT-4o-mini:**
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens
- Average cost per summary: $0.0003
- 1000 summaries = $0.30
- 10,000 summaries = $3.00

**Optimization tips:**
1. Cache summaries in database
2. Regenerate only when post/comments change significantly
3. Use gpt-4o-mini (not gpt-4) for cost savings
