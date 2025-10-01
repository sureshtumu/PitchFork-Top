import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Building2, FileText, CheckCircle, AlertCircle, User, ChevronDown, Save } from 'lucide-react';
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
  title_1: string;
  email_1: string;
  phone_1: string;
  contact_name_2: string;
  title_2: string;
  email_2: string;
  phone_2: string;
  description: string;
  funding_sought: string;
  serviceable_market_size_value: number | null;
  serviceable_market_size_units: string;
  serviceable_market_size_raw: string;
  serviceable_market_size_basis: string;
  annual_revenue_value: number | null;
  annual_revenue_units: string;
  annual_revenue_raw: string;
  annual_revenue_period: string;
  investment_amount_value: number | null;
  investment_amount_units: string;
  investment_amount_raw: string;
  investment_instrument: string;
  investment_other_terms: string;
  valuation_value: number | null;
  valuation_units: string;
  valuation_raw: string;
  valuation_type: string;
  key_team_members: any[];
}

const FounderSubmission: React.FC<FounderSubmissionProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Company data state
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
    funding_sought: '',
    serviceable_market_size_value: null,
    serviceable_market_size_units: 'M',
    serviceable_market_size_raw: '',
    serviceable_market_size_basis: '',
    annual_revenue_value: null,
    annual_revenue_units: 'K',
    annual_revenue_raw: '',
    annual_revenue_period: 'Annual',
    investment_amount_value: null,
    investment_amount_units: 'M',
    investment_amount_raw: '',
    investment_instrument: 'Equity',
    investment_other_terms: '',
    valuation_value: null,
    valuation_units: 'M',
    valuation_raw: '',
    valuation_type: 'Pre-money',
    key_team_members: []
  });

  // File upload state
  const [files, setFiles] = useState<FileList | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<{[key: string]: {name: string, description: string}}>({});

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      // Pre-fill email from user data
      if (currentUser.email) {
        setCompanyData(prev => ({
          ...prev,
          email_1: currentUser.email
        }));
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('_value')) {
      // Handle numeric fields
      setCompanyData(prev => ({
        ...prev,
        [name]: value === '' ? null : parseFloat(value)
      }));
    } else {
      setCompanyData(prev => ({
        ...prev,
        [name]: value
      }));
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

  const handleSubmitCompany = async () => {
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
        .insert([companyData])
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        setMessage({ type: 'error', text: 'Failed to create company. Please try again.' });
        setIsLoading(false);
        return;
      }

      setMessage({ type: 'success', text: 'Company information submitted successfully!' });
      
      // Move to next step after a short delay
      setTimeout(() => {
        setCurrentStep(2);
        setMessage(null);
      }, 2000);

    } catch (error) {
      console.error('Error submitting company:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!files || files.length === 0) {
      setMessage({ type: 'error', text: 'Please select files to upload' });
      return;
    }

    // Find the company we just created
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('name', companyData.name)
      .single();

    if (!company) {
      setMessage({ type: 'error', text: 'Company not found. Please submit company information first.' });
      return;
    }

    try {
      setIsLoading(true);
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
        setMessage({ type: 'error', text: 'Failed to save document records' });
        return;
      }

      setMessage({ type: 'success', text: 'Files uploaded successfully! Your submission is complete.' });
      
      // Redirect to founder dashboard after success
      setTimeout(() => {
        navigate('/founder-dashboard');
      }, 3000);

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

  const unitOptions = ['K', 'M', 'B'];
  const instrumentOptions = ['Equity', 'Convertible Note', 'SAFE', 'Debt', 'Other'];
  const valuationTypes = ['Pre-money', 'Post-money', 'Cap'];
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
              
              {/* Back to Dashboard */}
              <Link 
                to="/founder-dashboard" 
                className={`flex items-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
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
            Complete your company submission in two simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium">Company Information</span>
            <span className="text-sm font-medium">Upload Documents</span>
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

        {/* Step 1: Company Information */}
        {currentStep === 1 && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Complete Company Information
              </h2>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                </div>

                {/* Primary Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Primary Contact</h3>
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
                        placeholder="Contact name"
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
                        name="title_1"
                        value={companyData.title_1}
                        onChange={handleInputChange}
                        placeholder="Title"
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
                        name="email_1"
                        value={companyData.email_1}
                        onChange={handleInputChange}
                        placeholder="Email"
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
                        name="phone_1"
                        value={companyData.phone_1}
                        onChange={handleInputChange}
                        placeholder="Phone"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Secondary Contact (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="contact_name_2"
                        value={companyData.contact_name_2}
                        onChange={handleInputChange}
                        placeholder="Contact name"
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
                        name="title_2"
                        value={companyData.title_2}
                        onChange={handleInputChange}
                        placeholder="Title"
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
                        name="email_2"
                        value={companyData.email_2}
                        onChange={handleInputChange}
                        placeholder="Email"
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
                        name="phone_2"
                        value={companyData.phone_2}
                        onChange={handleInputChange}
                        placeholder="Phone"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Annual Revenue (Value)
                      </label>
                      <input
                        type="number"
                        name="annual_revenue_value"
                        value={companyData.annual_revenue_value || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., 500"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Units
                      </label>
                      <select
                        name="annual_revenue_units"
                        value={companyData.annual_revenue_units}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Period
                      </label>
                      <select
                        name="annual_revenue_period"
                        value={companyData.annual_revenue_period}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="Annual">Annual</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Investment Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Investment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Investment Amount (Value)
                      </label>
                      <input
                        type="number"
                        name="investment_amount_value"
                        value={companyData.investment_amount_value || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., 2"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Units
                      </label>
                      <select
                        name="investment_amount_units"
                        value={companyData.investment_amount_units}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Investment Instrument
                      </label>
                      <select
                        name="investment_instrument"
                        value={companyData.investment_instrument}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {instrumentOptions.map(instrument => (
                          <option key={instrument} value={instrument}>{instrument}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Valuation Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Valuation Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Valuation (Value)
                      </label>
                      <input
                        type="number"
                        name="valuation_value"
                        value={companyData.valuation_value || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., 10"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Units
                      </label>
                      <select
                        name="valuation_units"
                        value={companyData.valuation_units}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Valuation Type
                      </label>
                      <select
                        name="valuation_type"
                        value={companyData.valuation_type}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {valuationTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Market Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Market Information</h3>
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
                        placeholder="e.g., 1000"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Units
                      </label>
                      <select
                        name="serviceable_market_size_units"
                        value={companyData.serviceable_market_size_units}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Market Size Basis
                      </label>
                      <textarea
                        name="serviceable_market_size_basis"
                        value={companyData.serviceable_market_size_basis}
                        onChange={handleInputChange}
                        placeholder="Basis for market size calculation"
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

                {/* Description and Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Company Description
                      </label>
                      <textarea
                        name="description"
                        value={companyData.description}
                        onChange={handleInputChange}
                        placeholder="Brief description of the company"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Funding Sought
                      </label>
                      <input
                        type="text"
                        name="funding_sought"
                        value={companyData.funding_sought}
                        onChange={handleInputChange}
                        placeholder="e.g., $500K Series A"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Additional Investment Terms
                      </label>
                      <textarea
                        name="investment_other_terms"
                        value={companyData.investment_other_terms}
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

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitCompany}
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

        {/* Step 2: File Upload */}
        {currentStep === 2 && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-orange-600 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Documents
              </h2>
            </div>
            <div className="p-6">
              {/* File Input */}
              <div className="mb-6">
                <label htmlFor="file-input" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Select Files
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
                  Accepted formats: PDF, PPT, PPTX, XLS, XLSX
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

              {/* Upload Button */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
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
                  disabled={isLoading || !files || files.length === 0}
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {isLoading ? 'Uploading...' : 'Upload Files & Complete Submission'}
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