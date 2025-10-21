# Quick Deploy: Email Notification Function

## Prerequisites

Before deploying, make sure you have:

✅ Gmail App Password generated (see EMAIL_NOTIFICATION_SETUP.md)  
✅ Supabase CLI installed  
✅ Supabase project linked

## Quick Setup Commands

### 1. Set Environment Variables in Supabase

Go to your Supabase Dashboard and set these variables:
- Navigate to: **Settings** → **Edge Functions** → **Environment Variables**

Add:
```
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here
```

### 2. Deploy the Function

```bash
# From your project root directory:
cd C:\Users\vkotr\PitchFork-Top

# Deploy the email function
npx supabase functions deploy send-message-email

# You should see output like:
# Deploying send-message-email (project ref: your-project)
# Deployed to: https://your-project.supabase.co/functions/v1/send-message-email
```

### 3. Test the Deployment

Open your browser console and run this test (after logging in):

```javascript
const supabase = window.supabaseClient; // or however you access it
const session = await supabase.auth.getSession();

const response = await fetch(
  'https://nsimmsznrutwgtkkblgw.supabase.co/functions/v1/send-message-email',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.data.session.access_token}`,
    },
    body: JSON.stringify({
      companyName: 'Test Company',
      messageTitle: 'Test Email',
      messageDetail: 'This is a test message!'
    })
  }
);

const result = await response.json();
console.log(result);
// Should see: { success: true, message: 'Email sent successfully' }
```

### 4. Verify Email Arrived

Check vkotrapp@gmail.com inbox for the test email.

## Common Issues & Solutions

### Issue: "Gmail credentials not configured"
**Fix:** 
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables
3. Redeploy the function: `npx supabase functions deploy send-message-email`

### Issue: "SMTP authentication failed"
**Fix:**
1. Verify you're using the App Password (not regular password)
2. Remove any spaces from the App Password
3. Confirm 2FA is enabled on your Google account
4. Try generating a new App Password

### Issue: "Module not found" or import errors
**Fix:**
The edge function uses Deno, which automatically handles imports. No additional installation needed.

### Issue: Function not being called from frontend
**Fix:**
1. Check browser console for errors
2. Verify the Supabase URL in the frontend code matches your project
3. Ensure user is authenticated
4. Check Network tab in browser DevTools

## Current Implementation Status

### ✅ Completed:
- [x] Edge function created (`supabase/functions/send-message-email/index.ts`)
- [x] Frontend updated (`src/components/VentureDetail.tsx`)
- [x] Both message forms (quick and detailed) send emails
- [x] User authentication check
- [x] Graceful error handling
- [x] Sender name from database
- [x] Reply-to set to admin@pitchfork.com

### 📋 To Do:
- [ ] Set environment variables in Supabase Dashboard
- [ ] Deploy the edge function
- [ ] Test with real message
- [ ] Verify email delivery

## Next Steps

After successful deployment:

1. **Test the feature:**
   - Go to any company's Venture Detail page
   - Enter a message and click "Send"
   - Check vkotrapp@gmail.com for the email

2. **Monitor usage:**
   - Check Supabase Edge Function logs
   - Monitor for any errors
   - Watch for Gmail rate limits (500/day)

3. **Optional enhancements:**
   - Add HTML email templates
   - Include company logo
   - Add analysis report attachments
   - Send confirmation emails to senders

## Alternative: Use Resend Instead

If you prefer a simpler setup without Gmail complications:

```bash
# Install Resend (much simpler!)
# Sign up at https://resend.com
# Get API key
# Update edge function to use Resend

# Resend is easier because:
# - No 2FA setup
# - No App Passwords
# - Better deliverability
# - Simple API key
# - Free tier: 3,000 emails/month
```

Let me know if you want help switching to Resend!

## Deployment Verification

After deploying, verify everything works:

```bash
# View function logs in real-time
npx supabase functions logs send-message-email --follow

# Then send a test message from the UI
# You should see log output here
```

## Email Example

When working correctly, emails will look like this:

```
From: John Doe <vkotrapp@gmail.com>
To: vkotrapp@gmail.com
Reply-To: admin@pitchfork.com
Subject: Question about funding terms

From: John Doe
Company: Acme Corp
Reply-To: admin@pitchfork.com

Message:
I have a question about your funding terms. 
Could you provide more details about your current round?

---
This message was sent via Pitch Fork platform.
```

## Need Help?

If you encounter any issues:

1. Check the logs: `npx supabase functions logs send-message-email`
2. Check browser console for frontend errors
3. Verify environment variables are set correctly
4. Test the function directly with curl or browser console
5. Check Gmail App Password is valid and 2FA is enabled

Happy deploying! 🚀

