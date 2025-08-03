import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock, CheckCircle, XCircle, Filter, Calendar, Building2, ChevronDown, User, FileText, Settings, HelpCircle, ChevronRight } from 'lucide-react';
import { signOut, getCurrentUser } from '../lib/supabase';

interface DashboardProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState({
    submitted: false,
    analyzed: false,
    rejected: false,
    inDiligence: false,
    invested: false
  });
  
  const [itemsToShow, setItemsToShow] = React.useState('10');
  const [sortBy, setSortBy] = React.useState('Recent');
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  // Check authentication on component mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
    };
    
    checkAuth();
  }, [navigate]);

  const handleAnalyze = (ventureId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    console.log(`Analyzing venture ${ventureId}`);
    // Here you would trigger the analysis process
    alert(`Starting analysis for venture ${ventureId}`);
  };

  const handleCardClick = (ventureId: number) => {
    console.log(`Navigate to venture ${ventureId} detail page`);
    // Navigate to venture detail page
    window.location.href = `/venture/${ventureId}`;
  };

  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

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

  const mockDeals = [
    { 
      id: 1,
      company: "TechStart AI",
      status: "Analyzed",
      score: 7.8,
      industry: "AI/ML",
      valuation: "$8M",
      dateSubmitted: "2024-01-15"
    },
    { 
      id: 2,
      company: "GreenEnergy Co", 
      status: "Invested", 
      score: 8.7, 
      industry: "Clean Tech",
      valuation: "$12M",
      dateSubmitted: "2024-01-10"
    },
    { 
      id: 3,
      company: "RetailTech", 
      status: "Rejected", 
      score: 4.2, 
      industry: "E-commerce",
      valuation: "$3M",
      dateSubmitted: "2024-01-08"
    },
    { 
      id: 4,
      company: "HealthApp", 
      status: "Rejected", 
      score: 5.1, 
      industry: "HealthTech",
      valuation: "$6M",
      dateSubmitted: "2024-01-05"
    },
    { 
      id: 5,
      company: "FinanceBot", 
      status: "In-Diligence", 
      score: 7.3, 
      industry: "FinTech",
      valuation: "$9M",
      dateSubmitted: "2024-01-12"
    },
    {
      id: 6,
      company: "EduTech Solutions",
      status: "Submitted",
      score: null,
      industry: "EdTech",
      valuation: "$4M",
      dateSubmitted: "2024-01-18"
    },
    {
      id: 7,
      company: "FoodDelivery Pro",
      status: "Analyzed",
      score: 6.5,
      industry: "Food Tech",
      valuation: "$7M",
      dateSubmitted: "2024-01-14"
    },
    {
      id: 8,
      company: "CyberSecurity Inc",
      status: "Invested",
      score: 9.1,
      industry: "Cybersecurity",
      valuation: "$15M",
      dateSubmitted: "2024-01-02"
    }
  ];

  // Sort deals by date
  const sortedDeals = [...mockDeals].sort((a, b) => {
    const dateA = new Date(a.dateSubmitted).getTime();
    const dateB = new Date(b.dateSubmitted).getTime();
    return sortBy === 'Recent' ? dateB - dateA : dateA - dateB;
  });

  const stats = [
    { label: "Total Deals", value: "24", icon: <BarChart3 className="w-6 h-6" /> },
    { label: "Investments", value: "3", icon: <TrendingUp className="w-6 h-6" /> },
    { label: "In Review", value: "8", icon: <Clock className="w-6 h-6" /> }
  ];

  return (
    <div className={`min-h-screen font-arial transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`${isDark ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/pitch-fork2.jpg" alt="Pitch Fork Logo" className="w-8 h-8 mr-3" />
              <div className="text-2xl font-bold text-blue-600">
                Pitch Fork
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
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
              
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Link 
                  to="/" 
                  className={`flex items-center px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
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
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Investment Dashboard</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Welcome back{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}! Here's your investment portfolio overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                  <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
                </div>
                <div className="text-orange-500">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section 1: Filters */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Filters - Compact Layout */}
              <div>
                <h3 className="text-sm font-medium mb-3">Status</h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'submitted', label: 'Submitted' },
                    { key: 'analyzed', label: 'Analyzed' },
                    { key: 'rejected', label: 'Rejected' },
                    { key: 'inDiligence', label: 'In-Diligence' },
                    { key: 'invested', label: 'Invested' }
                  ].map((filter) => (
                    <label key={filter.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters[filter.key as keyof typeof filters]}
                        onChange={() => handleFilterChange(filter.key as keyof typeof filters)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {filter.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Items to Show */}
              <div>
                <h3 className="text-sm font-medium mb-3">Items to Show</h3>
                <select
                  value={itemsToShow}
                  onChange={(e) => setItemsToShow(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
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
                <h3 className="text-sm font-medium mb-3">Sort By Date</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
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
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600">Recent Ventures</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedDeals.map((venture) => {
                const recommendation = getRecommendation(venture.score);
                return (
                  <div 
                    key={venture.id} 
                    className={`p-6 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                        : 'bg-gray-50 border-gray-200 hover:bg-white hover:shadow-md'
                    }`}
                    onClick={() => handleCardClick(venture.id)}
                  >
                    {/* Venture Name */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-blue-600">{venture.company}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        venture.status === 'Submitted' ? 'bg-gray-100 text-gray-800' :
                        venture.status === 'Analyzed' ? 'bg-yellow-100 text-yellow-800' :
                        venture.status === 'Invested' ? 'bg-green-100 text-green-800' :
                        venture.status === 'In-Diligence' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {venture.status === 'Submitted' ? <Clock className="w-3 h-3 mr-1" /> :
                         venture.status === 'Analyzed' ? <BarChart3 className="w-3 h-3 mr-1" /> :
                         venture.status === 'Invested' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                         venture.status === 'In-Diligence' ? <Users className="w-3 h-3 mr-1" /> :
                         <XCircle className="w-3 h-3 mr-1" />}
                        {venture.status}
                      </span>
                    </div>

                    {/* Industry */}
                    <div className="flex items-center mb-2">
                      <Building2 className="w-4 h-4 mr-2 text-orange-500" />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {venture.industry}
                      </span>
                    </div>

                    {/* Date Submitted */}
                    <div className="flex items-center mb-3">
                      <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Submitted: {new Date(venture.dateSubmitted).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Score and Valuation */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Score</p>
                        {venture.score ? (
                          <p className="text-lg font-bold text-blue-600">{venture.score}/10</p>
                        ) : (
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Valuation</p>
                        <p className="text-lg font-bold text-green-600">{venture.valuation}</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Recommendation</p>
                      {recommendation ? (
                        <p className={`text-sm font-medium ${
                          recommendation === 'Invest' ? 'text-green-600' :
                          recommendation === 'Consider' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {recommendation}
                        </p>
                      ) : (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending Analysis</p>
                      )}
                    </div>

                    {/* Analyze Button for Submitted Status */}
                    {venture.status === 'Submitted' && (
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={(e) => handleAnalyze(venture.id, e)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                        >
                          Analyze
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

export default Dashboard;