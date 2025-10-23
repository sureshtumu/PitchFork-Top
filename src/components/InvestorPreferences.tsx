import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, ChevronDown, Save, Building2, Target, Mail, FileText } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

interface InvestorPreferencesProps {
  isDark: boolean;
  toggleTheme: () => void;
}

interface InvestorData {
  name: string;
  email: string;
  firm_name: string;
  focus_areas: string;
  comment: string;
  investment_criteria_doc: string;
}

const InvestorPreferences: React.FC<InvestorPreferencesProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [investorData, setInvestorData] = useState<InvestorData>({
    name: '',
    email: '',
    firm_name: '',
    focus_areas: '',
    comment: '',
    investment_criteria_doc: '',
  });

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // Check if user is an investor
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (profile?.user_type !== 'investor') {
        navigate('/founder-dashboard');
        return;
      }

      await loadInvestorDetails();
    };

    checkAuthAndLoadData();
  }, [navigate]);

  const loadInvestorDetails = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('investor_details')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading investor details:', error);
        setMessage({ type: 'error', text: 'Failed to load your details' });
        return;
      }

      if (data) {
        setInvestorData({
          name: data.name || '',
          email: data.email || '',
          firm_name: data.firm_name || '',
          focus_areas: data.focus_areas || '',
          comment: data.comment || '',
          investment_criteria_doc: data.investment_criteria_doc || '',
        });
      } else {
        // Pre-fill with user data if no investor_details record exists
        setInvestorData(prev => ({
          ...prev,
          name: currentUser.user_metadata?.full_name || '',
          email: currentUser.email || '',
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvestorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      // Check if record exists
      const { data: existing } = await supabase
        .from('investor_details')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('investor_details')
          .update({
            name: investorData.name,
            email: investorData.email,
            firm_name: investorData.firm_name,
            focus_areas: investorData.focus_areas,
            comment: investorData.comment,
            investment_criteria_doc: investorData.investment_criteria_doc,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', currentUser.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('investor_details')
          .insert([{
            user_id: currentUser.id,
            name: investorData.name,
            email: investorData.email,
            firm_name: investorData.firm_name,
            focus_areas: investorData.focus_areas,
            comment: investorData.comment,
            investment_criteria_doc: investorData.investment_criteria_doc,
          }]);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
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
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/dashboard"
              className={`flex items-center ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors font-semibold`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors font-semibold`}
                >
                  <User className="w-4 h-4 mr-1" />
                  {user?.email} <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {showUserMenu && (
                  <div className={`absolute top-full right-0 mt-2 w-48 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border z-50`}>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors font-semibold`}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            Investor Preferences
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Update your investment preferences and profile information
          </p>
        </header>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
              : isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Preferences Form */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <form onSubmit={handleSave}>
            <div className="p-6">
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'} flex items-center`}>
                <User className="w-6 h-6 mr-2 text-blue-600" />
                Your Investor Profile
              </h2>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={investorData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={investorData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Firm Name */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Firm Name
                  </label>
                  <input
                    type="text"
                    name="firm_name"
                    value={investorData.firm_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="e.g., TechVentures Capital"
                  />
                </div>

                {/* Focus Areas */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    <Target className="w-4 h-4 inline mr-1" />
                    Focus Areas
                  </label>
                  <input
                    type="text"
                    name="focus_areas"
                    value={investorData.focus_areas}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="e.g., SaaS, AI, Enterprise Software, FinTech"
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Comma-separated list of industries or sectors you invest in
                  </p>
                </div>

                {/* Bio/Comment */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    <FileText className="w-4 h-4 inline mr-1" />
                    Bio / Investment Philosophy
                  </label>
                  <textarea
                    name="comment"
                    value={investorData.comment}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Describe your investment approach, criteria, and what you look for in startups..."
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    This will be shown to founders when they select investors
                  </p>
                </div>

                {/* Investment Criteria */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    <FileText className="w-4 h-4 inline mr-1" />
                    Investment Criteria
                  </label>
                  <textarea
                    name="investment_criteria_doc"
                    value={investorData.investment_criteria_doc}
                    onChange={handleInputChange}
                    rows={8}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm`}
                    placeholder="Enter your detailed investment criteria...

Examples:
• Investment stage: Seed to Series A
• Ticket size: $100K - $2M
• Geographic focus: North America, Europe
• Industries: SaaS, AI/ML, FinTech, Enterprise Software
• Required metrics: $500K+ ARR, 20%+ MoM growth
• Team requirements: Technical co-founder, domain expertise
• Business model: B2B focus, enterprise customers
• Traction: Proven product-market fit, paying customers
• Other criteria: Scalable model, defensible IP"
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Detailed investment criteria that founders should review before submitting their pitch deck
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className={`px-6 py-4 ${isDark ? 'bg-gray-750 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-lg ${
                    isDark
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  } transition-colors`}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center ${
                    isSaving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-900 bg-opacity-30 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            Why update your preferences?
          </h3>
          <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
            <li>• Founders can see your investment focus when selecting investors</li>
            <li>• Your firm name and bio help founders understand your background</li>
            <li>• Accurate information leads to better-matched pitch deck submissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InvestorPreferences;

