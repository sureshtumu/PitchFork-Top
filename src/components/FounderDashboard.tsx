import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, FileText, User, ChevronDown, Upload, BarChart3, Trash2, Eye } from 'lucide-react';
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

interface FounderMessage {
  id: string;
  company_id: string;
  title: string;
  message: string;
  status: string;
  date_sent: string;
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
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [messages, setMessages] = useState<FounderMessage[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<{[key: string]: {name: string, description: string}}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
        .eq('email_1', currentUser.email)
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
      setIsLoadingDocuments(true);
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
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadMessages = async (companyId: string) => {
    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('founder_messages')
        .select('*')
        .eq('company_id', companyId)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFiles(e.target.files);
    
    // Initialize metadata for new files
    if (e.target.files) {
      const newMetadata: {[key: string]: {name: string, description: string}} = {};
      Array.from(e.target.files).forEach(file => {
        newMetadata[file.name] = {
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default name
          description: ''
        };
      });
      setDocumentMetadata(newMetadata);
    }
  };

  const handleMetadataChange = (filename: string, field: 'name' | 'description', value: string) => {
    setDocumentMetadata(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async () => {
    if (!company || !newFiles || newFiles.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = [];
      const documentRecords = [];

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const filePath = `${company.id}/${file.name}`;
        const metadata = documentMetadata[file.name] || { name: file.name, description: '' };

        // Upload file to Supabase Storage
        const uploadPromise = supabase.storage
          .from('company-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        uploadPromises.push(uploadPromise);
        documentRecords.push({
          company_id: company.id,
          filename: file.name,
          document_name: metadata.name,
          description: metadata.description,
          path: filePath
        });
      }

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      // Check for upload errors
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        console.error('Upload errors:', failedUploads);
        setMessage({ type: 'error', text: `Failed to upload ${failedUploads.length} file(s)` });
        return;
      }

      // Insert document records into database
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert(documentRecords)
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        setMessage({ type: 'error', text: 'Files uploaded but failed to save records' });
        return;
      }

      // Add new documents to the list
      setDocuments(prev => [...(data || []), ...prev]);
      setMessage({ type: 'success', text: 'Files uploaded successfully!' });
      setNewFiles(null);
      setDocumentMetadata({});
      setShowUploadModal(false);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload files' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.document_name}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('company-documents')
        .remove([document.path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) {
        console.error('Error deleting document:', dbError);
        setMessage({ type: 'error', text: 'Failed to delete document' });
        return;
      }

      setDocuments(prev => prev.filter(d => d.id !== document.id));
      setMessage({ type: 'success', text: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  const handleCompanyUpdate = async () => {
    if (!editingCompany || !company) return;

    try {
      setIsUploading(true);
      const { error } = await supabase
        .from('companies')
        .update(editingCompany)
        .eq('id', company.id);

      if (error) {
        console.error('Error updating company:', error);
        setMessage({ type: 'error', text: 'Failed to update company information' });
        return;
      }

      setCompany(editingCompany);
      setEditingCompany(null);
      setShowEditModal(false);
      setMessage({ type: 'success', text: 'Company information updated successfully' });
    } catch (error) {
      console.error('Error updating company:', error);
      setMessage({ type: 'error', text: 'Failed to update company information' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleShowAnalysis = () => {
    if (company?.status === 'Pending' || company?.status === 'Submitted') return;
    
    // TODO: Implement PDF analysis display
    alert('Analysis feature will be implemented to show PDF analysis report');
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const allowedFileTypes = '.pdf,.ppt,.pptx,.xls,.xlsx';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Founder Dashboard</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Welcome back{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}! Manage your company submission.
          </p>
        </div>

        {/* No Company Submitted - Show Submit Button */}
        {!company && !isLoading && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} text-center py-16`}>
            <div className="max-w-md mx-auto">
              <Building2 className={`w-16 h-16 mx-auto mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h2 className="text-2xl font-bold text-blue-600 mb-4">Submit Your Pitch Deck</h2>
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
                Get started by submitting your company information and pitch deck materials.
              </p>
              <Link
                to="/submit-pitch-deck"
                className="bg-orange-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors inline-flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Founders: Submit Pitch Deck
              </Link>
            </div>
          </div>
        )}

        {/* Company Information and Actions - Only show if company exists */}
        {company && (
          <>
        {/* Messages Section */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Messages from Investors
            </h2>
          </div>
          <div className="p-6">
            {isLoadingMessages ? (
              <div className="text-center py-4">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No messages yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-blue-600">{msg.title}</h4>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(msg.date_sent).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <Building2 className="w-5 h-5 mr-2" />
              ) : (
                <FileText className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Section 1: Company Information */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-blue-600 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Company Information
                </h2>
                <button
                  onClick={() => {
                    setEditingCompany({ ...company });
                    setShowEditModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit company information"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Company Name
                  </label>
                  <p className="text-xl font-semibold text-blue-600">{company.name}</p>
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
                  <div className="text-2xl font-bold text-orange-500">
                    {company.status || 'Submitted'}
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Industry
                  </label>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {company.industry || 'Not specified'}
                  </p>
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
              </div>
            </div>
          </div>

        {/* Section 2: Action Buttons */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600">Actions</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Documents
              </button>
              
              <button
                onClick={handleShowAnalysis}
                disabled={company?.status === 'Pending' || company?.status === 'Submitted'}
                className={`px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center ${
                  company?.status === 'Pending' || company?.status === 'Submitted'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Show Analysis
              </button>
            </div>
          </div>
        </div>
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

                {/* Description */}
                <div className="md:col-span-2">
                  <label className={\`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    Description
                  </label>
                  <div className="flex items-start">
                    <FileText className="w-4 h-4 mr-2 text-orange-500 mt-1 flex-shrink-0" />
                    <p className={\`${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {company.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Section 2: Action Buttons */}
        <div className={\`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600">Actions</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Documents
              </button>
              
              <button
                onClick={handleShowAnalysis}
                disabled={company?.status === 'Pending'}
                className={\`px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center ${
                  company?.status === 'Pending'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Show Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className={\`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-600 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Uploaded Documents
            </h2>
          </div>
          <div className="p-6">
            {isLoadingDocuments ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading documents...</div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className={\`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <div className={\`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No documents uploaded yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className={\`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
                          <h4 className="font-semibold">{document.document_name}</h4>
                        </div>
                        <p className={\`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                          {document.description || 'No description'}
                        </p>
                        <p className={\`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          File: {document.filename} • Added: {new Date(document.date_added).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDocumentDelete(document)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>

      {/* Edit Company Modal */}
      {showEditModal && editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={\`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-blue-600">Edit Company Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Basic Information */}
                <div>
                  <label className={\`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={editingCompany.name}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={\`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Industry
                  </label>
                  <input
                    type="text"
                    value={editingCompany.industry || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, industry: e.target.value } : null)}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={\`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={editingCompany.address || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, address: e.target.value } : null)}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={\`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Country
                  </label>
                  <input
                    type="text"
                    value={editingCompany.country || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, country: e.target.value } : null)}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                {/* Primary Contact */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Primary Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editingCompany.contact_name_1 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, contact_name_1: e.target.value } : null)}
                      placeholder="Contact name"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={editingCompany.title_1 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, title_1: e.target.value } : null)}
                      placeholder="Title"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="email"
                      value={editingCompany.email_1 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, email_1: e.target.value } : null)}
                      placeholder="Email"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="tel"
                      value={editingCompany.phone_1 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, phone_1: e.target.value } : null)}
                      placeholder="Phone"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                {/* Secondary Contact */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Secondary Contact (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editingCompany.contact_name_2 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, contact_name_2: e.target.value } : null)}
                      placeholder="Contact name"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={editingCompany.title_2 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, title_2: e.target.value } : null)}
                      placeholder="Title"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="email"
                      value={editingCompany.email_2 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, email_2: e.target.value } : null)}
                      placeholder="Email"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="tel"
                      value={editingCompany.phone_2 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, phone_2: e.target.value } : null)}
                      placeholder="Phone"
                      className={\`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                {/* Description and Funding */}
                <div className="md:col-span-2">
                  <label className={\`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Company Description
                  </label>
                  <textarea
                    value={editingCompany.description || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className={\`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Funding Sought
                  </label>
                  <input
                    type="text"
                    value={editingCompany.funding_sought || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, funding_sought: e.target.value } : null)}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCompany(null);
                  }}
                  className={\`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isDark 
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompanyUpdate}
                  disabled={isUploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={\`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-blue-600">Upload Documents</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept={allowedFileTypes}
                  onChange={handleFileChange}
                  className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3' 
                      : 'bg-white border-gray-300 text-gray-900 file:bg-gray-100 file:text-gray-700 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3'
                  }`}
                />
                <p className={\`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Accepted formats: PDF, PPT, PPTX, XLS, XLSX
                </p>
              </div>
              
              {/* File Metadata */}
              {newFiles && newFiles.length > 0 && (
                <div className="space-y-4 mb-4">
                  {Array.from(newFiles).map((file, index) => (
                    <div key={index} className={\`p-3 rounded border ${isDark ? 'border-gray-500 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                      <div className={\`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        <FileText className="w-4 h-4 mr-2" />
                        {file.name}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={documentMetadata[file.name]?.name || ''}
                          onChange={(e) => handleMetadataChange(file.name, 'name', e.target.value)}
                          placeholder="Document name"
                          className={\`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            isDark 
                              ? 'bg-gray-600 border-gray-500 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        <input
                          type="text"
                          value={documentMetadata[file.name]?.description || ''}
                          onChange={(e) => handleMetadataChange(file.name, 'description', e.target.value)}
                          placeholder="Description"
                          className={\`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            isDark 
                              ? 'bg-gray-600 border-gray-500 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setNewFiles(null);
                    setDocumentMetadata({});
                  }}
                  className={\`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isDark 
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={isUploading || !newFiles || newFiles.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={\`py-8 ${isDark ? 'bg-gray-800' : 'bg-gray-900'} text-white mt-12`}>
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