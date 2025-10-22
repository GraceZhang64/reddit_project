# Reddit Project - AI-Enhanced Discussion Forum

**Problem Statement**: Online discussions are often an information-overload and is inefficient to read through the entire conversation chain to understand the key points.

A minimalist Reddit-style forum where users post links, images, or discussions but with an AI sidebar or summary bubble that:
- Summarizes the top post and comments.
- Highlights major viewpoints or debates.

## 📁 Project Structure

```
reddit_project/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── main.tsx       # Entry point
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend (Express + TypeScript)
│   ├── src/
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Sample data seed script
│   ├── package.json
│   └── .env               # Environment variables
└── package.json           # Root package.json
```

## 🗄️ Database Schema

The application uses the following models:

- **Users** - User accounts with username, email, and password
- **Communities** - Reddit-like communities (subreddits)
- **Posts** - User posts within communities
- **Comments** - Comments on posts with nested reply support
- **Votes** - Upvote/downvote system for posts and comments
- **CommunityMembers** - User memberships in communities

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher) ✅ Installed
- PostgreSQL (v12 or higher) ⚠️ **Need to set up**
- npm ✅ Installed

### Installation Status

✅ All npm dependencies installed
✅ Prisma schema created
✅ Seed script ready
⚠️ Database needs to be set up

### 1. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended - Easiest!)

```powershell
docker run --name reddit-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=reddit_db -p 5432:5432 -d postgres:14
```

The `.env` file is already configured for this setup!

#### Option B: Using PostgreSQL locally

1. **Install PostgreSQL** if not already installed
   - Download from: https://www.postgresql.org/download/windows/
   - Or use chocolatey: `choco install postgresql`

2. **Start PostgreSQL service**
   ```powershell
   # Check if it's running
   Get-Service -Name postgresql*
   
   # Start the service if needed
   Start-Service postgresql-x64-14  # adjust version number
   ```

3. **Create the database**
   ```powershell
   # Connect to PostgreSQL (will prompt for password)
   psql -U postgres
   
   # Create database
   CREATE DATABASE reddit_db;
   
   # Exit
   \q
   ```

4. **Update .env file** (if needed)
   - The `.env` file is in the `server` folder
   - Update the `DATABASE_URL` with your credentials:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/reddit_db?schema=public"
   ```

### 2. Run Database Migrations & Seed Data

Once PostgreSQL is running:

```powershell
cd server
npm run prisma:migrate     # Create database tables
npm run prisma:seed        # Populate with sample data
```

This will create:
- ✅ 3 sample users (john_doe, jane_smith, bob_wilson)
- ✅ 3 communities (programming, gaming, cooking)
- ✅ 5 sample posts
- ✅ Multiple comments with nested replies
- ✅ Sample votes and community memberships

### 3. Start Development Servers

From the root directory:

```powershell
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

Or start them separately:

```powershell
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

## 📝 Available Scripts

### Root Directory
- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both frontend and backend
- `npm run dev:client` - Start frontend only
- `npm run dev:server` - Start backend only
- `npm run build` - Build both frontend and backend

### Server (cd server)
- `npm run dev` - Start server in development mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (DB GUI)
- `npm run prisma:seed` - Seed database with sample data

### Client (cd client)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

## 📚 Prisma Studio

To view and edit your database with a GUI:

```powershell
cd server
npm run prisma:studio
```

This will open Prisma Studio at http://localhost:5555

## 🎯 Features Roadmap

### Core Features
- [x] User authentication
- [x] Community creation and management
- [x] Post creation in communities
- [x] Commenting system with nested replies
- [x] Voting system (upvotes/downvotes)
- [ ] AI-powered post/comment summaries
- [ ] Highlight major viewpoints and debates

### Interface
- [ ] Homepage with popular/recommended posts
- [ ] Search functionality (questions and communities)
- [ ] Community pages with posts
- [ ] AI sidebar/summary bubble

## 🐛 Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your `.env` file has the correct credentials
- Test connection: `psql -U postgres -d reddit_db`

### Port Already in Use
- Frontend (3000) or Backend (5000) port might be in use
- Kill the process or change ports in:
  - Frontend: `client/vite.config.ts`
  - Backend: `server/.env` (PORT variable)

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Reset database: `npx prisma migrate reset` (WARNING: deletes all data)

## 📖 API Endpoints

Once running, the following endpoints are available:

- `GET /api/health` - Health check endpoint

(More endpoints will be added as features are built)
