-- Insert or update the Create-Detail-Report prompt
-- This prompt compiles all analysis reports into a comprehensive detail report

INSERT INTO prompts (prompt_name, prompt_detail, preferred_llm) 
VALUES (
  'Create-Detail-Report', 
  'Based on all the analysis reports provided for this company, create a Comprehensive Detail Report that consolidates all insights without losing important details.

Review all available reports (Score Card, Product Analysis, Market Analysis, Team Analysis, Financial Analysis) and compile them into a single, cohesive, detailed document.

**IMPORTANT INSTRUCTIONS:**
- Preserve all important details, findings, and insights from each report
- Remove redundant information that appears across multiple reports
- Organize information logically by topic rather than by report type
- Create smooth transitions between sections
- Maintain specific data points, metrics, and examples

**REPORT STRUCTURE:**

**EXECUTIVE SUMMARY**
- Comprehensive overview synthesizing key points from all reports
- Overall investment thesis
- Critical success factors

**COMPANY OVERVIEW**
- Company background and mission
- Product/service description
- Business model
- Current stage and milestones

**TEAM ANALYSIS** (Detailed)
- Leadership team profiles with backgrounds
- Key team members and their roles
- Relevant experience and expertise
- Team strengths and gaps
- Advisory board and mentors
- Team assessment and concerns

**PRODUCT ANALYSIS** (Detailed)
- Product description and features
- Technology and innovation
- Product-market fit assessment
- Competitive advantages
- Technical feasibility
- Development roadmap
- Product risks and challenges

**MARKET ANALYSIS** (Detailed)
- Market size (TAM, SAM, SOM with specifics)
- Market trends and growth drivers
- Target customer segments
- Competitive landscape
- Market positioning and differentiation
- Go-to-market strategy
- Market risks and barriers

**FINANCIAL ANALYSIS** (Detailed)
- Revenue model and pricing
- Unit economics (with specific metrics)
- Historical financials (if available)
- Financial projections and assumptions
- Funding history and current round
- Burn rate and runway
- Path to profitability
- Financial risks

**INVESTMENT SCORING** (From Score Card)
- Team Score with justification
- Product Score with justification
- Market Score with justification
- Financial Score with justification
- Overall Investment Score

**STRENGTHS & OPPORTUNITIES**
- Consolidated list of key strengths (remove duplicates)
- Unique opportunities identified

**RISKS & CONCERNS**
- Consolidated list of risks (remove duplicates)
- Mitigation strategies where applicable

**INVESTMENT RECOMMENDATION**
- Clear recommendation (Strong Buy / Buy / Hold / Pass)
- Investment rationale with supporting evidence
- Suggested investment terms or conditions
- Key milestones to monitor
- Exit opportunities

**DUE DILIGENCE PRIORITIES**
- Critical questions requiring further investigation
- Areas needing deeper analysis
- Recommended next steps

**APPENDIX** (If needed)
- Key metrics summary
- Timeline of major events
- Additional supporting data

**FORMATTING GUIDELINES:**
- Use clear section headers
- Include specific data points and metrics (not just generalizations)
- Cite examples from the original reports
- Maintain professional tone throughout
- Ensure logical flow between sections
- Remove redundant phrases like "As mentioned in X report"
- Integrate information seamlessly

Create a comprehensive, professional investment report that an investor can use for decision-making. The report should be detailed enough to stand alone without needing to reference the individual reports.',
  'GPT-4'
)
ON CONFLICT (prompt_name) DO UPDATE 
SET prompt_detail = EXCLUDED.prompt_detail,
    preferred_llm = EXCLUDED.preferred_llm,
    updated_at = now();

-- Verify the prompt was inserted
SELECT prompt_name, LEFT(prompt_detail, 100) as prompt_preview, preferred_llm, created_at
FROM prompts
WHERE prompt_name = 'Create-Detail-Report';

