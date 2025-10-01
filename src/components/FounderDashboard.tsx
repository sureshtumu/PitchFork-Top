import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, FileText, User, ChevronDown, Upload, BarChart3, Trash2, Eye, MessageCircle, Edit3 } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

interface FounderDashboardProps {
  isDark: boolean;
  toggleTheme: () => void;
}

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
  date_submitted: string;
  created_at: string;
}

interface Message {
  id: string;
  company_id: string;
  sender_type: string;
  sender_id?: string;
  recipient_type: string;
  recipient_id?: string;
  message_title: string;
  message_detail: string;
  message_status: string;
  date_sent: string;
  created_at: string;
}

interface Document {
  id: string;
  company_id: string;
  filename: string;
  document_name: string;
  description: string;
  path: string;
  date_added: string;
}

const FounderDashboard: React.FC<FounderDashboardProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Check authentication and load data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      await loadFounderCompany();
    };
    
    checkAuthAndLoadData();
  }, [navigate]);

  const loadFounderCompany = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      // Look for companies where the founder is the contact
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle();

      if (companyError) {
        console.error('Error loading company:', companyError);
        setIsLoading(false);
        return;
      }

      if (companyData) {
        setCompany(companyData);
        await loadDocuments(companyData.id);
        await loadMessages(companyData.id);
      }
    } catch (error) {
      console.error('Error loading founder data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .order('date_added', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadMessages = async (companyId: string) => {
    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('company_id', companyId)
        .eq('recipient_type', 'founder')
        .order('date_sent', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ message_status: 'read' })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, message_status: 'read' } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // If no company is found, show the submit pitch deck option
  if (!company) {
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
                      <button 
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  {isDark ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Click outside handler for dropdown */}
          {showUserMenu && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowUserMenu(false)}
            />
          )}
        </nav>

        {/* Main Content - No Company Submitted */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-12`}>
              <Building2 className="w-16 h-16 mx-auto mb-6 text-orange-500" />
              <h1 className="text-3xl font-bold text-orange-600 mb-4">Submit Your Pitch Deck</h1>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-2xl mx-auto`}>
                Welcome to Pitch Fork! To get started, please submit your company information and pitch deck materials. 
                Our AI-powered analysis will help investors understand your business opportunity.
              </p>
              <Link 
                to="/submit-pitch-deck"
                className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors inline-flex items-center"
              >
                <Upload className="w-6 h-6 mr-3" />
                Founders: Submit Pitch Deck
              </Link>
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
                    <button 
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Click outside handler for dropdown */}
        {showUserMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Founder Dashboard</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Welcome back{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}! Track your submission status and manage your company information.
          </p>
        </div>

        {/* Company Status Card */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6">
            {/* Company Name and Status - Side by side */}
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-orange-600">{company.name}</h2>
              <div className="text-right">
                <span className="text-lg font-medium text-blue-600">Status: </span>
                <span className="text-2xl font-bold text-orange-500">{company.status || 'Submitted'}</span>
              </div>
            </div>
            
            {/* Show Analysis Button */}
            <div className="mb-4">
              
              {/* Show Analysis Button - only if status is not "Submitted" */}
              {company.status && company.status !== 'Submitted' && (
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Show Analysis
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Messages
            </h2>
          </div>
          <div className="p-6">
            {isLoadingMessages ? (
              <div className="text-center py-4">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No messages yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      message.message_status === 'unread'
                        ? isDark 
                          ? 'border-orange-500 bg-orange-900/20' 
                          : 'border-orange-300 bg-orange-50'
                        : isDark 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => {
                      if (message.message_status === 'unread') {
                        markMessageAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-semibold ${
                        message.message_status === 'unread' ? 'text-orange-600' : ''
                      }`}>
                        {message.message_title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {message.message_status === 'unread' && (
                          <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(message.date_sent).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {message.message_detail}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        message.sender_type === 'system' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        From: {message.sender_type === 'system' ? 'System' : 'Investor'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Company Information Summary */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Company Information
            </h2>
            <button 
              onClick={() => navigate('/edit-company', { state: { company } })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Company
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Company Title */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-1">Company Title</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  {company.name}
                </p>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-1">Description</h3>
                <div className="flex items-start">
                  <FileText className="w-4 h-4 mr-2 text-orange-500 mt-1 flex-shrink-0" />
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {company.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Date Submitted */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-1">Date Submitted</h3>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {new Date(company.date_submitted).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Uploaded Documents
            </h2>
          </div>
          <div className="p-6">
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No documents uploaded yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FileText className="w-4 h-4 mr-2 text-orange-500" />
                          <h4 className="font-semibold">{document.document_name}</h4>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                          {document.description || 'No description'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          File: {document.filename} • Added: {new Date(document.date_added).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default FounderDashboard;