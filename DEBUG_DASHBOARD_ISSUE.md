# Debug Dashboard Issue - David Kim Not Seeing Companies

## Issue Description
David Kim has 2 companies assigned to him in the `analysis` table, but they're not showing on his investor dashboard.

## Changes Made

### Added Debug Logging to Dashboard.tsx

I've added comprehensive console logging to help diagnose the issue:

```typescript
// Lines 93-110: Logs user info and query results
console.log('Dashboard: Loading companies for user:', currentUser.id, currentUser.email);
console.log('Dashboard: Analysis query result:', { 
  dataCount: analysisData?.length || 0, 
  error: analysisError,
  sampleData: analysisData?.[0]
});

// Lines 128-132: Logs each analysis record processing
console.log('Dashboard: Processing analysis:', {
  analysisId: analysis.id,
  companyId: analysis.company_id,
  hasCompanyData: !!analysis.companies
});

// Lines 161-164: Logs final results
console.log('Dashboard: Final companies list:', {
  count: companiesWithAnalysis.length,
  companies: companiesWithAnalysis.map(c => ({ id: c.id, name: c.name, status: c.status }))
});
```

### Fixed Investor Details Join

Changed the join syntax from:
```typescript
investor_details:investor_details!investor_user_id(name, firm_name)
```

To:
```typescript
investor_details:investor_details(name, firm_name)
```

This makes the join work correctly without the foreign key hint that might be causing issues.

---

## How to Debug

### Step 1: Login as David Kim
1. Open the application
2. Login as David Kim
3. Navigate to the Dashboard

### Step 2: Check Browser Console
Open the browser's Developer Tools (F12) and check the Console tab for these log messages:

**Expected Output (if working):**
```
Dashboard: Loading companies for user: <david-kim-uuid> david@email.com
Dashboard: Analysis query result: { 
  dataCount: 2, 
  error: null,
  sampleData: { id: '...', company_id: '...', investor_user_id: '<david-kim-uuid>', ... }
}
Dashboard: Processing analysis: { analysisId: '...', companyId: '...', hasCompanyData: true }
Dashboard: Processing analysis: { analysisId: '...', companyId: '...', hasCompanyData: true }
Dashboard: Final companies list: { count: 2, companies: [{...}, {...}] }
```

**Possible Issues to Look For:**

#### Issue 1: No Analysis Records (dataCount: 0)
```
Dashboard: Analysis query result: { dataCount: 0, error: null }
Dashboard: No analysis records found for this investor
```

**Cause:** 
- The `investor_user_id` in the analysis table doesn't match David Kim's actual user ID
- Or RLS policies are blocking the query

**Solution:** Check the database directly:
```sql
-- Get David Kim's user ID
SELECT id, email FROM auth.users WHERE email = 'david@email.com';

-- Check analysis records for David Kim
SELECT * FROM analysis WHERE investor_user_id = '<david-kim-uuid>';
```

#### Issue 2: Query Error
```
Dashboard: Analysis query result: { 
  dataCount: 0, 
  error: { message: "...", code: "..." }
}
```

**Cause:** SQL error, RLS policy issue, or missing permissions

**Solution:** Check the error message in the console

#### Issue 3: No Company Data (hasCompanyData: false)
```
Dashboard: Processing analysis: { analysisId: '...', companyId: '...', hasCompanyData: false }
Dashboard: Analysis has no company data: <analysis-id>
```

**Cause:**
- The foreign key `company_id` in analysis table doesn't match any company
- Or RLS policy on `companies` table is blocking the join
- Or the company was deleted

**Solution:** Check if companies exist:
```sql
-- Check if the companies exist
SELECT c.id, c.name, a.id as analysis_id
FROM analysis a
LEFT JOIN companies c ON c.id = a.company_id
WHERE a.investor_user_id = '<david-kim-uuid>';
```

---

## Common Root Causes

### 1. Wrong investor_user_id in Analysis Table

**Problem:** The analysis records might have the wrong `investor_user_id`

**Check:**
```sql
-- What user_id does David Kim have?
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email ILIKE '%david%' OR raw_user_meta_data->>'first_name' ILIKE '%david%';

-- What analysis records exist?
SELECT 
  a.id,
  a.company_id,
  a.investor_user_id,
  c.name as company_name,
  u.email as investor_email
FROM analysis a
LEFT JOIN companies c ON c.id = a.company_id
LEFT JOIN auth.users u ON u.id = a.investor_user_id
ORDER BY a.created_at DESC
LIMIT 20;
```

### 2. RLS Policy Blocking Access

**Problem:** Row Level Security policies might be preventing the query

**Check RLS Policies:**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('analysis', 'companies');

-- See the policies
SELECT * FROM pg_policies 
WHERE tablename = 'analysis';
```

**Test Without RLS (as superuser):**
```sql
-- Disable RLS temporarily for testing
ALTER TABLE analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Try the query
SELECT * FROM analysis WHERE investor_user_id = '<david-kim-uuid>';

-- Re-enable RLS
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

### 3. Missing investor_details Record

**Problem:** The join to `investor_details` table might fail if no record exists

**Check:**
```sql
-- Check if investor_details exists for David Kim
SELECT * FROM investor_details WHERE user_id = '<david-kim-uuid>';

-- If missing, the query should still work (it's a LEFT JOIN)
-- But let's verify
```

**Note:** The updated code makes this a LEFT JOIN, so it should handle missing records gracefully.

### 4. User Profile Type Issue

**Problem:** David Kim might not be marked as an investor in `user_profiles`

**Check:**
```sql
-- Check user profile
SELECT * FROM user_profiles WHERE user_id = '<david-kim-uuid>';

-- Should show user_type = 'investor'
```

**Fix if needed:**
```sql
UPDATE user_profiles 
SET user_type = 'investor' 
WHERE user_id = '<david-kim-uuid>';
```

---

## Quick Database Checks

Run these queries in Supabase SQL Editor:

### 1. Find David Kim's User ID
```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email ILIKE '%david%kim%' 
   OR raw_user_meta_data->>'first_name' ILIKE '%david%';
```

### 2. Check Analysis Records for David Kim
```sql
-- Replace <david-kim-uuid> with actual ID from step 1
SELECT 
  a.id as analysis_id,
  a.company_id,
  a.investor_user_id,
  a.status,
  c.name as company_name,
  c.id as company_exists
FROM analysis a
LEFT JOIN companies c ON c.id = a.company_id
WHERE a.investor_user_id = '<david-kim-uuid>';
```

### 3. Check if Companies Exist
```sql
-- Get company IDs from step 2, then:
SELECT * FROM companies WHERE id IN ('<company-id-1>', '<company-id-2>');
```

### 4. Test the Exact Query
```sql
-- This simulates what Supabase does
SELECT 
  a.*,
  c.*,
  id.name as investor_name,
  id.firm_name
FROM analysis a
INNER JOIN companies c ON c.id = a.company_id
LEFT JOIN investor_details id ON id.user_id = a.investor_user_id
WHERE a.investor_user_id = '<david-kim-uuid>';
```

---

## Expected Behavior

**When Working Correctly:**

1. David Kim logs in
2. Dashboard loads
3. Console shows:
   - "Loading companies for user: <uuid>"
   - "Analysis query result: { dataCount: 2, ... }"
   - "Processing analysis" (2 times)
   - "Final companies list: { count: 2, ... }"
4. Dashboard displays 2 company cards

**Current Behavior:**

1. David Kim logs in
2. Dashboard loads
3. Console shows: (unknown - need to check)
4. Dashboard shows "No companies match the selected filters" OR empty state

---

## Next Steps

1. ✅ Deploy the updated Dashboard.tsx with debug logging
2. ⏳ Login as David Kim
3. ⏳ Open browser console (F12)
4. ⏳ Check console logs for error messages
5. ⏳ Run SQL queries to verify data
6. ⏳ Report findings

**Please share:**
- The console log output when David Kim loads the dashboard
- Results from the SQL queries above
- David Kim's actual user ID (UUID)

This will help pinpoint the exact issue!

---

## Possible Fixes (Based on Root Cause)

### If investor_user_id is wrong:
```sql
-- Update analysis records to correct user_id
UPDATE analysis 
SET investor_user_id = '<correct-david-kim-uuid>'
WHERE investor_user_id = '<wrong-uuid>';
```

### If RLS policy is too restrictive:
```sql
-- Update the policy to explicitly allow investors to see their assigned companies
DROP POLICY IF EXISTS "Investors can view all analysis" ON analysis;

CREATE POLICY "Investors can view their assigned analysis"
  ON analysis FOR SELECT
  TO authenticated
  USING (investor_user_id = auth.uid());
```

### If companies are missing:
- The companies need to be created in the database
- Or the company_id in analysis table needs to be corrected

### If user_profile is wrong:
```sql
-- Ensure David Kim is marked as investor
UPDATE user_profiles 
SET user_type = 'investor' 
WHERE user_id = '<david-kim-uuid>';
```

---

**Status:** Awaiting console logs and SQL query results to diagnose further.
