# Fix: User Not Authenticated Error

## What I Changed

I've improved both the **frontend** and **backend** to better handle authentication and provide detailed logging.

### Changes Made:

1. **Edge Function** (`supabase/functions/send-message-email/index.ts`)
   - Added detailed console logging at each step
   - Better error messages showing exactly where authentication fails
   - More informative error responses

2. **Frontend** (`src/components/VentureDetail.tsx`)
   - Better session validation before calling edge function
   - Added checks for valid access token
   - More detailed console logging
   - Improved error handling

## How to Deploy These Fixes

### Step 1: Deploy the Updated Edge Function

```bash
cd C:\Users\vkotr\PitchFork-Top
npx supabase functions deploy send-message-email
```

Wait for confirmation:
```
Deployed to: https://your-project.supabase.co/functions/v1/send-message-email
```

### Step 2: Refresh Your Frontend

1. If using a dev server, restart it:
   ```bash
   npm run dev
   ```

2. Or if already running, just refresh the browser with `Ctrl+F5` (hard refresh)

## How to Test & Debug

### Test 1: Check Browser Console First

1. Open your app and log in
2. Open browser console (`F12`)
3. Navigate to a Venture Detail page
4. Send a test message
5. Look for these console messages:

**✅ Good - Should see:**
```
Calling email function with session...
Email response status: 200
Email notification sent successfully
```

**❌ Bad - If you see:**
```
No valid session for email notification
```
**Solution:** You're not logged in properly. Try:
- Log out and log back in
- Clear browser cache/cookies
- Check if your session expired

### Test 2: Check Edge Function Logs

Open a terminal and run:

```bash
npx supabase functions logs send-message-email --follow
```

Leave this running, then send a test message. You should see:

**✅ Good output:**
```
Auth header present: true
Creating Supabase client...
Getting user from auth...
User error: null
User found: true
User email: user@example.com
Sending email from: John Doe
Company: Acme Corp
Title: Test message
Initializing SMTP client...
Gmail user: vkotrappa@gmail.com
Connecting to Gmail SMTP...
Email sent successfully!
```

**❌ If you see:**
```
Auth header present: false
No authorization header provided
```
**Problem:** Frontend isn't sending the auth token

**❌ If you see:**
```
Auth header present: true
Creating Supabase client...
Getting user from auth...
User error: { ... }
User found: false
```
**Problem:** Auth token is invalid or expired

## Common Causes & Solutions

### Cause 1: User Not Logged In
**Symptoms:**
- "No valid session" in browser console
- "No authorization header" in edge function logs

**Solution:**
1. Make sure you're logged in to the app
2. Try logging out and back in
3. Check if session expired (happens after ~1 hour by default)

### Cause 2: Token Expired
**Symptoms:**
- Was working before, now suddenly failing
- "User not authenticated" even though you're logged in

**Solution:**
```javascript
// In browser console, refresh the session:
const { data, error } = await supabase.auth.refreshSession();
console.log('Session refreshed:', data);
```

Or just log out and log back in.

### Cause 3: CORS or Network Issue
**Symptoms:**
- Network error in console
- No logs appearing in edge function

**Solution:**
1. Check your Supabase URL is correct
2. Verify edge function is deployed
3. Check browser Network tab for failed requests

### Cause 4: Edge Function Not Deployed
**Symptoms:**
- 404 error
- "Function not found"

**Solution:**
```bash
npx supabase functions deploy send-message-email
```

## Detailed Debugging Steps

### Step 1: Verify You're Logged In

In browser console:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Access token:', session?.access_token);
console.log('User:', session?.user);
```

**Expected:**
- session: {...} (not null)
- access_token: "ey..." (long string starting with ey)
- user: { id: "...", email: "..." }

**If null:** You're not logged in!

### Step 2: Test Function Directly

In browser console:
```javascript
const { data: { session } } = await supabase.auth.getSession();

if (!session?.access_token) {
  console.error('Not logged in!');
} else {
  console.log('Testing with token:', session.access_token.substring(0, 20) + '...');
  
  const response = await fetch(
    'https://nsimmsznrutwgtkkblgw.supabase.co/functions/v1/send-message-email',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        companyName: 'Test Company',
        messageTitle: 'Debug Test',
        messageDetail: 'Testing authentication'
      })
    }
  );
  
  const result = await response.json();
  console.log('Status:', response.status);
  console.log('Result:', result);
}
```

**Expected:**
```
Status: 200
Result: {success: true, message: "Email sent successfully"}
```

### Step 3: Check Edge Function Environment

Make sure environment variables are still set:

```bash
npx supabase secrets list
```

**Should show:**
```
GMAIL_USER
GMAIL_APP_PASSWORD
```

**If missing:**
```bash
npx supabase secrets set GMAIL_USER=vkotrappa@gmail.com
npx supabase secrets set GMAIL_APP_PASSWORD=your-app-password
npx supabase functions deploy send-message-email
```

## Still Having Issues?

If the error persists after deploying the updates:

1. **Capture these details:**
   - Edge function logs (from terminal)
   - Browser console output
   - Network tab response
   
2. **Check these:**
   - [ ] Are you logged in to the app?
   - [ ] Did you deploy the edge function?
   - [ ] Did you hard-refresh the browser (Ctrl+F5)?
   - [ ] Do the edge function logs show any output?
   - [ ] Is your session token valid?

3. **Quick Reset:**
   ```bash
   # Redeploy function
   npx supabase functions deploy send-message-email
   
   # In browser:
   # Log out
   # Clear cache (Ctrl+Shift+Delete)
   # Log back in
   # Try sending message again
   ```

## What The Logs Will Show Now

With the new logging, you'll see exactly where the process fails:

```
Step 1: Auth header present: true ✓
Step 2: Creating Supabase client... ✓
Step 3: Getting user from auth... ✓
Step 4: User error: null ✓
Step 5: User found: true ✓
Step 6: User email: user@example.com ✓
Step 7: Sending email from: John Doe ✓
Step 8: Initializing SMTP client... ✓
Step 9: Email sent successfully! ✓
```

If it fails, you'll see exactly which step failed!

## Need More Help?

After deploying and testing, if you're still getting errors, share:

1. **Edge function logs** (entire output when you send a message)
2. **Browser console** (all messages when you send)
3. **Network response** (from the send-message-email request)

With these logs, I can pinpoint the exact issue!

