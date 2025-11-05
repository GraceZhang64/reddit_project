# Database Setup Guide

## Option 1: Supabase (Recommended - Free & Easy)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest)

### Step 2: Create a New Project
1. Click "New Project"
2. Project Name: `reddit-clone`
3. Database Password: Create a strong password (SAVE THIS!)
4. Region: Choose closest to you
5. Click "Create new project" (takes ~2 minutes)

### Step 3: Get Connection String
1. In your Supabase project dashboard
2. Click "Project Settings" (gear icon)
3. Click "Database" in the sidebar
4. Scroll to "Connection string"
5. Select "URI" tab
6. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual password

### Step 4: Update .env File
Replace your DATABASE_URL in `server/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public"
OPENAI_API_KEY="your-openai-key-here"
PORT=5000
```

### Step 5: Run Migrations
```bash
cd server
npm run prisma:migrate
npm run prisma:seed
```

---

## Option 2: Neon (Alternative Free Option)

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub
3. Click "Create a project"
4. Project name: `reddit-clone`

### Step 2: Get Connection String
1. Copy the connection string shown
2. Should look like:
   ```
   postgresql://user:pass@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Update .env and Run Migrations
Same as Supabase steps 4-5

---

## Option 3: Install PostgreSQL Locally (Windows)

### Step 1: Download PostgreSQL
1. Go to https://www.postgresql.org/download/windows/
2. Download the installer (latest version)
3. Run the installer

### Step 2: Installation
1. Accept default components
2. Default data directory: OK
3. Set superuser password: **SAVE THIS PASSWORD!**
4. Port: 5432 (default)
5. Locale: Default
6. Complete installation

### Step 3: Add to PATH (Optional)
1. Search "Environment Variables" in Windows
2. Edit System variables
3. Add: `C:\Program Files\PostgreSQL\16\bin`

### Step 4: Create Database
Open PowerShell as Administrator:
```powershell
# Set password for psql command (use your superuser password)
$env:PGPASSWORD="your_password"

# Create database
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres reddit_db

# Test connection
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d reddit_db -c "SELECT version();"
```

### Step 5: Update .env
Your existing DATABASE_URL should work if PostgreSQL is running:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/reddit_db?schema=public"
```

### Step 6: Run Migrations
```bash
cd server
npm run prisma:migrate
npm run prisma:seed
```

---

## After Database Setup

Once your database is set up (any option), run:

```bash
# Generate Prisma Client
npm run prisma:generate

# Create tables
npm run prisma:migrate

# Add sample data
npm run prisma:seed

# Verify with Prisma Studio
npm run prisma:studio
```

## Troubleshooting

**Error: Can't reach database server**
- Check DATABASE_URL format
- Ensure PostgreSQL is running (local install)
- Check firewall settings (local install)
- Verify credentials are correct

**Error: Password authentication failed**
- Double-check password in DATABASE_URL
- Escape special characters in password (use URL encoding)

**Error: Database does not exist**
- For local: Create database first with `createdb`
- For cloud: Database should auto-create

## Next Steps

After database is set up:
1. Install OpenAI package: `npm install openai`
2. Add OPENAI_API_KEY to .env
3. Start server: `npm run dev`
4. Test: `curl http://localhost:5000/api/posts/1/summary`
