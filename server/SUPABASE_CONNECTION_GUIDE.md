# Supabase Connection Setup Guide

This guide explains how to configure Supabase with connection pooling for your Reddit project.

## Overview

For Supabase, you need **two different connection strings**:
1. **DATABASE_URL** - Uses connection pooler (port 6543) for regular queries
2. **DIRECT_URL** - Uses direct connection (port 5432) for migrations and schema operations

## Step 1: Get Your Supabase Connection Strings

1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon)
3. Click **Database** in the sidebar
4. Scroll to **Connection string** section

### For DATABASE_URL (Pooler - Recommended for Production)

Select **"Connection pooling"** tab and choose **"Session mode"** or **"Transaction mode"**:

**Option A: Using pooler subdomain (Recommended)**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Option B: Using direct subdomain with pooler port**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:6543/postgres?pgbouncer=true
```

### For DIRECT_URL (Direct Connection - For Migrations)

Select **"URI"** tab (not connection pooling):

```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Important:** 
- Replace `[PASSWORD]` with your database password
- Replace `[PROJECT_REF]` with your project reference ID
- Replace `[REGION]` with your region (e.g., `us-east-2`)

## Step 2: Get Supabase API Credentials

1. In the same **Project Settings** > **API** section
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

## Step 3: Configure Environment Variables

Create or update `server/.env`:

```env
# Database Connections
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Supabase API
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"

# Other
OPENAI_API_KEY="your-openai-key-here"
PORT=5000
```

## Step 4: Test Your Connection

Run the connection test script:

```bash
cd server
npm run test:connection
```

This will test:
- ✅ Prisma Client connection (DATABASE_URL)
- ✅ Direct PostgreSQL connection (DIRECT_URL)
- ✅ Supabase Client connection
- ✅ Environment variables
- ✅ Connection string format validation

## Understanding Connection Types

### Connection Pooler (DATABASE_URL - Port 6543)
- **Use for:** Regular application queries via Prisma
- **Benefits:** 
  - Handles more concurrent connections
  - Better for production workloads
  - Reduces connection overhead
- **Limitations:** 
  - Cannot run certain admin commands
  - Some PostgreSQL features may be limited

### Direct Connection (DIRECT_URL - Port 5432)
- **Use for:** 
  - Prisma migrations (`prisma migrate`)
  - Schema introspection
  - Admin operations
- **Benefits:**
  - Full PostgreSQL feature access
  - Required for migrations
- **Limitations:**
  - Fewer concurrent connections
  - Not ideal for production queries

## Troubleshooting

### Error: "Connection pooler does not support prepared statements"
- **Solution:** Add `?pgbouncer=true` to your DATABASE_URL
- Or use transaction mode instead of session mode

### Error: "Too many connections"
- **Solution:** Use the pooler connection (port 6543) for DATABASE_URL
- The pooler manages connections more efficiently

### Error: "Migration failed"
- **Solution:** Ensure DIRECT_URL uses port 5432 (direct connection)
- Migrations require direct connection, not pooler

### Error: "Environment variable not set"
- **Solution:** Check that all required variables are in `server/.env`
- Run `npm run test:connection` to verify

### Connection String Format Issues
- **Password with special characters:** URL encode them (e.g., `@` becomes `%40`)
- **Missing schema:** Add `?schema=public` to connection string
- **SSL required:** Add `?sslmode=require` (usually auto-handled by Supabase)

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use environment-specific keys** - Different keys for dev/staging/prod
3. **Rotate credentials regularly** - Especially if exposed
4. **Use connection pooling** - Reduces attack surface
5. **Monitor connection usage** - Check Supabase dashboard

## Next Steps

After successful connection:
1. Run migrations: `npm run prisma:migrate`
2. Seed database: `npm run prisma:seed`
3. Start server: `npm run dev`
4. Verify with Prisma Studio: `npm run prisma:studio`

