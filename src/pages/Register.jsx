// src/pages/Register.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, GraduationCap, MapPin, Home, Hash,
  Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Shield,
  ArrowRight, ArrowLeft, Droplets, XCircle, Calendar, BookOpen, CheckSquare
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Toast ────────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };
  const success = (message) => showToast('success', message);
  const error   = (message) => showToast('error',   message);
  const info    = (message) => showToast('info',     message);
  return { toast, success, error, info };
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast, success, error } = useToast();

  // ── Form state ───────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep]             = useState(1);
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting]           = useState(false);
  const [registerStatus, setRegisterStatus]       = useState({ type: '', message: '' });
  const [errors, setErrors]                       = useState({});

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    matricNumber: '', department: '', level: '',
    hall: '', roomNumber: '',
    password: '', confirmPassword: '', agreeTerms: false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0, hasLength: false, hasNumber: false,
    hasUpper: false, hasLower: false, hasSpecial: false
  });

  // ── OTP state ────────────────────────────────────────────────────────────
  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otp, setOtp]                     = useState(['', '', '', '', '', '']);
  const [otpEmail, setOtpEmail]           = useState('');
  const [verifying, setVerifying]         = useState(false);
  const [resending, setResending]         = useState(false);
  const [otpTimer, setOtpTimer]           = useState(600);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // ── OTP timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showOTPScreen) return;
    setOtpTimer(600);
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showOTPScreen]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const departments = [
    'Computer Science', 'Information Technology', 'Software Engineering',
    'Cyber Security', 'Data Science', 'Computer Engineering',
    'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Business Administration', 'Accounting', 'Economics'
  ];
  const levels = ['100', '200', '300', '400', '500'];
  const halls  = [
    'Daniel Hall', 'Joseph Hall', 'Mary Hall', 'Peter Hall',
    'Paul Hall', 'Esther Hall', 'Ruth Hall', 'Samuel Hall'
  ];

  // ── Input handler ────────────────────────────────────────────────────────
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') checkPasswordStrength(value);
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    if (registerStatus.message) setRegisterStatus({ type: '', message: '' });
  };

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      score:      password.length,
      hasLength:  password.length >= 8,
      hasNumber:  /\d/.test(password),
      hasUpper:   /[A-Z]/.test(password),
      hasLower:   /[a-z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const getPasswordStrengthScore = () => {
    const { hasLength, hasNumber, hasUpper, hasLower, hasSpecial } = passwordStrength;
    return [hasLength, hasNumber, hasUpper, hasLower, hasSpecial].filter(Boolean).length;
  };

  const getPasswordStrengthText = () => {
    const score = getPasswordStrengthScore();
    if (score === 0) return { text: 'Very Weak', color: 'text-red-600',    bg: 'bg-red-100'    };
    if (score <= 2)  return { text: 'Weak',      color: 'text-orange-600', bg: 'bg-orange-100' };
    if (score <= 3)  return { text: 'Fair',      color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score <= 4)  return { text: 'Good',      color: 'text-blue-600',   bg: 'bg-blue-100'   };
    return               { text: 'Strong',   color: 'text-green-600',  bg: 'bg-green-100'  };
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.firstName)              newErrors.firstName = 'First name is required';
      else if (formData.firstName.length < 2) newErrors.firstName = 'First name must be at least 2 characters';
      if (!formData.lastName)               newErrors.lastName  = 'Last name is required';
      else if (formData.lastName.length < 2)  newErrors.lastName  = 'Last name must be at least 2 characters';
      if (!formData.email)                  newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
      if (!formData.phone)                  newErrors.phone = 'Phone number is required';
      else if (!/^[0-9]{11}$/.test(formData.phone))  newErrors.phone = 'Phone number must be 11 digits';
    }
    if (step === 2) {
      if (!formData.matricNumber) newErrors.matricNumber = 'Matric number is required';
      else if (!/^PLASU\/\d{4}\/[A-Z]{4}\/\d{4}$/.test(formData.matricNumber)) newErrors.matricNumber = 'Format: PLASU/YYYY/FACULTY/XXXX';
      if (!formData.department)   newErrors.department = 'Department is required';
      if (!formData.level)        newErrors.level      = 'Level is required';
    }
    if (step === 3) {
      if (!formData.hall)       newErrors.hall       = 'Hall of residence is required';
      if (!formData.roomNumber) newErrors.roomNumber = 'Room number is required';
    }
    if (step === 4) {
      if (!formData.password)                         newErrors.password = 'Password is required';
      else if (formData.password.length < 8)          newErrors.password = 'Password must be at least 8 characters';
      else if (getPasswordStrengthScore() < 3)        newErrors.password = 'Password is too weak.';
      if (!formData.confirmPassword)                  newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.agreeTerms)                       newErrors.agreeTerms = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext     = () => { if (validateStep(currentStep)) setCurrentStep(p => p + 1); };
  const handlePrevious = () => setCurrentStep(p => p - 1);

  // ── Submit registration ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setRegisterStatus({ type: '', message: '' });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName:       formData.firstName,
        lastName:        formData.lastName,
        email:           formData.email,
        phone:           formData.phone,
        matricNumber:    formData.matricNumber,
        department:      formData.department,
        level:           formData.level,
        hall:            formData.hall,
        roomNumber:      formData.roomNumber,
        password:        formData.password,
        confirmPassword: formData.confirmPassword,
      });
      if (response.data.success) {
        setOtpEmail(formData.email);
        setShowOTPScreen(true); // ✅ show OTP screen
        success('OTP sent to your email!');
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.[0] || err.response?.data?.message || 'Registration failed. Please try again.';
      setRegisterStatus({ type: 'error', message: msg });
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP handlers ─────────────────────────────────────────────────────────
  const handleOTPInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
    if (!value && index > 0) otpRefs[index - 1].current?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return error('Please enter the complete 6-digit OTP');
    try {
      setVerifying(true);
      const res = await axios.post(`${API_URL}/auth/verify-otp`, {
        email: otpEmail, otp: otpValue
      });
      if (res.data.success) {
        success('Email verified! Redirecting to your dashboard...');
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user',  JSON.stringify(res.data.data));
        setTimeout(() => navigate('/student-dashboard'), 1500);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResending(true);
      await axios.post(`${API_URL}/auth/resend-otp`, { email: otpEmail });
      setOtpTimer(600);
      setOtp(['', '', '', '', '', '']);
      success('New OTP sent to your email!');
      otpRefs[0].current?.focus();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const strengthScore = getPasswordStrengthScore();
  const strengthText  = getPasswordStrengthText();

  const steps = [
    { number: 1, title: 'Personal',  icon: User         },
    { number: 2, title: 'Academic',  icon: GraduationCap},
    { number: 3, title: 'Residence', icon: Home         },
    { number: 4, title: 'Security',  icon: Lock         },
  ];
  const CurrentStepIcon = steps[currentStep - 1].icon;

  // ════════════════════════════════════════════════════════════
  // ✅ OTP VERIFICATION SCREEN
  // ════════════════════════════════════════════════════════════
  if (showOTPScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 animate-slideDown ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
          <p className="text-gray-500 text-sm mb-1">We sent a 6-digit OTP to</p>
          <p className="text-green-600 font-bold text-sm mb-8">{otpEmail}</p>

          {/* OTP Input Boxes */}
          <div className="flex gap-3 justify-center mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={otpRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOTPInput(index, e.target.value)}
                onKeyDown={e => handleOTPKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-black border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all
                  ${digit ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-800'}`}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="mb-6">
            {otpTimer > 0 ? (
              <p className="text-sm text-gray-500">
                OTP expires in <span className="font-bold text-green-600">{formatTimer(otpTimer)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">⏱ OTP expired. Please request a new one.</p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyOTP}
            disabled={verifying || otp.join('').length !== 6 || otpTimer === 0}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4 transition-all">
            {verifying
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
              : <><Shield className="h-4 w-4" /> Verify & Continue</>}
          </button>

          {/* Resend */}
          <button
            onClick={handleResendOTP}
            disabled={resending || otpTimer > 540}
            className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto transition-colors">
            {resending
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Sending...</>
              : '🔄 Resend OTP'}
          </button>

          {otpTimer > 540 && (
            <p className="text-xs text-gray-400 mt-1">
              Resend available in {formatTimer(otpTimer - 540)}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-6">
            Wrong email?{' '}
            <button
              onClick={() => { setShowOTPScreen(false); setOtp(['','','','','','']); }}
              className="text-green-600 font-medium hover:underline">
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // REGISTRATION FORM
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 md:py-12 px-3 md:px-4">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 animate-slideDown ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="h-10 w-10 md:h-14 md:w-14 bg-green-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
              <Droplets className="h-5 w-5 md:h-7 md:w-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">Create Your Account</h1>
          <p className="text-xs md:text-sm text-gray-600 px-4">Join PLASU HydroTrack Water Supply Management System</p>
          <div className="mt-3 md:hidden">
            <Link to="/login" className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <ArrowRight className="h-3 w-3" />Already have an account? Sign in
            </Link>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.number  ? 'bg-green-600 text-white' :
                    currentStep === step.number ? 'bg-green-600 text-white ring-2 md:ring-4 ring-green-100' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number
                      ? <CheckCircle className="h-3 w-3 md:h-5 md:w-5" />
                      : <step.icon   className="h-3 w-3 md:h-5 md:w-5" />}
                  </div>
                  <span className={`text-[10px] md:text-xs mt-1 md:mt-2 font-medium ${
                    currentStep >= step.number ? 'text-green-600' : 'text-gray-400'
                  }`}>{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 md:h-1 mx-1 md:mx-2 ${
                    currentStep > step.number + 1 ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Status Message */}
        {registerStatus.message && (
          <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg md:rounded-xl border ${
            registerStatus.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 md:gap-3">
              {registerStatus.type === 'success'
                ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                : <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />}
              <span className={`text-xs md:text-sm ${registerStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {registerStatus.message}
              </span>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 md:px-8 py-4 md:py-6 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-1 md:gap-2">
              <CurrentStepIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span>Step {currentStep}: {steps[currentStep - 1].title}</span>
            </h2>
            <p className="text-green-100 text-xs md:text-sm mt-1">
              {currentStep === 1 && 'Tell us about yourself'}
              {currentStep === 2 && 'Enter your academic details'}
              {currentStep === 3 && 'Where do you stay on campus?'}
              {currentStep === 4 && 'Create a secure password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-4 md:space-y-6">

            {/* ── Step 1: Personal ── */}
            {currentStep === 1 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)}
                        placeholder="John"
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`} />
                    </div>
                    {errors.firstName && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)}
                        placeholder="Doe"
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`} />
                    </div>
                    {errors.lastName && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.lastName}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)}
                        placeholder="your.email@gmail.com"
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'}`} />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                    <p className="mt-1 text-[10px] text-gray-500">⚠️ Use a valid email — an OTP will be sent to verify it.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)}
                        placeholder="08031234567" maxLength="11"
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.phone ? 'border-red-300' : 'border-gray-300'}`} />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.phone}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Academic ── */}
            {currentStep === 2 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Matric Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.matricNumber}
                        onChange={e => handleInputChange('matricNumber', e.target.value.toUpperCase())}
                        placeholder="PLASU/2021/CSC/0001"
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.matricNumber ? 'border-red-300' : 'border-gray-300'}`} />
                    </div>
                    {errors.matricNumber && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.matricNumber}</p>}
                    <p className="mt-1 text-[10px] md:text-xs text-gray-500">Format: PLASU/YYYY/FACULTY/XXXX</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Department</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <select value={formData.department} onChange={e => handleInputChange('department', e.target.value)}
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none ${errors.department ? 'border-red-300' : 'border-gray-300'}`}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {errors.department && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.department}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Level</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <select value={formData.level} onChange={e => handleInputChange('level', e.target.value)}
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none ${errors.level ? 'border-red-300' : 'border-gray-300'}`}>
                        <option value="">Select Level</option>
                        {levels.map(l => <option key={l} value={l}>{l} Level</option>)}
                      </select>
                    </div>
                    {errors.level && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.level}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Residence ── */}
            {currentStep === 3 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Hall of Residence</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <select value={formData.hall} onChange={e => handleInputChange('hall', e.target.value)}
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none ${errors.hall ? 'border-red-300' : 'border-gray-300'}`}>
                        <option value="">Select Hall</option>
                        {halls.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {errors.hall && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.hall}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Room Number</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.roomNumber}
                        onChange={e => handleInputChange('roomNumber', e.target.value.toUpperCase())}
                        placeholder="B202"
                        className={`w-full pl-9 md:pl-10 pr-3 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.roomNumber ? 'border-red-300' : 'border-gray-300'}`} />
                    </div>
                    {errors.roomNumber && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.roomNumber}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Security ── */}
            {currentStep === 4 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={formData.password}
                        onChange={e => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        className={`w-full pl-9 md:pl-10 pr-10 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.password ? 'border-red-300' : 'border-gray-300'}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1 h-1.5">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`flex-1 rounded-full transition-all ${
                              i <= strengthScore
                                ? i <= 2 ? 'bg-red-500' : i <= 3 ? 'bg-orange-500' : i <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                : 'bg-gray-200'
                            }`} />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${strengthText.color}`}>Strength: {strengthText.text}</p>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {[
                            { key: 'hasLength',  label: '8+ chars'   },
                            { key: 'hasNumber',  label: 'Number'     },
                            { key: 'hasUpper',   label: 'Uppercase'  },
                            { key: 'hasLower',   label: 'Lowercase'  },
                            { key: 'hasSpecial', label: 'Special char', span: true },
                          ].map(({ key, label, span }) => (
                            <div key={key} className={`flex items-center gap-1 ${span ? 'col-span-2' : ''}`}>
                              {passwordStrength[key]
                                ? <CheckCircle className="h-3 w-3 text-green-600" />
                                : <XCircle    className="h-3 w-3 text-gray-400" />}
                              <span className="text-xs text-gray-600">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {errors.password && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                        onChange={e => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className={`w-full pl-9 md:pl-10 pr-10 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password && (
                      <div className="mt-1">
                        {formData.password === formData.confirmPassword
                          ? <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Passwords match</p>
                          : <p className="text-xs text-red-600   flex items-center gap-1"><XCircle    className="h-3 w-3" />Passwords do not match</p>}
                      </div>
                    )}
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.confirmPassword}</p>}
                  </div>

                  <div className="pt-2">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" id="agreeTerms" checked={formData.agreeTerms}
                        onChange={e => handleInputChange('agreeTerms', e.target.checked)}
                        className="mt-0.5 h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                      <label htmlFor="agreeTerms" className="text-xs md:text-sm text-gray-600">
                        I agree to the{' '}
                        <a href="#" className="text-green-600 hover:text-green-700 font-medium">Terms</a>{' '}and{' '}
                        <a href="#" className="text-green-600 hover:text-green-700 font-medium">Privacy Policy</a>
                      </label>
                    </div>
                    {errors.agreeTerms && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.agreeTerms}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-3 md:pt-4">
              {currentStep > 1 && (
                <button type="button" onClick={handlePrevious}
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium">
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />Back
                </button>
              )}
              {currentStep < 4 ? (
                <button type="button" onClick={handleNext}
                  className={`${currentStep > 1 ? 'ml-auto' : 'w-full'} px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm font-medium`}>
                  Next <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting}
                  className={`${currentStep > 1 ? 'ml-auto' : 'w-full'} px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm font-medium`}>
                  {isSubmitting
                    ? <><Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />Sending OTP...</>
                    : <><CheckSquare className="h-3 w-3 md:h-4 md:w-4" />Complete & Verify</>}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="hidden md:block mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1">
              Sign in here <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 md:p-4 bg-purple-50 rounded-lg md:rounded-xl">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            <span className="text-xs md:text-sm font-medium text-purple-900">Secure Registration</span>
          </div>
          <p className="text-[10px] md:text-xs text-purple-700">
            Your email will be verified via OTP. Use a valid email address to receive your verification code.
          </p>
        </div>

        <p className="mt-6 md:mt-8 text-center text-[10px] md:text-xs text-gray-500">
          © {new Date().getFullYear()} PLASU HydroTrack System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;