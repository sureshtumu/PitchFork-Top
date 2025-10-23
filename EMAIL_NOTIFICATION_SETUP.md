# Email Notification Setup Guide

## Overview
This implementation sends email notifications via Gmail when users send messages from the Venture Detail screen. The emails are sent to `vkotrapp@gmail.com` with the sender's name as the display name and `admin@pitchfork.com` as the reply-to address.

## Architecture

```
User clicks "Send" button
        ↓
Frontend saves message to database
        ↓
Frontend calls /send-message-email edge function
        ↓
Edge function authenticates user
        ↓
Edge function retrieves sender name
        ↓
Edge function sends email via Gmail SMTP
        ↓
Email arrives at vkotrapp@gmail.com
```

## Gmail Setup Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", enable "2-Step Verification"
4. Follow the prompts to set up 2FA (you'll need your phone)

### Step 2: Generate Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. In the "Select app" dropdown, choose "Mail"
4. In the "Select device" dropdown, choose "Other (Custom name)"
5. Enter "Pitch Fork App" or similar
6. Click "Generate"
7. **IMPORTANT**: Copy the 16-character password that appears
   - It will look like: `xxxx xxxx xxxx xxxx`
   - Save it securely - you won't see it again!

### Step 3: Configure Supabase Environment Variables

You need to set two environment variables in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to: **Settings** → **Edge Functions**
3. Scroll to "Environment Variables" section
4. Add these variables:

```bash
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

**Example:**
```bash
GMAIL_USER=vkotrapp@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

⚠️ **Important Notes:**
- Use the **App Password** you just generated, NOT your regular Gmail password
- Remove any spaces from the App Password when entering it
- The GMAIL_USER should be the Gmail account you want to send FROM

## Deployment Instructions

### Step 1: Deploy the Edge Function

```bash
# Navigate to your project root
cd C:\Users\vkotr\PitchFork-Top

# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref your-project-ref

# Deploy the send-message-email function
npx supabase functions deploy send-message-email
```

### Step 2: Test the Function

After deployment, you can test the function:

```bash
# Get your access token from Supabase dashboard or browser console
# Then test with curl:

curl -X POST https://your-project.supabase.co/functions/v1/send-message-email \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company",
    "messageTitle": "Test Email",
    "messageDetail": "This is a test message from the email integration."
  }'
```

### Step 3: Verify Frontend Changes

The frontend changes have already been made to `VentureDetail.tsx`. The code will:
1. Save the message to the database (existing functionality)
2. Call the edge function to send an email (new functionality)
3. Show success message regardless of email status (graceful degradation)

## Files Modified

### Backend (Edge Function)
- `supabase/functions/send-message-email/index.ts` (new file)
  - Handles email sending via Gmail SMTP
  - Authenticates user
  - Formats email content
  - Sends to vkotrapp@gmail.com

### Frontend
- `src/components/VentureDetail.tsx`
  - Updated `handleQuickMessage()` function
  - Updated `handleSendMessage()` function
  - Added email notification API calls

## Email Format

When a user sends a message, the email will look like this:

```
From: John Smith <vkotrapp@gmail.com>
To: vkotrapp@gmail.com
Reply-To: admin@pitchfork.com
Subject: [Message Title from user]

From: John Smith
Company: Acme Corp
Reply-To: admin@pitchfork.com

Message:
[User's message content here]

---
This message was sent via Pitch Fork platform.
```

## Features

### ✅ Implemented:
- Email sent when user clicks "Send" button
- Sender's name displayed in email body
- Reply-To set to admin@pitchfork.com
- Company name included in email
- Gmail SMTP integration
- Secure credential storage via environment variables
- User authentication verification
- Graceful error handling (message still saves if email fails)

### 🔄 How It Works:
1. User enters message and clicks "Send"
2. Message is saved to database
3. Edge function is called with message details
4. Function retrieves current user's name from database
5. Email is formatted and sent via Gmail
6. User sees success message
7. If email fails, message is still saved (graceful degradation)

## Troubleshooting

### Error: "Gmail credentials not configured"
**Solution:** Make sure you've set the `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables in Supabase.

### Error: "SMTP authentication failed"
**Solutions:**
- Verify you're using the App Password, not your regular password
- Make sure there are no spaces in the App Password
- Confirm 2FA is enabled on your Google account
- Try generating a new App Password

### Error: "Failed to send email"
**Possible causes:**
- Gmail's daily sending limit reached (500 emails/day)
- Incorrect SMTP credentials
- Network/firewall issues
- Gmail account suspended or locked

### Emails not arriving
**Check:**
- Spam/Junk folder in vkotrapp@gmail.com
- Gmail "Sent" folder to verify emails are being sent
- Edge function logs in Supabase dashboard
- Browser console for error messages

## Security Considerations

✅ **Good Practices:**
- Credentials stored as environment variables (not in code)
- App Password used instead of real password
- Authentication required to send emails
- CORS headers properly configured

⚠️ **Limitations:**
- Gmail has daily sending limits
- Not recommended for high-volume production use
- Consider dedicated email service (SendGrid, Resend) for production

## Monitoring

### Check Email Logs:
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **send-message-email**
3. Click "Logs" tab
4. View real-time logs of email sending attempts

### Common Log Messages:
- ✅ "Email sent successfully!" - Email sent without errors
- ⚠️ "SMTP Error:" - Problem connecting to Gmail
- ❌ "Gmail credentials not configured" - Environment variables missing

## Future Enhancements

### Potential Improvements:
1. **Email Templates**: HTML-formatted emails with branding
2. **Attachments**: Include analysis reports in emails
3. **Multiple Recipients**: CC/BCC functionality
4. **Email Queue**: Batch sending for better reliability
5. **Read Receipts**: Track when emails are opened
6. **Dedicated Service**: Migrate to SendGrid/Resend for production
7. **Email Preferences**: Let users opt-in/out of notifications
8. **Digest Mode**: Combine multiple messages into daily digest

## Testing Checklist

- [ ] Environment variables set in Supabase
- [ ] Edge function deployed successfully
- [ ] Send test message from Venture Detail screen
- [ ] Verify email arrives at vkotrapp@gmail.com
- [ ] Check sender name displays correctly
- [ ] Verify reply-to is admin@pitchfork.com
- [ ] Test with both quick message and detailed message forms
- [ ] Verify message saves even if email fails
- [ ] Check logs for any errors
- [ ] Test from different user accounts

## Support

If you encounter issues:

1. Check Supabase Edge Function logs
2. Check browser console for errors
3. Verify Gmail App Password is correct
4. Ensure 2FA is enabled on Gmail account
5. Test with curl command to isolate frontend/backend issues

## Alternative: Using a Dedicated Email Service

If Gmail proves problematic, consider switching to **Resend**:

**Benefits:**
- 3,000 emails/month free
- Better deliverability
- No 2FA setup required
- Purpose-built for applications
- Better analytics and tracking

**Setup:**
1. Sign up at https://resend.com
2. Get API key
3. Update edge function to use Resend API
4. Much simpler integration!

Let me know if you'd like help switching to Resend!

