# Shared Database Development Guide

## ✅ Confirmation: This IS Supabase

Your connection tests confirm:
- ✅ Connection strings use `.supabase.co` domains
- ✅ Using Supabase Client (`@supabase/supabase-js`)
- ✅ Connection pooler configured (`pooler.supabase.com`)
- ✅ Supabase API credentials configured

**Your Supabase Project:** `ieorilunmzvirhckifei`

## ⚠️ Critical Issue: Shared Database

**YES - All developers sharing the same database will see each other's changes.**

### What This Means

If multiple developers use the same Supabase database:
- ✅ **Schema changes** (migrations) affect everyone
- ✅ **Data changes** (seed, inserts, updates) are visible to all
- ✅ **One developer's seed script** will overwrite others' data
- ✅ **Migrations** can conflict if run simultaneously

### Current Risk

Your seed script **clears all data** before seeding:
```typescript
await prisma.vote.deleteMany();
await prisma.comment.deleteMany();
await prisma.post.deleteMany();
await prisma.community.deleteMany();
await prisma.user.deleteMany();
```

**This means:** If Developer A runs `npm run prisma:seed`, it will delete Developer B's data!

## 🛡️ Solutions

### Option 1: Separate Databases Per Developer (Recommended)

**Each developer gets their own Supabase project:**

1. Each developer creates their own Supabase project
2. Each has their own `.env` file with unique credentials
3. No conflicts, no data loss
4. **Cost:** Free tier supports this (each project is free)

**Setup:**
```bash
# Developer 1
DATABASE_URL="postgresql://postgres.[PROJECT_1]:[PASSWORD]@..."
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_1].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT_1].supabase.co"

# Developer 2
DATABASE_URL="postgresql://postgres.[PROJECT_2]:[PASSWORD]@..."
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_2].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT_2].supabase.co"
```

### Option 2: Shared Development Database with Coordination

**Use one shared database but coordinate:**

1. **Use feature branches** for schema changes
2. **Coordinate migrations** - only one person runs migrations
3. **Modify seed script** to be idempotent (check before insert)
4. **Use different test data** per developer (different usernames/emails)
5. **Document who's working on what**

**Modified Seed Script (Idempotent):**
```typescript
// Instead of deleteMany, use upsert
const user1 = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: {},
  create: { /* ... */ }
});
```

### Option 3: Local Development Databases

**Each developer runs PostgreSQL locally:**

1. Install PostgreSQL locally
2. Each developer has their own local database
3. Only production uses Supabase
4. **Pros:** Complete isolation, no conflicts
5. **Cons:** Requires local PostgreSQL setup

### Option 4: Database Branching (Supabase Pro)

**Supabase Pro feature** (paid):
- Database branching for development
- Each developer gets a branch
- Merge branches when ready
- **Cost:** $25/month per project

## 📋 Recommended Setup

### For Small Teams (2-5 developers)

**Use Option 1: Separate Supabase Projects**
- Free tier supports unlimited projects
- Zero conflicts
- Easy to set up
- Each developer can experiment freely

### For Larger Teams or Production-Like Testing

**Use Option 3: Local + Shared Staging**
- Developers use local PostgreSQL
- Shared Supabase project for staging/testing
- Production Supabase for production
- Coordinate on staging database

## 🔧 Immediate Actions

### 1. Make Seed Script Safer

Update `server/prisma/seed.ts` to be idempotent:

```typescript
// Instead of deleting everything, use upsert
const user1 = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: { /* update if exists */ },
  create: { /* create if doesn't exist */ }
});
```

### 2. Add Environment-Specific Configuration

Create `.env.development` and `.env.production`:
- Development: Local or personal Supabase
- Production: Shared Supabase

### 3. Document Database Usage

Create `DATABASE_USAGE.md`:
- Who's using which database
- Migration coordination process
- Seed script usage guidelines

## 🚨 Current State

**Your current setup:**
- ✅ Connected to Supabase (confirmed)
- ⚠️ Seed script deletes all data (dangerous for shared DB)
- ⚠️ No coordination mechanism for migrations
- ⚠️ All developers would share the same data

**Recommendation:** Set up separate Supabase projects per developer immediately.

