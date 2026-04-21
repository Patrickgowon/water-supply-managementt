// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  UserCog,
  Building2,
  Users,
  Truck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://plasu-hydrotrack-backend.onrender.com/api';

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

const AdminLogin = () => {
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (loginStatus.message) {
      setLoginStatus({ type: '', message: '' });
    }
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
      console.log('Attempting admin login with:', formData.email);
      
      // Make real API call to backend
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { 
          email: formData.email, 
          password: formData.password 
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);

      const { token, data: user } = response.data;

      // Check if user has admin role
      if (user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Save token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');

      setLoginStatus({
        type: 'success',
        message: 'Login successful! Redirecting to admin dashboard...'
      });

      success('Welcome back, Admin!');

      setTimeout(() => {
        navigate('/admin-dashboard', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (err.message === 'Access denied. Admin privileges required.') {
        errorMessage = err.message;
      } else if (err.code === 'ECONNABORTED' || !err.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setLoginStatus({
        type: 'error',
        message: errorMessage
      });
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 sm:py-12 px-3 sm:px-4">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 animate-slideDown ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg flex items-center gap-2 text-xs sm:text-sm`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="h-10 w-10 sm:h-14 sm:w-14 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserCog className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Admin Portal</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">PLASU HydroTrack Administration</p>
        </div>

        {/* Modern Responsive Toggle Switch */}
        <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-md p-1 sm:p-2">
          <div className="flex items-center justify-between">
            {/* Admin Label - Active */}
            <div className="flex-1 text-center">
              <div className="py-2 sm:py-3 px-2 sm:px-4 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md">
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Shield className="h-3 w-3 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Admin</span>
                </div>
              </div>
            </div>
            
            {/* Toggle Button - Clickable */}
            <button
              onClick={() => navigate('/driver-login')}
              className="mx-2 sm:mx-3 relative inline-flex items-center justify-center group"
              aria-label="Switch to Driver Login"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Toggle circle */}
              <div className="relative bg-white border-2 border-green-200 rounded-full p-0.5 sm:p-1 hover:border-green-400 transition-colors shadow-md">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white shadow-inner">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
              </div>
              
              {/* Tooltip - Hidden on mobile, visible on hover desktop */}
              <span className="absolute -bottom-5 sm:-bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                Switch to Driver
              </span>
            </button>
            
            {/* Driver Label - Inactive */}
            <div className="flex-1 text-center">
              <div 
                onClick={() => navigate('/driver-login')}
                className="py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Truck className="h-3 w-3 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Driver</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Status Message */}
        {loginStatus.message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border ${
            loginStatus.type === 'success' 
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              {loginStatus.type === 'success' ? (
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              )}
              <span className={`text-xs sm:text-sm ${
                loginStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {loginStatus.message}
              </span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
              <UserCog className="h-4 w-4 sm:h-5 sm:w-5" />
              Admin Login
            </h2>
            <p className="text-green-100 text-xs sm:text-sm mt-1">
              Enter your administrator credentials
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@hydrosystem.com"
                  className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <a href="#" className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Admin Access Info */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            <span className="text-xs sm:text-sm font-medium text-purple-900">Admin Access</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-purple-700">Use your admin credentials created in the database</p>
            <p className="text-xs sm:text-sm text-purple-700 font-mono mt-2">Default admin: admin@hydrosystem.com / admin123</p>
          </div>
        </div>

        {/* Back to Student Login */}
        <div className="mt-4 text-center">
          <Link 
            to="/login" 
            className="text-xs sm:text-sm text-gray-600 hover:text-green-600 transition-colors inline-flex items-center gap-1"
          >
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180" />
            Back to Student Login
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          © {new Date().getFullYear()} PLASU HydroTrack System. All rights reserved.
        </p>
      </div>

      {/* Animation Styles */}
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

export default AdminLogin;