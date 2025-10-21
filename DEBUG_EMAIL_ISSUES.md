# Debug Email Issues - Step-by-Step Guide

## Quick Checklist

Before diving deep, verify these basics:
- [ ] Environment variables are set in Supabase Dashboard
- [ ] Edge function has been deployed
- [ ] Gmail App Password is correct (no spaces)
- [ ] 2FA is enabled on Gmail account
- [ ] User is logged in when sending message

## Step 1: Check Edge Function Logs (Most Important!)

### View Real-Time Logs

Open a terminal and run:

```bash
cd C:\Users\vkotr\PitchFork-Top
npx supabase functions logs send-message-email --follow
```

Leave this running, then send a test message from the UI. Watch for output.

### What to Look For:

**✅ Success looks like:**
```
Initializing SMTP client...
Gmail user: vkotrappa@gmail.com
Connecting to Gmail SMTP...
Email sent successfully!
```

**❌ Common Errors:**

**Error 1: "Gmail credentials not configured"**
```
Error: Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD
```
**Solution:** Environment variables not set or function not redeployed
- Set variables in Supabase Dashboard
- Redeploy: `npx supabase functions deploy send-message-email`

**Error 2: "SMTP authentication failed"**
```
SMTP Error: authentication failed
```
**Solutions:**
- App Password has spaces (remove them)
- Wrong App Password (generate new one)
- 2FA not enabled on Gmail
- Using regular password instead of App Password

**Error 3: "User not authenticated"**
```
Error: User not authenticated
```
**Solution:** User needs to be logged in to the app

**Error 4: No logs at all**
**Solutions:**
- Function wasn't deployed: `npx supabase functions deploy send-message-email`
- Function name mismatch
- Frontend not calling the function

## Step 2: Check Browser Console

### Open Browser Developer Tools:
- Press `F12` or `Ctrl+Shift+I` (Windows)
- Click on "Console" tab

### Send a Test Message

Watch for these messages:

**✅ Success:**
```
Email notification sent successfully
```

**❌ Errors to look for:**

```
Failed to send email notification: [error message]
```

```
Failed to fetch
```

```
Network error
```

```
404 Not Found
```

### Check Network Tab:

1. Open Developer Tools (`F12`)
2. Click "Network" tab
3. Send a message
4. Look for request to `send-message-email`
5. Click on it to see details

**What to check:**
- Status Code: Should be `200 OK`
- If `404`: Function not deployed
- If `401`: Authentication issue
- If `500`: Server error (check function logs)

**View Response:**
- Click on the request
- Click "Response" tab
- Look for error messages

## Step 3: Test Function Directly

### Test with Browser Console:

Open browser console (`F12`) and run this:

```javascript
async function testEmail() {
  const supabase = window.supabaseClient || window.supabase;
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('Not logged in!');
    return;
  }
  
  console.log('Session found, testing email...');
  
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
        messageTitle: 'Test Email',
        messageDetail: 'This is a test message from console!'
      })
    }
  );
  
  const result = await response.json();
  console.log('Status:', response.status);
  console.log('Result:', result);
  
  if (response.ok) {
    console.log('✅ Success! Check email inbox.');
  } else {
    console.error('❌ Failed:', result.error);
  }
}

testEmail();
```

**Expected output:**
```
Session found, testing email...
Status: 200
Result: {success: true, message: 'Email sent successfully'}
✅ Success! Check email inbox.
```

## Step 4: Verify Environment Variables

### Using Supabase CLI:

```bash
npx supabase secrets list
```

**Should show:**
```
GMAIL_USER
GMAIL_APP_PASSWORD
```

**If empty or missing:**
```bash
# Set them again
npx supabase secrets set GMAIL_USER=vkotrappa@gmail.com
npx supabase secrets set GMAIL_APP_PASSWORD=your-app-password-here

# Redeploy
npx supabase functions deploy send-message-email
```

## Step 5: Verify Gmail App Password

### Test App Password is Valid:

1. Go to: https://myaccount.google.com/apppasswords
2. Check if your "Pitch Fork" app password still exists
3. If not, generate a new one
4. Update in Supabase: Settings → Edge Functions → Environment Variables
5. Redeploy function

### Common App Password Issues:

❌ **Spaces in password:** `abcd efgh ijkl mnop`  
✅ **Remove spaces:** `abcdefghijklmnop`

❌ **Using regular Gmail password**  
✅ **Must use App Password** (16 characters)

❌ **2FA not enabled**  
✅ **Must enable 2FA first**

## Step 6: Check Function Deployment

### Verify function exists:

```bash
npx supabase functions list
```

Should show:
```
send-message-email
```

### Redeploy function:

```bash
npx supabase functions deploy send-message-email --no-verify-jwt
```

Wait for confirmation:
```
Deployed to: https://your-project.supabase.co/functions/v1/send-message-email
```

## Step 7: Check Gmail Account

### Is 2FA Enabled?

1. Go to: https://myaccount.google.com/security
2. Look for "2-Step Verification"
3. Should say "On"
4. If "Off", enable it first

### Check "Less Secure App Access"

This is NOT needed for App Passwords, but check if Gmail is blocking:

1. Go to: https://myaccount.google.com/lesssecureapps
2. This should be OFF (App Passwords are secure)

### Check Gmail Sent Folder

1. Log into the Gmail account you're sending FROM
2. Check "Sent" folder
3. See if emails are being sent but not received

## Step 8: Test SMTP Connection

### Create a test file to verify SMTP works:

Create: `test-smtp.ts`

```typescript
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const client = new SMTPClient({
  connection: {
    hostname: 'smtp.gmail.com',
    port: 587,
    tls: true,
    auth: {
      username: 'vkotrappa@gmail.com',
      password: 'YOUR_APP_PASSWORD_HERE',
    },
  },
});

try {
  console.log('Testing SMTP connection...');
  
  await client.send({
    from: 'Test <vkotrappa@gmail.com>',
    to: 'vkotrappa@gmail.com',
    subject: 'SMTP Test',
    content: 'If you receive this, SMTP is working!',
  });
  
  console.log('✅ Email sent successfully!');
  await client.close();
} catch (error) {
  console.error('❌ SMTP Error:', error);
}
```

Run with:
```bash
deno run --allow-net test-smtp.ts
```

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Gmail credentials not configured" | Env vars not set | Set in Supabase Dashboard, redeploy |
| "SMTP authentication failed" | Wrong App Password | Generate new App Password |
| "User not authenticated" | Not logged in | Log in to app first |
| "Failed to fetch" | Function not deployed | Deploy function |
| "Network error" | CORS or connection issue | Check Supabase URL correct |
| "535 5.7.8 Username and Password not accepted" | Wrong credentials | Check App Password (no spaces) |
| No logs at all | Function not being called | Check frontend code calling function |

## Quick Fixes to Try

### Fix 1: Redeploy Everything
```bash
# Redeploy function
npx supabase functions deploy send-message-email

# Clear browser cache
# Refresh page
# Try again
```

### Fix 2: Regenerate App Password
1. Delete old App Password in Google
2. Generate new one
3. Update in Supabase
4. Redeploy function
5. Test again

### Fix 3: Check Frontend is Calling Function

Open: `src/components/VentureDetail.tsx`

Search for: `send-message-email`

Should see around line 1112-1127:
```typescript
const functionUrl = `${supabaseUrl}/functions/v1/send-message-email`;
```

Verify the URL matches your Supabase project URL.

## Still Not Working?

If you've tried everything above, provide me with:

1. **Edge function logs output** (when sending message)
2. **Browser console errors** (when sending message)
3. **Network tab response** (click on send-message-email request)
4. **Environment variables status** (npx supabase secrets list)
5. **Function deployment output**

With this information, I can pinpoint the exact issue!

## Emergency Workaround

If you need emails working immediately, try using Resend instead:

1. Sign up at: https://resend.com (free, 3000 emails/month)
2. Get API key
3. I'll help you switch the edge function to use Resend (much simpler!)

