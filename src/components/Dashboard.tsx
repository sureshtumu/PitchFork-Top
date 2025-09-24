import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock, CheckCircle, XCircle, Filter, Calendar, Building2, ChevronDown, User, FileText, Settings, HelpCircle, ChevronRight } from 'lucide-react';
import { signOut, getCurrentUser, supabase } from '../lib/supabase';
import { analyzeCompany, generateReportPDFs, saveAnalysisReports } from '../lib/analysisService';

interface DashboardProps {
  isDark: boolean;
  toggleTheme: () => void;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  status?: string;
  overall_score?: number;
  recommendation?: string;
  date_submitted: string;
  created_at: string;
}

const Dashboard: React.FC<DashboardProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState({
    submitted: true,
    pending: true,
    analyzed: true,
    inDiligence: true,
    rejected: true,
    ddRejected: true,
    invested: true
  });
  
  const [itemsToShow, setItemsToShow] = React.useState('10');
  const [sortBy, setSortBy] = React.useState('Recent');
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(true);
  const [analyzingCompanies, setAnalyzingCompanies] = React.useState<Set<string>>(new Set());

  // Check authentication on component mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      // Check user type and redirect if founder
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', currentUser.id)
        .single();
      
      if (profile?.user_type === 'founder') {
        navigate('/founder-dashboard');
        return;
      }
      
      await loadCompanies();
    };
    
    checkAuth();
  }, [navigate]);

  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('date_submitted', { ascending: false });

      if (error) {
        console.error('Error loading companies:', error);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleAnalyze = async (companyId: string, companyName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (analyzingCompanies.has(companyId)) {
      return; // Already analyzing
    }

    try {
      // Add to analyzing set
      setAnalyzingCompanies(prev => new Set(prev).add(companyId));

      // Step 1: Analyze the company
      const analysisResult = await analyzeCompany(companyId);

      // Step 2: Update company with score and recommendation
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          overall_score: analysisResult.overall_score,
          recommendation: analysisResult.recommendation,
          status: 'Analyzed'
        })
        .eq('id', companyId);

      if (updateError) {
        console.error('Error updating company:', updateError);
        throw new Error('Failed to update company analysis');
      }

      // Step 3: Generate PDF reports
      const reports = await generateReportPDFs(companyId, analysisResult, companyName);

      // Step 4: Save reports to storage and database
      const currentUser = await getCurrentUser();
      if (currentUser) {
        await saveAnalysisReports(companyId, companyName, reports, currentUser.id);
      }

      // Step 5: Update local state
      setCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { 
              ...company, 
              overall_score: analysisResult.overall_score,
              recommendation: analysisResult.recommendation,
              status: 'Analyzed'
            }
          : company
      ));

      // Step 6: Create notification message for founder
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          company_id: companyId,
          sender_type: 'system',
          sender_id: null,
          recipient_type: 'founder',
          recipient_id: null,
          message_title: 'Analysis Complete',
          message_detail: `Your company analysis is complete. Overall score: ${analysisResult.overall_score}/10. Recommendation: ${analysisResult.recommendation}`,
          message_status: 'unread'
        });

      if (messageError) {
        console.error('Error creating analysis notification:', messageError);
      }

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      // Remove from analyzing set
      setAnalyzingCompanies(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyId);
        return newSet;
      });
    }
  };

  const handleCardClick = (companyId: string) => {
    navigate(`/venture/${companyId}`);
  };

  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Filter companies based on selected filters
  const filteredCompanies = companies.filter(company => {
    const status = company.status?.toLowerCase().replace('-', '').replace(' ', '') || 'submitted';
    if (status === 'submitted' && filters.submitted) return true;
    if (status === 'pending' && filters.pending) return true;
    if (status === 'analyzed' && filters.analyzed) return true;
    if (status === 'indiligence' && filters.inDiligence) return true;
    if (status === 'rejected' && filters.rejected) return true;
    if (status === 'ddrejected' && filters.ddRejected) return true;
    if (status === 'invested' && filters.invested) return true;
    return false;
  });

  // Apply sorting and limit
  const sortedAndLimitedCompanies = React.useMemo(() => {
    let sorted = [...filteredCompanies];
    
    // Sort by date
    sorted.sort((a, b) => {
      const dateA = new Date(a.date_submitted).getTime();
      const dateB = new Date(b.date_submitted).getTime();
      return sortBy === 'Recent' ? dateB - dateA : dateA - dateB;
    });

    // Apply limit
    if (itemsToShow !== 'All') {
      sorted = sorted.slice(0, parseInt(itemsToShow));
    }

    return sorted;
  }, [filteredCompanies, sortBy, itemsToShow]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  // Function to determine recommendation based on score
  const getRecommendation = (score: number | null) => {
    if (score === null) return null;
    if (score >= 8) return "Invest";
    if (score >= 5) return "Consider";
    return "Pass";
  };

  const stats = [
    { label: "Total Deals", value: companies.length.toString(), icon: <BarChart3 className="w-6 h-6" /> },
    { label: "Investments", value: companies.filter(c => c.status === 'Invested').length.toString(), icon: <TrendingUp className="w-6 h-6" /> },
    { label: "In Review", value: companies.filter(c => c.status === 'Pending' || c.status === 'Analyzed').length.toString(), icon: <Clock className="w-6 h-6" /> }
  ];

  return (
    <>
    <div className={`min-h-screen font-inter transition-colors duration-300 ${isDark ? 'bg-navy-950 text-silver-100' : 'bg-silver-50 text-navy-900'}`}>
      {/* Navigation */}
      <nav className={`${isDark ? 'bg-navy-900/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-navy-700' : 'border-silver-200'} shadow-financial`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/pitch-fork3.png" alt="Pitch Fork Logo" className="w-8 h-8 mr-3" />
              <div className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                Pitch Fork
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="text-gold-600 font-bold">Dashboard</Link>
                <Link to="/reports" className={`${isDark ? 'text-silver-300 hover:text-white' : 'text-navy-700 hover:text-navy-900'} transition-colors font-semibold`}>Reports</Link>
                
                {/* Utilities Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUtilitiesMenu(!showUtilitiesMenu)}
                    className={`flex items-center ${isDark ? 'text-silver-300 hover:text-white' : 'text-navy-700 hover:text-navy-900'} transition-colors font-semibold`}
                  >
                    Utilities <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {showUtilitiesMenu && (
                    <div className={`absolute top-full left-0 mt-2 w-48 ${isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-silver-200'} rounded-lg shadow-financial border z-50`}>
                      <Link to="/submit-files" className={`block px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}>
                        Submit Files
                      </Link>
                      <Link to="/edit-company" className={`block px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}>
                        Edit Company
                      </Link>
                      <Link to="/investor-criteria" className={`block px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}>
                        Investor Criteria
                      </Link>
                      <Link to="/edit-prompts" className={`block px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}>
                        Edit Prompts
                      </Link>
                    </div>
                  )}
                </div>
                
                <Link to="/help" className={`${isDark ? 'text-silver-300 hover:text-white' : 'text-navy-700 hover:text-navy-900'} transition-colors font-semibold`}>Help</Link>
                
                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center ${isDark ? 'text-silver-300 hover:text-white' : 'text-navy-700 hover:text-navy-900'} transition-colors font-semibold`}
                  >
                    <User className="w-4 h-4 mr-1" />
                    User <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {showUserMenu && (
                    <div className={`absolute top-full right-0 mt-2 w-32 ${isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-silver-200'} rounded-lg shadow-financial border z-50`}>
                      <Link to="/account" className={`block px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}>
                        Account
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </nav>
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-navy-800 hover:bg-navy-700' : 'bg-silver-100 hover:bg-silver-200'} transition-colors shadow-sm`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Link 
                  to="/" 
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-navy-800 hover:bg-navy-700' : 'bg-silver-100 hover:bg-silver-200'} transition-colors font-semibold`}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Home
                </Link>
              </div>
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

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gold-gradient bg-clip-text text-transparent mb-4">Investment Dashboard</h1>
          <p className={`text-xl ${isDark ? 'text-silver-300' : 'text-navy-600'}`}>
            Welcome back{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}! Here's your investment portfolio overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className={`${isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-silver-200'} p-8 rounded-xl shadow-financial border hover:shadow-gold transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-silver-400' : 'text-navy-600'}`}>{stat.label}</p>
                  <p className="text-3xl font-bold text-gold-600">{stat.value}</p>
                </div>
                <div className="text-gold-500">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section 1: Filters */}
        <div className={`${isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-silver-200'} rounded-xl shadow-financial border mb-12`}>
          <div className="p-6 border-b border-silver-200 dark:border-navy-700">
            <h2 className="text-2xl font-bold text-gold-600 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Filters - Compact Layout */}
              <div>
                <h3 className="text-sm font-bold mb-3 text-navy-800 dark:text-silver-200">Status</h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'submitted', label: 'Submitted' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'analyzed', label: 'Analyzed' },
                    { key: 'inDiligence', label: 'In-Diligence' },
                    { key: 'rejected', label: 'Rejected' },
                    { key: 'ddRejected', label: 'DD-Rejected' },
                    { key: 'invested', label: 'Invested' }
                  ].map((filter) => (
                    <label key={filter.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters[filter.key as keyof typeof filters]}
                        onChange={() => handleFilterChange(filter.key as keyof typeof filters)}
                        className="rounded border-silver-300 text-gold-600 focus:ring-gold-500"
                      />
                      <span className={`ml-2 text-sm font-semibold ${isDark ? 'text-silver-300' : 'text-navy-700'}`}>
                        {filter.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Items to Show */}
              <div>
                <h3 className="text-sm font-bold mb-3 text-navy-800 dark:text-silver-200">Items to Show</h3>
                <select
                  value={itemsToShow}
                  onChange={(e) => setItemsToShow(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-semibold ${
                    isDark 
                      ? 'bg-navy-700 border-navy-600 text-white' 
                      : 'bg-white border-silver-300 text-navy-900'
                  }`}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="All">All</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-sm font-bold mb-3 text-navy-800 dark:text-silver-200">Sort By Date</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-semibold ${
                    isDark 
                      ? 'bg-navy-700 border-navy-600 text-white' 
                      : 'bg-white border-silver-300 text-navy-900'
                  }`}
                >
                  <option value="Recent">Recent</option>
                  <option value="Oldest">Oldest</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Venture Cards */}
        <div className={`${isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-silver-200'} rounded-xl shadow-financial border`}>
          <div className="p-6 border-b border-silver-200 dark:border-navy-700">
            <h2 className="text-2xl font-bold text-gold-600">Recent Ventures</h2>
          </div>
          <div className="p-6">
            {isLoadingCompanies ? (
              <div className="text-center py-8">
                <div className="text-silver-500">Loading companies...</div>
              </div>
            ) : sortedAndLimitedCompanies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-navy-600' : 'text-silver-400'}`} />
                <div className={`${isDark ? 'text-silver-400' : 'text-navy-500'}`}>No companies match the selected filters</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedAndLimitedCompanies.map((company) => {
                  const recommendation = getRecommendation(company.overall_score);
                  const isAnalyzing = analyzingCompanies.has(company.id);
                return (
                    <div 
                      key={company.id} 
                    className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-gold hover:scale-105 ${
                      isDark 
                        ? 'bg-navy-700 border-navy-600 hover:bg-navy-650' 
                        : 'bg-silver-50 border-silver-200 hover:bg-white hover:shadow-financial'
                    }`}
                      onClick={() => handleCardClick(company.id)}
                  >
                    {/* Venture Name */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gold-600">{company.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          company.status === 'Submitted' ? 'bg-silver-100 text-silver-800' :
                          company.status === 'Pending' ? 'bg-gold-100 text-gold-800' :
                          company.status === 'Analyzed' ? 'bg-navy-100 text-navy-800' :
                          company.status === 'Invested' ? 'bg-success-100 text-success-800' :
                          company.status === 'In-Diligence' ? 'bg-gold-100 text-gold-800' :
                        'bg-danger-100 text-danger-800'
                      }`}>
                          {company.status === 'Submitted' ? <Clock className="w-3 h-3 mr-1" /> :
                           company.status === 'Pending' ? <Clock className="w-3 h-3 mr-1" /> :
                           company.status === 'Analyzed' ? <BarChart3 className="w-3 h-3 mr-1" /> :
                           company.status === 'Invested' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                           company.status === 'In-Diligence' ? <Users className="w-3 h-3 mr-1" /> :
                         <XCircle className="w-3 h-3 mr-1" />}
                          {company.status || 'Submitted'}
                      </span>
                    </div>

                    {/* Industry */}
                    <div className="flex items-center mb-2">
                      <Building2 className="w-4 h-4 mr-2 text-gold-500" />
                      <span className={`text-sm font-semibold ${isDark ? 'text-silver-300' : 'text-navy-600'}`}>
                          {company.industry || 'Not specified'}
                      </span>
                    </div>

                    {/* Date Submitted */}
                    <div className="flex items-center mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-gold-500" />
                      <span className={`text-sm font-semibold ${isDark ? 'text-silver-300' : 'text-navy-600'}`}>
                          Submitted: {new Date(company.date_submitted).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Score and Valuation */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-silver-400' : 'text-navy-500'} mb-1`}>Score</p>
                          {company.overall_score ? (
                            <p className="text-lg font-bold text-gold-600">{company.overall_score}/10</p>
                        ) : (
                          <p className={`text-sm ${isDark ? 'text-silver-400' : 'text-navy-500'}`}>Pending</p>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-silver-400' : 'text-navy-500'} mb-1`}>Valuation</p>
                          {company.valuation_value && company.valuation_units ? (
                            <p className="text-lg font-bold text-success-600">
                              {company.valuation_value}{company.valuation_units}
                            </p>
                          ) : (
                            <p className={`text-sm ${isDark ? 'text-silver-400' : 'text-navy-500'}`}>TBD</p>
                          )}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-silver-400' : 'text-navy-500'} mb-1`}>Recommendation</p>
                        {company.recommendation && company.recommendation !== 'Pending Analysis' ? (
                        <p className={`text-sm font-medium ${
                            company.recommendation === 'Invest' ? 'text-success-600' :
                            company.recommendation === 'Consider' ? 'text-gold-600' :
                          'text-danger-600'
                        }`}>
                            {company.recommendation}
                        </p>
                      ) : (
                          <p className={`text-sm ${isDark ? 'text-silver-400' : 'text-navy-500'}`}>Pending Analysis</p>
                      )}
                    </div>

                    {/* Analyze Button for Submitted Status */}
                      {company.status === 'Submitted' && (
                      <div className="mt-4 pt-3 border-t border-silver-200 dark:border-navy-600">
                        <button
                            onClick={(e) => handleAnalyze(company.id, company.name, e)}
                            disabled={isAnalyzing}
                          className="w-full bg-gold-gradient text-white py-2 px-4 rounded-lg font-bold hover:shadow-gold focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-financial"
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

    {/* Footer */}
    <footer className={`py-12 ${isDark ? 'bg-navy-900' : 'bg-navy-950'} text-white mt-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent mb-4">
                Pitch Fork
              </div>
              <p className="text-silver-300 leading-relaxed">
                Empowering investors with AI-driven analysis for smarter investment decisions.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold-400">Contact</h4>
              <p className="text-silver-300 mb-2">hello@pitchfork.com</p>
              <p className="text-silver-300">+1 (555) 123-4567</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold-400">Product</h4>
              <ul className="space-y-2 text-silver-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold-400">Legal</h4>
              <ul className="space-y-2 text-silver-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-navy-700 pt-8 text-center text-silver-400">
            <p>&copy; 2025 Pitch Fork. All rights reserved.</p>
          </div>
        </div>
    </footer>
    </>
  );
};

export default Dashboard;