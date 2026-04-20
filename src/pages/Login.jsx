import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogIn, Eye, EyeOff, Mail, Lock, AlertCircle,
  CheckCircle, Loader2, Shield, ArrowRight, Droplets, XCircle
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useToast = () => {
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };
  const success = (message) => showToast('success', message);
  const error   = (message) => showToast('error', message);
  return { toast, success, error };
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast, success, error } = useToast();

  const [showPassword, setShowPassword]   = useState(false);
  const [formData, setFormData]           = useState({ email: '', password: '' });
  const [errors, setErrors]               = useState({});
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [loginStatus, setLoginStatus]     = useState({ type: '', message: '' });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0, hasLength: false, hasNumber: false,
    hasUpper: false, hasLower: false, hasSpecial: false
  });

  // ✅ REMOVED: socket.io useEffect - not needed for login page
  // ✅ REMOVED: location tracking useEffect - not needed for login page

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') checkPasswordStrength(value);
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
    if (loginStatus.message) setLoginStatus({ type: '', message: '' });
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
    if (score === 0) return { text: 'Very Weak', color: 'text-red-600' };
    if (score <= 2)  return { text: 'Weak',      color: 'text-orange-600' };
    if (score <= 3)  return { text: 'Fair',       color: 'text-yellow-600' };
    if (score <= 4)  return { text: 'Good',       color: 'text-blue-600' };
    return                  { text: 'Strong',     color: 'text-green-600' };
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
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoginStatus({ type: '', message: '' });

    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { email: formData.email, password: formData.password },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );

      const { token, data: user } = response.data;

      if (!token) throw new Error('No token received from server');
      if (!user)  throw new Error('No user data received from server');

      localStorage.setItem('token',     token);
      localStorage.setItem('user',      JSON.stringify(user));
      localStorage.setItem('isLoggedIn','true');
      localStorage.setItem('userRole',  user.role);

      setLoginStatus({ type: 'success', message: response.data.message || 'Login successful! Redirecting...' });
      success(`Welcome back, ${user.firstName}!`);

      setTimeout(() => {
        console.log('👤 User role:', user.role);
        console.log('👤 Full user object:', user);
        if (user.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (user.role === 'driver') {
          navigate('/driver-dashboard', { replace: true });
        } else {
          navigate('/student-dashboard', { replace: true });
        }
      }, 1500);

    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.response?.status === 403) {
        errorMessage = err.response.data.message || 'Account is deactivated. Contact support.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      setLoginStatus({ type: 'error', message: errorMessage });
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthScore = getPasswordStrengthScore();
  const strengthText  = getPasswordStrengthText();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4">

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 animate-slideDown ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
          {toast.type === 'success'
            ? <CheckCircle className="h-5 w-5" />
            : <AlertCircle className="h-5 w-5" />}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to HydroTrack</h1>
          <p className="text-gray-600">PLASU Water Supply Management System</p>
        </div>

        {/* Login Status */}
        {loginStatus.message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            loginStatus.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {loginStatus.type === 'success'
                ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
              <span className={`text-sm ${
                loginStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {loginStatus.message}
              </span>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Card Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LogIn className="h-5 w-5" /> Login
            </h2>
            <p className="text-green-100 text-sm mt-1">
              Students, Drivers and Admins — all login here
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1 h-1.5">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`flex-1 rounded-full transition-all ${
                        i <= strengthScore
                          ? i <= 2 ? 'bg-red-500' : i <= 3 ? 'bg-orange-500' : i <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthText.color}`}>
                    Password Strength: {strengthText.text}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'hasLength',  label: '8+ characters' },
                      { key: 'hasNumber',  label: 'Number' },
                      { key: 'hasUpper',   label: 'Uppercase' },
                      { key: 'hasLower',   label: 'Lowercase' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1">
                        {passwordStrength[key]
                          ? <CheckCircle className="h-3 w-3 text-green-600" />
                          : <XCircle    className="h-3 w-3 text-gray-400" />}
                        <span className="text-xs text-gray-600">{label}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 col-span-2">
                      {passwordStrength.hasSpecial
                        ? <CheckCircle className="h-3 w-3 text-green-600" />
                        : <XCircle    className="h-3 w-3 text-gray-400" />}
                      <span className="text-xs text-gray-600">Special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              {isSubmitting
                ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Signing in...</>
                : <><LogIn  className="h-5 w-5 mr-2" /> Sign In</>}
            </button>

            {/* Role hint */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                🎓 Students &nbsp;·&nbsp; 🚛 Drivers &nbsp;·&nbsp; 🛡️ Admins — one login for all
              </p>
            </div>

            {/* Register */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1">
                  Register here <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </div>

          </form>
        </div>

        {/* Security badge */}
        <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-900">Secure Login</span>
          </div>
          <p className="text-xs text-purple-700">
            Your credentials are encrypted and never stored in plain text.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PLASU HydroTrack System. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default LoginPage;