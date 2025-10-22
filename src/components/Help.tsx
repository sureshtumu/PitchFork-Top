import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ChevronDown, BookOpen, HelpCircle, FileText, BarChart3, Settings, Target, Zap, CheckCircle, Mail } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

interface HelpProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const Help: React.FC<HelpProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = useState(false);
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // Check if user is a founder
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      setIsFounder(profile?.role === 'founder');
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`${isDark ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/pitch-fork3.png" alt="Pitch Fork Logo" className="w-8 h-8 mr-3" />
              <div className="text-2xl font-bold text-blue-600">
                Pitch Fork
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Menu */}
              {!isFounder && (
                <nav className="hidden md:flex items-center space-x-6">
                  <Link to="/dashboard" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>Dashboard</Link>
                  
                  {/* Utilities Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUtilitiesMenu(!showUtilitiesMenu)}
                      className={`flex items-center ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
                    >
                      Utilities <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    {showUtilitiesMenu && (
                      <div className={`absolute top-full left-0 mt-2 w-48 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} z-50`}>
                        <Link to="/investor-preferences" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                          Investor Preferences
                        </Link>
                        <Link to="/edit-prompts" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                          Edit Prompts
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <Link to="/help" className={`text-blue-600 font-medium transition-colors`}>Help</Link>
                  
                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className={`flex items-center ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
                    >
                      <User className="w-4 h-4 mr-1" />
                      User <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    {showUserMenu && (
                      <div className={`absolute top-full right-0 mt-2 w-32 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} z-50`}>
                        <Link to="/account" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                          Account
                        </Link>
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </nav>
              )}

              {/* Founder Navigation */}
              {isFounder && (
                <nav className="hidden md:flex items-center space-x-6">
                  <Link to="/founder-dashboard" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>Dashboard</Link>
                  <Link to="/help" className={`text-blue-600 font-medium transition-colors`}>Help</Link>
                  
                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className={`flex items-center ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}
                    >
                      <User className="w-4 h-4 mr-1" />
                      User <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                    {showUserMenu && (
                      <div className={`absolute top-full right-0 mt-2 w-32 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} z-50`}>
                        <Link to="/account" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                          Account
                        </Link>
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </nav>
              )}

              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              <Link
                to={isFounder ? "/founder-dashboard" : "/dashboard"}
                className={`flex items-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {(showUserMenu || showUtilitiesMenu) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowUserMenu(false);
              setShowUtilitiesMenu(false);
            }}
          />
        )}
      </nav>

      {/* Help Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Help & Documentation</h1>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Everything you need to know about using Pitch Fork
          </p>
        </div>

        {/* Overview */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-8 mb-8`}>
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
            What is PitchFork?
          </h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4 leading-relaxed font-semibold text-lg`}>
            PitchFork is an AI Driven VC-Investor Platform
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600">For Founders:</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                Provides a platform to submit your pitch deck and other information (financials, patent documents, market research, etc.) 
                for evaluation and consideration from selected investors – <strong>AND receive detailed feedback</strong> on your company and pitch.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 text-blue-600">For Investors:</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                Provides an AI-driven platform to receive, screen, analyze, evaluate, and diligence companies using comprehensive analysis 
                based on specific industry context, submitted documents, and public information including websites, publications, LinkedIn profiles, and more.
              </p>
            </div>
          </div>

          <div className={`${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-blue-800' : 'border-blue-200'} rounded-lg p-4`}>
            <p className={`${isDark ? 'text-blue-300' : 'text-blue-900'} font-semibold`}>
              Key Benefit: Analyze companies in fields you're not an expert in with confidence, scale your deal flow, and never miss a hidden gem.
            </p>
          </div>
        </div>

        {/* For Investors */}
        {!isFounder && (
          <>
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-8 mb-8`}>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-600" />
                For Investors: How It Works
              </h2>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2">Set Your Investment Criteria</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Navigate to <strong>Utilities → Investor Preferences</strong> to set your specific screening criteria. 
                      Incoming proposals will be automatically screened based on your requirements including:
                    </p>
                    <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 space-y-1`}>
                      <li>Revenue thresholds and financial requirements</li>
                      <li>Industry preferences and focus sectors</li>
                      <li>Geographic location requirements</li>
                      <li>Funding stage and company maturity</li>
                      <li>Team size and other custom criteria</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    2
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2">Automated Screening & Review</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      From your <strong>Dashboard</strong>, you'll see all venture proposals with their analysis status. 
                      The platform automatically screens submissions based on your criteria, saving time by filtering non-matches:
                    </p>
                    <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 space-y-1`}>
                      <li><strong>Open:</strong> New proposals awaiting initial screening</li>
                      <li><strong>Screened:</strong> Proposals that passed your criteria filter</li>
                      <li><strong>Analyzing:</strong> AI analysis in progress</li>
                      <li><strong>Reject:</strong> Proposals that don't meet your criteria or analysis</li>
                      <li><strong>Diligence:</strong> Promising ventures for deeper review</li>
                      <li><strong>Invest:</strong> Top candidates recommended for investment</li>
                    </ul>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2">Detailed AI-Driven Analysis</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                      The AI analyzes companies using submitted documents, industry-specific context, and public information 
                      (websites, publications, LinkedIn, etc.). Analysis is organized into four comprehensive categories:
                    </p>
                    
                    <div className="space-y-3 ml-4">
                      <div>
                        <h4 className="font-semibold text-blue-500 mb-1">A. Product/Service Analysis:</h4>
                        <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 text-sm space-y-0.5`}>
                          <li>Problem-Solution fit</li>
                          <li>Differentiation & Defensibility</li>
                          <li>Product–Market Readiness</li>
                          <li>Commercial Traction & Validation</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-500 mb-1">B. Market Analysis:</h4>
                        <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 text-sm space-y-0.5`}>
                          <li>Serviceable Market Size & Growth</li>
                          <li>Competitive Landscape</li>
                          <li>Competitive Advantage & Positioning</li>
                          <li>Adoption Drivers & Risks</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-500 mb-1">C. Leadership Team (Strengths and Gaps):</h4>
                        <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 text-sm space-y-0.5`}>
                          <li>Founder's experience</li>
                          <li>Go to Market leadership</li>
                          <li>Execution/Operations</li>
                          <li>Finance & Governance</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-blue-500 mb-1">D. Financials:</h4>
                        <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 text-sm space-y-0.5`}>
                          <li>Revenue & Growth</li>
                          <li>Financial Health & Burn</li>
                          <li>Capital Raised & Structure</li>
                          <li>Valuation & Benchmarking</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    4
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2">Evaluation Score Card & Reports</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Based on the four analysis categories, the system generates a detailed evaluation and multiple report types:
                    </p>
                    <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 space-y-1`}>
                      <li><strong>Comprehensive Score Card:</strong> Overall evaluation scores across all four categories 
                      (Product/Service, Market, Leadership Team, Financials) with recommendations</li>
                      <li><strong>Detailed Analysis Report:</strong> In-depth analysis document covering all findings and insights</li>
                      <li><strong>Feedback Report to the Founder:</strong> Constructive feedback document that can be shared with entrepreneurs</li>
                    </ul>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    5
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2">Diligence Questions & Decision Making</h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      For ventures moving forward in your pipeline:
                    </p>
                    <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 space-y-1`}>
                      <li><strong>Diligence Questions:</strong> AI-generated key questions for further consideration and deeper investigation</li>
                      <li><strong>Status Management:</strong> Update venture status (Open, Reject, Diligence, Invest) and track your pipeline</li>
                      <li><strong>Ongoing Evaluation:</strong> Re-analyze companies as new information becomes available</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Analysis Framework */}
            <div className={`${isDark ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'} rounded-lg shadow-lg border p-8 mb-8`}>
              <h2 className="text-2xl font-bold mb-4 flex items-center text-blue-600">
                <BarChart3 className="w-6 h-6 mr-2" />
                Four-Category Analysis Framework
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Every venture analysis is organized into four comprehensive categories, with each category contributing to the overall evaluation score:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-lg p-4`}>
                  <h3 className="font-bold text-blue-600 mb-2">1. Product/Service</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    Evaluates solution fit, differentiation, market readiness, and commercial validation
                  </p>
                </div>
                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-lg p-4`}>
                  <h3 className="font-bold text-blue-600 mb-2">2. Market</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    Analyzes market size, competitive landscape, positioning, and adoption dynamics
                  </p>
                </div>
                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-lg p-4`}>
                  <h3 className="font-bold text-blue-600 mb-2">3. Leadership Team</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    Assesses founder experience, GTM leadership, operations, and governance capabilities
                  </p>
                </div>
                <div className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} rounded-lg p-4`}>
                  <h3 className="font-bold text-blue-600 mb-2">4. Financials</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                    Reviews revenue growth, financial health, capital structure, and valuation metrics
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features for Investors */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-8 mb-8`}>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-blue-600" />
                Key Features
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-blue-500" />
                    Custom Analysis Prompts
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Navigate to <strong>Utilities → Edit Prompts</strong> to customize how AI analyzes ventures based on your specific 
                    investment approach and focus areas.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                    Dashboard Filtering
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Filter ventures by status, industry, score range, and other criteria to quickly find the deals that matter most.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Analysis History
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    View the complete analysis history for each venture, including all generated reports and status changes over time.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
                    Automated Screening
                  </h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Proposals are automatically screened against your criteria, saving time by filtering out non-matches before detailed analysis.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* For Founders */}
        {isFounder && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-8 mb-8`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              For Founders: Submitting Your Pitch
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                  1
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">Complete Your Company Profile</h3>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    From your dashboard, fill out your company information including:
                  </p>
                  <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 space-y-1`}>
                    <li>Company name and description</li>
                    <li>Industry and market focus</li>
                    <li>Funding stage and amount seeking</li>
                    <li>Team information</li>
                    <li>Financial information</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                  2
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">Upload Your Documents</h3>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Upload your pitch deck and supporting documents for comprehensive evaluation. Documents can include:
                  </p>
                  <ul className={`list-disc list-inside ${isDark ? 'text-gray-400' : 'text-gray-600'} ml-4 space-y-1`}>
                    <li>Pitch deck (PDF format recommended)</li>
                    <li>Financials and financial projections</li>
                    <li>Patent documents (if applicable)</li>
                    <li>Market research and analysis</li>
                    <li>Any additional supporting materials</li>
                  </ul>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2 text-sm italic`}>
                    Note: The AI will also gather public information from your website, LinkedIn profiles, publications, and other online sources.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                  3
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">Select Target Investors</h3>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Choose which investors or investor groups should receive your proposal. You can target multiple investors 
                    based on their focus areas and investment criteria.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                  4
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">Track Status & Receive Feedback</h3>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Monitor your proposal's progress from your dashboard. You'll see when investors review your proposal 
                    and receive updates on your status. <strong>You will also receive detailed feedback reports</strong> on your 
                    company and pitch, helping you improve your presentation and understand investor perspectives.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Common Questions */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-8 mb-8`}>
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">How accurate is the AI analysis?</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                The AI analysis is trained on thousands of investment decisions and industry standards. However, it should be 
                used as a decision-support tool, not a replacement for human judgment and due diligence.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Can I customize the analysis criteria?</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Yes! Navigate to <strong>Utilities → Investor Preferences</strong> to set your investment criteria, and 
                <strong> Utilities → Edit Prompts</strong> to customize how the AI analyzes ventures.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">How long does analysis take?</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Initial screening typically completes within minutes. Detailed analysis including all reports can take 5-15 minutes 
                depending on the complexity of the proposal and documents provided.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Is my data secure?</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Yes. All data is encrypted in transit and at rest. We use enterprise-grade security measures and comply with 
                industry-standard data privacy regulations. Your investment decisions and company information remain confidential.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Can I download reports?</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Yes. All generated reports can be downloaded as PDF files for sharing with your team or for record-keeping purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className={`${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${isDark ? 'border-blue-800' : 'border-blue-200'} rounded-lg p-8`}>
          <div className="flex items-start">
            <Mail className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Need More Help?</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="space-y-2">
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <strong>Email:</strong> <a href="mailto:support@pitchfork.com" className="text-blue-600 hover:underline">support@pitchfork.com</a>
                </p>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <strong>Response Time:</strong> We typically respond within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

