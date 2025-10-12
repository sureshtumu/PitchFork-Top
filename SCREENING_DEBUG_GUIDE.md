# Investor Screening - Debug Guide

## Overview

The `screen-investor-match` edge function now has comprehensive debug logging to help diagnose issues. Every step of the screening process is logged with clear markers.

---

## How to View Logs

### Method 1: Supabase CLI (Real-time)

```bash
# Watch logs in real-time
supabase functions logs screen-investor-match --follow

# Or view recent logs
supabase functions logs screen-investor-match
```

### Method 2: Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **screen-investor-match**
3. Click **Logs** tab
4. See all invocations and their logs

---

## Log Structure

The function logs are organized into clear sections:

```
=== SCREENING STARTED ===
Timestamp: 2025-10-10T12:34:56.789Z
✓ Supabase client initialized
✓ OpenAI client initialized

=== REQUEST PARAMETERS ===
Company ID: abc-123-def-456
Investor User ID: xyz-789-uvw-012
Analysis ID: analysis-uuid-here

=== STEP 1: FETCHING INVESTOR CRITERIA ===
✓ Investor found: David Kim (david@example.com)
✓ Investment criteria length: 523 characters
Investment criteria preview: I invest in early-stage B2B SaaS companies...

=== STEP 2: FETCHING COMPANY INFORMATION ===
✓ Company found: TechCo
  Industry: SaaS
  Revenue: $1.2M ARR
  Valuation: $5M
  Funding Stage: Series A

=== STEP 3: FETCHING PITCH DECK ===
✓ Found pitch deck:
  File name: TechCo-Pitch-Deck.pdf
  File path: company-uuid/pitch-deck.pdf
  Date added: 2025-10-10

=== STEP 4: DOWNLOADING & UPLOADING PITCH DECK ===
Downloading from storage bucket: company-documents
Path: company-uuid/pitch-deck.pdf
✓ Downloaded pitch deck
  File size: 2456789 bytes
  File type: application/pdf
Uploading to OpenAI...
✓ Uploaded to OpenAI
  OpenAI File ID: file-abc123xyz
  File name: pitch-deck.pdf
  File bytes: 2456789

=== STEP 5: PREPARING SCREENING PROMPT ===
Company summary prepared:
Company Name: TechCo
Industry: SaaS
Description: AI-powered analytics platform
...

=== STEP 6: SENDING TO OPENAI ===
Prompt length: 1234 characters
Has pitch deck: true
Will use: Assistants API with file_search
Creating OpenAI Assistant...
✓ Assistant created: asst_abc123
Creating thread with pitch deck attachment...
✓ Thread created: thread_xyz789
Running analysis (this may take 30-60 seconds)...
✓ Run completed with status: completed

=== OPENAI RESPONSE ===
{
  "recommendation": "Accept",
  "reason": "TechCo matches your B2B SaaS criteria with $1.2M ARR..."
}
======================
✓ Parsed JSON successfully

=== SCREENING RESULT ===
Recommendation: Accept
Reason: TechCo matches your B2B SaaS criteria...

=== STEP 7: UPDATING DATABASE ===
Setting recommendation to: Analyze
Updating analysis table...
Analysis ID: analysis-uuid-here
Update data: { status: 'Screened', recommendation: 'Analyze', ... }
✓ Analysis table updated successfully

=== SCREENING COMPLETE ===
Total time: 2025-10-10T12:35:42.123Z
```

---

## Common Issues & Solutions

### Issue 1: No Investor Criteria Found

**Logs:**
```
=== STEP 1: FETCHING INVESTOR CRITERIA ===
❌ Error fetching investor details: { code: '...' }
```

**Cause:** Investor doesn't have an entry in `investor_details` table

**Solution:**
```sql
-- Check if investor_details exists
SELECT * FROM investor_details WHERE user_id = '<investor-user-id>';

-- If missing, insert one
INSERT INTO investor_details (user_id, name, email, investment_criteria_doc)
VALUES ('<investor-user-id>', 'Investor Name', 'email@example.com', 'Your criteria here');
```

---

### Issue 2: Empty Investment Criteria

**Logs:**
```
=== STEP 1: FETCHING INVESTOR CRITERIA ===
✓ Investor found: David Kim
✓ Investment criteria length: 0 characters
Investment criteria preview: ...
```

**Cause:** `investment_criteria_doc` field is empty

**Solution:**
1. Login as investor
2. Go to "Investor Preferences"
3. Fill in the "Investment Criteria" text field
4. Save

**Or via SQL:**
```sql
UPDATE investor_details 
SET investment_criteria_doc = 'I invest in early-stage B2B SaaS companies...'
WHERE user_id = '<investor-user-id>';
```

---

### Issue 3: No Pitch Deck Found

**Logs:**
```
=== STEP 3: FETCHING PITCH DECK ===
⚠️  No pitch deck found, will use company text data only
```

**Cause:** No documents uploaded for the company

**Impact:** Screening will still work but won't analyze the pitch deck content

**Solution:**
- Ensure founder uploaded pitch deck during submission
- Check `documents` table:
```sql
SELECT * FROM documents WHERE company_id = '<company-id>';
```

---

### Issue 4: Pitch Deck Download Failed

**Logs:**
```
=== STEP 4: DOWNLOADING & UPLOADING PITCH DECK ===
Downloading from storage bucket: company-documents
Path: company-uuid/pitch-deck.pdf
❌ Error downloading pitch deck: { message: '...' }
Will proceed without pitch deck
```

**Causes:**
1. File doesn't exist in storage
2. RLS policy blocking access
3. Incorrect file path

**Solution:**
```sql
-- Check if file exists in storage
SELECT * FROM storage.objects 
WHERE bucket_id = 'company-documents' 
AND name LIKE '%<company-id>%';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

---

### Issue 5: OpenAI Upload Failed

**Logs:**
```
=== STEP 4: DOWNLOADING & UPLOADING PITCH DECK ===
✓ Downloaded pitch deck
  File size: 2456789 bytes
Uploading to OpenAI...
❌ Error: OpenAI API error...
```

**Causes:**
1. Invalid OpenAI API key
2. File too large (>512MB)
3. Invalid file format

**Solution:**
- Check OpenAI API key in Supabase Dashboard → Edge Functions → Secrets
- Verify file is a valid PDF
- Check file size (should be < 50MB for best performance)

---

### Issue 6: OpenAI Run Failed

**Logs:**
```
=== STEP 6: SENDING TO OPENAI ===
Running analysis (this may take 30-60 seconds)...
❌ Run failed with status: failed
```

**Causes:**
1. OpenAI service issue
2. Invalid prompt
3. File processing error

**Solution:**
- Check OpenAI status: https://status.openai.com
- Review the prompt in logs
- Try without pitch deck (test with company that has no documents)

---

### Issue 7: Can't Parse JSON Response

**Logs:**
```
=== OPENAI RESPONSE ===
Here's my analysis: The company looks good...
======================
❌ Could not find JSON in response
```

**Cause:** OpenAI didn't return properly formatted JSON

**Solution:**
- Check the full response in logs
- The function should extract JSON even if there's extra text
- If persistent, adjust the prompt to be more explicit about JSON format

---

### Issue 8: Database Update Failed

**Logs:**
```
=== STEP 7: UPDATING DATABASE ===
Setting recommendation to: Analyze
Updating analysis table...
❌ Error updating analysis: { code: '23514', message: '...' }
```

**Causes:**
1. Analysis ID doesn't exist
2. Status constraint violation (missing 'Screened' in allowed values)
3. RLS policy blocking update

**Solution:**
```sql
-- Check if analysis exists
SELECT * FROM analysis WHERE id = '<analysis-id>';

-- Check status constraint
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'analysis'::regclass
AND con.conname = 'analysis_status_check';

-- Should include 'Screened'
-- If not, run migration:
-- supabase db push
```

---

## Testing Checklist

Use this checklist to verify each step:

### Pre-Test Setup
- [ ] Investor has entry in `investor_details` table
- [ ] Investor has filled `investment_criteria_doc` field (not empty)
- [ ] Company exists in `companies` table
- [ ] Company has uploaded pitch deck in `documents` table
- [ ] Pitch deck file exists in `company-documents` storage bucket
- [ ] OpenAI API key is set in edge function secrets
- [ ] Migration for 'Screened' status has been run

### Test Execution
- [ ] Founder submits to investor
- [ ] Check edge function logs immediately
- [ ] Verify each step completes successfully
- [ ] Check for any ❌ error markers
- [ ] Verify OpenAI response contains valid JSON
- [ ] Check `analysis` table for updated record

### Expected Results
- [ ] `analysis.status` = 'Screened'
- [ ] `analysis.recommendation` = 'Analyze' or 'Reject'
- [ ] `analysis.recommendation_reason` contains AI explanation
- [ ] Investor sees company on dashboard with correct status

---

## SQL Queries for Debugging

### Check Complete Screening Data
```sql
SELECT 
  c.name as company_name,
  id.name as investor_name,
  id.investment_criteria_doc,
  a.status,
  a.recommendation,
  a.recommendation_reason,
  a.created_at,
  a.updated_at,
  (SELECT COUNT(*) FROM documents WHERE company_id = c.id) as document_count
FROM analysis a
JOIN companies c ON c.id = a.company_id
JOIN investor_details id ON id.user_id = a.investor_user_id
WHERE a.id = '<analysis-id>';
```

### Check Pitch Deck Files
```sql
SELECT 
  d.document_name,
  d.file_path,
  d.date_added,
  so.name as storage_path,
  so.metadata
FROM documents d
LEFT JOIN storage.objects so ON so.name = d.file_path
WHERE d.company_id = '<company-id>'
ORDER BY d.date_added DESC;
```

### Check Recent Screenings
```sql
SELECT 
  a.id,
  c.name as company,
  id.name as investor,
  a.status,
  a.recommendation,
  LEFT(a.recommendation_reason, 100) as reason_preview,
  a.updated_at
FROM analysis a
JOIN companies c ON c.id = a.company_id
JOIN investor_details id ON id.user_id = a.investor_user_id
WHERE a.status = 'Screened'
ORDER BY a.updated_at DESC
LIMIT 10;
```

---

## Manual Test Command

You can manually invoke the function for testing:

```bash
# Using Supabase CLI
supabase functions invoke screen-investor-match \
  --data '{
    "company_id": "your-company-uuid",
    "investor_user_id": "your-investor-uuid",
    "analysis_id": "your-analysis-uuid"
  }'
```

Or using curl:

```bash
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/screen-investor-match' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "company_id": "your-company-uuid",
    "investor_user_id": "your-investor-uuid",
    "analysis_id": "your-analysis-uuid"
  }'
```

---

## Performance Monitoring

### Expected Timings

- **Step 1-3** (Database queries): < 1 second
- **Step 4** (File download/upload): 2-10 seconds
- **Step 5-6** (OpenAI processing): 20-60 seconds
- **Step 7** (Database update): < 1 second

**Total:** 25-75 seconds per screening

### If Screening Takes Too Long

**Check:**
1. Pitch deck file size (large files take longer)
2. OpenAI API response time (check status.openai.com)
3. Network latency

**Optimize:**
- Compress pitch deck PDFs before upload
- Consider background processing for production
- Implement timeout handling

---

## Troubleshooting Workflow

```
1. Check edge function logs
   ↓
2. Find the last successful step (✓)
   ↓
3. Find the first error (❌)
   ↓
4. Use the "Common Issues" section above
   ↓
5. Apply the solution
   ↓
6. Redeploy if code changes needed:
   supabase functions deploy screen-investor-match
   ↓
7. Test again
```

---

## Contact Points for Issues

### Database Issues
- Check Supabase Dashboard → Database → Tables
- Review RLS policies
- Check table constraints

### Storage Issues
- Check Supabase Dashboard → Storage → Buckets
- Verify file exists
- Check storage policies

### OpenAI Issues
- Check OpenAI API key validity
- Review OpenAI usage dashboard
- Check rate limits

### Edge Function Issues
- Check deployment status
- Verify environment variables
- Review function logs

---

**Last Updated:** October 10, 2025  
**Status:** Debug logging active and comprehensive

