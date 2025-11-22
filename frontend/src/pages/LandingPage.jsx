import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CheckCircle2, Users, Clock, FileText, TrendingUp, Shield, Zap, ArrowRight, Mail, BarChart, Calendar } from 'lucide-react';
import axios from 'axios';

export function LandingPage() {
  const [formExpanded, setFormExpanded] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    companyName: '',
    contactNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setFormExpanded(true);
  };

  const handleFullSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/landing/submit`, formData);
      setSuccess(true);
      setFormData({ email: '', fullName: '', companyName: '', contactNumber: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Centralized employee database with complete workforce visibility and control',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      icon: Clock,
      title: 'Smart Attendance',
      description: 'Automated time tracking with real-time updates and approval workflows',
      gradient: 'from-teal-500 to-cyan-600'
    },
    {
      icon: FileText,
      title: 'Automated Payroll',
      description: 'Instant salary calculations with detailed reports and export capabilities',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Mail,
      title: 'Email Automation',
      description: 'Automated reports delivered to your inbox with scheduled payroll and attendance summaries',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: BarChart,
      title: 'Smart Analytics',
      description: 'AI-powered insights with automated trend analysis and predictive workforce planning',
      gradient: 'from-indigo-500 to-blue-600'
    },
    {
      icon: Calendar,
      title: 'Workflow Automation',
      description: 'Automated approvals, notifications, and task scheduling to streamline operations',
      gradient: 'from-teal-500 to-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-teal-50">
      {/* Modern Header - Bayzat Style */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="https://www.billionets.com/assets/images/logo-new.png" 
                alt="Billionets" 
                className="h-8 sm:h-10 w-auto"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <a
                href="/login"
                className="px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-violet-600 text-violet-600 font-medium rounded-full hover:bg-violet-50 transition-all duration-300 text-sm sm:text-base"
              >
                LOGIN
              </a>
              <button
                onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-violet-600 text-white font-medium rounded-full hover:bg-violet-700 hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
              >
                GET STARTED
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile First */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-6 sm:space-y-8 order-2 lg:order-1">
              {/* Animated Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-violet-200 animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-teal-600 bg-clip-text text-transparent">
                  Trusted by Growing Businesses
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  All-in-One
                </span>
                <br />
                <span className="text-gray-900">Workforce Management</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Automate attendance, streamline payroll, and manage your entire workforce from one powerful platform.
              </p>

              {/* Key Benefits */}
              <div className="space-y-3 sm:space-y-4">
                {[
                  'Process payroll in minutes, not hours',
                  'Real-time attendance tracking & approvals',
                  'Automated reporting & analytics',
                  'Mobile-friendly interface for on-the-go access'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="mt-1 p-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="text-base sm:text-lg text-gray-700 text-left">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button - Mobile */}
              <div className="lg:hidden">
                <button
                  onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
                  className="w-full px-8 py-4 bg-violet-600 text-white font-bold rounded-2xl hover:bg-violet-700 hover:shadow-2xl transition-all duration-300 text-lg flex items-center justify-center gap-2"
                >
                  Get Free Demo
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Right Form - Enhanced */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                {/* Animated Background Blobs */}
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

                {/* Form Card */}
                <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200">
                  {success ? (
                    <div className="text-center py-8 space-y-6">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
                        <p className="text-gray-600">
                          We've received your request and will contact you shortly.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSuccess(false);
                          setFormExpanded(false);
                        }}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-full"
                      >
                        Submit Another Request
                      </Button>
                    </div>
                  ) : !formExpanded ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                          Get Started Today
                        </h2>
                        <p className="text-gray-600">
                          Enter your email to request a free demo
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Company Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="mt-2 h-12 text-base border-2 border-gray-200 focus:border-violet-500 rounded-xl"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-14 bg-violet-600 hover:bg-violet-700 hover:shadow-xl text-white font-bold text-lg rounded-xl transition-all duration-300"
                        >
                          GET FREE DEMO →
                        </Button>
                      </div>

                      <p className="text-xs text-center text-gray-500">
                        No credit card required • Free forever
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleFullSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Complete Your Request
                        </h2>
                        <p className="text-sm text-gray-600">
                          We'll get back to you within 24 hours
                        </p>
                      </div>

                      {error && (
                        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-shake">
                          {error}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Full Name
                          </Label>
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                            className="mt-1 h-11 border-2 border-gray-200 focus:border-violet-500 rounded-lg"
                          />
                        </div>

                        <div>
                          <Label htmlFor="emailFull" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Company Email
                          </Label>
                          <Input
                            id="emailFull"
                            type="email"
                            placeholder="you@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="mt-1 h-11 border-2 border-gray-200 focus:border-violet-500 rounded-lg"
                          />
                        </div>

                        <div>
                          <Label htmlFor="companyName" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Company Name
                          </Label>
                          <Input
                            id="companyName"
                            type="text"
                            placeholder="Your Company Ltd"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            required
                            className="mt-1 h-11 border-2 border-gray-200 focus:border-violet-500 rounded-lg"
                          />
                        </div>

                        <div>
                          <Label htmlFor="contactNumber" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Contact Number
                          </Label>
                          <Input
                            id="contactNumber"
                            type="tel"
                            placeholder="+971 XX XXX XXXX"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            required
                            className="mt-1 h-11 border-2 border-gray-200 focus:border-violet-500 rounded-lg"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full h-12 bg-violet-600 hover:bg-violet-700 hover:shadow-xl text-white font-bold rounded-xl transition-all duration-300"
                        >
                          {loading ? 'SUBMITTING...' : 'GET FREE DEMO →'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 3D Cards */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to simplify workforce management
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>

                <div className="relative space-y-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-teal-600 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Animated */}
      <section id="benefits" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 via-purple-600 to-teal-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: '180+', label: 'Hours Saved Annually' },
              { value: '100%', label: 'Digital Workflow' },
              { value: '24/7', label: 'Cloud Access' },
              { value: '99.9%', label: 'Uptime Guarantee' }
            ].map((stat, index) => (
              <div key={index} className="text-center space-y-2 group">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-violet-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
              Ready to Transform
            </span>
            <br />
            <span className="text-gray-900">Your Workforce Management?</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Join hundreds of businesses streamlining their HR operations
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 sm:px-12 py-4 sm:py-5 bg-violet-600 text-white font-bold text-base sm:text-lg rounded-full hover:bg-violet-700 hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3"
          >
            Get Started Now
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </section>

      {/* Footer - Modern */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <img 
                src="https://www.billionets.com/assets/images/logo-new.png" 
                alt="Billionets" 
                className="h-10 w-auto brightness-0 invert"
              />
              <p className="text-gray-400 leading-relaxed">
                Powerful Digital Solutions by Billionets
              </p>
              <p className="text-sm text-gray-500">
                Best Digital Solutions Provider in UAE
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Contact Us</h3>
              <div className="space-y-2 text-gray-400">
                <p>2606, Regal Tower</p>
                <p>Business Bay, Dubai, UAE</p>
                <p className="mt-3">
                  <a href="tel:+971543541000" className="hover:text-violet-400 transition-colors">
                    +971 54 354 1000
                  </a>
                </p>
                <p>
                  <a href="mailto:info@billionets.com" className="hover:text-violet-400 transition-colors">
                    info@billionets.com
                  </a>
                </p>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Product</h3>
              <div className="space-y-2 text-gray-400">
                <p>Employee Labour Management</p>
                <p>Cloud-Based HR Solution</p>
                <p>Mobile-First Platform</p>
                <p>Real-Time Analytics</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Billionets. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Animations CSS */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
