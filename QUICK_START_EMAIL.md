# Quick Start: Email Integration

## 3-Step Setup

### Step 1: Get Gmail App Password (5 minutes)

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to your Gmail account
3. Enable 2FA if not already enabled
4. Select "Mail" and "Other (Custom name)"
5. Enter "Pitch Fork" as the name
6. Copy the 16-character password (like: `abcd efgh ijkl mnop`)
7. **Save it securely!**

### Step 2: Set Supabase Environment Variables (2 minutes)

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
2. Scroll to "Environment Variables"
3. Add these two variables:

```
GMAIL_USER = vkotrapp@gmail.com
GMAIL_APP_PASSWORD = abcdefghijklmnop (remove spaces!)
```

4. Click "Save"

### Step 3: Deploy Edge Function (1 minute)

Open terminal:

```bash
cd C:\Users\vkotr\PitchFork-Top
npx supabase functions deploy send-message-email
```

## That's It! ✅

Now when users click "Send" on the Venture Detail screen:
- Message saves to database ✓
- Email sent to vkotrapp@gmail.com ✓
- Sender's name shown ✓
- Reply-to: admin@pitchfork.com ✓

## Test It

1. Go to any company's Venture Detail page
2. Type a message in the input field
3. Click "Send"
4. Check vkotrapp@gmail.com inbox!

## If Something Goes Wrong

**Email not arriving?**
- Check spam folder
- Verify environment variables in Supabase
- Check edge function logs: `npx supabase functions logs send-message-email`

**"Gmail credentials not configured" error?**
- Make sure you saved the environment variables
- Redeploy: `npx supabase functions deploy send-message-email`

**"Authentication failed" error?**
- Double-check the App Password (no spaces!)
- Verify 2FA is enabled on Gmail
- Try generating a new App Password

## Need More Details?

See:
- `EMAIL_INTEGRATION_COMPLETE.md` - Full documentation
- `EMAIL_NOTIFICATION_SETUP.md` - Detailed setup guide
- `DEPLOY_EMAIL_FUNCTION.md` - Deployment guide

---

**Total Setup Time:** ~8 minutes  
**Difficulty:** Easy  
**Cost:** Free (Gmail)  
**Limit:** 500 emails/day

