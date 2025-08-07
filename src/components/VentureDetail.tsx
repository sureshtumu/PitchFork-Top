import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, User, Mail, Phone, BarChart3, TrendingUp, Users, Target, Zap, DollarSign, FileText, Download, MessageCircle, ChevronDown } from 'lucide-react';
import { signOut, getCurrentUser, supabase } from '../lib/supabase';

interface Company {
  id: string;
  name: string;
  industry?: string;
  address?: string;
  country?: string;
  contact_name_1?: string;
  title_1?: string;
  email_1?: string;
  phone_1?: string;
  contact_name_2?: string;
  title_2?: string;
  email_2?: string;
  phone_2?: string;
  description?: string;
  funding_sought?: string;
  status?: string;
  overall_score?: number;
  recommendation?: string;
  date_submitted: string;
  created_at: string;
}

interface VentureDetailProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const VentureDetail: React.FC<VentureDetailProps> = ({ isDark, toggleTheme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState('Analyzed');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on component mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      loadCompanyData();
    };
    
    checkAuth();
  }, [navigate]);

  const loadCompanyData = async () => {
    if (!id) {
      setError('No company ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error loading company:', fetchError);
        setError('Failed to load company data');
        return;
      }

      if (!data) {
        setError('Company not found');
        return;
      }

      setCompany(data);
    } catch (error) {
      console.error('Error loading company:', error);
      setError('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendation = (score: number) => {
    if (score >= 8) return "Invest";
    if (score >= 5) return "Consider";
    return "Pass";
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const handleStatusChange = (newStatus: string) => {
    if (!company) return;
    
    const updateStatus = async () => {
      try {
        const { error } = await supabase
          .from('companies')
          .update({ status: newStatus })
          .eq('id', company.id);

        if (error) {
          console.error('Error updating status:', error);
          return;
        }

        setCurrentStatus(newStatus);
        setCompany(prev => prev ? { ...prev, status: newStatus } : null);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    updateStatus();
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const handleDownloadReport = () => {
    if (!company) return;
    alert(`PDF report download for ${company.name} would be triggered here`);
  };

  const scoreCategories = [
    { key: 'product', label: 'Product', icon: <Zap className="w-5 h-5" /> },
    { key: 'market', label: 'Market', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'productMarketFit', label: 'Product-Market-Fit', icon: <Target className="w-5 h-5" /> },
    { key: 'team', label: 'Team', icon: <Users className="w-5 h-5" /> },
    { key: 'competition', label: 'Competition', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'revenueCustomerTraction', label: 'Revenue & Customer Traction', icon: <DollarSign className="w-5 h-5" /> },
    { key: 'financials', label: 'Financials', icon: <FileText className="w-5 h-5" /> },
    { key: 'valuation', label: 'Valuation', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'swotAnalysis', label: 'SWOT Analysis', icon: <BarChart3 className="w-5 h-5" /> }
  ];

  // Mock scores for demonstration - in real app, these would come from analysis
  const mockScores = {
    product: 8.2,
    market: 7.5,
    productMarketFit: 7.8,
    team: 8.5,
    competition: 6.9,
    revenueCustomerTraction: 7.2,
    financials: 7.6,
    valuation: 7.4,
    swotAnalysis: 7.7
  };

  const mockFollowUpQuestions = [
    "What is your customer acquisition cost and how do you plan to reduce it?",
    "How do you differentiate from established competitors in your space?",
    "What are your specific revenue milestones for the next 12 months?",
    "Can you provide more details on your intellectual property portfolio?",
    "What is your plan for scaling the team?"
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen font-arial transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg">Loading company data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className={`min-h-screen font-arial transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">{error || 'Company not found'}</div>
            <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-arial transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>Dashboard</Link>
                <Link to="/reports" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>Reports</Link>
                
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
                      <Link to="/submit-files" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                        Submit Files
                      </Link>
                      <Link to="/edit-company" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                        Edit Company
                      </Link>
                      <Link to="/investor-criteria" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                        Investor Criteria
                      </Link>
                    </div>
                  )}
                </div>
                
                <Link to="/help" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>Help</Link>
                
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
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              
              {/* Back to Dashboard */}
              <Link 
                to="/dashboard" 
                className={`flex items-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
        
        {/* Click outside handler for dropdowns */}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">{company.name}</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Venture Detail Analysis
          </p>
        </div>

        {/* Company Information */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6">
            {/* Company Description */}
            <div className="mb-6">
              <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {company.description || 'No description available for this company.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date Submitted</p>
                  <p className="font-semibold">{new Date(company.date_submitted).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Building2 className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Industry</p>
                  <p className="font-semibold">{company.industry || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Submitter</p>
                  <p className="font-semibold">{company.contact_name_1 || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                  <p className="font-semibold">{company.email_1 || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                  <p className="font-semibold">{company.phone_1 || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Valuation</p>
                  <p className="font-semibold">TBD</p>
                </div>
              </div>
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Funding Terms</p>
                  <p className="font-semibold">{company.funding_sought || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Card - Only show if analyzed */}
        {company.status === 'Analyzed' && company.overall_score && (
          <>
            {/* Overall Score and Recommendation */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-blue-600">Overall Assessment</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Overall Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(company.overall_score)}`}>
                      {company.overall_score}/10
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Recommendation</p>
                    <p className={`text-2xl font-bold ${
                      company.recommendation === 'Invest' ? 'text-green-600' :
                      company.recommendation === 'Consider' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {company.recommendation || getRecommendation(company.overall_score)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Scores */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-blue-600">Detailed Score Card</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scoreCategories.map((category) => {
                    const score = mockScores[category.key as keyof typeof mockScores];
                    const getScoreDescription = (key: string, score: number) => {
                      const descriptions: { [key: string]: string } = {
                        product: "Strong technical foundation with innovative AI algorithms and scalable architecture. Product demonstrates clear value proposition.",
                        market: "Large addressable market with growing demand for AI solutions. Market timing appears favorable for expansion.",
                        productMarketFit: "Good initial traction with enterprise clients. Product addresses real pain points in the market.",
                        team: "Experienced founding team with strong technical backgrounds and relevant industry experience.",
                        competition: "Competitive landscape is intense with established players, but company has differentiated approach.",
                        revenueCustomerTraction: "Early revenue generation with growing customer base. Needs improvement in customer acquisition.",
                        financials: "Solid financial projections with reasonable assumptions. Revenue model is well-defined.",
                        valuation: "Valuation appears reasonable given current metrics and market comparables.",
                        swotAnalysis: "Strong technical capabilities offset by competitive challenges. Good growth potential identified."
                      };
                      return descriptions[key] || "Analysis completed for this category.";
                    };
                    
                    return (
                      <div key={category.key} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center mb-2">
                          <div className="text-orange-500 mr-2">{category.icon}</div>
                          <h3 className="font-semibold text-sm">{category.label}</h3>
                        </div>
                        <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score}/10
                        </p>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {getScoreDescription(category.key, score)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-blue-600">Investment Rationale</h2>
              </div>
              <div className="p-6">
                <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {company.name} demonstrates potential in the {company.industry || 'specified'} industry. Based on the submitted information and documents, this represents an investment opportunity that requires further analysis. The company's funding requirements of {company.funding_sought || 'unspecified amount'} should be evaluated against market conditions and growth potential.
                </p>
              </div>
            </div>

            {/* Detailed Report Link */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-blue-600">Detailed Report</h2>
              </div>
              <div className="p-6">
                <button
                  onClick={handleDownloadReport}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors inline-flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Full Report (PDF)
                </button>
              </div>
            </div>

            {/* Follow-up Questions */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-blue-600 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Follow-up Questions
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {mockFollowUpQuestions.map((question, index) => (
                    <li key={index} className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="text-blue-600 font-bold mr-3">{index + 1}.</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Status Management */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600">Status Management</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {['Analyze', 'Reject', 'Diligence', 'Invest'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    (company.status || 'Submitted') === status
                      ? 'bg-orange-600 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-orange-500 hover:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-500 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Current Status: <span className="font-semibold text-orange-600">{company.status || 'Submitted'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`py-8 ${isDark ? 'bg-gray-800' : 'bg-gray-900'} text-white mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-xl font-bold text-blue-400 mb-3">
                Pitch Fork
              </div>
              <p className="text-gray-300">
                Empowering investors with AI-driven analysis for smarter investment decisions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <p className="text-gray-300">hello@pitchfork.com</p>
              <p className="text-gray-300">+1 (555) 123-4567</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 text-center text-gray-300">
            <p>&copy; 2025 Pitch Fork. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VentureDetail;