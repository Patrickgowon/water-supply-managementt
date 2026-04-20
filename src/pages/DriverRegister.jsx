// src/pages/DriverRegister.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle,
  CheckCircle, Loader2, Shield, ArrowRight, ArrowLeft,
  Droplets, XCircle, CheckSquare, Truck, Hash, MapPin,
  FileText, Star, Calendar, CreditCard, Camera, Wrench,
  KeyRound, Send, RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Toast ─────────────────────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };
  return {
    toast,
    success: (m) => showToast('success', m),
    error:   (m) => showToast('error', m),
    info:    (m) => showToast('info', m),
  };
};

const DriverRegisterPage = () => {
  const navigate = useNavigate();
  const { toast, success, error, info } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerStatus, setRegisterStatus] = useState({ type: '', message: '' });
  
  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [registrationData, setRegistrationData] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1 – Personal
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', address: '',
    // Step 2 – Vehicle
    tankerId: '', vehicleType: '', vehiclePlate: '', vehicleCapacity: '', vehicleYear: '',
    // Step 3 – License & Experience
    licenseNumber: '', licenseExpiry: '', yearsExperience: '', emergencyContact: '', emergencyPhone: '',
    // Step 4 – Security
    password: '', confirmPassword: '', agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false, hasNumber: false, hasUpper: false, hasLower: false, hasSpecial: false,
  });

  const vehicleTypes   = ['5,000L Tanker', '8,000L Tanker', '10,000L Tanker', '15,000L Tanker', '20,000L Tanker'];
  const capacityOptions= ['5000', '8000', '10000', '15000', '20000'];
  const expOptions     = ['< 1 year', '1–2 years', '3–5 years', '5–10 years', '10+ years'];

  // ── OTP Timer ────────────────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') checkPasswordStrength(value);
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    if (registerStatus.message) setRegisterStatus({ type: '', message: '' });
  };

  const checkPasswordStrength = (pw) => {
    setPasswordStrength({
      hasLength:  pw.length >= 8,
      hasNumber:  /\d/.test(pw),
      hasUpper:   /[A-Z]/.test(pw),
      hasLower:   /[a-z]/.test(pw),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
    });
  };

  const getStrengthScore = () =>
    Object.values(passwordStrength).filter(Boolean).length;

  const getStrengthText = () => {
    const s = getStrengthScore();
    if (s === 0) return { text: 'Very Weak', color: 'text-red-600' };
    if (s <= 2)  return { text: 'Weak',      color: 'text-orange-600' };
    if (s <= 3)  return { text: 'Fair',      color: 'text-yellow-600' };
    if (s <= 4)  return { text: 'Good',      color: 'text-blue-600' };
    return              { text: 'Strong',    color: 'text-green-600' };
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateStep = (step) => {
    const e = {};
    if (step === 1) {
      if (!formData.firstName)  e.firstName  = 'First name is required';
      else if (formData.firstName.length < 2) e.firstName = 'At least 2 characters';
      if (!formData.lastName)   e.lastName   = 'Last name is required';
      else if (formData.lastName.length < 2)  e.lastName  = 'At least 2 characters';
      if (!formData.email)      e.email      = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email';
      if (!formData.phone)      e.phone      = 'Phone number is required';
      else if (!/^[0-9]{11}$/.test(formData.phone))  e.phone = 'Must be 11 digits';
      if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
      if (!formData.address)     e.address    = 'Address is required';
    }
    if (step === 2) {
      if (!formData.tankerId)        e.tankerId        = 'Tanker ID is required';
      if (!formData.vehicleType)     e.vehicleType     = 'Vehicle type is required';
      if (!formData.vehiclePlate)    e.vehiclePlate    = 'Plate number is required';
      else if (!/^[A-Z]{2,3}-\d{3}[A-Z]{2}$/i.test(formData.vehiclePlate))
                                     e.vehiclePlate    = 'Format: ABC-123DE';
      if (!formData.vehicleCapacity) e.vehicleCapacity = 'Capacity is required';
      if (!formData.vehicleYear)     e.vehicleYear     = 'Vehicle year is required';
    }
    if (step === 3) {
      if (!formData.licenseNumber)   e.licenseNumber   = 'License number is required';
      if (!formData.licenseExpiry)   e.licenseExpiry   = 'License expiry is required';
      if (!formData.yearsExperience) e.yearsExperience = 'Experience is required';
      if (!formData.emergencyContact)e.emergencyContact= 'Emergency contact name is required';
      if (!formData.emergencyPhone)  e.emergencyPhone  = 'Emergency contact phone is required';
      else if (!/^[0-9]{11}$/.test(formData.emergencyPhone)) e.emergencyPhone = 'Must be 11 digits';
    }
    if (step === 4) {
      if (!formData.password)           e.password        = 'Password is required';
      else if (formData.password.length < 8) e.password   = 'At least 8 characters';
      else if (getStrengthScore() < 3)  e.password        = 'Password is too weak';
      if (!formData.confirmPassword)    e.confirmPassword = 'Please confirm password';
      else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!formData.agreeTerms)         e.agreeTerms      = 'You must agree to the terms';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(p => p + 1); };
  const handlePrevious = () => setCurrentStep(p => p - 1);

  // ── Submit registration (without OTP) ───────────────────────────────────────
  const submitRegistration = async () => {
    setIsSubmitting(true);
    setRegisterStatus({ type: '', message: '' });
    try {
      const response = await axios.post(`${API_URL}/auth/driver/register`, {
        firstName:        formData.firstName,
        lastName:         formData.lastName,
        email:            formData.email,
        phone:            formData.phone,
        dateOfBirth:      formData.dateOfBirth,
        address:          formData.address,
        tankerId:         formData.tankerId,
        vehicleType:      formData.vehicleType,
        vehiclePlate:     formData.vehiclePlate,
        vehicleCapacity:  formData.vehicleCapacity,
        vehicleYear:      formData.vehicleYear,
        licenseNumber:    formData.licenseNumber,
        licenseExpiry:    formData.licenseExpiry,
        yearsExperience:  formData.yearsExperience,
        emergencyContact: formData.emergencyContact,
        emergencyPhone:   formData.emergencyPhone,
        password:         formData.password,
        confirmPassword:  formData.confirmPassword,
      });
      
      // Store registration data for potential resend
      setRegistrationData(response.data.data);
      setOtpEmail(formData.email);
      
      // Show OTP modal instead of auto-login
      setShowOtpModal(true);
      startResendTimer();
      info('Verification code sent to your email!');
      
    } catch (err) {
      console.error('❌ Driver registration error:', err);
      const msg =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setRegisterStatus({ type: 'error', message: msg });
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      error('Please enter a valid 6-digit OTP code');
      return;
    }
    
    setOtpLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/driver/verify-otp`, {
        email: otpEmail,
        otp: otpCode
      });
      
      if (response.data.success) {
        success('Email verified successfully! Redirecting to login...');
        setShowOtpModal(false);
        localStorage.clear();
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      error(err.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const resendOtp = async () => {
    if (resendTimer > 0) return;
    
    setOtpLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/driver/resend-otp`, {
        email: otpEmail
      });
      
      if (response.data.success) {
        success('New verification code sent to your email!');
        startResendTimer();
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      error(err.response?.data?.message || 'Failed to resend OTP code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    await submitRegistration();
  };

  // ── Steps config ─────────────────────────────────────────────────────────────
  const steps = [
    { number: 1, title: 'Personal',  icon: User    },
    { number: 2, title: 'Vehicle',   icon: Truck   },
    { number: 3, title: 'License',   icon: FileText},
    { number: 4, title: 'Security',  icon: Lock    },
  ];
  const CurrentStepIcon = steps[currentStep - 1].icon;
  const strengthScore   = getStrengthScore();
  const strengthText    = getStrengthText();

  // ── Shared input class ────────────────────────────────────────────────────────
  const inputCls = (field) =>
    `w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}`;

  const selectCls = (field) =>
    `w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-300'}`;

  const ErrMsg = ({ field }) => errors[field]
    ? <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[field]}</p>
    : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 md:py-12 px-3 md:px-4">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 animate-bounce ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Verify Your Email</h3>
              <p className="text-sm text-gray-500 mt-1">
                We've sent a 6-digit verification code to<br />
                <span className="font-semibold text-green-600">{otpEmail}</span>
              </p>
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP Code</label>
              <input
                type="text"
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div className="flex justify-between items-center mb-5">
              <button
                onClick={resendOtp}
                disabled={resendTimer > 0 || otpLoading}
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${otpLoading ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </button>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            
            <button
              onClick={verifyOtp}
              disabled={otpLoading || otpCode.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {otpLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
              ) : (
                <><CheckCircle className="h-5 w-5" /> Verify & Complete Registration</>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              Didn't receive the code? Check your spam folder or click resend.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="h-10 w-10 md:h-14 md:w-14 bg-green-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
              <Truck className="h-5 w-5 md:h-7 md:w-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            Driver Registration
          </h1>
          <p className="text-xs md:text-sm text-gray-600 px-4">
            Join PLASU HydroTrack as a certified water delivery driver
          </p>
          <div className="mt-3 md:hidden">
            <Link to="/login" className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <ArrowRight className="h-3 w-3" />Already registered? Sign in
            </Link>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : currentStep === step.number
                      ? 'bg-green-600 text-white ring-2 md:ring-4 ring-green-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.number
                      ? <CheckCircle className="h-3 w-3 md:h-5 md:w-5" />
                      : <step.icon className="h-3 w-3 md:h-5 md:w-5" />}
                  </div>
                  <span className={`text-[10px] md:text-xs mt-1 md:mt-2 font-medium ${
                    currentStep >= step.number ? 'text-green-600' : 'text-gray-400'
                  }`}>{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 md:h-1 mx-1 md:mx-2 transition-all duration-300 ${
                    currentStep > step.number + 1 ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Status Banner */}
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

        {/* Main Card */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="px-4 md:px-8 py-4 md:py-6 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-1 md:gap-2">
              <CurrentStepIcon className="h-4 w-4 md:h-5 md:w-5" />
              <span>Step {currentStep}: {steps[currentStep - 1].title}</span>
            </h2>
            <p className="text-green-100 text-xs md:text-sm mt-1">
              {currentStep === 1 && "Tell us about yourself"}
              {currentStep === 2 && "Enter your vehicle details"}
              {currentStep === 3 && "License & experience info"}
              {currentStep === 4 && "Create a secure password"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-4 md:space-y-6">

            {/* ── STEP 1: Personal Info ── */}
            {currentStep === 1 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

                  {/* First Name */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.firstName} placeholder="John"
                        onChange={e => handleInputChange('firstName', e.target.value)}
                        className={inputCls('firstName')} />
                    </div>
                    <ErrMsg field="firstName" />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.lastName} placeholder="Doe"
                        onChange={e => handleInputChange('lastName', e.target.value)}
                        className={inputCls('lastName')} />
                    </div>
                    <ErrMsg field="lastName" />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="email" value={formData.email} placeholder="your.email@example.com"
                        onChange={e => handleInputChange('email', e.target.value)}
                        className={inputCls('email')} />
                    </div>
                    <ErrMsg field="email" />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="tel" value={formData.phone} placeholder="08031234567" maxLength="11"
                        onChange={e => handleInputChange('phone', e.target.value)}
                        className={inputCls('phone')} />
                    </div>
                    <ErrMsg field="phone" />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="date" value={formData.dateOfBirth}
                        onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                        className={inputCls('dateOfBirth')} />
                    </div>
                    <ErrMsg field="dateOfBirth" />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Residential Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <textarea value={formData.address} placeholder="No. 12, Example Street, City, State"
                        onChange={e => handleInputChange('address', e.target.value)} rows={2}
                        className={`w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} />
                    </div>
                    <ErrMsg field="address" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Vehicle Info ── */}
            {currentStep === 2 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

                  {/* Tanker ID */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Tanker ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.tankerId} placeholder="TNK-001"
                        onChange={e => handleInputChange('tankerId', e.target.value.toUpperCase())}
                        className={inputCls('tankerId')} />
                    </div>
                    <ErrMsg field="tankerId" />
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Vehicle Type</label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <select value={formData.vehicleType}
                        onChange={e => handleInputChange('vehicleType', e.target.value)}
                        className={selectCls('vehicleType')}>
                        <option value="">Select Type</option>
                        {vehicleTypes.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <ErrMsg field="vehicleType" />
                  </div>

                  {/* Plate Number */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Plate Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.vehiclePlate} placeholder="ABC-123DE"
                        onChange={e => handleInputChange('vehiclePlate', e.target.value.toUpperCase())}
                        className={inputCls('vehiclePlate')} />
                    </div>
                    <p className="mt-1 text-[10px] md:text-xs text-gray-500">Format: ABC-123DE</p>
                    <ErrMsg field="vehiclePlate" />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Tank Capacity (Litres)</label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <select value={formData.vehicleCapacity}
                        onChange={e => handleInputChange('vehicleCapacity', e.target.value)}
                        className={selectCls('vehicleCapacity')}>
                        <option value="">Select Capacity</option>
                        {capacityOptions.map(c => <option key={c} value={c}>{parseInt(c).toLocaleString()}L</option>)}
                      </select>
                    </div>
                    <ErrMsg field="vehicleCapacity" />
                  </div>

                  {/* Vehicle Year */}
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Vehicle Year</label>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="number" value={formData.vehicleYear} placeholder="2019"
                        min="2000" max={new Date().getFullYear()}
                        onChange={e => handleInputChange('vehicleYear', e.target.value)}
                        className={inputCls('vehicleYear')} />
                    </div>
                    <ErrMsg field="vehicleYear" />
                  </div>
                </div>

                {/* Info Banner */}
                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                  <Truck className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Your vehicle details will be verified by the admin team before your account is activated.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3: License & Experience ── */}
            {currentStep === 3 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

                  {/* License Number */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">License Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.licenseNumber} placeholder="NIG-DL-XXXXXXXX"
                        onChange={e => handleInputChange('licenseNumber', e.target.value.toUpperCase())}
                        className={inputCls('licenseNumber')} />
                    </div>
                    <ErrMsg field="licenseNumber" />
                  </div>

                  {/* License Expiry */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">License Expiry Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="date" value={formData.licenseExpiry}
                        onChange={e => handleInputChange('licenseExpiry', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={inputCls('licenseExpiry')} />
                    </div>
                    <ErrMsg field="licenseExpiry" />
                  </div>

                  {/* Years Experience */}
                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Years of Driving Experience</label>
                    <div className="relative">
                      <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <select value={formData.yearsExperience}
                        onChange={e => handleInputChange('yearsExperience', e.target.value)}
                        className={selectCls('yearsExperience')}>
                        <option value="">Select Experience</option>
                        {expOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <ErrMsg field="yearsExperience" />
                  </div>

                  {/* Divider */}
                  <div className="md:col-span-2 border-t border-gray-100 pt-2">
                    <p className="text-xs md:text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      Emergency Contact
                    </p>
                  </div>

                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Contact Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="text" value={formData.emergencyContact} placeholder="Jane Doe"
                        onChange={e => handleInputChange('emergencyContact', e.target.value)}
                        className={inputCls('emergencyContact')} />
                    </div>
                    <ErrMsg field="emergencyContact" />
                  </div>

                  {/* Emergency Phone */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input type="tel" value={formData.emergencyPhone} placeholder="08091234567" maxLength="11"
                        onChange={e => handleInputChange('emergencyPhone', e.target.value)}
                        className={inputCls('emergencyPhone')} />
                    </div>
                    <ErrMsg field="emergencyPhone" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Security ── */}
            {currentStep === 4 && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 gap-3 md:gap-4">

                  {/* Password */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'} value={formData.password}
                        onChange={e => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        className={`w-full pl-9 md:pl-10 pr-10 md:pr-12 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      <button type="button" onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                      </button>
                    </div>

                    {/* Strength indicator */}
                    {formData.password && (
                      <div className="mt-2 md:mt-3 space-y-1 md:space-y-2">
                        <div className="flex gap-1 h-1 md:h-1.5">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`flex-1 rounded-full transition-all ${
                              i <= strengthScore
                                ? i <= 2 ? 'bg-red-500' : i <= 3 ? 'bg-orange-500' : i <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                : 'bg-gray-200'
                            }`} />
                          ))}
                        </div>
                        <p className={`text-[10px] md:text-xs font-medium ${strengthText.color}`}>
                          Password Strength: {strengthText.text}
                        </p>
                        <div className="grid grid-cols-2 gap-1 md:gap-2 mt-1 md:mt-2">
                          {[
                            { key: 'hasLength',  label: '8+ chars' },
                            { key: 'hasNumber',  label: 'Number' },
                            { key: 'hasUpper',   label: 'Uppercase' },
                            { key: 'hasLower',   label: 'Lowercase' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1">
                              {passwordStrength[key]
                                ? <CheckCircle className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                                : <XCircle    className="h-2 w-2 md:h-3 md:w-3 text-gray-400" />}
                              <span className="text-[8px] md:text-xs text-gray-600">{label}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1 col-span-2">
                            {passwordStrength.hasSpecial
                              ? <CheckCircle className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                              : <XCircle    className="h-2 w-2 md:h-3 md:w-3 text-gray-400" />}
                            <span className="text-[8px] md:text-xs text-gray-600">Special character</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <ErrMsg field="password" />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                        onChange={e => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className={`w-full pl-9 md:pl-10 pr-10 md:pr-12 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password && (
                      <div className="mt-1 md:mt-2">
                        {formData.password === formData.confirmPassword
                          ? <p className="text-[10px] md:text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-2 w-2 md:h-3 md:w-3" />Passwords match</p>
                          : <p className="text-[10px] md:text-xs text-red-600 flex items-center gap-1"><XCircle    className="h-2 w-2 md:h-3 md:w-3" />Passwords do not match</p>}
                      </div>
                    )}
                    <ErrMsg field="confirmPassword" />
                  </div>

                  {/* Terms */}
                  <div className="pt-2 md:pt-4">
                    <div className="flex items-start gap-2 md:gap-3">
                      <input type="checkbox" id="agreeTerms" checked={formData.agreeTerms}
                        onChange={e => handleInputChange('agreeTerms', e.target.checked)}
                        className="mt-0.5 h-3 w-3 md:h-4 md:w-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                      <label htmlFor="agreeTerms" className="text-[10px] md:text-sm text-gray-600">
                        I agree to the{' '}
                        <a href="#" className="text-green-600 hover:text-green-700 font-medium">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-green-600 hover:text-green-700 font-medium">Driver Code of Conduct</a>
                      </label>
                    </div>
                    <ErrMsg field="agreeTerms" />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-3 md:pt-4">
              {currentStep > 1 && (
                <button type="button" onClick={handlePrevious}
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium transition-colors">
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />Back
                </button>
              )}
              {currentStep < 4 ? (
                <button type="button" onClick={handleNext}
                  className={`${currentStep > 1 ? 'ml-auto' : 'w-full'} px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm font-medium transition-all`}>
                  Next <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting}
                  className={`${currentStep > 1 ? 'ml-auto' : 'w-full'} px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm font-medium transition-all`}>
                  {isSubmitting
                    ? <><Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />Submitting...</>
                    : <><Send className="h-3 w-3 md:h-4 md:w-4" />Complete Registration</>}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Desktop sign-in link */}
        <div className=" mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              onClick={() => localStorage.clear()}
              className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1">
              Sign in here <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 md:p-4 bg-green-50 rounded-lg md:rounded-xl border border-green-100">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            <span className="text-xs md:text-sm font-medium text-green-900">Driver Verification Process</span>
          </div>
          <p className="text-[10px] md:text-xs text-green-700">
            After registration, you'll receive an OTP to verify your email. Once verified, your license and vehicle details will be reviewed by an admin within 24–48 hours. You will receive an email once your account is activated.
          </p>
        </div>

        <p className="mt-6 md:mt-8 text-center text-[10px] md:text-xs text-gray-500">
          © {new Date().getFullYear()} PLASU HydroTrack System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default DriverRegisterPage;