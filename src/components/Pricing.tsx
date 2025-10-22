import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Mail } from 'lucide-react';

interface PricingProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const Pricing: React.FC<PricingProps> = ({ isDark, toggleTheme }) => {
  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-950 text-silver-100' : 'bg-silver-50 text-slate-900'}`}>
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
            
            <Link to="/" className="flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gold-gradient bg-clip-text text-transparent">Pricing Plans</h1>
          <p className={`text-xl ${isDark ? 'text-silver-300' : 'text-slate-600'} max-w-3xl mx-auto`}>
            Flexible pricing designed to scale with your investment needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Starter */}
          <div className={`${isDark ? 'bg-navy-900 border-navy-700' : 'bg-white border-silver-200'} rounded-xl shadow-lg border p-8`}>
            <h3 className="text-2xl font-bold mb-4">Starter</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">Contact Us</span>
            </div>
            <p className={`${isDark ? 'text-silver-300' : 'text-slate-600'} mb-6`}>
              Perfect for individual angel investors getting started
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Up to 25 analyses per month</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> 4-category comprehensive analysis</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> All report types included</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Automated screening</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Email support</li>
            </ul>
            <Link to="/signup" className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Get Started
            </Link>
          </div>

          {/* Professional */}
          <div className={`${isDark ? 'bg-navy-900 border-gold-600' : 'bg-white border-gold-400'} rounded-xl shadow-lg border-2 p-8 relative`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold-gradient text-white rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-4">Professional</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">Contact Us</span>
            </div>
            <p className={`${isDark ? 'text-silver-300' : 'text-slate-600'} mb-6`}>
              Ideal for active investment groups and funds
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Up to 100 analyses per month</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> 4-category comprehensive analysis</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> All report types included</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Automated screening</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Custom analysis prompts</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Priority support</li>
            </ul>
            <Link to="/signup" className="block w-full text-center px-6 py-3 bg-gold-gradient text-white rounded-lg hover:shadow-gold transition-all font-semibold">
              Get Started
            </Link>
          </div>

          {/* Enterprise */}
          <div className={`${isDark ? 'bg-navy-900 border-navy-700' : 'bg-white border-silver-200'} rounded-xl shadow-lg border p-8`}>
            <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <p className={`${isDark ? 'text-silver-300' : 'text-slate-600'} mb-6`}>
              For large funds and institutional investors
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Unlimited analyses</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> 4-category comprehensive analysis</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> All report types included</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Automated screening</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Custom analysis prompts</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> Dedicated account manager</li>
              <li className="flex items-start"><Check className="w-5 h-5 text-green-600 mr-2 mt-1 flex-shrink-0" /> API access</li>
            </ul>
            <a href="mailto:hello@pitchfork.com" className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Contact Sales
            </a>
          </div>
        </div>

        {/* Contact Section */}
        <div className={`${isDark ? 'bg-navy-900' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
          <Mail className="w-16 h-16 text-gold-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Need a Custom Plan?</h2>
          <p className={`text-xl ${isDark ? 'text-silver-300' : 'text-slate-600'} mb-8 max-w-2xl mx-auto`}>
            We offer flexible pricing based on your specific needs, deal volume, and features required. 
            Contact us for a customized quote that fits your investment group.
          </p>
          <a 
            href="mailto:hello@pitchfork.com" 
            className="inline-flex items-center px-8 py-4 bg-gold-gradient text-white rounded-lg text-lg font-semibold hover:shadow-gold transition-all duration-300"
          >
            <Mail className="w-5 h-5 mr-2" />
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

