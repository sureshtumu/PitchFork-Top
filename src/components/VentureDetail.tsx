import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, User, Mail, Phone, DollarSign, BarChart3, ChevronDown } from 'lucide-react';
import { signOut, getCurrentUser, supabase } from '../lib/supabase';

interface Company {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  contact_name_1?: string;
  email_1?: string;
  phone_1?: string;
  funding_sought?: string;
  status?: string;
  overall_score?: number;
  recommendation?: string;
  date_submitted: string;
}

interface VentureDetailProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const VentureDetail: React.FC<VentureDetailProps> = ({ isDark, toggleTheme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Check authentication and load company data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      await loadCompanyData();
    };
    
    checkAuthAndLoadData();
  }, [navigate, id]);

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

  const handleStatusChange = async (newStatus: string) => {
    if (!company) return;
    
    try {
      setIsUpdatingStatus(true);
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', company.id);

      if (error) {
        console.error('Error updating status:', error);
        return;
      }

      setCompany(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">{company.name}</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Venture Details
          </p>
        </div>

        {/* Venture Information */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Venture Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Company Name</p>
                <p className="text-lg font-semibold">{company.name}</p>
              </div>

              {/* Industry */}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Industry</p>
                <p className="text-lg">{company.industry || 'Not specified'}</p>
              </div>

              {/* Date Submitted */}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Date Submitted</p>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  <p className="text-lg">{new Date(company.date_submitted).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Contact Name */}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Contact Name</p>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-orange-500" />
                  <p className="text-lg">{company.contact_name_1 || 'Not specified'}</p>
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Contact Email</p>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-orange-500" />
                  <p className="text-lg">{company.email_1 || 'Not specified'}</p>
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Contact Phone</p>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-orange-500" />
                  <p className="text-lg">{company.phone_1 || 'Not specified'}</p>
                </div>
              </div>

              {/* Funding Sought */}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Funding Sought</p>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-orange-500" />
                  <p className="text-lg">{company.funding_sought || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Description</p>
              <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {company.description || 'No description available for this company.'}
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analysis
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Overall Score */}
              <div className="text-center">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Overall Score</p>
                {company.status === 'Submitted' || !company.overall_score ? (
                  <p className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
                ) : (
                  <p className={`text-4xl font-bold ${
                    company.overall_score >= 8 ? 'text-green-600' :
                    company.overall_score >= 6 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {company.overall_score}/10
                  </p>
                )}
              </div>

              {/* Recommendation */}
              <div className="text-center">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Recommendation</p>
                {company.status === 'Submitted' || !company.recommendation || company.recommendation === 'Pending Analysis' ? (
                  <p className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
                ) : (
                  <p className={`text-2xl font-bold ${
                    company.recommendation === 'Invest' ? 'text-green-600' :
                    company.recommendation === 'Consider' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {company.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Management */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600">Status Management</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-4">
              {['Submitted', 'Analyze', 'Rejected', 'Diligence', 'Invest'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdatingStatus}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    (company.status || 'Submitted') === status
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Current Status: <span className="font-semibold text-blue-600">{company.status || 'Submitted'}</span>
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