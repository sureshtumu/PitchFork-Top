import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Building2, FileText, CheckCircle, AlertCircle, BarChart3, Loader } from 'lucide-react';
import { supabase, getCurrentUser } from '../lib/supabase';

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

interface AnalysisResult {
  company_name?: string;
  industry?: string;
  description?: string;
  funding_sought?: string;
  contact_name?: string;
  title?: string;
  address?: string;
  country?: string;
}

const FounderSubmission: React.FC<FounderSubmissionProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'company'>('upload');
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [documentMetadata, setDocumentMetadata] = useState<{[key: string]: {name: string, description: string}}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
        email_1: currentUser.email || ''
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

  const handlePitchDeckUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedExtensions = ['.pdf', '.ppt', '.pptx'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.includes(extension)) {
        setMessage({ type: 'error', text: 'Please select a PDF, PPT, or PPTX file for your pitch deck' });
        return;
      }

      setPitchDeckFile(file);
      setMessage(null);
    }
  };

  const handleAdditionalFiles = (fileList: FileList) => {
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
    const existingFileNames = additionalFiles.map(f => f.name);
    const uniqueNewFiles = validFiles.filter(file => !existingFileNames.includes(file.name));
    
    if (uniqueNewFiles.length === 0) {
      setMessage({ type: 'error', text: 'These files are already selected' });
      return;
    }

    const updatedFiles = [...additionalFiles, ...uniqueNewFiles];
    setAdditionalFiles(updatedFiles);
    
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
      if (currentStep === 'upload') {
        // For pitch deck upload, only take the first file
        const file = droppedFiles[0];
        const allowedExtensions = ['.pdf', '.ppt', '.pptx'];
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (allowedExtensions.includes(extension)) {
          setPitchDeckFile(file);
          setMessage(null);
        } else {
          setMessage({ type: 'error', text: 'Please select a PDF, PPT, or PPTX file for your pitch deck' });
        }
      } else {
        // For additional files
        handleAdditionalFiles(droppedFiles);
      }
    }
  };

  const handleRemoveAdditionalFile = (fileName: string) => {
    const updatedFiles = additionalFiles.filter(file => file.name !== fileName);
    setAdditionalFiles(updatedFiles);

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

  const analyzePitchDeck = async () => {
    if (!pitchDeckFile) {
      setMessage({ type: 'error', text: 'Please select a pitch deck file first' });
      return;
    }

    try {
      setIsAnalyzing(true);
      setMessage(null);
      setCurrentStep('analyze');

      // Simulate AI analysis (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock analysis result (replace with actual AI analysis)
      const mockAnalysis: AnalysisResult = {
        company_name: "TechStart AI",
        industry: "Artificial Intelligence",
        description: "AI-powered analytics platform for enterprise customers",
        funding_sought: "$2M Series A",
        contact_name: companyData.contact_name_1,
        title: "CEO & Founder"
      };

      setAnalysisResult(mockAnalysis);

      // Pre-fill company data with analysis results
      setCompanyData(prev => ({
        ...prev,
        name: mockAnalysis.company_name || prev.name,
        industry: mockAnalysis.industry || prev.industry,
        description: mockAnalysis.description || prev.description,
        funding_sought: mockAnalysis.funding_sought || prev.funding_sought,
        contact_name_1: mockAnalysis.contact_name || prev.contact_name_1,
        title_1: mockAnalysis.title || prev.title_1,
        address: mockAnalysis.address || prev.address,
        country: mockAnalysis.country || prev.country
      }));

      setCurrentStep('company');
      setMessage({ type: 'success', text: 'Pitch deck analyzed successfully! Review and complete the company information below.' });

    } catch (error) {
      console.error('Analysis error:', error);
      setMessage({ type: 'error', text: 'Failed to analyze pitch deck. Please try again.' });
      setCurrentStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
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

    if (!pitchDeckFile) {
      setMessage({ type: 'error', text: 'Please upload a pitch deck' });
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

      // Upload pitch deck and additional files
      const allFiles = [pitchDeckFile, ...additionalFiles];
      const uploadPromises = [];
      const documentRecords = [];

      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const filePath = `${company.id}/${file.name}`;
        const isPitchDeck = file === pitchDeckFile;
        const metadata = isPitchDeck 
          ? { name: 'Pitch Deck', description: 'Main pitch deck presentation' }
          : documentMetadata[file.name] || { name: file.name, description: '' };

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
          message_title: 'Company Submitted',
          message_detail: 'Thank you for submitting your company information',
          message_status: 'unread'
        }]);

      if (messageError) {
        console.error('Error creating welcome message:', messageError);
      }

      setMessage({ type: 'success', text: 'Pitch deck and company information submitted successfully!' });
      
      // Navigate back to founder dashboard after successful submission
      setTimeout(() => {
        navigate('/founder-dashboard');
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ type: 'error', text: 'Failed to submit information' });
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`flex items-center ${currentStep === 'upload' ? 'text-orange-600' : currentStep === 'analyze' || currentStep === 'company' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'upload' ? 'border-orange-600 bg-orange-100' : currentStep === 'analyze' || currentStep === 'company' ? 'border-green-600 bg-green-100' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Upload Pitch Deck</span>
            </div>
            <div className={`w-8 h-1 ${currentStep === 'analyze' || currentStep === 'company' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'analyze' ? 'text-orange-600' : currentStep === 'company' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'analyze' ? 'border-orange-600 bg-orange-100' : currentStep === 'company' ? 'border-green-600 bg-green-100' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">AI Analysis</span>
            </div>
            <div className={`w-8 h-1 ${currentStep === 'company' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${currentStep === 'company' ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 'company' ? 'border-orange-600 bg-orange-100' : 'border-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Company Details</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            {currentStep === 'upload' && 'Upload Your Pitch Deck'}
            {currentStep === 'analyze' && 'Analyzing Your Pitch Deck'}
            {currentStep === 'company' && 'Complete Company Information'}
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentStep === 'upload' && 'Start by uploading your pitch deck for AI analysis'}
            {currentStep === 'analyze' && 'Our AI is analyzing your pitch deck to extract company information'}
            {currentStep === 'company' && 'Review and complete your company information'}
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

        {/* Step 1: Upload Pitch Deck */}
        {currentStep === 'upload' && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Your Pitch Deck
              </h2>
            </div>
            <div className="p-6">
              <div 
                className={`p-8 border-2 border-dashed rounded-lg transition-colors ${
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
                <div className="text-center">
                  <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragOver ? 'text-orange-500' : 'text-gray-400'}`} />
                  <p className={`text-lg mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {pitchDeckFile ? pitchDeckFile.name : 'Drop your pitch deck here or click to browse'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                    Accepted formats: PDF, PPT, PPTX
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={handlePitchDeckUpload}
                    className="hidden"
                    id="pitch-deck-input"
                  />
                  <label
                    htmlFor="pitch-deck-input"
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 cursor-pointer inline-block transition-colors"
                  >
                    Choose File
                  </label>
                </div>
              </div>
              
              {pitchDeckFile && (
                <div className="mt-6 text-center">
                  <button
                    onClick={analyzePitchDeck}
                    disabled={isAnalyzing}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center text-lg"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Continue'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Analysis in Progress */}
        {currentStep === 'analyze' && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
            <div className="p-12 text-center">
              <Loader className="w-16 h-16 mx-auto mb-6 text-orange-600 animate-spin" />
              <h3 className="text-xl font-semibold mb-4">Analyzing Your Pitch Deck</h3>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Our AI is extracting key information from your pitch deck...
              </p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Company Information Form */}
        {currentStep === 'company' && (
          <form onSubmit={handleSubmit}>
            {/* Company Information */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-orange-600 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Company Information
                  {analysisResult && (
                    <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      AI Pre-filled
                    </span>
                  )}
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
                  
                  {/* Financial Information */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-4 text-orange-600">Financial Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Annual Revenue (Value)
                        </label>
                        <input
                          type="number"
                          name="annual_revenue_value"
                          value={companyData.annual_revenue_value || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., 500000"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Annual Revenue (Units)
                        </label>
                        <select
                          name="annual_revenue_units"
                          value={companyData.annual_revenue_units || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select unit</option>
                          <option value="K">K (Thousands)</option>
                          <option value="M">M (Millions)</option>
                          <option value="B">B (Billions)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Annual Revenue (Raw Text)
                        </label>
                        <input
                          type="text"
                          name="annual_revenue_raw"
                          value={companyData.annual_revenue_raw || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., $500K ARR"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Revenue Period
                        </label>
                        <input
                          type="text"
                          name="annual_revenue_period"
                          value={companyData.annual_revenue_period || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., Annual, Monthly"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Investment Information */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-4 text-orange-600">Investment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Investment Amount (Value)
                        </label>
                        <input
                          type="number"
                          name="investment_amount_value"
                          value={companyData.investment_amount_value || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., 2000000"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Investment Amount (Units)
                        </label>
                        <select
                          name="investment_amount_units"
                          value={companyData.investment_amount_units || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select unit</option>
                          <option value="K">K (Thousands)</option>
                          <option value="M">M (Millions)</option>
                          <option value="B">B (Billions)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Investment Amount (Raw Text)
                        </label>
                        <input
                          type="text"
                          name="investment_amount_raw"
                          value={companyData.investment_amount_raw || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., $2M Series A"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Investment Instrument
                        </label>
                        <select
                          name="investment_instrument"
                          value={companyData.investment_instrument || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select instrument</option>
                          <option value="Equity">Equity</option>
                          <option value="Convertible Note">Convertible Note</option>
                          <option value="SAFE">SAFE</option>
                          <option value="Debt">Debt</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Valuation Information */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-4 text-orange-600">Valuation Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Valuation (Value)
                        </label>
                        <input
                          type="number"
                          name="valuation_value"
                          value={companyData.valuation_value || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., 10000000"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Valuation (Units)
                        </label>
                        <select
                          name="valuation_units"
                          value={companyData.valuation_units || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select unit</option>
                          <option value="K">K (Thousands)</option>
                          <option value="M">M (Millions)</option>
                          <option value="B">B (Billions)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Valuation (Raw Text)
                        </label>
                        <input
                          type="text"
                          name="valuation_raw"
                          value={companyData.valuation_raw || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., $10M pre-money"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Valuation Type
                        </label>
                        <select
                          name="valuation_type"
                          value={companyData.valuation_type || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select type</option>
                          <option value="Pre-money">Pre-money</option>
                          <option value="Post-money">Post-money</option>
                          <option value="Cap">Cap</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Market Information */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-4 text-orange-600">Market Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Market Size (Value)
                        </label>
                        <input
                          type="number"
                          name="serviceable_market_size_value"
                          value={companyData.serviceable_market_size_value || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., 1000000000"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Market Size (Units)
                        </label>
                        <select
                          name="serviceable_market_size_units"
                          value={companyData.serviceable_market_size_units || ''}
                          onChange={handleSelectChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select unit</option>
                          <option value="K">K (Thousands)</option>
                          <option value="M">M (Millions)</option>
                          <option value="B">B (Billions)</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Market Size (Raw Text)
                        </label>
                        <input
                          type="text"
                          name="serviceable_market_size_raw"
                          value={companyData.serviceable_market_size_raw || ''}
                          onChange={handleInputChange}
                          placeholder="e.g., $1B TAM"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Market Size Basis
                        </label>
                        <input
                          type="text"
                          name="serviceable_market_size_basis"
                          value={companyData.serviceable_market_size_basis || ''}
                          onChange={handleInputChange}
                          placeholder="Basis for market size calculation"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            isDark 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
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
                  
                  {/* Additional Investment Terms */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Investment Other Terms
                    </label>
                    <textarea
                      name="investment_other_terms"
                      value={companyData.investment_other_terms || ''}
                      onChange={handleInputChange}
                      placeholder="Additional investment terms and conditions"
                      rows={2}
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

            {/* Additional Documents Section */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-orange-600 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Additional Documents (Optional)
                </h2>
              </div>
              <div className="p-6">
                <div 
                  className={`p-6 border-2 border-dashed rounded-lg transition-colors ${
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
                  <div className="text-center">
                    <FileText className={`w-12 h-12 mx-auto mb-2 ${isDragOver ? 'text-orange-500' : 'text-gray-400'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      Drop additional documents here or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.ppt,.pptx,.xls,.xlsx"
                      onChange={(e) => e.target.files && handleAdditionalFiles(e.target.files)}
                      className="hidden"
                      id="additional-files-input"
                    />
                    <label
                      htmlFor="additional-files-input"
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 cursor-pointer inline-block transition-colors"
                    >
                      Choose Files
                    </label>
                  </div>
                </div>
                <p className={`mt-2 text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Accepted formats: PDF, PPT, PPTX, XLS, XLSX
                </p>

                {/* Additional Files Display */}
                {additionalFiles.length > 0 && (
                  <div className={`mt-6 p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Additional Files ({additionalFiles.length}):
                    </h3>
                    <div className="space-y-4">
                      {additionalFiles.map((file, index) => (
                        <div key={index} className={`p-3 rounded border ${isDark ? 'border-gray-600 bg-gray-600' : 'border-gray-300 bg-white'}`}>
                          <div className={`flex items-center justify-between text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdditionalFile(file.name)}
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
                disabled={isLoading}
                className="bg-orange-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center text-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                {isLoading ? 'Submitting...' : 'Submit Company Information'}
              </button>
            </div>
          </form>
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