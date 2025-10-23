# Complete Deployment Guide - Team Analysis with PDF Generation

## Overview
This guide covers deploying the complete team analysis feature with PDF report generation, including database migrations, storage bucket setup, and edge function deployment.

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- OpenAI API key with GPT-4 access
- Supabase project set up and linked
- Node.js and npm installed

## Step-by-Step Deployment

### Step 1: Database Migrations

Run all migrations to set up the database schema:

```bash
# Push all migrations to your Supabase database
npx supabase db push
```

This will:
- ✅ Add Team-Analysis prompt to `prompts` table
- ✅ Add `analysis_id` column to `analysis_reports` table
- ✅ Create `analysis-output-docs` storage bucket
- ✅ Set up RLS policies for storage
- ✅ Update report type constraints

**Verify migrations:**
```bash
# Check migration status
npx supabase migration list
```

**Alternative (Manual via Dashboard):**
1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order:
   - `20251009110004_add_team_analysis_prompt.sql`
   - `20251009122047_link_analysis_reports_to_analysis.sql`
   - `20251009122048_create_analysis_output_docs_bucket.sql`

### Step 2: Verify Storage Bucket

Check that the storage bucket was created:

**Via Dashboard:**
1. Go to Storage in Supabase Dashboard
2. Verify `analysis-output-docs` bucket exists
3. Check settings:
   - Public: ❌ No (Private)
   - File size limit: 50MB
   - Allowed MIME types: `application/pdf`

**Via CLI:**
```bash
# List all buckets
npx supabase storage ls
```

### Step 3: Deploy Edge Function

Deploy the analyze-team function with PDF generation:

```bash
# Login to Supabase (if not already)
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the analyze-team function
npx supabase functions deploy analyze-team
```

**Expected output:**
```
Deploying function analyze-team...
✓ Function analyze-team deployed successfully
```

### Step 4: Set Environment Secrets

Set your OpenAI API key:

```bash
# Set OpenAI API key
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Verify it's set (values are hidden)
npx supabase secrets list
```

**Expected output:**
```
OPENAI_API_KEY: ***
SUPABASE_URL: ***
SUPABASE_SERVICE_ROLE_KEY: ***
SUPABASE_ANON_KEY: ***
```

### Step 5: Test the Feature

Start your development server and test:

```bash
# Start development server
npm run dev

# Navigate to: http://localhost:5173/test-files
```

**Test Workflow:**
1. ✅ Login as an investor
2. ✅ Go to Test Files page
3. ✅ Click "Analyze Team" on a PDF file
4. ✅ Wait 30-60 seconds for analysis
5. ✅ Verify success message appears
6. ✅ Check modal displays:
   - Analysis text
   - PDF download button
   - Model used
   - Prompt (collapsible)
7. ✅ Click "Download PDF" button
8. ✅ Verify PDF downloads with proper formatting
9. ✅ Check PDF contains:
   - Header with company name
   - Analysis content
   - Page numbers
   - Confidential footer

## Verification Checklist

### Database
- [ ] `prompts` table has "Team-Analysis" entry
- [ ] `analysis_reports` table has `analysis_id` column
- [ ] `analysis` table exists with proper foreign keys
- [ ] RLS policies are enabled on all tables

### Storage
- [ ] `analysis-output-docs` bucket exists
- [ ] Bucket is private (not public)
- [ ] RLS policies are set for authenticated users
- [ ] File size limit is 50MB
- [ ] Only PDF files are allowed

### Edge Function
- [ ] `analyze-team` function is deployed
- [ ] Function logs show no errors
- [ ] OPENAI_API_KEY secret is set
- [ ] Function can access storage bucket
- [ ] Function can write to database

### Frontend
- [ ] "Analyze Team" button appears on Test Files page
- [ ] Button is green and next to "Test" button
- [ ] Clicking button triggers analysis
- [ ] Loading state shows "Analyzing..."
- [ ] Success message appears after completion
- [ ] Modal displays analysis results
- [ ] PDF download button appears
- [ ] Download button works

## Common Commands

### View Function Logs
```bash
# View real-time logs
npx supabase functions logs analyze-team --follow

# View recent logs
npx supabase functions logs analyze-team
```

### Check Function Status
```bash
# List all functions
npx supabase functions list

# Check specific function
npx supabase functions inspect analyze-team
```

### Manage Secrets
```bash
# List all secrets (values hidden)
npx supabase secrets list

# Set a secret
npx supabase secrets set SECRET_NAME=value

# Update OpenAI key
npx supabase secrets set OPENAI_API_KEY=new-key-here
```

### Database Operations
```bash
# Check migration status
npx supabase migration list

# Create new migration
npx supabase migration new migration_name

# Reset database (CAUTION: deletes all data)
npx supabase db reset
```

### Storage Operations
```bash
# List buckets
npx supabase storage ls

# List files in bucket
npx supabase storage ls analysis-output-docs

# Download file
npx supabase storage download analysis-output-docs/path/to/file.pdf
```

## Troubleshooting

### Issue: Migration fails
**Error:** `relation "analysis_reports" does not exist`

**Solution:**
```bash
# Check migration order
npx supabase migration list

# Run migrations in correct order
npx supabase db push
```

### Issue: Function deployment fails
**Error:** `Failed to deploy function`

**Solutions:**
```bash
# Make sure you're logged in
npx supabase login

# Make sure project is linked
npx supabase link --project-ref YOUR_PROJECT_REF

# Check function syntax
cd supabase/functions/analyze-team
deno check index.ts

# Try deploying again
npx supabase functions deploy analyze-team
```

### Issue: "Team-Analysis prompt not found"
**Error in function logs**

**Solution:**
```sql
-- Run in SQL Editor
INSERT INTO prompts (prompt_name, prompt_detail, preferred_llm) 
VALUES ('Team-Analysis', 'Your prompt text...', 'GPT-4')
ON CONFLICT (prompt_name) DO UPDATE 
SET prompt_detail = EXCLUDED.prompt_detail;
```

### Issue: "Failed to upload PDF"
**Error:** `Failed to upload PDF: new row violates row-level security policy`

**Solutions:**
1. Check storage bucket exists
2. Verify RLS policies:
```sql
-- Check policies on storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects';
```
3. Re-run storage migration:
```bash
npx supabase db push
```

### Issue: OpenAI API errors
**Error:** `OPENAI_API_KEY environment variable is not set`

**Solution:**
```bash
# Set the key
npx supabase secrets set OPENAI_API_KEY=sk-your-key

# Redeploy function
npx supabase functions deploy analyze-team
```

### Issue: PDF download link doesn't work
**Error:** `SignedURL expired` or `Access denied`

**Causes:**
- Signed URL expired (1 hour expiry)
- User doesn't have access
- File doesn't exist

**Solutions:**
1. Re-run analysis to generate new signed URL
2. Check file exists in storage:
```bash
npx supabase storage ls analysis-output-docs/COMPANY_UUID/
```
3. Check RLS policies on storage

### Issue: PDF formatting is wrong
**Symptoms:** Text overlaps, missing content, weird characters

**Solutions:**
1. Check jsPDF version in edge function
2. Verify text encoding
3. Test with different PDF viewers
4. Check function logs for errors

## Production Deployment

### Pre-Production Checklist
- [ ] All tests pass in development
- [ ] Database migrations tested
- [ ] Edge function tested with real PDFs
- [ ] Storage bucket tested
- [ ] Error handling tested
- [ ] Load testing completed
- [ ] Cost estimates reviewed

### Production Steps

1. **Backup Production Database**
```bash
# Create backup before migrations
npx supabase db dump -f backup-$(date +%Y%m%d).sql
```

2. **Run Migrations in Production**
```bash
# Link to production project
npx supabase link --project-ref PROD_PROJECT_REF

# Run migrations
npx supabase db push
```

3. **Deploy Edge Function to Production**
```bash
# Deploy to production
npx supabase functions deploy analyze-team

# Set production secrets
npx supabase secrets set OPENAI_API_KEY=prod-key-here
```

4. **Deploy Frontend**
```bash
# Build frontend
npm run build

# Deploy to your hosting provider
# (Vercel, Netlify, etc.)
```

5. **Verify in Production**
- Test with real user account
- Verify PDF generation works
- Check storage bucket
- Monitor function logs
- Test download links

### Post-Deployment Monitoring

**Monitor these metrics:**
1. Edge function invocations
2. Error rates
3. Average execution time
4. Storage usage
5. OpenAI API costs
6. Database query performance

**Set up alerts for:**
- Function errors > 5%
- Execution time > 90 seconds
- Storage > 80% capacity
- API costs > budget threshold

## Environment Variables

### Required in Supabase
```bash
OPENAI_API_KEY=sk-...           # Your OpenAI API key
SUPABASE_URL=https://...        # Auto-set by Supabase
SUPABASE_SERVICE_ROLE_KEY=...   # Auto-set by Supabase
SUPABASE_ANON_KEY=...           # Auto-set by Supabase
```

### Required in Frontend (.env)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Cost Estimation

### Per Analysis
- OpenAI API: $0.10 - $0.50
- Supabase Storage: < $0.01
- Supabase Database: < $0.01
- **Total: ~$0.11 - $0.51**

### Monthly (100 analyses)
- OpenAI API: $10 - $50
- Supabase Storage: $1 - $5
- Supabase Database: $1 - $2
- **Total: ~$12 - $57/month**

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **jsPDF Docs**: https://github.com/parallax/jsPDF
- **Project Docs**: 
  - `TEAM_ANALYSIS_IMPLEMENTATION.md`
  - `PDF_GENERATION_IMPLEMENTATION.md`

## Quick Reference

### File Locations
```
supabase/
├── migrations/
│   ├── 20251009110004_add_team_analysis_prompt.sql
│   ├── 20251009122047_link_analysis_reports_to_analysis.sql
│   └── 20251009122048_create_analysis_output_docs_bucket.sql
└── functions/
    └── analyze-team/
        └── index.ts

src/
└── components/
    └── TestFiles.tsx
```

### Key Tables
- `prompts` - AI prompts for analysis
- `analysis` - Investor-company analysis records
- `analysis_reports` - Generated report metadata
- `companies` - Company information
- `extracted_data` - Analysis results for display

### Storage Buckets
- `company-documents` - Uploaded company files (input)
- `analysis-output-docs` - Generated PDF reports (output)

## Success Criteria

✅ **Deployment is successful when:**
1. All migrations run without errors
2. Storage bucket is created and accessible
3. Edge function deploys successfully
4. Test analysis completes in < 90 seconds
5. PDF is generated with proper formatting
6. Download button works in UI
7. No errors in function logs
8. Database records are created correctly

## Next Steps After Deployment

1. **Monitor Performance**
   - Check function logs daily
   - Review error rates
   - Monitor costs

2. **User Training**
   - Document feature for users
   - Create video tutorial
   - Provide example reports

3. **Gather Feedback**
   - Collect user feedback
   - Track usage metrics
   - Identify improvements

4. **Plan Enhancements**
   - Additional report types
   - Custom branding
   - Batch processing
   - Report templates

## Emergency Rollback

If something goes wrong:

```bash
# 1. Rollback edge function (deploy previous version)
git checkout HEAD~1 supabase/functions/analyze-team/
npx supabase functions deploy analyze-team

# 2. Rollback database (if needed)
npx supabase db reset
# Then restore from backup

# 3. Check logs
npx supabase functions logs analyze-team

# 4. Notify users
# Send notification about temporary issue
```

---

**Last Updated:** 2025-10-09
**Version:** 1.0.0
**Status:** Production Ready ✅
