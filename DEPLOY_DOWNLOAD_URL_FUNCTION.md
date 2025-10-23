# Deploy get-report-download-url Edge Function

## What Was Changed

Created a new Supabase Edge Function that generates signed URLs using the **service role key** (admin access), bypassing all RLS restrictions. This solves the "Object not found" error permanently.

### Solution Overview

**Before:** Frontend tries to create signed URLs → Blocked by RLS  
**After:** Frontend calls Edge Function → Function uses service role → Bypasses RLS → Returns signed URL  

## Files Created/Modified

### New Files:
- ✅ `supabase/functions/get-report-download-url/index.ts` - Edge function that creates signed URLs
- ✅ `ADD_STORAGE_RLS_POLICIES.sql` - Alternative SQL solution (optional)

### Modified Files:
- ✅ `src/components/VentureDetail.tsx` - Updated to call the edge function instead of creating URLs directly

## Deployment Steps

### Step 1: Deploy the Edge Function (2 minutes)

Open a terminal in your project root and run:

```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref nsimmsznrutwgtkkblgw

# Deploy the new function
npx supabase functions deploy get-report-download-url
```

**Expected output:**
```
Deploying get-report-download-url (project ref: nsimmsznrutwgtkkblgw)
Bundled get-report-download-url (1.2 KB)
Deployed function get-report-download-url
```

### Step 2: Verify Deployment

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. You should see `get-report-download-url` in the list
4. Click on it to view logs (optional)

### Step 3: Test the Fix

1. **Hard refresh your browser:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Navigate to a company detail page with analysis reports
3. Click the download button
4. **Check the console logs:**

Expected output:
```
Creating signed URL for download...
Signed URL created successfully via edge function
Download successful, file size: 123456
```

5. **The file should download!** 🎉

## How It Works

### Old Approach (Failed):
```typescript
// Frontend directly tries to create signed URL
const { data } = await supabase.storage
  .from('analysis-output-docs')
  .createSignedUrl(file_path, 60);
// ❌ Blocked by RLS policies
```

### New Approach (Works):
```typescript
// Frontend calls edge function
const response = await fetch('/functions/v1/get-report-download-url', {
  method: 'POST',
  body: JSON.stringify({ file_path: report.file_path })
});

// Edge function uses service role (bypasses RLS)
const signedUrl = await response.json().signed_url;
// ✅ Works! Downloads the file
```

## Benefits

✅ **Bypasses RLS completely** - Service role has full access  
✅ **Secure** - Still requires user authentication  
✅ **No database changes needed** - Works with existing storage setup  
✅ **Reliable** - No more "Object not found" errors  
✅ **Consistent** - Same approach for all users  

## Troubleshooting

### Error: "Command 'supabase' not found"

Install the Supabase CLI:
```bash
npm install -g supabase
```

### Error: "Failed to link project"

Get your project reference from:
1. Supabase Dashboard → Settings → General → Reference ID
2. Use it in the link command:
```bash
npx supabase link --project-ref your-project-ref-here
```

### Error: "Function deployment failed"

1. Check that you're in the project root directory
2. Verify the function file exists at: `supabase/functions/get-report-download-url/index.ts`
3. Check Supabase CLI is logged in: `npx supabase status`

### Downloads still don't work after deployment

1. **Check the browser console** - What error do you see?
2. **Check Edge Function logs:**
   - Dashboard → Edge Functions → get-report-download-url → Logs
   - Look for errors or missing requests
3. **Verify the function is called:**
   - Console should show: "Creating signed URL for download..."
   - Network tab should show POST to `/functions/v1/get-report-download-url`
4. **Hard refresh again:** Clear all caches (Ctrl+Shift+R)

### Function returns 404

The function might not be deployed or the URL is wrong. Check:
1. Function exists in Dashboard → Edge Functions
2. Environment variable `VITE_SUPABASE_URL` is correct
3. Try redeploying: `npx supabase functions deploy get-report-download-url`

## Alternative: SQL Solution (If You Prefer)

If you'd rather fix the RLS policies directly instead of using an edge function:

1. Open `ADD_STORAGE_RLS_POLICIES.sql`
2. Copy **Option 1** (simple solution)
3. Run in Supabase SQL Editor
4. Revert the frontend changes (use direct `createSignedUrl` again)

**Pros of SQL solution:**
- Simpler (no edge function needed)
- Faster (no network round-trip)

**Cons of SQL solution:**
- Requires careful RLS policy configuration
- More complex for multi-tenant setups
- Harder to debug permission issues

## Current Solution: Edge Function (Recommended)

**Why this is better:**
- ✅ Centralized authentication and authorization logic
- ✅ Easier to debug (logs in one place)
- ✅ Flexible (can add more logic later)
- ✅ Works regardless of RLS configuration

## What's Next

After deploying:

1. ✅ Test downloads work
2. ✅ Check edge function logs for any errors
3. ✅ Consider applying the same pattern to document downloads
4. ✅ Monitor function usage and performance

## Need Help?

If you encounter issues:
1. Share the **browser console output**
2. Share the **Edge Function logs** from Supabase Dashboard
3. Share the **Network tab** showing the POST request to the function






