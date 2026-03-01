// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  Droplets,
  ChevronRight,
  MapPin,
  Clock,
  Shield,
  Truck,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  Phone,
  Mail,
  Map,
  Calendar,
  CreditCard,
  Bell,
  Smartphone,
  Globe,
  Star,
  Play,
  Pause,
  ArrowRight,
  ChevronDown,
  LogIn
} from 'lucide-react';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);

  // Stats counter animation
  const [counts, setCounts] = useState({
    deliveries: 0,
    students: 0,
    water: 0,
    satisfaction: 0
  });

  const targetCounts = {
    deliveries: 15000,
    students: 5000,
    water: 2500000,
    satisfaction: 98
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Check if stats section is visible
      const statsSection = document.getElementById('stats');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          setStatsVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate stats when visible
  useEffect(() => {
    if (statsVisible) {
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;
      
      Object.keys(targetCounts).forEach(key => {
        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / steps;
          setCounts(prev => ({
            ...prev,
            [key]: Math.min(Math.floor(targetCounts[key] * progress), targetCounts[key])
          }));
          
          if (step >= steps) {
            clearInterval(timer);
          }
        }, interval);
      });
    }
  }, [statsVisible]);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    {
      name: "Dr. Amina Mohammed",
      role: "Dean of Students",
      image: "https://images.unsplash.com/photo-1494790108777-296fd5c5f5d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      content: "HydroTrack has revolutionized water management on our campus. Students can now easily request and track water deliveries, ensuring everyone has access to clean water.",
      rating: 5
    },
    {
      name: "John Danladi",
      role: "Student, 400 Level",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      content: "The real-time tracking feature is amazing! I always know exactly when my water will arrive. No more waiting around or missed deliveries.",
      rating: 5
    },
    {
      name: "Prof. Samuel Yakubu",
      role: "Head of Department, Computer Science",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      content: "An innovative solution that combines technology with essential services. The system is reliable, efficient, and user-friendly.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: Map,
      title: "Real-Time Tracking",
      description: "Track your water tanker in real-time with GPS technology. Know exactly when your delivery will arrive.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Clock,
      title: "Scheduled Deliveries",
      description: "Set up recurring deliveries or request on-demand. Never run out of water with our smart scheduling system.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Multiple payment options with bank-level security. Choose from cards, transfers, or USSD.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Get instant alerts via SMS, email, or push notifications when your delivery is on the way.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: CreditCard,
      title: "Flexible Plans",
      description: "Choose from Basic, Standard, or Premium plans that fit your water consumption needs.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Users,
      title: "Community Support",
      description: "24/7 customer support and community forum. We're here to help whenever you need us.",
      color: "from-teal-500 to-green-500"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Create Account",
      description: "Sign up with your PLASU email and complete your student profile.",
      icon: Users
    },
    {
      step: 2,
      title: "Choose a Plan",
      description: "Select a payment plan that matches your water consumption needs.",
      icon: CreditCard
    },
    {
      step: 3,
      title: "Request Water",
      description: "Schedule deliveries or request on-demand water supply.",
      icon: Calendar
    },
    {
      step: 4,
      title: "Track & Receive",
      description: "Track your tanker in real-time and receive notifications.",
      icon: Map
    }
  ];

  const stats = [
    { label: "Deliveries Completed", value: counts.deliveries, suffix: "+", icon: Truck },
    { label: "Happy Students", value: counts.students, suffix: "+", icon: Users },
    { label: "Liters Delivered", value: counts.water, suffix: "L", icon: Droplets },
    { label: "Satisfaction Rate", value: counts.satisfaction, suffix: "%", icon: Star }
  ];

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Simply click the 'Get Started' button and fill in your PLASU email address and student details. You'll receive a verification email to complete your registration."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit/debit cards (Visa, Mastercard, Verve), bank transfers, and USSD payments. All transactions are secure and encrypted."
    },
    {
      question: "How accurate is the tracking?",
      answer: "Our GPS tracking is updated in real-time with 99.9% accuracy. You can see the exact location of your tanker on the map and get accurate ETAs."
    },
    {
      question: "Can I change my delivery schedule?",
      answer: "Yes! You can modify or cancel deliveries up to 2 hours before the scheduled time through your dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2 md:py-3' : 'bg-transparent py-3 md:py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo - Smaller on mobile */}
            <Link to="/" className="flex items-center gap-1 md:gap-2 group">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Droplets className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <span className="text-sm md:text-xl font-bold text-gray-900">
                <span className="text-green-600">PLASU</span> HydroTrack
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-green-600 transition-colors font-medium">How It Works</a>
              <a href="#plans" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Plans</a>
              <a href="#testimonials" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Testimonials</a>
              <a href="#faq" className="text-gray-700 hover:text-green-600 transition-colors font-medium">FAQ</a>
            </div>

            {/* Desktop Buttons - Added Login Button */}
            <div className="hidden md:flex items-center gap-3">
              <Link 
                to="/login" 
                className="px-4 py-2 text-gray-700 hover:text-green-600 font-medium transition-colors flex items-center gap-2"
              >
                <LogIn size={18} />
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Menu - Optimized for mobile */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-2xl p-5 animate-slideDown">
              <div className="flex flex-col gap-3">
                <a href="#features" className="text-gray-700 hover:text-green-600 py-2 text-sm">Features</a>
                <a href="#how-it-works" className="text-gray-700 hover:text-green-600 py-2 text-sm">How It Works</a>
                <a href="#plans" className="text-gray-700 hover:text-green-600 py-2 text-sm">Plans</a>
                <a href="#testimonials" className="text-gray-700 hover:text-green-600 py-2 text-sm">Testimonials</a>
                <a href="#faq" className="text-gray-700 hover:text-green-600 py-2 text-sm">FAQ</a>
                <hr className="border-gray-200 my-2" />
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-green-600 py-2 text-sm flex items-center gap-2"
                >
                  <LogIn size={16} />
                  Login (Registered Users)
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full py-3 text-center font-medium text-sm mt-2"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50"></div>
        
        {/* Animated Shapes - Smaller on mobile */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-48 md:w-72 h-48 md:h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-48 md:w-72 h-48 md:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content - Mobile text sizes optimized */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6">
                <Shield size={14} className="md:h-4 md:w-4" />
                Trusted by 5,000+ PLASU Students
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
                Never Run Out of{' '}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Clean Water
                </span>
              </h1>
              
              <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto lg:mx-0">
                The smart way to request, track, and manage water deliveries on campus. 
                Real-time tracking, flexible plans, and instant notifications.
              </p>

              {/* CTA Buttons - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start mb-6 md:mb-8">
                <Link
                  to="/register"
                  className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-semibold text-sm md:text-base hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 group"
                >
                  Get Started Free
                  <ChevronRight size={16} className="md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => {
                    document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 md:px-8 py-3 md:py-4 bg-white text-gray-700 rounded-full font-semibold text-sm md:text-base border-2 border-gray-200 hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={16} className="md:h-5 md:w-5" />
                  Watch Demo
                </button>
              </div>

              {/* Stats - Compact on mobile */}
              <div className="flex items-center gap-4 md:gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://images.unsplash.com/photo-${i === 1 ? '1494790108777-296fd5c5f5d1' : i === 2 ? '1500648767791-00dcc994a43e' : i === 3 ? '1472099645785-5658abf4ff4e' : '1534528741775-53994a69daeb'}?ixlib=rb-1.2.1&auto=format&fit=crop&w=50&q=80`}
                      alt="User"
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  <span className="font-bold text-gray-900">2,500+</span> active students
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl overflow-hidden border-4 md:border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                  alt="Dashboard Preview"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Floating Card - Smaller on mobile */}
                <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 bg-white/95 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="text-green-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs md:text-sm font-semibold text-gray-800">Tanker TKR-004</p>
                        <span className="text-[10px] md:text-xs text-green-600 bg-green-50 px-1.5 md:px-2 py-0.5 rounded-full">En Route</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-[10px] md:text-xs text-gray-600">Arriving in 15 mins</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-3 md:-top-4 -right-3 md:-right-4 w-16 md:w-24 h-16 md:h-24 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-3 md:-bottom-4 -left-3 md:-left-4 w-20 md:w-32 h-20 md:h-32 bg-emerald-500 rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile optimized */}
      <section id="stats" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid  md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex p-2 md:p-3 bg-green-100 rounded-full mb-2 md:mb-3">
                  <stat.icon className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Mobile optimized */}
      <section id="features" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600">
              Powerful features designed to make water delivery simple, transparent, and reliable.
            </p>
          </div>

          <div className="grid  sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-md md:shadow-lg hover:shadow-xl md:hover:shadow-2xl transition-all hover:-translate-y-1 md:hover:-translate-y-2"
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 bg-gradient-to-r ${feature.color} rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-5 w-5 md:h-7 md:w-7 text-white" />
                </div>
                <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Mobile optimized */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              How HydroTrack Works
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600">
              Get started in minutes with these simple steps
            </p>
          </div>

          <div className="grid  sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Connector Line - Hidden on mobile */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-green-200 to-green-300"></div>
                )}
                
                {/* Step Number */}
                <div className="relative z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{step.title}</h3>
                <p className="text-xs md:text-sm text-gray-600 px-2">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section - Mobile optimized */}
      <section id="plans" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600">
              Choose the plan that fits your water needs
            </p>
          </div>

          <div className="grid  md:grid-cols-3 gap-6 md:gap-8">
            {/* Basic Plan */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl md:hover:shadow-2xl transition-all hover:-translate-y-1 md:hover:-translate-y-2">
              <div className="p-5 md:p-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Basic</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">For light users</p>
                <div className="flex items-end gap-1 mb-4 md:mb-6">
                  <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">₦5,000</span>
                  <span className="text-xs md:text-sm text-gray-600">/month</span>
                </div>
                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">500L water/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">4 scheduled deliveries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">Basic tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">Email notifications</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="block w-full py-2 md:py-3 text-xs md:text-sm text-center border-2 border-green-600 text-green-600 rounded-full font-semibold hover:bg-green-600 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Standard Plan - Popular */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl overflow-hidden border-2 border-green-500 transform scale-105 md:scale-105">
              <div className="bg-gradient-to-r from-green-600 to-green-700 py-1 md:py-2 px-3 md:px-4 text-center">
                <span className="text-xs md:text-sm font-semibold text-white">MOST POPULAR</span>
              </div>
              <div className="p-5 md:p-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Standard</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">For regular users</p>
                <div className="flex items-end gap-1 mb-4 md:mb-6">
                  <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">₦10,000</span>
                  <span className="text-xs md:text-sm text-gray-600">/month</span>
                </div>
                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">1000L water/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">8 scheduled deliveries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">Real-time tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">SMS & Email notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">Priority support</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="block w-full py-2 md:py-3 text-xs md:text-sm text-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-semibold hover:shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl md:hover:shadow-2xl transition-all hover:-translate-y-1 md:hover:-translate-y-2">
              <div className="p-5 md:p-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Premium</h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">For heavy users</p>
                <div className="flex items-end gap-1 mb-4 md:mb-6">
                  <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">₦18,000</span>
                  <span className="text-xs md:text-sm text-gray-600">/month</span>
                </div>
                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">2000L water/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">12 scheduled deliveries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">Advanced tracking with map</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">All notification channels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">24/7 priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-gray-600">Delivery analytics</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="block w-full py-2 md:py-3 text-xs md:text-sm text-center border-2 border-green-600 text-green-600 rounded-full font-semibold hover:bg-green-600 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile optimized */}
      <section id="testimonials" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              What Our Users Say
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600">
              Join thousands of satisfied students using HydroTrack
            </p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            {/* Testimonial Carousel */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2 md:px-4">
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl md:rounded-2xl p-4 md:p-8 shadow-md md:shadow-lg">
                      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="w-10 h-10 md:w-16 md:h-16 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="text-sm md:text-base font-semibold text-gray-900">{testimonial.name}</h4>
                          <p className="text-xs md:text-sm text-gray-600">{testimonial.role}</p>
                          <div className="flex gap-1 mt-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-gray-700 italic">"{testimonial.content}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="flex justify-center gap-2 md:gap-3 mt-6 md:mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 md:h-3 rounded-full transition-all ${
                    index === activeTestimonial
                      ? 'w-6 md:w-8 bg-green-600'
                      : 'w-2 md:w-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Mobile optimized */}
      <section id="faq" className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600">
              Got questions? We've got answers
            </p>
          </div>

          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 md:p-6 cursor-pointer list-none">
                    <span className="text-sm md:text-base font-semibold text-gray-900 pr-4">{faq.question}</span>
                    <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-4 md:px-6 pb-4 md:pb-6 text-xs md:text-sm text-gray-600">
                    {faq.answer}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile optimized */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-sm md:text-base lg:text-xl text-green-100 mb-6 md:mb-8">
            Join thousands of students who never run out of water
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link
              to="/register"
              className="px-6 md:px-8 py-3 md:py-4 bg-white text-green-600 rounded-full font-semibold text-sm md:text-base hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              Create Free Account
              <ArrowRight size={16} className="md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-6 md:px-8 py-3 md:py-4 bg-transparent text-white rounded-full font-semibold text-sm md:text-base border-2 border-white hover:bg-white/10 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Mobile optimized */}
      <footer className="bg-gray-900 text-gray-300 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid  sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Droplets className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
                <span className="text-base md:text-xl font-bold text-white">HydroTrack</span>
              </div>
              <p className="text-xs md:text-sm mb-4">
                Smart water management system for PLASU students. Never run out of water again.
              </p>
              <div className="flex gap-3 md:gap-4">
                <a href="#" className="hover:text-white transition-colors">
                  <Globe size={16} className="md:h-5 md:w-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Smartphone size={16} className="md:h-5 md:w-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Mail size={16} className="md:h-5 md:w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4">Quick Links</h4>
              <ul className="space-y-1.5 md:space-y-2">
                <li><a href="#features" className="text-xs md:text-sm hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-xs md:text-sm hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#plans" className="text-xs md:text-sm hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="text-xs md:text-sm hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#faq" className="text-xs md:text-sm hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4">Support</h4>
              <ul className="space-y-1.5 md:space-y-2">
                <li><a href="#" className="text-xs md:text-sm hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-xs md:text-sm hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-xs md:text-sm hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-xs md:text-sm hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4">Contact Us</h4>
              <ul className="space-y-1.5 md:space-y-2">
                <li className="flex items-center gap-1.5 md:gap-2">
                  <Phone size={12} className="md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">+234 800 123 4567</span>
                </li>
                <li className="flex items-center gap-1.5 md:gap-2">
                  <Mail size={12} className="md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">support@hydrotrack.com</span>
                </li>
                <li className="flex items-center gap-1.5 md:gap-2">
                  <MapPin size={12} className="md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">PLASU, Bokkos, Plateau State</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 md:pt-8 border-t border-gray-800 text-center">
            <p className="text-xs md:text-sm">&copy; {new Date().getFullYear()} PLASU HydroTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style jsx>{`
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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;