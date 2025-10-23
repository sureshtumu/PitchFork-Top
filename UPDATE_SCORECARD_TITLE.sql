-- Update existing scorecard report titles in the database
-- This changes "Investment Score Card" to "Score-Card" for consistency

-- Note: The analysis_reports table doesn't have a title column
-- The title is only shown in the PDF and comes from the edge function configuration
-- No database updates are needed as the report_type remains 'scorecard-analysis'

-- If you had a custom column storing titles, you would update it like this:
-- UPDATE analysis_reports 
-- SET report_title = 'Score-Card'
-- WHERE report_type = 'scorecard-analysis';

-- Verify the report types are correct
SELECT id, company_id, report_type, file_name, generated_at
FROM analysis_reports
WHERE report_type = 'scorecard-analysis'
ORDER BY generated_at DESC
LIMIT 10;

-- The new reports generated will automatically use "Score-Card" as the title
