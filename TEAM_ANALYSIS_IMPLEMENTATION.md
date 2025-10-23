# Team Analysis Feature Implementation

## Overview
This document describes the implementation of the Team Analysis feature that allows investors to analyze team composition and leadership structure from uploaded PDF documents using OpenAI GPT-4 Turbo.

## What Was Implemented

### 1. Database Migration
**File**: `supabase/migrations/20251009110004_add_team_analysis_prompt.sql`

- Added "Team-Analysis" prompt to the `prompts` table
- The prompt focuses on:
  - Key team members and their roles
  - Relevant experience and expertise
  - Team completeness and gaps
  - Leadership structure
  - Advisory board/mentors
  - Team strengths and concerns
  - Overall team assessment score (1-10)
  - Recommendations for improvement

### 2. Supabase Edge Function
**File**: `supabase/functions/analyze-team/index.ts`

A new serverless function that:
- Fetches the "Team-Analysis" prompt from the database
- Downloads the PDF from Supabase Storage
- Uploads it to OpenAI and creates a vector store
- Creates an AI assistant using GPT-4 Turbo (gpt-4-turbo-preview)
- Runs the analysis using the custom prompt
- Stores the results in the `extracted_data` table
- Returns the analysis to the frontend
- Cleans up OpenAI resources after completion

### 3. Frontend Updates
**File**: `src/components/TestFiles.tsx`

Updated the TestFiles component with:

#### Interface Changes:
- Extended `ExtractedData` interface to support team analysis fields:
  - `analysis_type`: Type of analysis performed
  - `analysis_result`: The full analysis text
  - `prompt_used`: The prompt that was used
  - `model_used`: The AI model that generated the analysis

#### UI Changes:
- Added "Analyze Team" button (green) next to the "Test" button in each file row
- Both buttons disable each other during analysis to prevent conflicts
- Shows loading state: "Analyzing..." during processing

#### Function Updates:
- `handleAnalyzeTeam()`: 
  - Calls the new `/functions/v1/analyze-team` endpoint
  - Displays results immediately in a modal
  - Shows success/error messages

#### Modal Enhancements:
- Larger modal (max-w-4xl) for better readability
- Dynamic title: "👥 Team Analysis Results" for team analysis
- Prominent display of analysis report with proper formatting
- Shows AI model used (GPT-4 Turbo)
- Collapsible "View Prompt Used" section
- Maintains support for original extracted data display

## How It Works

### User Flow:
1. User navigates to Test Files screen
2. User clicks "Analyze Team" button on any file row
3. System shows "Analyzing team for: [filename]... This may take a minute."
4. Backend:
   - Fetches Team-Analysis prompt from database
   - Downloads PDF from storage
   - Sends to OpenAI GPT-4 Turbo with the prompt
   - Waits for analysis completion (typically 30-60 seconds)
   - Stores result in database
5. Frontend displays comprehensive team analysis in a modal
6. User can view the full report, model used, and prompt

### Technical Flow:
```
TestFiles.tsx (Frontend)
    ↓
    → handleAnalyzeTeam()
    ↓
    → POST /functions/v1/analyze-team
    ↓
Supabase Edge Function
    ↓
    → Fetch prompt from 'prompts' table
    ↓
    → Download PDF from Supabase Storage
    ↓
    → Upload to OpenAI
    ↓
    → Create Assistant + Vector Store
    ↓
    → Run analysis with custom prompt
    ↓
    → Store in 'extracted_data' table
    ↓
    → Return to frontend
    ↓
Display in Modal
```

## Deployment Instructions

### 1. Run Database Migration
```bash
# Option A: Using Supabase CLI (recommended)
npx supabase db push

# Option B: Manual via Supabase Dashboard
# Go to SQL Editor and run the contents of:
# supabase/migrations/20251009110004_add_team_analysis_prompt.sql
```

### 2. Deploy Edge Function
```bash
# Make sure you're logged in to Supabase
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the analyze-team function
npx supabase functions deploy analyze-team

# Verify OPENAI_API_KEY is set (required)
npx supabase secrets list

# If not set, add it:
npx supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Verify Environment Variables
Ensure these environment variables are set in your Supabase project:
- `OPENAI_API_KEY`: Your OpenAI API key
- `SUPABASE_URL`: Auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Auto-set by Supabase

### 4. Test the Feature
1. Start your development server: `npm run dev`
2. Navigate to Test Files screen
3. Click "Analyze Team" on any PDF file
4. Wait for analysis (30-60 seconds)
5. View results in the modal

## Database Schema

### prompts table
The feature uses the existing `prompts` table:
```sql
- id (uuid)
- prompt_name (text) - "Team-Analysis"
- prompt_detail (text) - Full prompt text
- preferred_llm (text) - "GPT-4"
- created_at (timestamptz)
- updated_at (timestamptz)
```

### extracted_data table
Stores analysis results:
```sql
- id (uuid)
- file_path (text)
- extracted_info (jsonb) - Contains:
  - analysis_type: "team"
  - analysis_result: Full analysis text
  - prompt_used: The prompt text
  - model_used: "gpt-4-turbo-preview"
  - company_id: Company UUID
- created_at (timestamptz)
```

## Cost Considerations

### OpenAI API Costs:
- **GPT-4 Turbo**: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- **File Upload**: Free
- **Vector Store**: $0.10/GB/day (minimal for single PDFs)

**Estimated cost per analysis**: $0.10 - $0.50 depending on PDF size and analysis length

### Optimization Tips:
1. The function cleans up OpenAI resources after each run
2. Vector stores are deleted immediately after use
3. Files are removed from OpenAI storage
4. Results are cached in your database

## Troubleshooting

### Common Issues:

1. **"Team-Analysis prompt not found"**
   - Solution: Run the database migration

2. **"OPENAI_API_KEY environment variable is not set"**
   - Solution: Set the secret using `npx supabase secrets set OPENAI_API_KEY=...`

3. **"Failed to generate signed URL"**
   - Solution: Check that the file exists in Supabase Storage
   - Verify storage bucket permissions

4. **Analysis takes too long**
   - Normal: 30-60 seconds for GPT-4 Turbo
   - Check OpenAI API status if longer

5. **Function not found**
   - Solution: Deploy the function using `npx supabase functions deploy analyze-team`

## Future Enhancements

Potential improvements:
1. Add ability to regenerate analysis with different prompts
2. Export analysis as PDF report
3. Compare analyses across multiple files
4. Add team scoring visualization
5. Allow users to edit/customize the prompt
6. Support for other AI models (Claude, Gemini)
7. Batch analysis of multiple files
8. Historical analysis comparison

## Files Modified/Created

### Created:
- `supabase/migrations/20251009110004_add_team_analysis_prompt.sql`
- `supabase/functions/analyze-team/index.ts`
- `TEAM_ANALYSIS_IMPLEMENTATION.md` (this file)

### Modified:
- `src/components/TestFiles.tsx`
  - Added `analyzingTeam` state
  - Updated `ExtractedData` interface
  - Added `handleAnalyzeTeam()` function
  - Added "Analyze Team" button
  - Enhanced modal display

## Support

For issues or questions:
1. Check Supabase function logs: `npx supabase functions logs analyze-team`
2. Check browser console for frontend errors
3. Verify OpenAI API key is valid and has credits
4. Check database for stored prompts and results
