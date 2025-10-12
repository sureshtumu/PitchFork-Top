# Automated Investor Screening Workflow - Implementation

## 🎯 Overview

Implemented automated AI-powered screening that evaluates each company against each investor's specific investment criteria **immediately after** the founder selects investors. This saves investors time by automatically filtering out companies that don't match their criteria.

---

## 🔄 Complete Workflow

### Founder Journey

```
1. Founder uploads pitch deck
   ↓
2. Choose: "Update with AI" or "Manually Update Company"
   ↓
3. Edit company information
   ↓
4. Click "Submit" → Move to Investor Selection
   ↓
5. Select multiple investors (checkboxes)
   ↓
6. Click "Submit to Investors"
   ↓
7. System creates analysis entries (status: 'submitted')
   ↓
8. 🤖 AI SCREENING RUNS AUTOMATICALLY FOR EACH INVESTOR
   ↓
9. For each investor:
   - Fetch investor's investment criteria
   - Fetch company pitch deck
   - Send to OpenAI for screening
   - Get recommendation: Accept or Reject
   ↓
10. Update analysis table:
    - If Reject: status='Screened', recommendation='Reject', reason=AI explanation
    - If Accept: status='Screened', recommendation='Analyze', reason=AI explanation
   ↓
11. Founder redirected to dashboard
```

### Investor View

```
Investor logs into dashboard
   ↓
Sees only companies with status='Screened' (if filter enabled)
   ↓
Companies with recommendation='Reject':
   - Status badge: "Screened"
   - Can see AI's rejection reason
   - Can override if desired
   ↓
Companies with recommendation='Analyze':
   - Status badge: "Screened"
   - Ready for detailed analysis
   - Can click "Analyze" to run full AI analysis
```

---

## 📁 Files Created/Modified

### 1. New Edge Function: `screen-investor-match`

**File:** `supabase/functions/screen-investor-match/index.ts`

**Purpose:** Performs AI-powered screening of a company against an investor's criteria

**Inputs:**
```typescript
{
  company_id: string,
  investor_user_id: string,
  analysis_id: string
}
```

**Process:**
1. Fetch investor's `investment_criteria_doc` from `investor_details` table
2. Fetch company information from `companies` table
3. Download pitch deck from `company-documents` storage
4. Upload pitch deck to OpenAI
5. Create screening prompt combining criteria + company info
6. Call OpenAI (GPT-4 Turbo with file_search if pitch deck available)
7. Parse JSON response: `{ "recommendation": "Accept/Reject", "reason": "..." }`
8. Update `analysis` table with results
9. Cleanup OpenAI resources

**Outputs:**
```typescript
{
  success: true,
  screening_result: {
    recommendation: "Accept" | "Reject",
    reason: "AI explanation..."
  },
  analysis_id: "uuid"
}
```

**Key Features:**
- ✅ Uses GPT-4 Turbo for accurate screening
- ✅ Includes pitch deck analysis if available
- ✅ Falls back to company text data if no pitch deck
- ✅ Returns structured JSON for database updates
- ✅ Handles errors gracefully

---

### 2. Updated Component: `InvestorSelection.tsx`

**Changes to `handleSubmit` function:**

**Before:**
```typescript
// Create analysis entries
await supabase.from('analysis').insert(analysisEntries);
// Done!
onComplete();
```

**After:**
```typescript
// Step 1: Create analysis entries
const { data: insertedAnalysis } = await supabase
  .from('analysis')
  .insert(analysisEntries)
  .select();

// Step 2: Run AI screening for each investor
const screeningPromises = insertedAnalysis.map(async (analysis) => {
  await supabase.functions.invoke('screen-investor-match', {
    body: {
      company_id: companyId,
      investor_user_id: analysis.investor_user_id,
      analysis_id: analysis.id
    }
  });
});

// Wait for all screening to complete
await Promise.allSettled(screeningPromises);

// Done!
onComplete();
```

**UI Updates:**
- Shows "Running AI screening..." message
- Shows "AI screening complete!" when done
- Handles errors gracefully (continues even if one screening fails)

---

### 3. New Migration: `20251010120000_add_screened_status_to_analysis.sql`

**Purpose:** Update the `analysis` table status constraint to allow "Screened" status

**Changes:**
```sql
-- Old constraint
CHECK (status IN ('submitted', 'in_progress', 'completed', 'rejected'))

-- New constraint
CHECK (status IN ('submitted', 'Screened', 'in_progress', 'completed', 'rejected'))
```

**Status Values:**
- `submitted`: Initial submission (before screening)
- `Screened`: AI screening completed ← **NEW!**
- `in_progress`: Manual analysis in progress
- `completed`: Analysis completed
- `rejected`: Rejected by investor

---

## 🤖 AI Screening Prompt

The screening prompt sent to OpenAI:

```
You are an investment screening assistant. Your job is to evaluate if a company matches an investor's investment criteria.

INVESTOR'S INVESTMENT CRITERIA:
[investor's investment_criteria_doc text]

COMPANY INFORMATION:
Company Name: [name]
Industry: [industry]
Description: [description]
Funding Stage: [funding_stage]
Revenue: [revenue]
Valuation: [valuation]
Location: [address, country]
Website: [url]
Contact: [contact_name, email]

[If pitch deck available: "A pitch deck has been attached for additional context."]

TASK:
Based on the investor's criteria and the company information provided, determine if this company should be:
- "Accept": The company matches the investor's criteria and should proceed to detailed analysis
- "Reject": The company does not match the investor's criteria and should be screened out

Provide your response in the following JSON format:
{
  "recommendation": "Accept" or "Reject",
  "reason": "A brief 2-3 sentence explanation of why you made this recommendation, specifically referencing the investor's criteria"
}

Be strict but fair. Only recommend "Accept" if there's a clear match with the investor's stated criteria.
```

---

## 📊 Database Schema Updates

### analysis table (updated)

```sql
CREATE TABLE analysis (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  investor_user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'submitted',
  recommendation text,
  recommendation_reason text,  -- ← Stores AI screening reason
  overall_score numeric,
  comments text,
  history text,
  analyzed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Updated constraint
  CONSTRAINT analysis_status_check 
    CHECK (status IN ('submitted', 'Screened', 'in_progress', 'completed', 'rejected'))
);
```

---

## 🎨 Example Screening Scenarios

### Scenario 1: Perfect Match (Accept)

**Investor Criteria:**
```
I invest in early-stage B2B SaaS companies in the healthcare space.
Looking for $500K-$2M ARR, strong founding team, and clear path to $10M ARR.
```

**Company:**
```
Name: HealthTech AI
Industry: Healthcare SaaS
Description: AI-powered patient scheduling platform for hospitals
Revenue: $1.2M ARR
Funding: Series A
```

**AI Response:**
```json
{
  "recommendation": "Accept",
  "reason": "HealthTech AI is a B2B SaaS company in the healthcare space with $1.2M ARR, which falls within your target range of $500K-$2M. The AI-powered platform addresses a clear pain point in hospital operations, and their current traction suggests a viable path to $10M ARR."
}
```

**Database Update:**
```sql
UPDATE analysis SET
  status = 'Screened',
  recommendation = 'Analyze',
  recommendation_reason = 'HealthTech AI is a B2B SaaS company...'
WHERE id = 'analysis-uuid';
```

---

### Scenario 2: Mismatch (Reject)

**Investor Criteria:**
```
I invest in early-stage B2B SaaS companies in the healthcare space.
Looking for $500K-$2M ARR, strong founding team, and clear path to $10M ARR.
```

**Company:**
```
Name: GameFi Platform
Industry: Gaming / Blockchain
Description: Play-to-earn gaming platform with NFT marketplace
Revenue: $50K ARR
Funding: Pre-seed
```

**AI Response:**
```json
{
  "recommendation": "Reject",
  "reason": "GameFi Platform operates in the gaming/blockchain space, which does not align with your focus on healthcare B2B SaaS. Additionally, their $50K ARR is significantly below your minimum threshold of $500K, and the business model (play-to-earn gaming) differs substantially from traditional SaaS."
}
```

**Database Update:**
```sql
UPDATE analysis SET
  status = 'Screened',
  recommendation = 'Reject',
  recommendation_reason = 'GameFi Platform operates in the gaming/blockchain space...'
WHERE id = 'analysis-uuid';
```

---

## 🔍 How It Works: Step-by-Step

### Step 1: Founder Submits to 3 Investors

```typescript
// InvestorSelection.tsx - handleSubmit()
const analysisEntries = [
  { company_id: 'company-1', investor_user_id: 'investor-A', status: 'submitted' },
  { company_id: 'company-1', investor_user_id: 'investor-B', status: 'submitted' },
  { company_id: 'company-1', investor_user_id: 'investor-C', status: 'submitted' }
];

const { data: insertedAnalysis } = await supabase
  .from('analysis')
  .insert(analysisEntries)
  .select();
```

**Database State:**
```
analysis table:
┌──────────────┬────────────┬─────────────────┬───────────┬────────────────┐
│ id           │ company_id │ investor_user_id│ status    │ recommendation │
├──────────────┼────────────┼─────────────────┼───────────┼────────────────┤
│ analysis-1   │ company-1  │ investor-A      │ submitted │ NULL           │
│ analysis-2   │ company-1  │ investor-B      │ submitted │ NULL           │
│ analysis-3   │ company-1  │ investor-C      │ submitted │ NULL           │
└──────────────┴────────────┴─────────────────┴───────────┴────────────────┘
```

---

### Step 2: AI Screening Runs for Each Investor

```typescript
// For each analysis entry, call screening function
const screeningPromises = insertedAnalysis.map(async (analysis) => {
  await supabase.functions.invoke('screen-investor-match', {
    body: {
      company_id: 'company-1',
      investor_user_id: analysis.investor_user_id,
      analysis_id: analysis.id
    }
  });
});

await Promise.allSettled(screeningPromises);
```

**What Happens:**
```
Investor A:
  1. Fetch Investor A's criteria: "Looking for B2B SaaS..."
  2. Fetch company-1 data + pitch deck
  3. Send to OpenAI: "Does this match?"
  4. OpenAI: { "recommendation": "Accept", "reason": "..." }
  5. Update analysis-1: status='Screened', recommendation='Analyze'

Investor B:
  1. Fetch Investor B's criteria: "Looking for consumer apps..."
  2. Fetch company-1 data + pitch deck
  3. Send to OpenAI: "Does this match?"
  4. OpenAI: { "recommendation": "Reject", "reason": "..." }
  5. Update analysis-2: status='Screened', recommendation='Reject'

Investor C:
  1. Fetch Investor C's criteria: "Looking for fintech..."
  2. Fetch company-1 data + pitch deck
  3. Send to OpenAI: "Does this match?"
  4. OpenAI: { "recommendation": "Accept", "reason": "..." }
  5. Update analysis-3: status='Screened', recommendation='Analyze'
```

---

### Step 3: Database After Screening

```
analysis table:
┌──────────────┬────────────┬─────────────────┬──────────┬────────────────┬────────────────────────────────────┐
│ id           │ company_id │ investor_user_id│ status   │ recommendation │ recommendation_reason              │
├──────────────┼────────────┼─────────────────┼──────────┼────────────────┼────────────────────────────────────┤
│ analysis-1   │ company-1  │ investor-A      │ Screened │ Analyze        │ "Company matches B2B SaaS..."      │
│ analysis-2   │ company-1  │ investor-B      │ Screened │ Reject         │ "Not a consumer app, doesn't..."   │
│ analysis-3   │ company-1  │ investor-C      │ Screened │ Analyze        │ "Strong fintech opportunity..."    │
└──────────────┴────────────┴─────────────────┴──────────┴────────────────┴────────────────────────────────────┘
```

---

### Step 4: Investor Dashboards

**Investor A Dashboard:**
```
✅ Company-1 (Status: Screened, Recommendation: Analyze)
   "Company matches B2B SaaS criteria with strong metrics..."
   [Analyze Button] → Run full AI analysis
```

**Investor B Dashboard:**
```
❌ Company-1 (Status: Screened, Recommendation: Reject)
   "Not a consumer app, doesn't match investment thesis..."
   [Can still view details if interested]
```

**Investor C Dashboard:**
```
✅ Company-1 (Status: Screened, Recommendation: Analyze)
   "Strong fintech opportunity with clear market fit..."
   [Analyze Button] → Run full AI analysis
```

---

## 🎯 Benefits

### For Investors

1. **Time Savings**
   - Automatic filtering of non-matching companies
   - Only see companies that pass initial screening
   - Focus on high-potential opportunities

2. **Consistency**
   - AI applies criteria uniformly
   - No human bias or fatigue
   - Documented reasoning for each decision

3. **Transparency**
   - See why each company was accepted/rejected
   - Can override AI decisions if needed
   - Full audit trail

### For Founders

1. **Faster Response**
   - Immediate screening results
   - Know which investors are interested
   - No waiting for manual review

2. **Better Targeting**
   - See which investors match their profile
   - Understand rejection reasons
   - Can improve pitch for future submissions

### For Platform

1. **Scalability**
   - Handles unlimited submissions
   - Parallel processing
   - No manual bottlenecks

2. **Quality**
   - GPT-4 Turbo for accurate screening
   - Considers full pitch deck content
   - Structured decision-making

---

## 🔧 Configuration

### Environment Variables Required

```bash
# Supabase Edge Function
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-api-key
```

### OpenAI Models Used

- **With Pitch Deck**: GPT-4 Turbo Preview with Assistants API + file_search
- **Without Pitch Deck**: GPT-4 Turbo Preview with Chat Completions API + JSON mode

### Cost Estimation

Per screening (approximate):
- With pitch deck: ~$0.10-0.30 (depends on PDF size)
- Without pitch deck: ~$0.01-0.05

For 100 companies × 10 investors = 1,000 screenings:
- Estimated cost: $100-300

---

## 🧪 Testing

### Manual Test Steps

1. **Setup:**
   - Create investor account with specific criteria
   - Create founder account
   - Upload pitch deck

2. **Test Accept Path:**
   - Create company that matches investor criteria
   - Select the investor
   - Submit
   - Check analysis table: status='Screened', recommendation='Analyze'
   - Login as investor: see company with "Analyze" recommendation

3. **Test Reject Path:**
   - Create company that doesn't match investor criteria
   - Select the investor
   - Submit
   - Check analysis table: status='Screened', recommendation='Reject'
   - Login as investor: see company with "Reject" recommendation

4. **Test Multiple Investors:**
   - Create company
   - Select 3 investors with different criteria
   - Submit
   - Check that each gets individual screening
   - Verify different recommendations based on criteria

### SQL Test Queries

```sql
-- Check screening results
SELECT 
  c.name as company_name,
  id.name as investor_name,
  a.status,
  a.recommendation,
  a.recommendation_reason,
  a.created_at,
  a.updated_at
FROM analysis a
JOIN companies c ON c.id = a.company_id
JOIN investor_details id ON id.user_id = a.investor_user_id
WHERE a.status = 'Screened'
ORDER BY a.updated_at DESC;
```

---

## 📋 Deployment Checklist

- [x] Create `screen-investor-match` edge function
- [x] Update `InvestorSelection.tsx` to call screening
- [x] Create migration to add 'Screened' status
- [ ] Deploy edge function to Supabase
- [ ] Run migration on production database
- [ ] Deploy frontend changes
- [ ] Test with real investor criteria
- [ ] Monitor OpenAI API costs
- [ ] Set up error alerting

---

## 🚀 Deployment Commands

```bash
# 1. Deploy edge function
supabase functions deploy screen-investor-match

# 2. Run migration
supabase db push

# 3. Deploy frontend
git add .
git commit -m "Add automated investor screening workflow"
git push origin analyze-pdf

# 4. Test
# - Login as founder
# - Submit to investors
# - Check console logs
# - Verify analysis table updates
```

---

## 🐛 Troubleshooting

### Issue: Screening doesn't run

**Check:**
1. Edge function deployed: `supabase functions list`
2. Environment variables set in Supabase dashboard
3. Console logs in browser (F12)
4. Edge function logs: `supabase functions logs screen-investor-match`

### Issue: All screenings return "Reject"

**Check:**
1. Investor criteria is filled in `investor_details` table
2. Criteria is specific enough for AI to evaluate
3. Company information is complete
4. OpenAI API key is valid

### Issue: Screening takes too long

**Cause:** Processing pitch deck PDFs can take 30-60 seconds per investor

**Solutions:**
1. Show progress indicator to founder
2. Process screenings in background (don't wait)
3. Send email notification when complete

---

## 🔮 Future Enhancements

1. **Background Processing**
   - Don't block founder on screening completion
   - Send email when screening is done
   - Show "Screening in progress..." status

2. **Batch Processing**
   - Process multiple screenings in parallel batches
   - Optimize OpenAI API calls
   - Reduce latency

3. **Screening Analytics**
   - Track accept/reject rates per investor
   - Identify overly strict/lenient criteria
   - Suggest criteria refinements

4. **Custom Screening Models**
   - Allow investors to fine-tune screening
   - Add custom questions
   - Adjust strictness level

5. **Feedback Loop**
   - Let investors rate screening accuracy
   - Use feedback to improve prompts
   - Train custom models

---

**Implementation Date:** October 10, 2025  
**Status:** ✅ Complete and Ready for Deployment  
**Next Step:** Deploy edge function and run migration

