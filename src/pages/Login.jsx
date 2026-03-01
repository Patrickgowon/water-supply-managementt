// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogIn,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  ArrowRight,
  Droplets,
  XCircle
} from 'lucide-react';
import axios from 'axios';

// Simple toast notification system
const useToast = () => {
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };

  const success = (message) => showToast('success', message);
  const error = (message) => showToast('error', message);
  const info = (message) => showToast('info', message);

  return { toast, success, error, info };
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast, success, error } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStatus, setLoginStatus] = useState({ type: '', message: '' });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasNumber: false,
    hasUpper: false,
    hasLower: false,
    hasSpecial: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Check password strength when password field changes
    if (field === 'password') {
      checkPasswordStrength(value);
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear login status when user starts typing
    if (loginStatus.message) {
      setLoginStatus({ type: '', message: '' });
    }
  };

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      score: password.length,
      hasLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const getPasswordStrengthScore = () => {
    const { hasLength, hasNumber, hasUpper, hasLower, hasSpecial } = passwordStrength;
    const requirements = [hasLength, hasNumber, hasUpper, hasLower, hasSpecial];
    return requirements.filter(Boolean).length;
  };

  const getPasswordStrengthText = () => {
    const score = getPasswordStrengthScore();
    if (score === 0) return { text: 'Very Weak', color: 'text-red-600', bg: 'bg-red-100' };
    if (score <= 2) return { text: 'Weak', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (score <= 3) return { text: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score <= 4) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { text: 'Strong', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (getPasswordStrengthScore() < 3) {
      newErrors.password = 'Password is too weak. Please use a stronger password.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoginStatus({ type: '', message: '' });

    try {
      // For demo purposes - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock user data based on login
      const mockUserData = {
        id: 'STU' + Date.now(),
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        email: formData.email,
        role: 'student',
        matricNumber: 'PLASU/2021/CSC/001',
        department: 'Computer Science',
        level: '300',
        hall: 'Daniel Hall',
        roomNumber: 'B202',
        phone: '08031234567'
      };
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(mockUserData));
      
      setLoginStatus({
        type: 'success',
        message: 'Login successful! Redirecting to dashboard...'
      });

      success('Login successful! Redirecting to dashboard...');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/student-dashboard');
      }, 2000);

    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Login failed. Invalid email or password.';
      
      setLoginStatus({
        type: 'error',
        message: errorMessage
      });
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthScore = getPasswordStrengthScore();
  const strengthText = getPasswordStrengthText();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 animate-slideDown ${
          toast.type === 'success' ? 'bg-green-600' : 
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-14 w-14 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Droplets className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to HydroTrack
          </h1>
          <p className="text-gray-600">
            PLASU Water Supply Management System
          </p>
        </div>

        {/* Login Status Message */}
        {loginStatus.message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            loginStatus.type === 'success' 
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {loginStatus.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm ${
                loginStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {loginStatus.message}
              </span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Student Login
            </h2>
            <p className="text-green-100 text-sm mt-1">
              Enter your credentials to access the water supply system
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Email Field - Now accepts any email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field - Strong password required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  {/* Strength Meter */}
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all ${
                          i <= strengthScore 
                            ? i <= 2 ? 'bg-red-500' 
                            : i <= 3 ? 'bg-orange-500'
                            : i <= 4 ? 'bg-yellow-500'
                            : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Strength Text */}
                  <p className={`text-xs font-medium ${strengthText.color}`}>
                    Password Strength: {strengthText.text}
                  </p>

                  {/* Password Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasLength ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600">8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasNumber ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600">Number</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasUpper ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600">Uppercase</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {passwordStrength.hasLower ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600">Lowercase</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      {passwordStrength.hasSpecial ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600">Special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <a href="#" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>

            {/* Registration Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1">
                  Register here
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-xs font-semibold text-blue-800 mb-2">Demo Credentials</h4>
          <div className="space-y-1">
            <p className="text-xs text-blue-600">Email: student@example.com</p>
            <p className="text-xs text-blue-600">Password: Password123!</p>
          </div>
          <p className="text-xs text-blue-500 mt-2">
            * Password must be 8+ chars with uppercase, lowercase, number & special character
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PLASU HydroTrack System. All rights reserved.
        </p>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;