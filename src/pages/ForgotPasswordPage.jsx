import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  Loader2, Droplets, ArrowRight, ArrowLeft, KeyRound,
  ShieldCheck, XCircle, RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://plasu-hydrotrack-backend.onrender.com/api';

const useToast = () => {
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 3000);
  };
  return {
    toast,
    success: (msg) => showToast('success', msg),
    error:   (msg) => showToast('error', msg),
  };
};

// ─── Step indicators ──────────────────────────────────────────────────────────
const steps = [
  { number: 1, label: 'Email'    },
  { number: 2, label: 'Verify'   },
  { number: 3, label: 'Reset'    },
];

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { toast, success, error } = useToast();

  const [step, setStep]               = useState(1); // 1 | 2 | 3
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg]     = useState({ type: '', message: '' });

  // Step 1
  const [email, setEmail]             = useState('');
  const [emailError, setEmailError]   = useState('');

  // Step 2
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError]       = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 3
  const [passwords, setPasswords]     = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [pwErrors, setPwErrors]           = useState({});
  const [pwStrength, setPwStrength]       = useState({
    hasLength: false, hasNumber: false,
    hasUpper: false,  hasLower: false, hasSpecial: false
  });

  // ─── Password strength ───────────────────────────────────────────────────
  const checkStrength = (pw) => setPwStrength({
    hasLength:  pw.length >= 8,
    hasNumber:  /\d/.test(pw),
    hasUpper:   /[A-Z]/.test(pw),
    hasLower:   /[a-z]/.test(pw),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  });

  const strengthScore = Object.values(pwStrength).filter(Boolean).length;
  const strengthText  = () => {
    if (strengthScore === 0) return { text: 'Very Weak', color: 'text-red-600' };
    if (strengthScore <= 2)  return { text: 'Weak',      color: 'text-orange-600' };
    if (strengthScore <= 3)  return { text: 'Fair',      color: 'text-yellow-600' };
    if (strengthScore <= 4)  return { text: 'Good',      color: 'text-blue-600' };
    return                          { text: 'Strong',    color: 'text-green-600' };
  };

  // ─── Resend cooldown timer ───────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── OTP box input handler ───────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError('');
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      document.getElementById('otp-5')?.focus();
    }
    e.preventDefault();
  };

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email) { setEmailError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Enter a valid email address'); return; }
    setEmailError('');
    setIsSubmitting(true);
    setStatusMsg({ type: '', message: '' });
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setStatusMsg({ type: 'success', message: res.data.message });
      success('Reset code sent! Check your email.');
      startCooldown();
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send reset code. Try again.';
      setStatusMsg({ type: 'error', message: msg });
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) { setOtpError('Please enter all 6 digits'); return; }
    setOtpError('');
    setIsSubmitting(true);
    setStatusMsg({ type: '', message: '' });
    try {
      const res = await axios.post(`${API_URL}/auth/verify-reset-otp`, { email, otp: otpString });
      setStatusMsg({ type: 'success', message: res.data.message });
      success('OTP verified!');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP.';
      setOtpError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step 2: Resend OTP ──────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setOtp(['', '', '', '', '', '']);
      startCooldown();
      success('New code sent to your email!');
    } catch (err) {
      error('Failed to resend. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step 3: Reset Password ──────────────────────────────────────────────
  const handleResetPassword = async () => {
    const errs = {};
    if (!passwords.password)        errs.password = 'Password is required';
    else if (passwords.password.length < 8) errs.password = 'Must be at least 8 characters';
    if (!passwords.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (passwords.password !== passwords.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setStatusMsg({ type: '', message: '' });
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        password:        passwords.password,
        confirmPassword: passwords.confirmPassword,
      });
      setStatusMsg({ type: 'success', message: res.data.message });
      success('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Try again.';
      setStatusMsg({ type: 'error', message: msg });
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const st = strengthText();

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">PLASU Water Supply Management System</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s.number
                    ? 'bg-green-600 text-white'
                    : step === s.number
                    ? 'bg-green-600 text-white ring-4 ring-green-100'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.number ? <CheckCircle className="h-5 w-5" /> : s.number}
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  step >= s.number ? 'text-green-700' : 'text-gray-400'
                }`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-16 mx-2 mb-4 transition-all ${
                  step > s.number ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Status message */}
        {statusMsg.message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            statusMsg.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {statusMsg.type === 'success'
                ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
              <span className={`text-sm ${
                statusMsg.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>{statusMsg.message}</span>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Card header */}
          <div className="px-8 py-6 bg-gradient-to-r from-green-600 to-green-700">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {step === 1 && <><Mail className="h-5 w-5" /> Enter Your Email</>}
              {step === 2 && <><ShieldCheck className="h-5 w-5" /> Verify OTP Code</>}
              {step === 3 && <><KeyRound className="h-5 w-5" /> Set New Password</>}
            </h2>
            <p className="text-green-100 text-sm mt-1">
              {step === 1 && "We'll send a 6-digit reset code to your email"}
              {step === 2 && `Code sent to ${email}`}
              {step === 3 && 'Choose a strong new password'}
            </p>
          </div>

          <div className="p-8 space-y-6">

            {/* ── STEP 1: Email ─────────────────────────────────────────── */}
            {step === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    placeholder="your.email@example.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                      emailError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> {emailError}
                  </p>
                )}

                <button
                  onClick={handleSendOTP}
                  disabled={isSubmitting}
                  className="mt-6 w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                  {isSubmitting
                    ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Sending...</>
                    : <><Mail className="h-5 w-5 mr-2" /> Send Reset Code</>}
                </button>
              </div>
            )}

            {/* ── STEP 2: OTP ───────────────────────────────────────────── */}
            {step === 2 && (
              <div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>

                {/* OTP boxes */}
                <div className="flex gap-2 justify-center mb-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                        digit ? 'border-green-400 bg-green-50' : otpError ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-sm text-red-600 flex items-center justify-center gap-1 mb-2">
                    <AlertCircle className="h-4 w-4" /> {otpError}
                  </p>
                )}

                {/* Resend */}
                <div className="text-center mb-4">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isSubmitting}
                    className="text-sm text-green-600 hover:text-green-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1 mx-auto">
                    <RefreshCw className="h-4 w-4" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={isSubmitting || otp.join('').length !== 6}
                  className="w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                  {isSubmitting
                    ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Verifying...</>
                    : <><ShieldCheck className="h-5 w-5 mr-2" /> Verify Code</>}
                </button>

                <button
                  onClick={() => { setStep(1); setOtp(['','','','','','']); setOtpError(''); }}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-4 w-4" /> Change email address
                </button>
              </div>
            )}

            {/* ── STEP 3: New Password ──────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.password}
                      onChange={e => {
                        setPasswords(p => ({ ...p, password: e.target.value }));
                        checkStrength(e.target.value);
                        if (pwErrors.password) setPwErrors(p => ({ ...p, password: '' }));
                      }}
                      placeholder="Enter new password"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                        pwErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {pwErrors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> {pwErrors.password}
                    </p>
                  )}

                  {/* Strength meter */}
                  {passwords.password && (
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
                      <p className={`text-xs font-medium ${st.color}`}>
                        Password Strength: {st.text}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { key: 'hasLength',  label: '8+ characters' },
                          { key: 'hasNumber',  label: 'Number' },
                          { key: 'hasUpper',   label: 'Uppercase' },
                          { key: 'hasLower',   label: 'Lowercase' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-1">
                            {pwStrength[key]
                              ? <CheckCircle className="h-3 w-3 text-green-600" />
                              : <XCircle    className="h-3 w-3 text-gray-400" />}
                            <span className="text-xs text-gray-600">{label}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-1 col-span-2">
                          {pwStrength.hasSpecial
                            ? <CheckCircle className="h-3 w-3 text-green-600" />
                            : <XCircle    className="h-3 w-3 text-gray-400" />}
                          <span className="text-xs text-gray-600">Special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={passwords.confirmPassword}
                      onChange={e => {
                        setPasswords(p => ({ ...p, confirmPassword: e.target.value }));
                        if (pwErrors.confirmPassword) setPwErrors(p => ({ ...p, confirmPassword: '' }));
                      }}
                      placeholder="Confirm new password"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${
                        pwErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {passwords.confirmPassword && (
                    <p className={`mt-2 text-xs flex items-center gap-1 ${
                      passwords.password === passwords.confirmPassword ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {passwords.password === passwords.confirmPassword
                        ? <><CheckCircle className="h-3 w-3" /> Passwords match</>
                        : <><XCircle    className="h-3 w-3" /> Passwords do not match</>}
                    </p>
                  )}
                  {pwErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> {pwErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                  {isSubmitting
                    ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Resetting...</>
                    : <><KeyRound className="h-5 w-5 mr-2" /> Reset Password</>}
                </button>
              </div>
            )}

            {/* Back to login — always visible */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Remember your password?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1">
                  Back to Login <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </div>

          </div>
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

export default ForgotPasswordPage;