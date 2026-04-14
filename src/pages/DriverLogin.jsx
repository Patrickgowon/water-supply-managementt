// src/pages/DriverLogin.jsx
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
  Truck,
  IdCard,
  Phone,
  Users
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Simple toast notification system
const useToast = () => {
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };

  const success = (message) => showToast('success', message);
  const error = (message) => showToast('error', message);

  return { toast, success, error };
};

const DriverLogin = () => {
  const navigate = useNavigate();
  const { toast, success, error } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [formData, setFormData] = useState({
    email: '',
    driverId: '',
    password: '',
    phone: ''
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

    if (loginMethod === 'email') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else {
      if (!formData.driverId) {
        newErrors.driverId = 'Driver ID is required';
      }
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[0-9]{11}$/.test(formData.phone)) {
        newErrors.phone = 'Phone must be 11 digits';
      }
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
      let loginData = {};
      
      if (loginMethod === 'email') {
        loginData = {
          email: formData.email,
          password: formData.password,
          loginType: 'email'
        };
      } else {
        loginData = {
          driverId: formData.driverId,
          phone: formData.phone,
          password: formData.password,
          loginType: 'id'
        };
      }

      // Real API call to backend
      const response = await axios.post(
        `${API_URL}/auth/driver/login`,
        loginData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Driver login response:', response.data);

      const { token, data: driver } = response.data;

      // Save token and driver data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(driver));
      localStorage.setItem('userRole', 'driver');

      setLoginStatus({
        type: 'success',
        message: response.data.message || 'Login successful! Redirecting to driver dashboard...'
      });

      success(`Welcome back, ${driver.firstName || driver.name}!`);

      setTimeout(() => {
        navigate('/driver-dashboard', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('Driver login error:', err);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email/password or account not activated.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Account is deactivated. Please contact admin.';
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
              <Truck className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="h-10 w-10 sm:h-14 sm:w-14 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <IdCard className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Driver Portal</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">PLASU HydroTrack Delivery System</p>
        </div>

        {/* Modern Responsive Toggle Switch */}
        <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-md p-1 sm:p-2">
          <div className="flex items-center justify-between">
            {/* Admin Label - Inactive */}
            <div className="flex-1 text-center">
              <div 
                onClick={() => navigate('/admin-login')}
                className="py-2 sm:py-3 px-2 sm:px-4 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Shield className="h-3 w-3 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Admin</span>
                </div>
              </div>
            </div>
            
            {/* Toggle Button - Clickable */}
            <button
              onClick={() => navigate('/admin-login')}
              className="mx-2 sm:mx-3 relative inline-flex items-center justify-center group"
              aria-label="Switch to Admin Login"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Toggle circle */}
              <div className="relative bg-white border-2 border-green-200 rounded-full p-0.5 sm:p-1 hover:border-green-400 transition-colors shadow-md">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white shadow-inner">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
              </div>
              
              {/* Tooltip - Hidden on mobile, visible on hover desktop */}
              <span className="absolute -bottom-5 sm:-bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                Switch to Admin
              </span>
            </button>
            
            {/* Driver Label - Active */}
            <div className="flex-1 text-center">
              <div className="py-2 sm:py-3 px-2 sm:px-4 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md">
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
              <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
              Driver Login
            </h2>
            <p className="text-green-100 text-xs sm:text-sm mt-1">
              Enter your credentials to access deliveries
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="px-4 sm:px-8 pt-4 sm:pt-6">
            <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  loginMethod === 'email'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('id')}
                className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  loginMethod === 'id'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Driver ID
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
            {/* Email Login Fields */}
            {loginMethod === 'email' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="driver@hydrosystem.com"
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
            )}

            {/* Driver ID Login Fields */}
            {loginMethod === 'id' && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Driver ID
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.driverId}
                      onChange={(e) => handleInputChange('driverId', e.target.value)}
                      placeholder="DRV001"
                      className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.driverId ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.driverId && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.driverId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="08012345678"
                      maxLength="11"
                      className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </>
            )}

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

        {/* Driver Access Info */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium text-blue-900">Demo Driver Access</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-blue-700">Email: driver@hydrosystem.com</p>
            <p className="text-xs sm:text-sm text-blue-700">Driver ID: DRV001</p>
            <p className="text-xs sm:text-sm text-blue-700">Phone: 08012345678</p>
            <p className="text-xs sm:text-sm text-blue-700">Password: driver123</p>
          </div>
          <p className="text-xs text-blue-600 mt-2">Note: Account must be activated by admin first</p>
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

export default DriverLogin;