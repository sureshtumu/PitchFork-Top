import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, User, Mail, Phone, FileText, ChevronDown, MessageCircle, Send, Download, BarChart3 } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

interface VentureDetailProps {
  isDark: boolean;
  toggleTheme: () => void;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  address?: string;
  country?: string;
  contact_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  description?: string;
  funding_terms?: string;
  status?: string;
  overall_score?: number;
  recommendation?: string;
  date_submitted: string;
  created_at: string;
  key_team_members?: string;
  revenue?: string;
  valuation?: string;
  url?: string;
}

interface AnalysisReport {
  id: string;
  report_type: string;
  file_name: string;
  file_path: string;
  generated_at: string;
}

interface Document {
  id: string;
  document_name: string;
  description?: string;
  path: string;
  date_added: string;
}

const VentureDetail: React.FC<VentureDetailProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [analysisReports, setAnalysisReports] = useState<AnalysisReport[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageDetail, setMessageDetail] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check authentication and load company data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      if (id) {
        await loadCompanyData(id);
        await loadAnalysisReports(id);
        await loadDocuments(id);
      }
    };
    
    checkAuthAndLoadData();
  }, [navigate, id]);

  const loadCompanyData = async (companyId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Error loading company:', error);
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

  const loadAnalysisReports = async (companyId: string) => {
    try {
      setIsLoadingReports(true);

      const { data, error } = await supabase
        .from('analysis_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error loading analysis reports:', error);
        return;
      }

      setAnalysisReports(data || []);
    } catch (error) {
      console.error('Error loading analysis reports:', error);
    } finally {
      setIsLoadingReports(false);
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

  const handleDownloadReport = async (report: AnalysisReport) => {
    try {
      const { data, error } = await supabase.storage
        .from('company-documents')
        .download(report.file_path);

      if (error) {
        console.error('Error downloading report:', error);
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('company-documents')
        .download(document.path);

      if (error) {
        console.error('Error downloading document:', error);
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.document_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!company || isUpdating) return;

    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', company.id);

      if (error) {
        console.error('Error updating status:', error);
        return;
      }

      // Update local state
      setCompany(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const handleSendMessage = async () => {
    if (!messageTitle.trim() || !messageDetail.trim()) {
      setMessageStatus({ type: 'error', text: 'Please fill in both title and message' });
      return;
    }

    if (!company) {
      setMessageStatus({ type: 'error', text: 'Company information not available' });
      return;
    }

    try {
      setIsSendingMessage(true);
      setMessageStatus(null);

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setMessageStatus({ type: 'error', text: 'You must be logged in to send messages' });
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert([{
          company_id: company.id,
          sender_type: 'investor',
          sender_id: currentUser.id,
          recipient_type: 'founder',
          recipient_id: null, // Will be handled by RLS policies
          message_title: messageTitle.trim(),
          message_detail: messageDetail.trim(),
          message_status: 'unread'
        }]);

      if (error) {
        console.error('Error sending message:', error);
        setMessageStatus({ type: 'error', text: 'Failed to send message. Please try again.' });
        return;
      }

      setMessageStatus({ type: 'success', text: 'Message sent successfully!' });
      setMessageTitle('');
      setMessageDetail('');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessageStatus(null);
        setShowMessageForm(false);
      }, 3000);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessageStatus({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen font-arial transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading company details...</p>
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
            <p className="text-red-600 mb-4">{error || 'Company not found'}</p>
            <Link 
              to="/dashboard" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
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
                      <Link to="/company-list" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                        Edit Company
                      </Link>
                      <Link to="/edit-prompts" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                        Edit Prompts
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Venture Detail</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Detailed information about {company.name}
          </p>
        </div>

        {/* Message Status */}
        {messageStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageStatus.type === 'success' 
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            <div className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              {messageStatus.text}
            </div>
          </div>
        )}

        {/* Company Name and Action Buttons */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">{company.name}</h2>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {['Submitted', 'Analyze', 'Reject', 'Diligence', 'Invest'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    company.status === status
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isUpdating ? 'Updating...' : status}
                </button>
              ))}
              
              {/* Send Message Button */}
              <button
                onClick={() => setShowMessageForm(!showMessageForm)}
                className="px-4 py-2 rounded-lg font-semibold transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </button>
            </div>
            
            {/* Current Status Display */}
            <div className="flex items-center">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mr-2`}>
                Current Status:
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                company.status === 'Submitted' ? 'bg-gray-100 text-gray-800' :
                company.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                company.status === 'Analyzed' ? 'bg-blue-100 text-blue-800' :
                company.status === 'Invested' ? 'bg-green-100 text-green-800' :
                company.status === 'Diligence' ? 'bg-purple-100 text-purple-800' :
                'bg-red-100 text-red-800'
              }`}>
                {company.status || 'Submitted'}
              </span>
            </div>
          </div>
        </div>

        {/* Message Form */}
        {showMessageForm && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-green-600 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Send Message to Founder
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Message Title
                  </label>
                  <input
                    type="text"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    placeholder="Enter message title"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Message
                  </label>
                  <textarea
                    value={messageDetail}
                    onChange={(e) => setMessageDetail(e.target.value)}
                    placeholder="Enter your message"
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !messageTitle.trim() || !messageDetail.trim()}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                  <button
                    onClick={() => {
                      setShowMessageForm(false);
                      setMessageTitle('');
                      setMessageDetail('');
                      setMessageStatus(null);
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      isDark 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results Section */}
        {company.status === 'Analyzed' && company.overall_score && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-blue-600 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analysis Results
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {company.overall_score}/10
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Overall Score
                  </div>
                </div>
                
                {/* Recommendation */}
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    company.recommendation === 'Invest' ? 'text-green-600' :
                    company.recommendation === 'Consider' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {company.recommendation}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Recommendation
                  </div>
                </div>
                
                {/* Analysis Date */}
                <div className="text-center">
                  <div className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    {analysisReports.length > 0 
                      ? new Date(analysisReports[0].generated_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Analysis Date
                  </div>
                </div>
              </div>
              
              {/* Summary Score and Recommendation */}
              {analysisReports.find(r => r.report_type === 'summary') && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'} mb-4`}>
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">Summary Score and Recommendation</h3>
                  <button
                    onClick={() => handleDownloadReport(analysisReports.find(r => r.report_type === 'summary')!)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Summary Report
                  </button>
                </div>
              )}
              
              {/* Uploaded Documents */}
              {documents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{doc.document_name}</h4>
                            {doc.description && (
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                {doc.description}
                              </p>
                            )}
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                              Uploaded: {new Date(doc.date_added).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors ml-2 flex-shrink-0"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Downloadable Reports */}
              {analysisReports.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Analysis Reports</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisReports.map((report) => (
                      <div key={report.id} className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold capitalize">
                              {report.report_type === 'summary' ? 'Summary Report' :
                               report.report_type === 'detailed' ? 'Detailed Analysis' :
                               'Company Feedback'}
                            </h4>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Generated: {new Date(report.generated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Download report"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Company Information Card */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Company Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Industry */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Industry
                </label>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  {company.industry || 'Not specified'}
                </p>
              </div>

              {/* Date Submitted */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Date Submitted
                </label>
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

              {/* Status */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Status
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  company.status === 'Submitted' ? 'bg-gray-100 text-gray-800' :
                  company.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  company.status === 'Analyzed' ? 'bg-blue-100 text-blue-800' :
                  company.status === 'Invested' ? 'bg-green-100 text-green-800' :
                  company.status === 'In-Diligence' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {company.status || 'Submitted'}
                </span>
              </div>

              {/* Funding Sought */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Funding Sought
                </label>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  {company.funding_sought || 'Not specified'}
                </p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  Description
                </label>
                <div className="flex items-start">
                  <FileText className="w-4 h-4 mr-2 text-orange-500 mt-1 flex-shrink-0" />
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {company.description || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Contact Name */}
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Contact Name
                    </label>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-orange-500" />
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {company.contact_name || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Email
                    </label>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-orange-500" />
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {company.email_1 ? (
                          <a 
                            href={`mailto:${company.email_1}`} 
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {company.email_1}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Phone
                    </label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-orange-500" />
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {company.phone_1 ? (
                          <a 
                            href={`tel:${company.phone_1}`} 
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {company.phone_1}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

export default VentureDetail;