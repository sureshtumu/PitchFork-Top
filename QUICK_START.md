# Quick Start Guide - Team Analysis with PDF Generation

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Supabase project set up
- OpenAI API key
- Supabase CLI installed

### Step 1: Deploy Database (1 minute)
```bash
npx supabase db push
```

### Step 2: Deploy Edge Function (1 minute)
```bash
npx supabase functions deploy analyze-team
```

### Step 3: Set OpenAI Key (30 seconds)
```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### Step 4: Test It (2 minutes)
```bash
npm run dev
```

1. Go to http://localhost:5173/test-files
2. Click green "Analyze Team" button
3. Wait ~60 seconds
4. Download your PDF report!

## ✅ That's It!

You now have:
- ✅ AI-powered team analysis
- ✅ Professional PDF reports
- ✅ Secure storage
- ✅ Complete database tracking

## 📖 Need More Details?

See these docs:
- **DEPLOYMENT_STEPS_UPDATED.md** - Full deployment guide
- **PDF_GENERATION_IMPLEMENTATION.md** - Technical details
- **IMPLEMENTATION_SUMMARY.md** - Complete overview

## 🆘 Troubleshooting

### Issue: Migrations fail
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### Issue: Function won't deploy
```bash
npx supabase login
npx supabase functions deploy analyze-team
```

### Issue: Analysis fails
```bash
# Check logs
npx supabase functions logs analyze-team

# Verify OpenAI key
npx supabase secrets list
```

## 💡 What Happens When You Click "Analyze Team"?

1. **Frontend** sends PDF to edge function
2. **Edge Function**:
   - Authenticates you
   - Fetches prompt from database
   - Sends PDF to OpenAI GPT-4 Turbo
   - Gets comprehensive analysis
   - Generates professional PDF
   - Saves to storage
   - Creates database records
3. **Frontend** shows:
   - Analysis text
   - Download button
   - Success message
4. **You** download a beautiful PDF report!

## 📊 What Gets Created?

### In Database:
- Entry in `analysis` table (investor + company)
- Entry in `analysis_reports` table (PDF metadata)
- Entry in `extracted_data` table (for display)

### In Storage:
- PDF file in `analysis-output-docs` bucket
- Path: `{company-id}/{company-name}_team-analysis_{timestamp}.pdf`

### In UI:
- Analysis text in modal
- Green download button
- Success message

## 🎯 Example Output

**PDF Report Contains:**
```
┌────────────────────────────────────────┐
│ Team Analysis Report                   │
│ Company: DAC                           │
│ Generated: October 9, 2025 at 12:20 PM│
│ Model: GPT-4 Turbo                     │
│                                        │
│ ─────────────────────────────────────  │
│                                        │
│ [Comprehensive team analysis here...]  │
│                                        │
│ 1. Key team members and their roles    │
│ 2. Relevant experience and expertise   │
│ 3. Team completeness - gaps identified │
│ 4. Leadership structure                │
│ 5. Advisory board or mentors           │
│ 6. Team strengths and concerns         │
│ 7. Overall team assessment score       │
│ 8. Recommendations for improvement     │
│                                        │
│ ─────────────────────────────────────  │
│ Page 1 of 3 | Confidential            │
└────────────────────────────────────────┘
```

## 💰 Cost Per Analysis

- OpenAI API: **$0.10 - $0.50**
- Storage: **< $0.01**
- **Total: ~$0.11 - $0.51**

## ⏱️ Time Per Analysis

- **30-60 seconds** total
- Most time is OpenAI processing

## 🔐 Security

- ✅ Private storage bucket
- ✅ Authenticated users only
- ✅ Download links expire in 1 hour
- ✅ RLS policies enforced
- ✅ Proper user tracking

## 🎉 You're Done!

Your team analysis feature with PDF generation is now live!

**Next Steps:**
1. Test with real pitch decks
2. Share with your team
3. Gather feedback
4. Check the docs for advanced features

---

**Questions?** Check the full documentation or function logs.

**Status:** ✅ Production Ready
