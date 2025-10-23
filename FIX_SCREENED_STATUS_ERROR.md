# Fix "Screened" Status Error

## The Error

```
Error updating analysis: {
  code: "23514",
  message: 'new row for relation "analysis" violates check constraint "analysis_status_check"'
}
```

## What It Means

The database constraint on the `analysis` table doesn't allow "Screened" as a valid status value. It currently only allows:
- `submitted`
- `in_progress`
- `completed`
- `rejected`

We need to add `Screened` to this list.

## Quick Fix (Recommended)

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL

Copy and paste this into the SQL Editor and click **Run**:

```sql
-- Drop the existing constraint
ALTER TABLE analysis DROP CONSTRAINT IF EXISTS analysis_status_check;

-- Add the updated constraint with 'Screened' status
ALTER TABLE analysis
  ADD CONSTRAINT analysis_status_check 
  CHECK (status IN ('submitted', 'Screened', 'in_progress', 'completed', 'rejected'));
```

### Step 3: Verify

Run this query to verify it worked:

```sql
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'analysis'::regclass
AND con.conname = 'analysis_status_check';
```

You should see output like:
```
analysis_status_check | CHECK ((status = ANY (ARRAY['submitted'::text, 'Screened'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text])))
```

### Step 4: Test Again

Now try the screening workflow again - it should work!

---

## Alternative: Use SQL File

I've created a file `ADD_SCREENED_STATUS.sql` with the SQL commands. You can:

1. Open it in your editor
2. Copy the SQL
3. Paste into Supabase SQL Editor
4. Run

---

## What This Does

**Before:**
```sql
CHECK (status IN ('submitted', 'in_progress', 'completed', 'rejected'))
```

**After:**
```sql
CHECK (status IN ('submitted', 'Screened', 'in_progress', 'completed', 'rejected'))
                              ↑ Added this!
```

Now the database will accept `status = 'Screened'` when the screening function updates the analysis table.

---

## Why This Happened

The migration file `20251010120000_add_screened_status_to_analysis.sql` was created but not deployed to the database due to migration history sync issues. Running the SQL directly bypasses this issue.

---

## After Running the SQL

The screening workflow will work properly:

1. Founder submits to investor
2. Screening function runs
3. Updates analysis table with `status = 'Screened'` ✓
4. Sets recommendation to 'Analyze' or 'Reject' ✓
5. Saves AI reasoning in recommendation_reason ✓

---

**Status:** Ready to fix - just run the SQL in Supabase Dashboard!

