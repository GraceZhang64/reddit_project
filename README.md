# BlueIt - Community Discussion Platform 💙

A modern, Reddit-like community discussion platform with AI-powered post summaries.

## ✨ Features

- **Community Spaces** - Create and join topic-based communities
- **Content Posting** - Share text posts with markdown support
- **Threaded Comments** - Nested comment replies (2-3 levels deep)
- **Voting System** - Upvote/downvote posts and comments
- **User Accounts** - Secure authentication with Supabase
- **AI Summaries** - Automatic post summarization using OpenAI GPT-4o-mini
- **Hot Feed** - Trending posts based on votes and engagement
- **Search** - Full-text search across posts

## 🎨 Design

- Beautiful light blue and white color scheme
- Modern, clean UI with smooth animations
- Responsive design for all devices
- SEO-friendly slug-based URLs

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key (for AI summaries)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd reddit_project
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Configure environment variables**

Create `server/.env`:
```env
# Supabase Database (Connection Pooler)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true"

# Supabase Database (Direct - for migrations)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase API
SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Server
PORT=3001
```

4. **Setup database**
```bash
cd server
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **Start development servers**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

6. **Open your browser**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📁 Project Structure

```
reddit_project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API integration
│   │   └── types/         # TypeScript interfaces
│   └── vite.config.ts
│
├── server/                # Node.js backend
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Sample data
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth, etc.
│   │   └── utils/         # Helper functions
│   └── package.json
│
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **Supabase** - PostgreSQL database & auth
- **OpenAI** - AI summaries

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Communities
- `GET /api/communities` - List all communities
- `GET /api/communities/:slug` - Get community by slug
- `POST /api/communities` - Create community (auth required)
- `PUT /api/communities/:slug` - Update community (owner only)
- `DELETE /api/communities/:slug` - Delete community (owner only)

### Posts
- `GET /api/posts` - List all posts
- `GET /api/posts/hot` - Get hot/trending posts
- `GET /api/posts/search?q=query` - Search posts
- `GET /api/posts/:slugOrId` - Get specific post
- `GET /api/posts/:id/summary` - Get post with AI summary
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (author only)
- `DELETE /api/posts/:id` - Delete post (author only)

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `GET /api/comments/:id` - Get comment with replies
- `POST /api/comments` - Create comment (auth required)
- `PUT /api/comments/:id` - Update comment (author only)
- `DELETE /api/comments/:id` - Delete comment (author only)

### Votes
- `POST /api/votes` - Cast/update vote (auth required)
- `DELETE /api/votes` - Remove vote (auth required)
- `GET /api/votes/:target_type/:target_id` - Get vote count
- `GET /api/votes/user/:target_type/:target_id` - Get user's vote

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/posts` - Get user's posts
- `GET /api/users/:username/comments` - Get user's comments
- `GET /api/users/:username/communities` - Get user's communities
- `PUT /api/users/profile` - Update own profile (auth required)

## 🔐 Security

- JWT token authentication via Supabase
- Password validation (minimum 8 characters)
- Username validation (3-20 characters, alphanumeric + underscore)
- Protected routes with middleware
- Owner-only operations
- Input validation on all endpoints

## 🧪 Testing

```bash
# Test database connection
cd server
npm run test:connection

# Test API endpoints
npm run test:api
```

## 📦 Database Seeding

```bash
cd server
npm run prisma:seed
```

This creates:
- 3 sample communities (programming, gaming, cooking)
- 5 sample posts
- Sample comments and votes

## 🎯 URL Structure

- Communities: `/c/programming`
- Posts: `/p/post-title-slug`
- User profiles: `/users/username`

## 🚧 Development

### Database Migrations

```bash
cd server
npx prisma migrate dev --name migration_name
```

### Generate Prisma Client

```bash
npx prisma generate
```

### View Database

```bash
npx prisma studio
```

## 📝 Environment Setup

### Supabase Setup
1. Create a Supabase project
2. Get database connection strings (pooler & direct)
3. Get API URL and anon key
4. Disable email confirmation (for development) or configure SMTP

See `server/SUPABASE_CONNECTION_GUIDE.md` for detailed instructions.

### OpenAI Setup
1. Create an OpenAI account
2. Get API key from dashboard
3. Add to `.env` file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Supabase for database and authentication
- OpenAI for AI summaries
- React and the amazing open-source community

---

**Built with 💙 by the BlueIt team**
