import { supabase } from './supabase';

export interface AnalysisResult {
  overall_score: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  market_analysis: string;
  team_assessment: string;
  financial_analysis: string;
  risk_factors: string[];
  investment_highlights: string[];
  scorecard: {
    product: number;
    market: number;
    team: number;
    financials: number;
    valuation: number;
  };
  detailed_questions: string[];
}

export interface AnalysisReports {
  summary_report: string;
  detailed_report: string;
  feedback_report: string;
}

// Mock analysis function - replace with actual AI service
export const analyzeCompany = async (companyId: string): Promise<AnalysisResult> => {
  // Simulate analysis time
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Mock analysis result - replace with actual AI analysis
  const mockResult: AnalysisResult = {
    overall_score: Math.round((Math.random() * 4 + 6) * 10) / 10, // Score between 6.0-10.0
    recommendation: Math.random() > 0.7 ? 'Invest' : Math.random() > 0.4 ? 'Consider' : 'Pass',
    summary: 'This company shows strong potential in the AI/ML space with a solid team and clear market opportunity.',
    strengths: [
      'Strong technical team with relevant experience',
      'Clear market opportunity and addressable market',
      'Innovative product with competitive advantages',
      'Strong early traction and customer validation'
    ],
    weaknesses: [
      'Limited financial runway',
      'Competitive market landscape',
      'Scaling challenges ahead'
    ],
    market_analysis: 'The AI analytics market is growing rapidly with significant opportunities for disruption.',
    team_assessment: 'Experienced founding team with complementary skills and domain expertise.',
    financial_analysis: 'Revenue projections appear realistic with clear path to profitability.',
    risk_factors: [
      'Market competition from established players',
      'Technology adoption risks',
      'Regulatory compliance requirements'
    ],
    investment_highlights: [
      'Experienced team with track record',
      'Large addressable market',
      'Strong product-market fit indicators',
      'Clear monetization strategy'
    ],
    scorecard: {
      product: Math.round((Math.random() * 3 + 7) * 10) / 10, // 7.0-10.0
      market: Math.round((Math.random() * 3 + 7) * 10) / 10,
      team: Math.round((Math.random() * 3 + 7) * 10) / 10,
      financials: Math.round((Math.random() * 3 + 6) * 10) / 10, // 6.0-9.0
      valuation: Math.round((Math.random() * 3 + 6) * 10) / 10
    },
    detailed_questions: [
      'What is your customer acquisition cost and lifetime value?',
      'How do you plan to scale your technology infrastructure?',
      'What are your key competitive advantages and moats?',
      'What is your go-to-market strategy for the next 18 months?',
      'How will you use the funding to achieve your milestones?',
      'What are the key risks to your business model?'
    ]
  };

  return mockResult;
};

// Generate PDF content for reports
export const generateReportPDFs = async (
  companyId: string, 
  analysisResult: AnalysisResult,
  companyName: string
): Promise<AnalysisReports> => {
  // Mock PDF generation - replace with actual PDF generation service
  await new Promise(resolve => setTimeout(resolve, 2000));

  const summaryContent = `
INVESTMENT ANALYSIS SUMMARY
Company: ${companyName}
Generated: ${new Date().toLocaleDateString()}

OVERALL SCORE: ${analysisResult.overall_score}/10
RECOMMENDATION: ${analysisResult.recommendation}

EXECUTIVE SUMMARY:
${analysisResult.summary}

KEY STRENGTHS:
${analysisResult.strengths.map(s => `• ${s}`).join('\n')}

KEY WEAKNESSES:
${analysisResult.weaknesses.map(w => `• ${w}`).join('\n')}

INVESTMENT HIGHLIGHTS:
${analysisResult.investment_highlights.map(h => `• ${h}`).join('\n')}

RISK FACTORS:
${analysisResult.risk_factors.map(r => `• ${r}`).join('\n')}
  `;

  const detailedContent = `
DETAILED INVESTMENT ANALYSIS
Company: ${companyName}
Generated: ${new Date().toLocaleDateString()}

OVERALL ASSESSMENT:
Score: ${analysisResult.overall_score}/10
Recommendation: ${analysisResult.recommendation}

MARKET ANALYSIS:
${analysisResult.market_analysis}

TEAM ASSESSMENT:
${analysisResult.team_assessment}

FINANCIAL ANALYSIS:
${analysisResult.financial_analysis}

DETAILED STRENGTHS:
${analysisResult.strengths.map(s => `• ${s}`).join('\n')}

DETAILED WEAKNESSES:
${analysisResult.weaknesses.map(w => `• ${w}`).join('\n')}

RISK ASSESSMENT:
${analysisResult.risk_factors.map(r => `• ${r}`).join('\n')}

INVESTMENT THESIS:
${analysisResult.investment_highlights.map(h => `• ${h}`).join('\n')}
  `;

  const feedbackContent = `
COMPANY FEEDBACK REPORT
Company: ${companyName}
Generated: ${new Date().toLocaleDateString()}

Dear ${companyName} Team,

Thank you for submitting your company information for investment consideration.

OVERALL ASSESSMENT:
We have completed our analysis of your submission and provide the following feedback:

STRENGTHS IDENTIFIED:
${analysisResult.strengths.map(s => `• ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${analysisResult.weaknesses.map(w => `• ${w}`).join('\n')}

RECOMMENDATIONS:
Based on our analysis, we recommend focusing on the following areas:
${analysisResult.weaknesses.map(w => `• Address: ${w}`).join('\n')}

NEXT STEPS:
${analysisResult.recommendation === 'Invest' 
  ? 'We are interested in proceeding with due diligence. Our team will be in touch to schedule next steps.'
  : analysisResult.recommendation === 'Consider'
  ? 'We would like to learn more about your company. Please address the areas for improvement and we will reconsider.'
  : 'While we appreciate your submission, we will not be moving forward at this time. We encourage you to address the feedback provided and consider reapplying in the future.'
}

Best regards,
Investment Analysis Team
  `;

  return {
    summary_report: summaryContent,
    detailed_report: detailedContent,
    feedback_report: feedbackContent
  };
};

// Save reports to storage and database
export const saveAnalysisReports = async (
  companyId: string,
  companyName: string,
  reports: AnalysisReports,
  userId: string
): Promise<void> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const reportTypes = [
    { type: 'summary', content: reports.summary_report, name: `${companySlug}-summary-${timestamp}.txt` },
    { type: 'detailed', content: reports.detailed_report, name: `${companySlug}-detailed-${timestamp}.txt` },
    { type: 'feedback', content: reports.feedback_report, name: `${companySlug}-feedback-${timestamp}.txt` }
  ];

  for (const report of reportTypes) {
    // Upload to Supabase Storage
    const filePath = `analysis-reports/${companyId}/${report.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('company-documents')
      .upload(filePath, new Blob([report.content], { type: 'text/plain' }), {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`Error uploading ${report.type} report:`, uploadError);
      continue;
    }

    // Save record to database
    const { error: dbError } = await supabase
      .from('analysis_reports')
      .insert({
        company_id: companyId,
        report_type: report.type,
        file_name: report.name,
        file_path: filePath,
        generated_by: userId
      });

    if (dbError) {
      console.error(`Error saving ${report.type} report record:`, dbError);
    }
  }
};