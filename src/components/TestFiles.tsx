import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, ChevronDown, FileText, TestTube, X } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

interface TestFilesProps {
  isDark: boolean;
  toggleTheme: () => void;
}

interface FileRecord {
  id: string;
  company_id: string;
  company_name: string;
  user_id: string | null;
  user_name: string;
  filename: string;
  document_name: string;
  path: string;
  date_added: string;
}

interface ExtractedData {
  id: string;
  file_path: string;
  extracted_info: {
    company_name?: string;
    industry?: string;
    key_team_members?: string[];
    raw_response?: string;
    parse_error?: string;
  };
  created_at: string;
}

const TestFiles: React.FC<TestFilesProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [testingFile, setTestingFile] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [showExtractedData, setShowExtractedData] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadFiles = async () => {
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

      await loadFiles();
    };

    checkAuthAndLoadFiles();
  }, [navigate]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);

      // Get all documents with company information
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('id, company_id, filename, document_name, path, date_added')
        .order('date_added', { ascending: false });

      if (docsError) {
        console.error('Error loading documents:', docsError);
        setMessage({ type: 'error', text: 'Failed to load files' });
        setIsLoading(false);
        return;
      }

      if (!documents || documents.length === 0) {
        setFiles([]);
        setIsLoading(false);
        return;
      }

      // Get all companies
      const companyIds = [...new Set(documents.map(d => d.company_id))];
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, user_id')
        .in('id', companyIds);

      if (companiesError) {
        console.error('Error loading companies:', companiesError);
        setMessage({ type: 'error', text: 'Failed to load company data' });
        setIsLoading(false);
        return;
      }

      // Create company map for quick lookup
      const companyMap = new Map(companies?.map(c => [c.id, c]) || []);

      // Combine all data - use email from companies table as user name
      const fileRecords: FileRecord[] = documents.map(doc => {
        const company = companyMap.get(doc.company_id);
        const userName = company?.contact_name || 'Unknown';

        return {
          id: doc.id,
          company_id: doc.company_id,
          company_name: company?.name || 'Unknown Company',
          user_id: company?.user_id || null,
          user_name: userName,
          filename: doc.filename,
          document_name: doc.document_name,
          path: doc.path,
          date_added: doc.date_added
        };
      });

      setFiles(fileRecords);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage({ type: 'error', text: 'Failed to load files' });
      setIsLoading(false);
    }
  };

  const handleTest = async (fileId: string, fileName: string, filePath: string) => {
    setTestingFile(fileId);
    setMessage({ type: 'success', text: `Analyzing file: ${fileName}...` });
    setExtractedData(null);
    setShowExtractedData(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        setTestingFile(null);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-pdf`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze PDF');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: `Analysis completed for: ${fileName}` });

      // Fetch the extracted data from the database
      const { data: extractedInfo, error: fetchError } = await supabase
        .from('extracted_data')
        .select('*')
        .eq('file_path', filePath)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching extracted data:', fetchError);
        setMessage({ type: 'error', text: 'Analysis completed but failed to retrieve results' });
      } else if (extractedInfo) {
        setExtractedData(extractedInfo);
        setShowExtractedData(true);
      }

      setTestingFile(null);
    } catch (error) {
      console.error('Error testing file:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to analyze file'
      });
      setTestingFile(null);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/dashboard"
              className={`flex items-center ${isDark ? 'text-silver-300 hover:text-white' : 'text-navy-700 hover:text-navy-900'} transition-colors font-semibold`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>

            <div className="flex items-center space-x-6">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center ${isDark ? 'text-silver-300 hover:text-white' : 'text-navy-700 hover:text-navy-900'} transition-colors font-semibold`}
                >
                  <User className="w-4 h-4 mr-1" />
                  User <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {showUserMenu && (
                  <div className={`absolute top-full right-0 mt-2 w-32 ${isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-silver-200'} rounded-lg shadow-lg border z-50`}>
                    <Link to="/account" className={`block px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}>
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-silver-300 hover:bg-navy-700' : 'text-navy-700 hover:bg-silver-50'} transition-colors font-semibold`}
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
            Test Files
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Test uploaded files from storage
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

        {/* Files List */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-6">
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Uploaded Files
            </h2>

            {isLoading ? (
              <div className="text-center py-8">
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No files found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Company Name
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        User Name
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        File Name
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr
                        key={file.id}
                        className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                      >
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {file.company_name}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {file.user_name}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="truncate max-w-xs">{file.filename}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTest(file.id, file.filename, file.path)}
                            disabled={testingFile === file.id}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${
                              testingFile === file.id
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isDark
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            <TestTube className="w-4 h-4 mr-2" />
                            {testingFile === file.id ? 'Analyzing...' : 'Test'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Extracted Data Modal */}
        {showExtractedData && extractedData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Extracted Data
                  </h2>
                  <button
                    onClick={() => setShowExtractedData(false)}
                    className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      File Path
                    </p>
                    <p className={`font-mono text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} bg-gray-100 dark:bg-gray-700 p-2 rounded`}>
                      {extractedData.file_path}
                    </p>
                  </div>

                  {extractedData.extracted_info.company_name && (
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Company Name
                      </p>
                      <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
                        {extractedData.extracted_info.company_name}
                      </p>
                    </div>
                  )}

                  {extractedData.extracted_info.industry && (
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Industry
                      </p>
                      <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {extractedData.extracted_info.industry}
                      </p>
                    </div>
                  )}

                  {extractedData.extracted_info.key_team_members && extractedData.extracted_info.key_team_members.length > 0 && (
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        Key Team Members
                      </p>
                      <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {extractedData.extracted_info.key_team_members.map((member, index) => (
                          <li key={index}>{member}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {extractedData.extracted_info.raw_response && (
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Raw Response
                      </p>
                      <pre className={`font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto`}>
                        {extractedData.extracted_info.raw_response}
                      </pre>
                    </div>
                  )}

                  {extractedData.extracted_info.parse_error && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                      <p className="font-semibold mb-1">Parse Error</p>
                      <p>{extractedData.extracted_info.parse_error}</p>
                    </div>
                  )}

                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Extracted At
                    </p>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(extractedData.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowExtractedData(false)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      isDark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestFiles;
