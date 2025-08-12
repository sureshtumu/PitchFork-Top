import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Building2, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/supabase';

interface FounderSubmissionProps {
  isDark: boolean;
  toggleTheme: () => void;
}

interface CompanyData {
  name: string;
  industry: string;
  address: string;
  country: string;
  contact_name_1: string;
  title_1: string;
  email_1: string;
  phone_1: string;
  contact_name_2: string;
  title_2: string;
  email_2: string;
  phone_2: string;
  description: string;
  funding_sought: string;
}

const FounderSubmission: React.FC<FounderSubmissionProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    industry: '',
    address: '',
    country: '',
    contact_name_1: '',
    title_1: '',
    email_1: '',
    phone_1: '',
    contact_name_2: '',
    title_2: '',
    email_2: '',
    phone_2: '',
    description: '',
    funding_sought: ''
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentMetadata, setDocumentMetadata] = useState<{[key: string]: {name: string, description: string}}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user data and prefill form
  React.useEffect(() => {
    const loadUserData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Prefill form with user registration data
      setCompanyData(prev => ({
        ...prev,
        contact_name_1: currentUser.user_metadata?.full_name || `${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`.trim(),
        email_1: currentUser.email || '',
        name: currentUser.user_metadata?.company_name || ''
      }));
      
      setIsInitialized(true);
    };

    loadUserData();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.xls', '.xlsx'];
    
    // Filter valid files
    const validFiles = newFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedExtensions.includes(extension);
    });

    if (validFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select only PDF, PPT, PPTX, XLS, or XLSX files' });
      return;
    }

    // Add new files to existing ones (avoid duplicates)
    const existingFileNames = selectedFiles.map(f => f.name);
    const uniqueNewFiles = validFiles.filter(file => !existingFileNames.includes(file.name));
    
    if (uniqueNewFiles.length === 0) {
      setMessage({ type: 'error', text: 'These files are already selected' });
      return;
    }

    const updatedFiles = [...selectedFiles, ...uniqueNewFiles];
    setSelectedFiles(updatedFiles);

    // Create FileList for form compatibility
    const dt = new DataTransfer();
    updatedFiles.forEach(file => dt.items.add(file));
    setFiles(dt.files);
    
    // Initialize metadata for new files only
    const newMetadata = { ...documentMetadata };
    uniqueNewFiles.forEach(file => {
      newMetadata[file.name] = {
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default name
        description: ''
      };
    });
    setDocumentMetadata(newMetadata);
    
    // Clear any error messages
    setMessage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    const updatedFiles = selectedFiles.filter(file => file.name !== fileName);
    setSelectedFiles(updatedFiles);

    // Update FileList
    const dt = new DataTransfer();
    updatedFiles.forEach(file => dt.items.add(file));
    setFiles(dt.files);

    // Remove metadata
    const newMetadata = { ...documentMetadata };
    delete newMetadata[fileName];
    setDocumentMetadata(newMetadata);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyData.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a company name' });
      return;
    }

    if (!companyData.email_1.trim()) {
      setMessage({ type: 'error', text: 'Please enter a contact email' });
      return;
    }

    if (!files || files.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one file to upload' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      // Check if company already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', companyData.name.trim())
        .maybeSingle();

      let company = existingCompany;

      if (!company) {
        // Insert new company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([companyData])
          .select()
          .single();

        if (companyError) {
          console.error('Error adding company:', companyError);
          setMessage({ type: 'error', text: 'Failed to add company information' });
          return;
        }

        company = newCompany;
      }

      // Upload files
      const uploadPromises = [];
      const documentRecords = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
      const { error: dbError } = await supabase
        .from('documents')
        .insert(documentRecords);

      if (dbError) {
        console.error('Database error:', dbError);
        setMessage({ type: 'error', text: 'Files uploaded but failed to save records' });
        return;
      }

      // Create welcome message for the founder
      const currentUser = await getCurrentUser();
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          company_id: company.id,
          sender_type: 'system',
          sender_id: null,
          recipient_type: 'founder',
          recipient_id: currentUser?.id || null,
          message_title: 'Welcome to Pitch Fork!',
          message_detail: 'Thank you for submitting your company information. We will notify you on the next steps. Please login to see the status and to address any questions that have been asked.',
          message_status: 'unread'
        }]);

      if (messageError) {
        console.error('Error creating welcome message:', messageError);
      }

      setMessage({ type: 'success', text: 'Pitch deck submitted successfully! Investors will review your submission.' });
      
      // Navigate back to founder dashboard after successful submission
      setTimeout(() => {
        navigate('/founder-dashboard');
      }, 2000); // Wait 2 seconds to show success message
      
      // Reset form
      setCompanyData({
        name: '',
        industry: '',
        address: '',
        country: '',
        contact_name_1: '',
        title_1: '',
        email_1: '',
        phone_1: '',
        contact_name_2: '',
        title_2: '',
        email_2: '',
        phone_2: '',
        description: '',
        funding_sought: ''
      });
      setFiles(null);
      setSelectedFiles([]);
      setDocumentMetadata({});
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ type: 'error', text: 'Failed to submit pitch deck' });
    } finally {
      setIsLoading(false);
    }
  };

  const allowedFileTypes = '.pdf,.ppt,.pptx,.xls,.xlsx';

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className={`min-h-screen font-arial transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading form...</p>
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
            <Link to="/" className="flex items-center">
              <img src="/pitch-fork3.png" alt="Pitch Fork Logo" className="w-8 h-8 mr-3" />
              <div className="text-2xl font-bold text-blue-600">
                Pitch Fork
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className={`flex items-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Submit Your Pitch Deck</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Share your company information and pitch materials with investors
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
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Company Information */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Company Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={companyData.name}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={companyData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology, Healthcare"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={companyData.address}
                    onChange={handleInputChange}
                    placeholder="Company address"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={companyData.country}
                    onChange={handleInputChange}
                    placeholder="Country"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                {/* Primary Contact */}
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">Primary Contact *</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="contact_name_1"
                      required
                      value={companyData.contact_name_1}
                      onChange={handleInputChange}
                      placeholder="Contact name"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <input
                      type="text"
                      name="title_1"
                      value={companyData.title_1}
                      onChange={handleInputChange}
                      placeholder="Title"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <input
                      type="email"
                      name="email_1"
                      required
                      value={companyData.email_1}
                      onChange={handleInputChange}
                      placeholder="Email *"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <input
                      type="tel"
                      name="phone_1"
                      value={companyData.phone_1}
                      onChange={handleInputChange}
                      placeholder="Phone"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
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
                      name="contact_name_2"
                      value={companyData.contact_name_2}
                      onChange={handleInputChange}
                      placeholder="Contact name"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <input
                      type="text"
                      name="title_2"
                      value={companyData.title_2}
                      onChange={handleInputChange}
                      placeholder="Title"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <input
                      type="email"
                      name="email_2"
                      value={companyData.email_2}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                    <input
                      type="tel"
                      name="phone_2"
                      value={companyData.phone_2}
                      onChange={handleInputChange}
                      placeholder="Phone"
                      className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
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
                    name="description"
                    value={companyData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of your company and what you do"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Funding Sought
                  </label>
                  <input
                    type="text"
                    name="funding_sought"
                    value={companyData.funding_sought}
                    onChange={handleInputChange}
                    placeholder="e.g., $500K Series A, $2M Seed Round"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Pitch Deck & Documents
              </h2>
            </div>
            <div className="p-6">
              {/* File Input */}
              <div 
                className={`mb-6 p-6 border-2 border-dashed rounded-lg transition-colors ${
                  isDragOver 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                    : isDark 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-300 bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center mb-4">
                  <Upload className={`w-12 h-12 mx-auto mb-2 ${isDragOver ? 'text-orange-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {isDragOver ? 'Drop your files here' : 'Drag your pitch deck and documents here, or click below to browse'}
                  </p>
                </div>
                <label htmlFor="file-input" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 text-center`}>
                  Select Additional Files
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept={allowedFileTypes}
                  onChange={handleFileChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3' 
                      : 'bg-white border-gray-300 text-gray-900 file:bg-gray-100 file:text-gray-700 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3'
                  }`}
                />
              </div>
              <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Accepted formats: PDF, PPT, PPTX, XLS, XLSX
              </p>

              {/* Selected Files Display */}
              {selectedFiles.length > 0 && (
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Selected Files ({selectedFiles.length}):
                  </h3>
                  <div className="space-y-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className={`p-3 rounded border ${isDark ? 'border-gray-600 bg-gray-600' : 'border-gray-300 bg-white'}`}>
                        <div className={`flex items-center justify-between text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.name)}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                              Document Name
                            </label>
                            <input
                              type="text"
                              value={documentMetadata[file.name]?.name || ''}
                              onChange={(e) => handleMetadataChange(file.name, 'name', e.target.value)}
                              placeholder="Document name"
                              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                              Description
                            </label>
                            <input
                              type="text"
                              value={documentMetadata[file.name]?.description || ''}
                              onChange={(e) => handleMetadataChange(file.name, 'description', e.target.value)}
                              placeholder="Document description"
                              className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading || selectedFiles.length === 0}
              className="bg-orange-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center text-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              {isLoading ? 'Submitting...' : 'Submit Pitch Deck'}
            </button>
          </div>
        </form>
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

export default FounderSubmission;