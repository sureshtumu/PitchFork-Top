# Automated Investor Screening - Quick Start

## What It Does

When a founder submits their company to investors, the system automatically:
1. Fetches each investor's investment criteria
2. Compares the company against the criteria using AI
3. Returns "Accept" (proceed to analysis) or "Reject" (doesn't match)
4. Updates the analysis table with the decision and reasoning

## How It Works

```
Founder selects investors → AI screens each one → Updates analysis table
```

**For "Accept":**
- Status: `Screened`
- Recommendation: `Analyze`
- Reason: AI explanation of why it matches

**For "Reject":**
- Status: `Screened`
- Recommendation: `Reject`
- Reason: AI explanation of why it doesn't match

## Files Changed

1. **`supabase/functions/screen-investor-match/index.ts`** (NEW)
   - Edge function that performs the screening
   - Calls OpenAI GPT-4 Turbo
   - Updates analysis table

2. **`src/components/InvestorSelection.tsx`** (MODIFIED)
   - Calls screening function after creating analysis entries
   - Shows "Running AI screening..." message
   - Waits for all screenings to complete

3. **`supabase/migrations/20251010120000_add_screened_status_to_analysis.sql`** (NEW)
   - Adds "Screened" to allowed status values

## Deployment

```bash
# 1. Deploy edge function
supabase functions deploy screen-investor-match

# 2. Run migration
supabase db push

# 3. Deploy frontend
git add .
git commit -m "Add automated investor screening"
git push
```

## Testing

1. Login as investor, add investment criteria in "Investor Preferences"
2. Login as founder, submit company to that investor
3. Check console logs - should see "Running AI screening..."
4. Check database:
   ```sql
   SELECT status, recommendation, recommendation_reason 
   FROM analysis 
   WHERE company_id = 'your-company-id';
   ```
5. Should see `status='Screened'` with recommendation and reason

## Environment Variables

Make sure these are set in Supabase Dashboard → Edge Functions:
- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Auto-set
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set

## Cost

- ~$0.01-0.30 per screening (depends on pitch deck size)
- Runs automatically for each investor selected
- Example: 10 companies × 5 investors = 50 screenings = ~$5-15

## Troubleshooting

**Screening not running?**
- Check edge function is deployed: `supabase functions list`
- Check browser console for errors (F12)
- Check edge function logs: `supabase functions logs screen-investor-match`

**All rejections?**
- Make sure investor has criteria filled in `investor_details` table
- Check criteria is specific enough for AI to evaluate

**Taking too long?**
- Normal: 10-60 seconds per investor (processing pitch deck)
- Consider background processing for production

## What Investors See

**Dashboard with Screened filter enabled:**
- Companies with recommendation="Analyze" → Ready to analyze
- Companies with recommendation="Reject" → Can see AI's reason, can override

**Example:**
```
✅ TechCo (Screened - Analyze)
   "Matches B2B SaaS criteria with $1.2M ARR..."
   [Analyze Button]

❌ GameFi (Screened - Reject)
   "Gaming/blockchain doesn't match healthcare focus..."
   [View Details]
```

---

**Status:** Ready to deploy!  
**See:** `INVESTOR_SCREENING_WORKFLOW.md` for full documentation

