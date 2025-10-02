import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChevronRight, Star, Users, Zap, Target, TrendingUp, Shield, MessageCircle, CheckCircle, XCircle, Clock, BarChart3, Moon, Sun, Menu, X, TrendingDown } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import Dashboard from './components/Dashboard';
import SubmitFiles from './components/SubmitFiles';
import EditCompany from './components/EditCompany';
import FounderSubmission from './components/FounderSubmission';
import VentureDetail from './components/VentureDetail';
import FounderDashboard from './components/FounderDashboard';
import EditPrompts from './components/EditPrompts';

function HomePage({ isDark, setIsDark, isMobileMenuOpen, setIsMobileMenuOpen }: {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
  setShowTestModal: (value: boolean) => void;
}) {
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const testimonials = [
    {
      quote: "Were able to review 5 times the number of proposals in a comprehensive and unbiased manner",
      author: "Tech Coast Angels"
    },
    {
      quote: "Quickly analyzed companies with which I had little knowledge and ended up investing in one that I would normally have passed on",
      author: "Angel investor"
    },
    {
      quote: "Have gotten greater visibility and are receiving more proposals",
      author: "Pasadena Angels"
    },
    {
      quote: "Were able to provide great feed back for our entrepreneurs",
      author: "Houston Angels"
    }
  ];

  const benefits = [
    {
      icon: <Target className="w-8 h-8 text-gold-500" />,
      title: "You Set Your Investor Criteria",
      description: "Customize investment parameters to match your investment thesis and risk tolerance"
    },
    {
      icon: <Zap className="w-8 h-8 text-gold-500" />,
      title: "Fast Analysis",
      description: "Product, Market, Team, SWOT, Valuation, and financial analysis in minutes, not days"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-gold-500" />,
      title: "Expert-Level Analysis",
      description: "Analyze companies in fields that you are not an expert in with confidence"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-gold-500" />,
      title: "Quick Go/No-Go Recommendation",
      description: "Score card and dashboard to see all your deals with clear recommendations"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-gold-500" />,
      title: "Scale Your Deal Flow",
      description: "Ability to receive and analyze many more projects efficiently"
    },
    {
      icon: <Shield className="w-8 h-8 text-gold-500" />,
      title: "Don't Miss Diamonds",
      description: "Reject poor proposals while identifying hidden gems you might have missed"
    }
  ];

  const flowSteps = [
    {
      step: "1",
      title: "Receive & Validate",
      description: "Receive funding proposals and automatically check for completeness and required documents"
    },
    {
      step: "2",
      title: "Filter & Screen",
      description: "Filter based on your criteria such as industry, geography, revenue, team size, and stage"
    },
    {
      step: "3",
      title: "Deep Analysis",
      description: "Detailed AI-driven analysis of business model, market fit, team, financials, and valuation"
    },
    {
      step: "4",
      title: "Dashboard View",
      description: "Results displayed in dashboard with venture statuses: Open, Reject, Diligence, Invest"
    },
    {
      step: "5",
      title: "Detailed Reports",
      description: "Score cards, investment recommendations, and detailed analysis reports with follow-up questions"
    },
    {
      step: "6",
      title: "Generate Reports",
      description: "Create comprehensive reports for investees with feedback and recommendations"
    }
  ];

  const faqs = [
    {
      question: "What criteria can be customized?",
      answer: "You can customize industry preferences, geographic focus, revenue thresholds, team size, funding stage, risk tolerance, and specific investment thesis parameters."
    },
    {
      question: "What is the pricing?",
      answer: "We offer flexible pricing tiers based on deal volume and features needed. Contact us for a customized quote that fits your investment group's needs."
    },
    {
      question: "Can you show me some sample reports?",
      answer: "Yes! We provide detailed sample reports showing our analysis methodology, scoring system, and recommendation format. Schedule a demo to see them in action."
    },
    {
      question: "How secure is our data?",
      answer: "We use enterprise-grade security with end-to-end encryption, SOC 2 compliance, and strict data privacy controls to protect sensitive investment information."
    }
  ];

  const mockDashboard = [
    { company: "TechStart AI", status: "Analyzing", score: null, recommendation: null },
    { company: "GreenEnergy Co", status: "Invest", score: 8.7, recommendation: "Strong Buy" },
    { company: "RetailTech", status: "Reject", score: 4.2, recommendation: "Pass" },
    { company: "HealthApp", status: "Reject", score: 5.1, recommendation: "Pass" }
  ];

  return (
    <div className={`min-h-screen font-body transition-colors duration-300 ${isDark ? 'bg-navy-950 text-silver-100' : 'bg-silver-50 text-slate-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDark ? 'bg-navy-900/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-navy-700' : 'border-silver-200'} shadow-financial`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/pitch-fork3.png" alt="Pitch Fork Logo" className="w-8 h-8 mr-3" />
              <div className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">
                Pitch Fork
              </div>
             <button
               onClick={() => setShowTestModal(true)}
               className="ml-4 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
             >
               test-edge
             </button>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <span className="text-gold-600 font-semibold">
                Founders: Sign-Up to Submit your pitch deck
              </span>
              <Link to="/login" className="bg-navy-800 text-white px-6 py-2 rounded-lg hover:bg-navy-700 transition-all duration-300 shadow-financial font-semibold">
                Login/Sign-Up
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-navy-800 hover:bg-navy-700' : 'bg-silver-100 hover:bg-silver-200'} transition-colors shadow-sm`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDark ? 'bg-navy-800' : 'bg-silver-100'}`}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg ${isDark ? 'bg-navy-800' : 'bg-silver-100'}`}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-navy-900' : 'bg-white'} border-t ${isDark ? 'border-navy-700' : 'border-silver-200'}`}>
            <div className="px-4 py-4 space-y-4">
              <div className="text-center">
                <span className="text-gold-600 font-semibold">
                  Founders: Sign-Up to Submit your pitch deck
                </span>
              </div>
              <Link to="/login" className="w-full bg-navy-800 text-white px-6 py-2 rounded-lg hover:bg-navy-700 block text-center font-semibold">
                Login/Sign-Up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className={`relative py-16 ${isDark ? 'bg-financial-gradient' : 'bg-gradient-to-br from-silver-50 to-navy-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="text-left relative">
              <h1 className="text-4xl md:text-5xl font-inter font-bold mb-4 bg-gold-gradient bg-clip-text text-transparent">
                Welcome to Pitch Fork
              </h1>
              <h2 className="text-2xl md:text-3xl font-inter font-bold mb-6 text-slate-900 dark:text-silver-100">
                To Invest or Not: Decide like a VC
              </h2>
              <p className="text-lg mb-8 text-slate-600 dark:text-silver-300 leading-relaxed font-body">
                AI based scoring of ventures based on your custom criteria + industry standards, leading to analysis of 10x more deals in 1/10th the time, so you don't miss a Diamond, and you filter out the duds. 
              </p>
              <Link to="/login" className="bg-gold-gradient text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-gold transition-all duration-300 inline-flex items-center shadow-financial">
                Login/Sign-Up <ChevronRight className="inline w-5 h-5 ml-2" />
              </Link>

              {/* Social Proof */}
              <div className="mt-10">
                <div className="flex items-center space-x-2 mb-2">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className={`text-sm ${isDark ? 'text-silver-300' : 'text-slate-600'} font-medium`}>
                  Rated 4.9/5 by over 500+ registered investors
                </p>
              </div>
            </div>

            {/* Right Column - Mock Dashboard Visual */}
            <div className="flex justify-center">
              <img 
                src="/landing-main-graphic.png" 
                alt="Pitch Fork Investment Analysis Platform" 
                className="w-full max-w-sm rounded-xl shadow-financial"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`py-16 ${isDark ? 'bg-navy-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-inter font-bold mb-4 bg-gold-gradient bg-clip-text text-transparent">Why Choose Pitch Fork?</h2>
            <p className={`text-xl ${isDark ? 'text-silver-300' : 'text-slate-600'} max-w-3xl mx-auto font-body`}>
              Streamline your investment process with AI-powered analysis and decision support
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className={`p-6 rounded-xl ${isDark ? 'bg-navy-800 border border-navy-700' : 'bg-silver-50 border border-silver-200'} hover:shadow-financial transition-all duration-300 hover:scale-105`}>
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-inter font-bold mb-3 text-slate-900 dark:text-silver-100">{benefit.title}</h3>
                <p className={`${isDark ? 'text-silver-300' : 'text-slate-600'} leading-relaxed font-body`}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={`py-16 ${isDark ? 'bg-navy-950' : 'bg-gradient-to-br from-gold-50 to-silver-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-inter font-bold mb-4 text-gold-600">How It Works</h2>
            <p className={`text-xl ${isDark ? 'text-silver-300' : 'text-slate-600'} max-w-3xl mx-auto font-body`}>
              From submission to investment decision in 6 simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {flowSteps.map((step, index) => (
              <div key={index} className={`relative p-6 rounded-xl ${isDark ? 'bg-navy-800 border border-navy-700' : 'bg-white border border-silver-200'} shadow-financial hover:shadow-gold transition-all duration-300`}>
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gold-gradient text-white rounded-full flex items-center justify-center font-bold text-sm shadow-gold">
                  {step.step}
                </div>
                <h3 className="text-xl font-inter font-bold mb-3 mt-2 text-slate-900 dark:text-silver-100">{step.title}</h3>
                <p className={`${isDark ? 'text-silver-300' : 'text-slate-600'} leading-relaxed font-body`}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-16 ${isDark ? 'bg-navy-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-inter font-bold mb-4 bg-gold-gradient bg-clip-text text-transparent">What Our Users Say</h2>
            <p className={`text-xl ${isDark ? 'text-silver-300' : 'text-slate-600'} font-body`}>
              Trusted by leading angel investors and investment groups
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`p-6 rounded-xl ${isDark ? 'bg-navy-800 border border-navy-700' : 'bg-silver-50 border border-silver-200'} shadow-financial hover:shadow-gold transition-all duration-300`}>
                <div className="flex mb-3">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className={`mb-4 italic ${isDark ? 'text-silver-300' : 'text-slate-600'} leading-relaxed font-body`}>
                  "{testimonial.quote}"
                </p>
                <p className="font-inter font-bold text-gold-600">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className={`py-16 ${isDark ? 'bg-navy-950' : 'bg-gradient-to-br from-silver-50 to-navy-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
           <h2 className="text-4xl font-inter font-bold mb-4 bg-gold-gradient bg-clip-text text-transparent">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className={`p-6 rounded-xl ${isDark ? 'bg-navy-800 border border-navy-700' : 'bg-white border border-silver-200'} shadow-financial hover:shadow-gold transition-all duration-300`}>
               <h3 className="text-xl font-inter font-bold mb-3 text-slate-900 dark:text-silver-100">{faq.question}</h3>
               <p className={`${isDark ? 'text-silver-300' : 'text-slate-600'} leading-relaxed font-body`}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 ${isDark ? 'bg-navy-900' : 'bg-navy-950'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-inter font-bold mb-4 bg-gold-gradient bg-clip-text text-transparent">Ready to Transform Your Investment Process?</h2>
            <p className="text-xl text-silver-300 mb-8 font-body">
              Join hundreds of investors making smarter decisions with Pitch Fork
            </p>
            <Link to="/login" className="bg-gold-gradient text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-gold transition-all duration-300 inline-flex items-center shadow-financial">
              Get Started Today <ChevronRight className="inline w-5 h-5 ml-2" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent mb-4">
                Pitch Fork
              </div>
              <p className="text-silver-300 leading-relaxed">
                Empowering investors with AI-driven analysis for smarter investment decisions.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold-400">Contact</h4>
              <p className="text-silver-300 mb-2">hello@pitchfork.com</p>
              <p className="text-silver-300">+1 (555) 123-4567</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold-400">Product</h4>
              <ul className="space-y-2 text-silver-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gold-400">Legal</h4>
              <ul className="space-y-2 text-silver-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-navy-700 pt-8 text-center text-silver-400">
            <p>&copy; 2025 Pitch Fork. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleTestFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTestFile(e.target.files[0]);
    }
  };

  const handleTestContinue = async () => {
    if (!testFile) {
      alert('Please select a PDF file first');
      return;
    }

    try {
      setIsTestLoading(true);
      setTestResults(null);

      const formData = new FormData();
      formData.append('file', testFile);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const functionUrl = `${supabaseUrl}/functions/v1/show-me-details`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge function failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      setTestResults(result);

    } catch (error) {
      console.error('Test error:', error);
      alert('Test failed: ' + error.message);
    } finally {
      setIsTestLoading(false);
    }
  };
  return (
    <Router>
      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-navy-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full mx-4`}>
            <h2 className="text-xl font-bold mb-4 text-gold-600">Test Edge Function</h2>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-silver-300' : 'text-navy-700'} mb-2`}>
                Upload PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleTestFileUpload}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDark 
                    ? 'bg-navy-700 border-navy-600 text-white' 
                    : 'bg-white border-silver-300 text-navy-900'
                }`}
              />
            </div>

            {testFile && (
              <div className="mb-4 p-3 bg-success-100 border border-success-300 rounded">
                <p className="text-success-700 text-sm">
                  Selected: {testFile.name} ({(testFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            {testResults && (
              <div className="mb-4 p-3 bg-gold-50 border border-gold-300 rounded">
                <h3 className="font-semibold text-gold-800 mb-2">Extracted Information:</h3>
                <div className="text-sm text-gold-700">
                  <p><strong>Company Name:</strong> {testResults.data?.company_name || 'Not found'}</p>
                  <p><strong>Industry:</strong> {testResults.data?.industry || 'Not found'}</p>
                  <p><strong>Key Team Members:</strong> {testResults.data?.key_team_members || 'Not found'}</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleTestContinue}
                disabled={!testFile || isTestLoading}
                className="bg-gold-600 text-white px-4 py-2 rounded hover:bg-gold-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestLoading ? 'Processing...' : 'Continue'}
              </button>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestFile(null);
                  setTestResults(null);
                }}
                className={`px-4 py-2 rounded ${
                  isDark 
                    ? 'bg-navy-600 text-silver-300 hover:bg-navy-500' 
                    : 'bg-silver-200 text-navy-700 hover:bg-silver-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            <HomePage 
              isDark={isDark} 
              setIsDark={setIsDark} 
              isMobileMenuOpen={isMobileMenuOpen} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
              setShowTestModal={setShowTestModal}
            />
          } 
        />
        <Route 
          path="/login" 
          element={<LoginPage isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/signup" 
          element={<SignUpPage isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/dashboard" 
          element={<Dashboard isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/submit-files" 
          element={<SubmitFiles isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/edit-company" 
          element={<EditCompany isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/submit-pitch-deck" 
          element={<FounderSubmission isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/venture/:id" 
          element={<VentureDetail isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/founder-dashboard" 
          element={<FounderDashboard isDark={isDark} toggleTheme={toggleTheme} />} 
        />
        <Route 
          path="/edit-prompts" 
          element={<EditPrompts isDark={isDark} toggleTheme={toggleTheme} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;