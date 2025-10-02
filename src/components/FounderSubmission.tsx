import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Building2, FileText, CheckCircle, AlertCircle, User, ChevronDown, Save, Play } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

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
  title: string;
  email: string;
  phone: string;
  description: string;
  funding_terms: string;
  key_team_members: string;
  revenue: string;
  valuation: string;
  url: string;
}

const FounderSubmission: React.FC<FounderSubmissionProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload Pitch Deck, 2: Company Info, 3: Additional Documents
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    industry: '',
    address: '',
    country: '',
    contact_name_1: '',
    title: '',
    email: '',
    phone: '',
    description: '',
    funding_terms: '',
    key_team_members: '',
    revenue: '',
    valuation: '',
    url: ''
  });
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<{[key: string]: {name: string, description: string}}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [extractionComplete, setExtractionComplete] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      // Pre-fill email from user data
      const userData = currentUser.user_metadata || {};
      setCompanyData(prev => ({
        ...prev,
        name: userData.company_name || 'TechStart Innovations',
        contact_name_1: userData.full_name || `${userData.first_name || 'John'} ${userData.last_name || 'Doe'}`,
        email: currentUser.email || 'john.doe@techstart.com',
        phone: userData.phone_number || '+1 (555) 123-4567',
        industry: 'Technology',
        address: '123 Innovation Drive, Suite 100',
        country: 'United States',
        description: 'A cutting-edge technology company focused on AI-driven solutions for modern businesses. We specialize in developing innovative software products that help companies streamline their operations and improve efficiency.',
        funding_terms: 'Seeking $2M Series A funding for product development, market expansion, and team growth. Offering 15% equity with board seat.',
        key_team_members: 'John Doe (CEO) - 10+ years in tech leadership, former VP at Google. Jane Smith (CTO) - PhD in Computer Science, AI expert. Mike Johnson (VP Sales) - 8 years enterprise sales experience.',
        revenue: '$500K ARR with 40% month-over-month growth',
        valuation: '$10M pre-money valuation based on comparable companies and revenue multiples',
        url: 'https://www.techstart-innovations.com'
      }));
    };
    
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePitchDeckUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeckFile(e.target.files[0]);
    }
  };

  const handleContinueFromPitchDeck = () => {
    if (!pitchDeckFile) {
      setMessage({ type: 'error', text: 'Please select a pitch deck file to continue' });
      return;
    }
    
    // Call the extraction function
    extractCompanySpecs();
  };

  const extractCompanySpecs = async () => {
    if (!pitchDeckFile) return;

    try {
      setIsLoading(true);
      setMessage({ type: 'success', text: 'Analyzing your pitch deck with AI...' });

      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', pitchDeckFile);

      // Call the Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-company-specs-from-pitchdeck`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Populate the form fields with extracted data
        const extractedData = result.data;
        setCompanyData(prev => ({
          ...prev,
          name: extractedData.name || prev.name,
          url: extractedData.url || prev.url,
          description: extractedData.description || prev.description,
          industry: extractedData.industry || prev.industry,
          country: extractedData.country || prev.country,
          key_team_members: extractedData.key_team_members || prev.key_team_members,
          revenue: extractedData.revenue || prev.revenue,
          valuation: extractedData.valuation || prev.valuation,
          funding_terms: extractedData.funding_sought || prev.funding_terms
        }));

        setExtractionComplete(true);
        setMessage({ type: 'success', text: 'AI extraction completed! Review and edit the information below.' });
      } else {
        throw new Error(result.error || 'Failed to extract company information');
      }

    } catch (error) {
      console.error('Extraction error:', error);
      setMessage({ 
        type: 'error', 
        text: 'AI extraction failed. Please fill in the information manually.' 
      });
    } finally {
      setIsLoading(false);
      setCurrentStep(2);
    }
  };

  const handleSubmitCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyData.name.trim()) {
      setMessage({ type: 'error', text: 'Company name is required' });
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

      if (existingCompany) {
        setMessage({ type: 'error', text: 'A company with this name already exists' });
        setIsLoading(false);
        return;
      }

      // Insert new company
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...companyData,
          status: 'Submitted',
          date_submitted: new Date().toISOString(),
          recommendation: 'Pending Analysis'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        setMessage({ type: 'error', text: 'Failed to submit company information' });
        return;
      }

      setMessage({ type: 'success', text: 'Company information submitted successfully!' });
      
      // Move to step 3 for additional document upload
      setCurrentStep(3);
      
      // Store company ID for document upload
      sessionStorage.setItem('companyId', data.id);

    } catch (error) {
      console.error('Error submitting company:', error);
      setMessage({ type: 'error', text: 'Failed to submit company information' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    
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
    const companyId = sessionStorage.getItem('companyId');
    if (!companyId) {
      setMessage({ type: 'error', text: 'Company information not found. Please start over.' });
      return;
    }

    if (!pitchDeckFile && (!files || files.length === 0)) {
      // Allow skipping file upload
      setMessage({ type: 'success', text: 'Company submission completed successfully!' });
      setTimeout(() => {
        navigate('/founder-dashboard');
      }, 2000);
      return;
    }

    try {
      setIsLoading(true);
      const uploadPromises = [];
      const documentRecords = [];

      // First upload the pitch deck
      if (pitchDeckFile) {
        const pitchDeckPath = `${companyId}/pitch-deck-${pitchDeckFile.name}`;
        const pitchDeckUpload = supabase.storage
          .from('company-documents')
          .upload(pitchDeckPath, pitchDeckFile, {
            cacheControl: '3600',
            upsert: false
          });

        uploadPromises.push(pitchDeckUpload);
        documentRecords.push({
          company_id: companyId,
          filename: pitchDeckFile.name,
          document_name: 'Pitch Deck',
          description: 'Company pitch deck presentation',
          path: pitchDeckPath
        });
      }

      // Then upload additional files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = `${companyId}/${file.name}`;
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
            company_id: companyId,
            filename: file.name,
            document_name: metadata.name,
            description: metadata.description,
            path: filePath
          });
        }
      }

      if (uploadPromises.length > 0) {
        const uploadResults = await Promise.all(uploadPromises);
        
        // Check for upload errors
        const failedUploads = uploadResults.filter(result => result.error);
        if (failedUploads.length > 0) {
          console.error('Upload errors:', failedUploads);
          setMessage({ type: 'error', text: `Failed to upload ${failedUploads.length} file(s)` });
          return;
        }

        if (documentRecords.length > 0) {
          // Insert document records into database
          const { error: dbError } = await supabase
            .from('documents')
            .insert(documentRecords);

          if (dbError) {
            console.error('Database error:', dbError);
            setMessage({ type: 'error', text: 'Failed to save document records' });
            return;
          }
        }
      }

      setMessage({ type: 'success', text: 'Company and documents submitted successfully!' });
      
      // Clean up session storage
      sessionStorage.removeItem('companyId');
      
      // Redirect to founder dashboard after success
      setTimeout(() => {
        navigate('/founder-dashboard');
      }, 2000);

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

  const allowedFileTypes = '.pdf,.ppt,.pptx,.xls,.xlsx,.doc,.docx';

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
              
              {/* Back to Home */}
              <Link 
                to="/" 
                className={`flex items-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Link>
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Submit Your Pitch Deck</h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Complete your company information and upload your pitch deck materials
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium">Upload Pitch Deck</span>
            <span className="text-sm font-medium">Company Information</span>
            <span className="text-sm font-medium">Additional Documents</span>
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
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Step 1: Upload Pitch Deck */}
        {currentStep === 1 && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Your Pitch Deck
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center mb-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  Please upload your pitch deck to get started with your submission.
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Accepted formats: PDF, PPT, PPTX
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="pitch-deck-input" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Select Pitch Deck File *
                </label>
                <input
                  id="pitch-deck-input"
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handlePitchDeckUpload}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3' 
                      : 'bg-white border-gray-300 text-gray-900 file:bg-gray-100 file:text-gray-700 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3'
                  }`}
                />
              </div>

              {pitchDeckFile && (
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-green-600 bg-green-900/20' : 'border-green-200 bg-green-50'}`}>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-semibold text-green-600">File Selected</p>
                      <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                        {pitchDeckFile.name} ({(pitchDeckFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleContinueFromPitchDeck}
                  disabled={!pitchDeckFile}
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Continue to Company Information
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Information */}
        {currentStep === 2 && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Company Information
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitCompanyInfo} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete ? 'text-orange-600 font-semibold' : ''}`}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={companyData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your company name"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.industry ? 'text-orange-600 font-semibold' : ''}`}>
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={companyData.industry}
                      onChange={handleInputChange}
                      placeholder="e.g., Technology, Healthcare"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.industry ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.country ? 'text-orange-600 font-semibold' : ''}`}>
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={companyData.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.country ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
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

                  {/* Contact Information */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-orange-600">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Contact Name
                        </label>
                        <input
                          type="text"
                          name="contact_name_1"
                          value={companyData.contact_name_1}
                          onChange={handleInputChange}
                          placeholder="Primary contact name"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={companyData.title}
                          onChange={handleInputChange}
                          placeholder="Job title"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={companyData.email}
                          onChange={handleInputChange}
                          placeholder="Contact email"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={companyData.phone}
                          onChange={handleInputChange}
                          placeholder="Contact phone"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company URL */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.url ? 'text-orange-600 font-semibold' : ''}`}>
                      Company Website
                    </label>
                    <input
                      type="url"
                      name="url"
                      value={companyData.url}
                      onChange={handleInputChange}
                      placeholder="https://www.yourcompany.com"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.url ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.description ? 'text-orange-600 font-semibold' : ''}`}>
                      Company Description
                    </label>
                    <textarea
                      name="description"
                      value={companyData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of your company and what you do"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.description ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Financial Information */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 text-orange-600">Financial Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.revenue ? 'text-orange-600 font-semibold' : ''}`}>
                          Annual Revenue
                        </label>
                        <input
                          type="text"
                          name="revenue"
                          value={companyData.revenue}
                          onChange={handleInputChange}
                          placeholder="e.g., $500K, $2M ARR"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.revenue ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.valuation ? 'text-orange-600 font-semibold' : ''}`}>
                          Current Valuation
                        </label>
                        <input
                          type="text"
                          name="valuation"
                          value={companyData.valuation}
                          onChange={handleInputChange}
                          placeholder="e.g., $10M pre-money"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.valuation ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Funding Terms */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.funding_terms ? 'text-orange-600 font-semibold' : ''}`}>
                      Funding Terms
                    </label>
                    <textarea
                      name="funding_terms"
                      value={companyData.funding_terms}
                      onChange={handleInputChange}
                      placeholder="Describe your funding requirements, terms, and how you plan to use the investment"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.funding_terms ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Key Team Members */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 ${extractionComplete && companyData.key_team_members ? 'text-orange-600 font-semibold' : ''}`}>
                      Key Team Members
                    </label>
                    <textarea
                      name="key_team_members"
                      value={companyData.key_team_members}
                      onChange={handleInputChange}
                      placeholder="List key team members and their roles/backgrounds"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${extractionComplete && companyData.key_team_members ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''} ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isLoading ? 'Submitting...' : 'Submit Company Information'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Additional Document Upload */}
        {currentStep === 3 && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Additional Documents
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your pitch deck has been uploaded. You can optionally upload additional supporting documents.
                </p>
              </div>

              {/* File Input */}
              <div className="mb-6">
                <label htmlFor="file-input" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Select Files (Optional)
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept={allowedFileTypes}
                  onChange={handleFileChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3' 
                      : 'bg-white border-gray-300 text-gray-900 file:bg-gray-100 file:text-gray-700 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3'
                  }`}
                />
                <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Accepted formats: PDF, PPT, PPTX, XLS, XLSX, DOC, DOCX
                </p>
              </div>

              {/* Selected Files Display */}
              {files && files.length > 0 && (
                <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Selected Files ({files.length}):
                  </h3>
                  <div className="space-y-4">
                    {Array.from(files).map((file, index) => (
                      <div key={index} className={`p-3 rounded border ${isDark ? 'border-gray-600 bg-gray-600' : 'border-gray-300 bg-white'}`}>
                        <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          <FileText className="w-4 h-4 mr-2" />
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
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

              {/* Upload/Complete Button */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isDark 
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back to Company Info
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={isLoading}
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {isLoading ? 'Processing...' : files && files.length > 0 ? 'Upload & Complete' : 'Complete Submission'}
                </button>
              </div>
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

export default FounderSubmission;