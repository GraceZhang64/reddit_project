# Database Usage Guidelines

## Current Database

**Provider:** Supabase  
**Project:** `ieorilunmzvirhckifei`  
**Status:** ✅ Connected and working

## ⚠️ Important: Shared Database Warning

**If multiple developers are using this database:**

1. **Schema Changes (Migrations)**
   - Coordinate before running `npm run prisma:migrate`
   - Only one person should run migrations at a time
   - Discuss schema changes before applying

2. **Data Changes (Seed Script)**
   - ⚠️ **Current seed script DELETES all data** before seeding
   - If you run `npm run prisma:seed`, it will delete everyone's data
   - **DO NOT run seed script on shared database without warning team**

3. **Development Data**
   - Use unique test data (different usernames/emails per developer)
   - Be aware others can see your test data
   - Don't rely on specific data existing

## Best Practices

### Before Running Migrations
```bash
# 1. Check current migration status
npx prisma migrate status

# 2. Coordinate with team
# 3. Run migration
npm run prisma:migrate
```

### Before Running Seed
```bash
# ⚠️ WARNING: This deletes all data!
# Only run if:
# - You're the only one using the database
# - You've warned the team
# - It's a fresh/reset scenario

npm run prisma:seed
```

### Safe Development Workflow
1. Use separate Supabase projects for development
2. Only use shared database for staging/testing
3. Coordinate schema changes via pull requests
4. Document who's working on what

## Recommended Setup

**Each Developer Should:**
1. Create their own Supabase project (free tier)
2. Use their own `.env` file
3. Share only production database credentials securely

**See:** `SHARED_DATABASE_GUIDE.md` for detailed solutions

