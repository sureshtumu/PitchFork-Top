import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, FileText, User, ChevronDown, Plus, Edit3, Trash2, Download, Save, X } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

interface EditCompanyProps {
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

const EditCompany: React.FC<EditCompanyProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<{[key: string]: {name: string, description: string}}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUtilitiesMenu, setShowUtilitiesMenu] = useState(false);
  const [showAddFiles, setShowAddFiles] = useState(false);

  // Check authentication and load companies
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      // Check if company data was passed from FounderDashboard
      if (location.state?.company) {
        const company = location.state.company;
        setSelectedCompany(company);
        setEditingCompany({ ...company });
        await loadDocuments(company.id);
      } else {
        await loadCompanies();
      }
    };
    
    checkAuthAndLoadData();
  }, [navigate, location.state]);

  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading companies:', error);
        setMessage({ type: 'error', text: 'Failed to load companies' });
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    } finally {
      setIsLoadingCompanies(false);
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
        setMessage({ type: 'error', text: 'Failed to load documents' });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setMessage({ type: 'error', text: 'Failed to load documents' });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleCompanySelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setSelectedCompany(null);
      setEditingCompany(null);
      setDocuments([]);
    } else {
      const company = companies.find(c => c.id === value);
      if (company) {
        setSelectedCompany(company);
        setEditingCompany({ ...company });
        await loadDocuments(company.id);
      }
    }
  };

  const handleCompanyUpdate = async () => {
    if (!editingCompany || !selectedCompany) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('companies')
        .update(editingCompany)
        .eq('id', selectedCompany.id);

      if (error) {
        console.error('Error updating company:', error);
        setMessage({ type: 'error', text: 'Failed to update company' });
        return;
      }

      setSelectedCompany(editingCompany);
      // Update in companies list
      setCompanies(prev => prev.map(c => c.id === editingCompany.id ? editingCompany : c));
      setMessage({ type: 'success', text: 'Company updated successfully' });
    } catch (error) {
      console.error('Error updating company:', error);
      setMessage({ type: 'error', text: 'Failed to update company' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpdate = async () => {
    if (!editingDocument) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('documents')
        .update({
          document_name: editingDocument.document_name,
          description: editingDocument.description
        })
        .eq('id', editingDocument.id);

      if (error) {
        console.error('Error updating document:', error);
        setMessage({ type: 'error', text: 'Failed to update document' });
        return;
      }

      // Update in documents list
      setDocuments(prev => prev.map(d => d.id === editingDocument.id ? editingDocument : d));
      setEditingDocument(null);
      setMessage({ type: 'success', text: 'Document updated successfully' });
    } catch (error) {
      console.error('Error updating document:', error);
      setMessage({ type: 'error', text: 'Failed to update document' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.document_name}"?`)) return;

    try {
      setIsLoading(true);
      
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
    } finally {
      setIsLoading(false);
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
    if (!selectedCompany || !newFiles || newFiles.length === 0) return;

    try {
      setIsLoading(true);
      const uploadPromises = [];
      const documentRecords = [];

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const filePath = `${selectedCompany.id}/${file.name}`;
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
          company_id: selectedCompany.id,
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
      setShowAddFiles(false);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload files' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

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
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>Dashboard</Link>
                <Link to="/reports" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors`}>Reports</Link>
                
                {/* Utilities Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUtilitiesMenu(!showUtilitiesMenu)}
                    className={`flex items-center text-blue-600 font-medium transition-colors`}
                  >
                    Utilities <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {showUtilitiesMenu && (
                    <div className={`absolute top-full left-0 mt-2 w-48 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} z-50`}>
                      <Link to="/submit-files" className={`block px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}>
                        Submit Files
                      </Link>
                      <Link to="/edit-company" className={`block px-4 py-2 text-sm text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20`}>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Edit Company{selectedCompany ? `: ${selectedCompany.name}` : ''}
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage company information and documents
          </p>
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
                <X className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Company Selection - Only show if no company was passed from FounderDashboard */}
        {!location.state?.company && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-blue-600 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Company Selection
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="company-select" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Select Company to Edit
                </label>
                <select
                  id="company-select"
                  onChange={handleCompanySelect}
                  value={selectedCompany?.id || ''}
                  disabled={isLoadingCompanies}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">
                    {isLoadingCompanies ? 'Loading companies...' : 'Select a company'}
                  </option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Company Details Editor */}
        {editingCompany && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-blue-600 flex items-center">
                <Edit3 className="w-5 h-5 mr-2" />
                Company Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Basic Information */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={editingCompany.name}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Industry
                  </label>
                  <input
                    type="text"
                    value={editingCompany.industry || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, industry: e.target.value } : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={editingCompany.address || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, address: e.target.value } : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Country
                  </label>
                  <input
                    type="text"
                    value={editingCompany.country || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, country: e.target.value } : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                {/* Secondary Contact */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Secondary Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editingCompany.contact_name_2 || ''}
                      onChange={(e) => setEditingCompany(prev => prev ? { ...prev, contact_name_2: e.target.value } : null)}
                      placeholder="Contact name"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                
                {/* Description and Funding */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Company Description
                  </label>
                  <textarea
                    value={editingCompany.description || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Funding Sought
                  </label>
                  <input
                    type="text"
                    value={editingCompany.funding_sought || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, funding_sought: e.target.value } : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <button
                onClick={handleCompanyUpdate}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Documents Section */}
        {selectedCompany && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-blue-600 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Documents
                </h2>
                <button
                  onClick={() => setShowAddFiles(!showAddFiles)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Files
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Add Files Section */}
              {showAddFiles && (
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-medium mb-4">Upload New Documents</h3>
                  <div className="mb-4">
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept={allowedFileTypes}
                      onChange={handleFileChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white file:bg-gray-500 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3' 
                          : 'bg-white border-gray-300 text-gray-900 file:bg-gray-100 file:text-gray-700 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3'
                      }`}
                    />
                  </div>
                  
                  {/* File Metadata */}
                  {newFiles && newFiles.length > 0 && (
                    <div className="space-y-4 mb-4">
                      {Array.from(newFiles).map((file, index) => (
                        <div key={index} className={`p-3 rounded border ${isDark ? 'border-gray-500 bg-gray-600' : 'border-gray-300 bg-white'}`}>
                          <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            <FileText className="w-4 h-4 mr-2" />
                            {file.name}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={documentMetadata[file.name]?.name || ''}
                              onChange={(e) => handleMetadataChange(file.name, 'name', e.target.value)}
                              placeholder="Document name"
                              className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-500 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                            <input
                              type="text"
                              value={documentMetadata[file.name]?.description || ''}
                              onChange={(e) => handleMetadataChange(file.name, 'description', e.target.value)}
                              placeholder="Description"
                              className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-500 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleFileUpload}
                      disabled={isLoading || !newFiles || newFiles.length === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Uploading...' : 'Upload Files'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddFiles(false);
                        setNewFiles(null);
                        setDocumentMetadata({});
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        isDark 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Documents List */}
              {isLoadingDocuments ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading documents...</div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No documents uploaded yet</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((document) => (
                    <div key={document.id} className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      {editingDocument?.id === document.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                Document Name
                              </label>
                              <input
                                type="text"
                                value={editingDocument.document_name}
                                onChange={(e) => setEditingDocument(prev => prev ? { ...prev, document_name: e.target.value } : null)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                                Description
                              </label>
                              <input
                                type="text"
                                value={editingDocument.description}
                                onChange={(e) => setEditingDocument(prev => prev ? { ...prev, description: e.target.value } : null)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleDocumentUpdate}
                              disabled={isLoading}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Save className="w-3 h-3 mr-1 inline" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingDocument(null)}
                              className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                isDark 
                                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <FileText className="w-4 h-4 mr-2 text-blue-500" />
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
                            <button
                              onClick={() => setEditingDocument(document)}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit document"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDocumentDelete(document)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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

export default EditCompany;