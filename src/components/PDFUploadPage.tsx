import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PDFUploader from './PDFUploader';

interface PDFUploadPageProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const PDFUploadPage: React.FC<PDFUploadPageProps> = ({ isDark, toggleTheme }) => {
  return (
    <div className={`min-h-screen font-inter transition-colors duration-300 ${isDark ? 'bg-navy-950 text-silver-100' : 'bg-silver-50 text-navy-900'}`}>
      {/* Navigation */}
      <nav className={`${isDark ? 'bg-navy-900/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-navy-700' : 'border-silver-200'} shadow-financial`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/pitch-fork3.png" alt="Pitch Fork Logo" className="w-8 h-8 mr-3" />
              <div className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                Pitch Fork
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className={`flex items-center px-4 py-2 rounded-lg ${isDark ? 'bg-navy-800 hover:bg-navy-700' : 'bg-silver-100 hover:bg-silver-200'} transition-colors shadow-sm font-semibold`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-navy-800 hover:bg-navy-700' : 'bg-silver-100 hover:bg-silver-200'} transition-colors shadow-sm`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className={`${isDark ? 'bg-navy-800 border-navy-700' : 'bg-white border-silver-200'} rounded-xl shadow-financial border`}>
            <div className="p-8">
              <h1 className="text-4xl font-bold bg-gold-gradient bg-clip-text text-transparent text-center mb-8">
                Upload a PDF
              </h1>
              <PDFUploader />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFUploadPage;