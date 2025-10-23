# Quick Deployment Guide - Team Analysis Feature

## Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- OpenAI API key with GPT-4 access
- Supabase project set up

## Step-by-Step Deployment

### Step 1: Database Migration
Run this command to add the Team-Analysis prompt to your database:

```bash
npx supabase db push
```

**Alternative (Manual):**
1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/migrations/20251009110004_add_team_analysis_prompt.sql`
3. Click "Run"

### Step 2: Deploy Edge Function
```bash
# Login to Supabase (if not already)
npx supabase login

# Link your project (replace YOUR_PROJECT_REF with your actual project reference)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the analyze-team function
npx supabase functions deploy analyze-team
```

### Step 3: Set OpenAI API Key
```bash
# Set your OpenAI API key as a secret
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Verify it's set
npx supabase secrets list
```

### Step 4: Test the Feature
```bash
# Start your development server
npm run dev

# Navigate to: http://localhost:5173/test-files
# Click "Analyze Team" on any PDF file
# Wait 30-60 seconds for the analysis
# View the results in the modal
```

## Verification Checklist

- [ ] Database migration completed successfully
- [ ] Edge function deployed without errors
- [ ] OPENAI_API_KEY secret is set
- [ ] Can see "Analyze Team" button on Test Files screen
- [ ] Button triggers analysis when clicked
- [ ] Results display in modal after analysis completes

## Common Commands

```bash
# View function logs (for debugging)
npx supabase functions logs analyze-team

# Check function status
npx supabase functions list

# Re-deploy function after changes
npx supabase functions deploy analyze-team

# View all secrets (values are hidden)
npx supabase secrets list

# Update a secret
npx supabase secrets set OPENAI_API_KEY=new-key-here
```

## Troubleshooting

### Function deployment fails
```bash
# Make sure you're logged in
npx supabase login

# Make sure project is linked
npx supabase link --project-ref YOUR_PROJECT_REF

# Try deploying again
npx supabase functions deploy analyze-team
```

### "Team-Analysis prompt not found" error
```bash
# Run the migration
npx supabase db push

# Or manually insert via SQL Editor:
INSERT INTO prompts (prompt_name, prompt_detail, preferred_llm) 
VALUES ('Team-Analysis', 'Your prompt text here...', 'GPT-4')
ON CONFLICT (prompt_name) DO UPDATE 
SET prompt_detail = EXCLUDED.prompt_detail;
```

### OpenAI API errors
```bash
# Verify your key is set
npx supabase secrets list

# Update if needed
npx supabase secrets set OPENAI_API_KEY=sk-your-key

# Check OpenAI API status: https://status.openai.com
```

## Production Deployment

When deploying to production:

1. **Build your frontend:**
   ```bash
   npm run build
   ```

2. **Deploy frontend** (to your hosting provider)

3. **Ensure environment variables are set in production:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Edge function is already deployed** to Supabase (same for dev and prod)

5. **Test in production** before announcing to users

## Support Resources

- Supabase Docs: https://supabase.com/docs
- OpenAI API Docs: https://platform.openai.com/docs
- Project Documentation: See `TEAM_ANALYSIS_IMPLEMENTATION.md`

## Quick Test

After deployment, test with this flow:
1. Login as an investor
2. Go to Test Files page
3. Click "Analyze Team" on a pitch deck PDF
4. Wait for "Team analysis completed" message
5. Review the analysis in the modal
6. Check that it includes team assessment, scores, and recommendations

**Expected Result:** A comprehensive team analysis report displayed in a modal within 30-60 seconds.
