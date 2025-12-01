# BlueIt Beta Setup Guide 🚀

## Overview
This guide will help you transition BlueIt from alpha (development) to beta (ready for 5-10 concurrent real users) with network access for multiple devices.

## Prerequisites
- Node.js 18+
- Supabase account with project
- OpenAI API key
- Multiple devices/network access for testing

## Step 1: Network Access Configuration ✅

### Server Changes Made:
- Server now binds to `0.0.0.0` instead of `localhost`
- CORS configured to allow all origins for beta testing
- This allows other devices on your network to connect

### Find Your Local IP Address:
```powershell
# Windows PowerShell
Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -eq 'Dhcp' } | Select-Object IPAddress
```

```bash
# Linux/Mac
ifconfig | grep "inet " | grep -v 127.0.0.1
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

Example output: `192.168.1.100`

## Step 2: Environment Configuration

### Create `.env` file in server directory:
```bash
cd server
# Copy and edit the template below
```

### Environment Variables Template:
```env
# Database Configuration (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://[YOUR_PROJECT].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"

# OpenAI API (for AI post summaries)
OPENAI_API_KEY="sk-your-openai-api-key"

# Server Configuration
PORT=5000
NODE_ENV=development

# Security (for beta testing)
CORS_ORIGIN=true
```

### How to Get Supabase Credentials:
1. Go to https://supabase.com/dashboard
2. Select your project
3. **Database** → **Connection string** → Copy URI
4. **Settings** → **API** → Copy URL and keys
5. **Settings** → **API** → Copy service_role key

## Step 3: Supabase Project Setup

### Authentication Configuration:
1. **Authentication** → **Settings**
2. Disable "Enable email confirmations" for beta testing
3. Enable "Enable email signups"
4. Set site URL to your local IP: `http://192.168.1.100:3000`

### Database Setup:
```bash
cd server
npm run prisma:generate
npm run prisma:db:push
npm run prisma:seed
```

## Step 4: Start Beta Environment

### Terminal 1 - Backend:
```bash
cd server
npm run dev
```
Expected output:
```
⚡️[server]: Server is running at http://0.0.0.0:5000
⚡️[server]: Access from network at: http://YOUR_LOCAL_IP:5000
```

### Terminal 2 - Frontend:
```bash
cd client
npm run dev:network
```
Expected output:
```
Local: http://localhost:3000
Network: http://YOUR_LOCAL_IP:3000
```

**Alternative: Use the automated script**
```bash
powershell ./start-beta-network.ps1
```
This script automatically detects your IP and starts both frontend and backend with proper network configuration.

## Step 5: Network Access Verification

### Test from Host Machine:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health

### Test from Other Devices:
- Frontend: http://YOUR_LOCAL_IP:3000
- Backend: http://YOUR_LOCAL_IP:5000/api/health

### Firewall Check:
If other devices can't connect, check Windows Firewall:
1. Windows Security → Firewall & network protection
2. Allow app through firewall → Node.js
3. Or add inbound rule for port 3000 and 5000

## Step 6: Beta Testing Checklist

### Core Features to Test:

#### ✅ User Authentication
- [ ] Register new user (email validation)
- [ ] Login/logout functionality
- [ ] Token persistence across browser refresh
- [ ] Password requirements (8+ characters)
- [ ] Username validation (3-20 chars, alphanumeric + _)

#### ✅ Communities
- [ ] View all communities
- [ ] Create new community (auth required)
- [ ] Join/leave communities
- [ ] Community member counts update correctly

#### ✅ Posts
- [ ] View posts feed (hot/trending)
- [ ] Create text posts
- [ ] Search posts
- [ ] AI summaries work (if OpenAI configured)
- [ ] Post slugs work correctly

#### ✅ Comments
- [ ] View post comments
- [ ] Reply to posts (2-3 levels deep)
- [ ] Nested comment threading
- [ ] Comment author display

#### ✅ Voting
- [ ] Upvote/downvote posts
- [ ] Upvote/downvote comments
- [ ] Vote counts update in real-time
- [ ] One vote per user per item

#### ✅ User Profiles
- [ ] View user profiles
- [ ] User post/comment history
- [ ] User karma calculation

### Performance Testing (5-10 concurrent users):

#### ✅ Load Testing
```bash
cd server
npm run loadtest:baseline
```

#### ✅ Concurrent User Simulation
- Open app on 5-10 devices/browsers
- Test simultaneous actions:
  - Multiple users posting
  - Voting on same posts
  - Commenting simultaneously
  - Real-time updates

#### ✅ Database Performance
- Check query performance
- Monitor connection pooling
- Verify no race conditions

## Step 7: Beta Release Preparation

### Pre-Release Checklist:
- [ ] All environment variables configured
- [ ] Supabase project properly set up
- [ ] OpenAI API key working
- [ ] Network access verified
- [ ] Core features tested individually
- [ ] 5-10 concurrent users tested
- [ ] Error handling works correctly
- [ ] Logs show no critical errors

### Beta User Instructions:
```
Welcome to BlueIt Beta! 🎉

Access URLs:
- Web App: http://[YOUR_LOCAL_IP]:3000
- API: http://[YOUR_LOCAL_IP]:5000

Test Account:
- Email: Any valid email (email confirmation disabled)
- Password: At least 8 characters

Report any issues or feedback!
```

## Troubleshooting

### Common Issues:

**"Can't connect from other devices"**
- Check firewall settings
- Verify IP address is correct
- Try disabling antivirus temporarily

**"Database connection failed"**
- Verify DATABASE_URL format
- Check Supabase project is active
- Run: `npm run test:connection`

**"OpenAI summaries not working"**
- Check OPENAI_API_KEY is set
- Verify API key has credits
- Test: `curl http://localhost:5000/api/posts/1/summary`

**"Authentication not working"**
- Check Supabase auth settings
- Verify email confirmations are disabled
- Check browser console for errors

### Debug Commands:
```bash
# Test database connection
cd server && npm run test:connection

# Test API endpoints
cd server && npm run test:api

# Test authentication flow
cd server && npm run test:auth

# Run load tests
cd server && npm run loadtest
```

## Security Notes for Beta

### ⚠️ Important Security Considerations:

1. **CORS is permissive** (`origin: true`) - restrict in production
2. **Email confirmations disabled** - re-enable for production
3. **Service role key exposed** - never commit to version control
4. **No rate limiting** - implement before production
5. **Debug logging enabled** - disable sensitive logs in production

### Production Migration Plan:
1. Restrict CORS to your domain
2. Enable email confirmations
3. Move to production Supabase project
4. Implement proper rate limiting
5. Add monitoring and alerts
6. Set up CI/CD pipeline

---

## 🎯 Beta Success Criteria

Your beta is ready when:
- ✅ 5-10 users can connect simultaneously
- ✅ All core features work without fake data
- ✅ No crashes under normal usage
- ✅ Real authentication works
- ✅ Database handles concurrent operations
- ✅ Network access works from multiple devices

**Congratulations on reaching Beta! 🚀**
