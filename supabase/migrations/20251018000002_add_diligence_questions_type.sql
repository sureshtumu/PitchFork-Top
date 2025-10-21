-- Add diligence-questions-analysis to analysis_reports table constraint

-- Drop the existing constraint
ALTER TABLE analysis_reports DROP CONSTRAINT IF EXISTS analysis_reports_report_type_check;

-- Add the updated constraint with 'diligence-questions-analysis'
ALTER TABLE analysis_reports
  ADD CONSTRAINT analysis_reports_report_type_check
  CHECK (report_type IN ('summary', 'detailed', 'feedback', 'team-analysis', 'product-analysis', 'market-analysis', 'financial-analysis', 'scorecard-analysis', 'detail-report-analysis', 'diligence-questions-analysis'));

-- Add comment for documentation
COMMENT ON COLUMN analysis_reports.report_type IS 'Type of analysis report: summary, detailed, feedback, team-analysis, product-analysis, market-analysis, financial-analysis, scorecard-analysis, detail-report-analysis, diligence-questions-analysis';

