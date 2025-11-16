# Fix DIRECT_URL Connection String

## Problem

Your `DIRECT_URL` is currently:
```
postgresql://postgres.ieorilunmzvirhckifei:blueitpassword12345@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Issue:** This uses the **pooler subdomain** (`pooler.supabase.com`) which is incorrect for direct connections.

## Solution

The `DIRECT_URL` should use the **database subdomain**, not the pooler subdomain.

### Correct Format:

```
postgresql://postgres:blueitpassword12345@db.ieorilunmzvirhckifei.supabase.co:5432/postgres
```

**Key differences:**
- ❌ `aws-1-us-east-2.pooler.supabase.com` (pooler subdomain)
- ✅ `db.ieorilunmzvirhckifei.supabase.co` (database subdomain)
- ❌ `postgres.ieorilunmzvirhckifei:password@` (pooler format)
- ✅ `postgres:password@` (direct format)

## How to Get the Correct DIRECT_URL

1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon)
3. Click **Database** in the sidebar
4. Scroll to **Connection string** section
5. Select the **"URI"** tab (NOT "Connection pooling")
6. Copy the connection string - it should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## Update Your .env File

Replace your `DIRECT_URL` in `server/.env`:

```env
DIRECT_URL="postgresql://postgres:blueitpassword12345@db.ieorilunmzvirhckifei.supabase.co:5432/postgres"
```

**Note:** Make sure your `DATABASE_URL` uses the pooler (port 6543) and `DIRECT_URL` uses the direct connection (port 5432 with database subdomain).

