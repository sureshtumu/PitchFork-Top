import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChevronRight, Star, Users, Zap, Target, TrendingUp, Shield, MessageCircle, CheckCircle, XCircle, Clock, BarChart3, Moon, Sun, Menu, X, TrendingDown } from 'lucide-react';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import Dashboard from './components/Dashboard';
import VentureDetail from './components/VentureDetail';
import SubmitFiles from './components/SubmitFiles';
import EditCompany from './components/EditCompany';
import FounderSubmission from './components/FounderSubmission';

function HomePage({ isDark, setIsDark, isMobileMenuOpen, setIsMobileMenuOpen }: {
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
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
      icon: <Target className="w-8 h-8" />,
      title: "You Set Your Investor Criteria",
      description: "Customize investment parameters to match your investment thesis and risk tolerance"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast Analysis",
      description: "Product, Market, Team, SWOT, Valuation, and financial analysis in minutes, not days"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Expert-Level Analysis",
      description: "Analyze companies in fields that you are not an expert in with confidence"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Quick Go/No-Go Recommendation",
      description: "Score card and dashboard to see all your deals with clear recommendations"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Scale Your Deal Flow",
      description: "Ability to receive and analyze many more projects efficiently"
    },
    {
      icon: <Shield className="w-8 h-8" />,
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
    <div className={`min-h-screen font-arial transition-colors duration-300 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${isDark ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/pitch-fork2.jpg" alt="Pitch Fork Logo" className="w-8 h-8 mr-3" />
              <div className="text-2xl font-bold text-blue-600">
                Pitch Fork
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className={`hover:text-blue-600 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Home
              </a>
              <Link 
                to="/submit-pitch-deck" 
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all duration-300 text-sm font-semibold"
              >
                Founders: Submit Pitch Deck
              </Link>
              <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300">
                Investor:Login/Registration
              </Link>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <button onClick={toggleTheme} className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="px-4 py-4 space-y-4">
              <Link 
                to="/submit-pitch-deck" 
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 block text-center text-sm font-semibold"
              >
                Founders: Submit Pitch Deck
              </Link>
              <Link to="/login" className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 block text-center">
                Investor:Login/Registration
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className={`relative py-12 ${isDark ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="text-left relative">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-blue-600">
                Welcome to Pitch Fork
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-orange-500">
                To Invest or Not: Decide like a VC
              </h2>
              <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
                AI based scoring of ventures based on your custom criteria, leading to analysis of 10x more deals in 1/10th the time, so you don't miss a Diamond, and you filter out the duds 
              </p>
              <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-300 inline-flex items-center">
                Investor:Login/Registration <ChevronRight className="inline w-5 h-5 ml-2" />
              </Link>

              {/* Social Proof */}
              <div className="mt-8">
                <div className="flex items-center space-x-2 mb-2">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Rated 4.9/5 by over 500+ registered investors
                </p>
              </div>
            </div>

            {/* Right Column - Mock Dashboard Visual */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
              <h3 className="text-lg font-bold mb-4 text-center">Investor Dashboard</h3>
              <div className="grid grid-cols-2 gap-3">
                {mockDashboard.map((company, index) => (
                  <div key={index} className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="mb-2">
                      <h4 className="font-semibold text-xs truncate mb-1">{company.company}</h4>
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        company.status === 'Analyzing' ? 'bg-yellow-100 text-yellow-800' :
                        company.status === 'Invest' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {company.status === 'Analyzing' ? <Clock className="inline w-2 h-2 mr-1" /> :
                         company.status === 'Invest' ? <CheckCircle className="inline w-2 h-2 mr-1" /> :
                         <XCircle className="inline w-2 h-2 mr-1" />}
                        {company.status}
                      </span>
                    </div>
                    {company.score && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span>Score:</span>
                          <span className="font-bold text-green-600">{company.score}/10</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Recommendation:</span>
                          <span className="font-semibold text-green-600 text-xs">Invest</span>
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Val: $2.5M
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`py-12 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-blue-600">Why Choose Pitch Fork?</h2>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              Streamline your investment process with AI-powered analysis and decision support
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className={`p-5 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} hover:shadow-lg transition-shadow`}>
                <div className="text-orange-500 mb-3">{benefit.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={`py-12 ${isDark ? 'bg-gray-900' : 'bg-orange-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-orange-500">How It Works</h2>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              From submission to investment decision in 6 simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flowSteps.map((step, index) => (
              <div key={index} className={`relative p-5 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="absolute -top-3 -left-3 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 mt-2">{step.title}</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-12 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-blue-600">What Our Users Say</h2>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Trusted by leading angel investors and investment groups
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`p-5 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'} shadow-lg`}>
                <div className="flex mb-3">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className={`mb-3 italic text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{testimonial.quote}"
                </p>
                <p className="font-semibold text-orange-500 text-sm">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className={`py-12 ${isDark ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 text-blue-600">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className={`p-5 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${isDark ? 'bg-gray-800' : 'bg-gray-900'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3">Ready to Transform Your Investment Process?</h2>
            <p className="text-lg text-gray-300 mb-6">
              Join hundreds of investors making smarter decisions with Pitch Fork
            </p>
            <Link to="/login" className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600 transition-all duration-300 inline-flex items-center">
              Get Started Today <ChevronRight className="inline w-5 h-5 ml-2" />
            </Link>
          </div>
          
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
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <HomePage 
              isDark={isDark} 
              setIsDark={setIsDark} 
              isMobileMenuOpen={isMobileMenuOpen} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
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
          path="/venture/:id" 
          element={<VentureDetail isDark={isDark} toggleTheme={toggleTheme} />} 
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
      </Routes>
    </Router>
  );
}

export default App;