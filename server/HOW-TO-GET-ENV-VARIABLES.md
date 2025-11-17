# How to Get Environment Variables for Load Testing

## Step 1: Get Your Authentication Token

### Method 1: Browser DevTools (Easiest)

1. **Open your BlueIt application** in your browser (make sure you're logged in)
2. **Open Developer Tools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)
3. **Go to Application tab:**
   - Click "Application" in the top menu
   - In the left sidebar, expand "Local Storage"
   - Click on your site's URL (usually `http://localhost:3000` or similar)
4. **Find the token:**
   - Look for `access_token` in the list
   - **Copy the entire value** (it's a long string starting with `eyJ...`)

### Method 2: Console (Alternative)

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Type and press Enter:
   ```javascript
   localStorage.getItem('access_token')
   ```
4. Copy the returned value

## Step 2: Set Environment Variables in PowerShell

Open PowerShell and run these commands:

```powershell
# Set the base URL (default is port 5000)
$env:BASE_URL = "http://localhost:5000"

# Set your auth token (paste the token you copied)
$env:AUTH_TOKEN = "paste_your_token_here"
```

**Important:** Replace `paste_your_token_here` with the actual token you copied!

## Step 3: Verify Environment Variables

Check that they're set correctly:

```powershell
# Check BASE_URL
$env:BASE_URL

# Check AUTH_TOKEN (shows first 20 characters for security)
$env:AUTH_TOKEN.Substring(0, [Math]::Min(20, $env:AUTH_TOKEN.Length))
```

## Step 4: Make Sure Server is Running

Before running load tests, ensure your server is running:

```powershell
cd C:\Users\Hudso\reddit_project\server
npm run dev
```

The server should show: `⚡️[server]: Server is running at http://localhost:5000`

## Step 5: Run the Load Test

Now you can run the load test:

```powershell
cd C:\Users\Hudso\reddit_project\server
npm run loadtest:critical
```

## Troubleshooting

### "Connection refused" Error
- **Problem:** Server isn't running
- **Solution:** Start the server with `npm run dev` in the `server` directory

### "401 Unauthorized" Error
- **Problem:** Token is invalid or expired
- **Solution:** 
  1. Log out and log back in to the app
  2. Get a fresh token from DevTools
  3. Update `$env:AUTH_TOKEN` with the new token

### Environment Variables Not Persisting
- **Problem:** Variables are only set for the current PowerShell session
- **Solution:** Set them again in each new PowerShell window, or add them to your PowerShell profile

### Token Not Found in Local Storage
- **Problem:** You might not be logged in, or token is stored elsewhere
- **Solution:** 
  1. Make sure you're logged in to the app
  2. Check `sessionStorage` instead: `sessionStorage.getItem('access_token')`
  3. Check for `token` instead of `access_token`: `localStorage.getItem('token')`

## Quick Reference

```powershell
# Full setup in one go (replace YOUR_TOKEN_HERE)
$env:BASE_URL = "http://localhost:5000"
$env:AUTH_TOKEN = "YOUR_TOKEN_HERE"
cd C:\Users\Hudso\reddit_project\server
npm run loadtest:critical
```

