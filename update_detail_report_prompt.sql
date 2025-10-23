-- Update the Detail Report prompt to fix the summarization issue
-- This script updates the Create-Detail-Report prompt in the database

UPDATE prompts 
SET prompt_detail = 'Create a Comprehensive Detail Report by assembling the provided analysis reports into a single document. Do NOT summarize, condense, or synthesize the content - include each report in its entirety.

**CRITICAL INSTRUCTIONS:**
- Include each analysis report as a complete, separate section
- Do NOT edit, summarize, or modify the content of the individual reports
- Preserve every word, detail, and formatting from the original reports
- Simply organize them into a single document with clear section headers

**REPORT STRUCTURE:**

**EXECUTIVE SUMMARY**
Create a brief 1-2 paragraph overview synthesizing the key points from all reports:
- Overall investment thesis
- Critical success factors
- Main strengths and concerns

**TEAM ANALYSIS REPORT**
Include the complete Team Analysis report exactly as it was generated. Do not modify any content.

**PRODUCT ANALYSIS REPORT**  
Include the complete Product Analysis report exactly as it was generated. Do not modify any content.

**MARKET ANALYSIS REPORT**
Include the complete Market Analysis report exactly as it was generated. Do not modify any content.

**FINANCIAL ANALYSIS REPORT**
Include the complete Financial Analysis report exactly as it was generated. Do not modify any content.

**INVESTMENT SCORECARD**
Include the complete Score Card report exactly as it was generated. Do not modify any content.

**FORMATTING:**
- Use clear section headers to separate each report
- Maintain the original formatting and structure of each report
- Do NOT add transitions or commentary between reports
- Simply present each report as a complete section

**REMINDER:** This is an assembly task, not a compilation task. Include the full content of each report without any modifications.',
    updated_at = now()
WHERE prompt_name = 'Create-Detail-Report';

-- Verify the update
SELECT prompt_name, LEFT(prompt_detail, 100) as prompt_preview, updated_at
FROM prompts
WHERE prompt_name = 'Create-Detail-Report';
