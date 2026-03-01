// src/pages/StudentDashboard.jsx
// ⚠️  SETUP REQUIRED: Replace 'pk_test_xxx...' with your real Paystack PUBLIC key
// Get your key at: https://dashboard.paystack.com/#/settings/developers
//
// Required dependencies (already in package.json if using standard setup):
//   npm install react-icons chart.js react-chartjs-2 react-leaflet leaflet
//
// Optional .env file (create at project root):
//   VITE_PAYSTACK_PUBLIC_KEY=pk_test_yourkey
//   VITE_APP_NAME=AquaStudent

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTint, FaTruck, FaBell, FaUserCircle, FaClock,
  FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt,
  FaPhone, FaEnvelope, FaGraduationCap, FaHome, FaIdCard,
  FaPlus, FaCreditCard, FaMoneyBillWave, FaMapMarkedAlt,
  FaStopwatch, FaCog, FaToggleOn, FaToggleOff,
  FaTimes, FaEdit, FaSave, FaChevronRight,
  FaShieldAlt, FaTrash, FaKey, FaSun, FaMoon,
} from 'react-icons/fa';
import { MdOutlineWaterDrop, MdOutlinePayment, MdNotifications, MdSecurity } from 'react-icons/md';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ─── PAYSTACK HOOK ────────────────────────────────────────────────────────────
const usePaystack = () => {
  const loadScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.PaystackPop) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }, []);

  const initializePayment = useCallback(async ({ email, amount, planName, onSuccess, onClose }) => {
    const loaded = await loadScript();
    if (!loaded || !window.PaystackPop) {
      return { error: 'Paystack failed to load. Check your internet connection.' };
    }
    const paystackKey = import.meta?.env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email,
      amount: amount * 100,
      currency: 'NGN',
      ref: `AQUA_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      metadata: {
        plan: planName,
        custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: planName }]
      },
      callback: (response) => onSuccess(response),
      onClose: () => onClose && onClose(),
    });
    handler.openIframe();
    return { error: null };
  }, [loadScript]);

  return { initializePayment };
};

// ─── TOAST SYSTEM ────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{ animation: 'slideInRight 0.35s cubic-bezier(.22,.68,0,1.2)' }}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium min-w-[280px] max-w-sm pointer-events-auto
          ${t.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            t.type === 'error'   ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            t.type === 'info'    ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                   'bg-gradient-to-r from-yellow-500 to-orange-500'}`}
      >
        <span className="text-xl mt-0.5 shrink-0">
          {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '⚠️'}
        </span>
        <div className="flex-1">
          <p>{t.message}</p>
          {t.sub && <p className="text-xs opacity-80 mt-0.5">{t.sub}</p>}
        </div>
        <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100 shrink-0 mt-0.5">✕</button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((type, message, sub = '', duration = 5500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, message, sub }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);
  const removeToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, addToast, removeToast };
};

// ─── PLAN PRICES (kobo → NGN) ─────────────────────────────────────────────────
const PLAN_PRICES = { plan1: 5000, plan2: 10000, plan3: 18000 };

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────
const PaymentModal = ({ show, onClose, selectedPlan, userEmail, addToast, onPaymentSuccess }) => {
  const { initializePayment } = usePaystack();
  const [step, setStep] = useState('select');   // select | confirm | processing | result
  const [method, setMethod] = useState(null);
  const [result, setResult] = useState(null);

  // Reset when reopened
  useEffect(() => {
    if (show) { setStep('select'); setMethod(null); setResult(null); }
  }, [show]);

  const handlePay = async () => {
    if (!selectedPlan) return;
    setStep('processing');

    if (method === 'card') {
      const { error } = await initializePayment({
        email: userEmail || 'student@university.edu.ng',
        amount: PLAN_PRICES[selectedPlan.id] || 5000,
        planName: selectedPlan.name,
        onSuccess: (response) => {
          setResult({ success: true, ref: response.reference });
          setStep('result');
          addToast('success', 'Payment Successful! 🎉', `Ref: ${response.reference}`);
          onPaymentSuccess({ plan: selectedPlan, ref: response.reference, method: 'Card' });
        },
        onClose: () => {
          setStep('confirm');
          addToast('info', 'Payment window closed', 'Transaction was not completed.');
        },
      });
      if (error) {
        setResult({ success: false, message: error });
        setStep('result');
        addToast('error', 'Payment Error', error);
      }
    } else {
      // Simulated bank/USSD for demo
      await new Promise(r => setTimeout(r, 3200));
      const ok = Math.random() > 0.15;
      const ref = `AQUA_${Date.now()}`;
      if (ok) {
        setResult({ success: true, ref });
        setStep('result');
        addToast('success', 'Payment Confirmed! 🎉', `Ref: ${ref}`);
        onPaymentSuccess({ plan: selectedPlan, ref, method: method === 'bank' ? 'Bank Transfer' : 'USSD' });
      } else {
        setResult({ success: false, message: 'Transaction declined. Please try a different method or contact your bank.' });
        setStep('result');
        addToast('error', 'Payment Failed', 'Transaction was declined.');
      }
    }
  };

  if (!show) return null;

  const METHODS = [
    { id: 'card', emoji: '💳', bg: 'bg-blue-100', icon: <FaCreditCard className="text-blue-600" />, label: 'Credit / Debit Card', sub: 'Visa · Mastercard · Verve — Instant' },
    { id: 'bank', emoji: '🏦', bg: 'bg-green-100', icon: <FaMoneyBillWave className="text-green-600" />, label: 'Bank Transfer', sub: 'Direct bank transfer' },
    { id: 'ussd', emoji: '📱', bg: 'bg-yellow-100', icon: <MdOutlinePayment className="text-yellow-600 text-xl" />, label: 'USSD', sub: 'Pay via USSD code' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-5 text-white ${result?.success ? 'bg-gradient-to-r from-green-500 to-emerald-600' : result && !result.success ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-green-600 to-emerald-700'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">
                {step === 'result' && result?.success ? '🎉 Payment Successful' :
                 step === 'result'                    ? '❌ Payment Failed' :
                 step === 'processing'               ? '⏳ Processing Payment…' :
                 step === 'confirm'                  ? '✅ Confirm & Pay' :
                                                       '💳 Choose Payment Method'}
              </h3>
              {selectedPlan && step !== 'result' && (
                <p className="text-white/80 text-sm mt-0.5">{selectedPlan.name} — {selectedPlan.price}/{selectedPlan.period}</p>
              )}
            </div>
            {step !== 'processing' && (
              <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* SELECT METHOD */}
          {step === 'select' && (
            <div className="space-y-3">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => { setMethod(m.id); setStep('confirm'); }}
                  className="w-full p-4 border-2 border-gray-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-3 group text-left">
                  <div className={`w-11 h-11 ${m.bg} rounded-full flex items-center justify-center text-lg shrink-0`}>{m.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.sub}</p>
                  </div>
                  <FaChevronRight className="text-gray-300 group-hover:text-green-600 transition-colors" />
                </button>
              ))}
              {!selectedPlan && (
                <p className="text-xs text-orange-500 text-center pt-1">⚠️ No plan selected — go to Payments tab to select one</p>
              )}
            </div>
          )}

          {/* CONFIRM */}
          {step === 'confirm' && selectedPlan && (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Order Summary</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{selectedPlan.name}</p>
                    <p className="text-sm text-gray-500">{selectedPlan.water} · {selectedPlan.deliveries}</p>
                  </div>
                  <p className="text-2xl font-black text-green-600">{selectedPlan.price}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{METHODS.find(m => m.id === method)?.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{METHODS.find(m => m.id === method)?.label}</p>
                  <p className="text-xs text-gray-500">Selected payment method</p>
                </div>
                <button onClick={() => setStep('select')} className="ml-auto text-xs text-green-600 hover:underline font-medium">Change</button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaShieldAlt className="text-green-500" />
                <span>Payments secured by Paystack · 256-bit SSL</span>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep('select')} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Back</button>
                <button onClick={handlePay}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 text-sm">
                  Pay {selectedPlan.price}
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {step === 'processing' && (
            <div className="py-12 text-center">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  {METHODS.find(m => m.id === method)?.emoji}
                </div>
              </div>
              <p className="text-lg font-bold text-gray-800">Processing Payment…</p>
              <p className="text-sm text-gray-500 mt-1">Please wait. Do not close this window.</p>
              {method !== 'card' && (
                <div className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                  Verifying transaction with your bank...
                </div>
              )}
            </div>
          )}

          {/* RESULT */}
          {step === 'result' && (
            <div className="py-6 text-center">
              {result?.success ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">✅</div>
                  <p className="text-2xl font-black text-gray-800 mb-1">Payment Successful!</p>
                  <p className="text-sm text-gray-500">Your <strong>{selectedPlan?.name}</strong> is now active</p>
                  <div className="mt-4 bg-gray-50 rounded-xl p-3 text-left">
                    <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
                    <p className="font-mono text-xs font-bold text-gray-700 break-all">{result.ref}</p>
                  </div>
                  <button onClick={onClose}
                    className="mt-5 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all">
                    Continue to Dashboard
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">❌</div>
                  <p className="text-2xl font-black text-gray-800 mb-1">Payment Failed</p>
                  <p className="text-sm text-gray-500 mt-1 mb-4">{result?.message}</p>
                  <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button>
                    <button onClick={() => { setStep('select'); setResult(null); }}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm">
                      Try Again
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
const SettingsPanel = ({ show, onClose, user, settings, setSettings, addToast }) => {
  const [section, setSection] = useState('notifications');
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({ phone: user?.phone || '', email: user?.email || '' });
  const [pwData, setPwData] = useState({ current: '', newPw: '', confirm: '' });

  if (!show) return null;

  const toggle = (key) => {
    const next = !settings[key];
    setSettings(p => ({ ...p, [key]: next }));
    const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    addToast('info', `${label.charAt(0).toUpperCase() + label.slice(1)} ${next ? 'enabled' : 'disabled'}`);
  };

  const saveProfile = () => { setEditProfile(false); addToast('success', 'Profile updated!'); };

  const changePassword = () => {
    if (!pwData.current)        return addToast('error', 'Enter your current password');
    if (pwData.newPw.length < 8) return addToast('error', 'New password must be ≥ 8 characters');
    if (pwData.newPw !== pwData.confirm) return addToast('error', 'Passwords do not match');
    setPwData({ current: '', newPw: '', confirm: '' });
    addToast('success', 'Password changed successfully!');
  };

  const ToggleRow = ({ label, sub, settingKey }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => toggle(settingKey)} className="transition-transform active:scale-90 ml-4 shrink-0">
        {settings[settingKey]
          ? <FaToggleOn className="text-3xl text-green-500" />
          : <FaToggleOff className="text-3xl text-gray-300" />}
      </button>
    </div>
  );

  const SECTIONS = [
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'appearance',    icon: '🎨', label: 'Appearance' },
    { id: 'security',      icon: '🔒', label: 'Security' },
    { id: 'profile',       icon: '👤', label: 'Edit Profile' },
    { id: 'danger',        icon: '⚠️', label: 'Danger Zone' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex max-h-[90vh]">
        {/* Sidebar */}
        <div className="w-52 bg-gray-50 border-r border-gray-100 p-4 flex flex-col shrink-0">
          <div className="flex items-center gap-2 mb-5">
            <FaCog className="text-green-600" />
            <span className="font-bold text-gray-800">Settings</span>
          </div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 text-left transition-all
                ${section === s.id ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
          <button onClick={onClose}
            className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl">
            <FaTimes size={12} /> Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {section === 'notifications' && (
            <div>
              <h4 className="font-bold text-gray-800 text-lg mb-4">Notification Preferences</h4>
              <ToggleRow label="Email Notifications" sub="Updates & receipts via email" settingKey="emailNotif" />
              <ToggleRow label="SMS Notifications" sub="Text alerts on your phone" settingKey="smsNotif" />
              <ToggleRow label="Push Notifications" sub="Browser push alerts" settingKey="pushNotif" />
              <ToggleRow label="Delivery Reminders" sub="1 hour before scheduled delivery" settingKey="deliveryReminders" />
              <ToggleRow label="Payment Reminders" sub="3 days before payment due" settingKey="paymentReminders" />
              <ToggleRow label="Tanker ETA Alerts" sub="When tanker is 10 minutes away" settingKey="etaAlerts" />
            </div>
          )}

          {section === 'appearance' && (
            <div>
              <h4 className="font-bold text-gray-800 text-lg mb-4">Appearance</h4>
              <ToggleRow label="Dark Mode" sub="Switch to dark theme" settingKey="darkMode" />
              <ToggleRow label="Compact View" sub="Reduce spacing for more content" settingKey="compactView" />
              <ToggleRow label="Sound Effects" sub="Play sounds on actions" settingKey="soundEffects" />
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">Accent Color</p>
                <div className="flex gap-3">
                  {[
                    { color: '#10B981', label: 'Green' },
                    { color: '#3B82F6', label: 'Blue' },
                    { color: '#8B5CF6', label: 'Purple' },
                    { color: '#F59E0B', label: 'Amber' },
                    { color: '#EF4444', label: 'Red' },
                  ].map(({ color, label }) => (
                    <button key={color} title={label}
                      onClick={() => addToast('success', `Accent changed to ${label}`)}
                      className="w-9 h-9 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'security' && (
            <div>
              <h4 className="font-bold text-gray-800 text-lg mb-4">Security</h4>
              <ToggleRow label="Two-Factor Authentication" sub="Extra layer of protection" settingKey="twoFA" />
              <ToggleRow label="Login Alerts" sub="Notify on new sign-ins" settingKey="loginAlerts" />
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaKey className="text-green-600" /> Change Password
                </p>
                <div className="space-y-3">
                  {[['Current Password', 'current'], ['New Password', 'newPw'], ['Confirm New Password', 'confirm']].map(([label, key]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 mb-1 block font-medium">{label}</label>
                      <input type="password" value={pwData[key]} onChange={e => setPwData(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={key === 'newPw' ? 'Min. 8 characters' : ''}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                  ))}
                  <button onClick={changePassword}
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 text-sm transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-5">
                <h4 className="font-bold text-gray-800 text-lg">Edit Profile</h4>
                <button onClick={() => setEditProfile(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${editProfile ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                  {editProfile ? <><FaTimes size={11} /> Cancel</> : <><FaEdit size={11} /> Edit</>}
                </button>
              </div>
              <div className="space-y-4">
                {[['Email Address', 'email', 'email'], ['Phone Number', 'phone', 'tel']].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 mb-1 block font-medium">{label}</label>
                    <input type={type} value={profileData[key]} disabled={!editProfile}
                      onChange={e => setProfileData(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors" />
                  </div>
                ))}
                {editProfile && (
                  <button onClick={saveProfile}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                    <FaSave size={13} /> Save Changes
                  </button>
                )}
              </div>
            </div>
          )}

          {section === 'danger' && (
            <div>
              <h4 className="font-bold text-red-600 text-lg mb-5">⚠️ Danger Zone</h4>
              <div className="space-y-3">
                {[
                  { label: 'Delete All Delivery History', sub: 'Permanently remove all past delivery records', btn: 'Delete History', color: 'orange' },
                  { label: 'Cancel Active Subscription', sub: 'Plan ends at current billing period', btn: 'Cancel Plan', color: 'orange' },
                  { label: 'Delete Account', sub: 'Permanently delete account and all data. Irreversible.', btn: 'Delete Account', color: 'red' },
                ].map(({ label, sub, btn, color }) => (
                  <div key={label} className={`border rounded-xl p-4 flex justify-between items-start
                    ${color === 'red' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                    <div className="flex-1 mr-4">
                      <p className={`text-sm font-semibold ${color === 'red' ? 'text-red-800' : 'text-orange-800'}`}>{label}</p>
                      <p className={`text-xs mt-0.5 ${color === 'red' ? 'text-red-600' : 'text-orange-600'}`}>{sub}</p>
                    </div>
                    <button
                      onClick={() => addToast('error', `${btn} requires email confirmation`, 'An email has been sent to verify your identity.')}
                      className={`px-3 py-1.5 text-white rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors
                        ${color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                      {btn}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── HELPER ───────────────────────────────────────────────────────────────────
const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z" />
  </svg>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { toasts, addToast, removeToast } = useToast();

  const [user] = useState({
    firstName: 'Amaka', lastName: 'Okonkwo', matricNumber: 'CSC/2021/045',
    department: 'Computer Science', level: '300', hall: 'Daniel Hall',
    roomNumber: 'B202', email: 'amaka.okonkwo@university.edu.ng', phone: '08012345678',
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTankerTracking, setShowTankerTracking] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [settings, setSettings] = useState({
    emailNotif: true, smsNotif: true, pushNotif: false,
    deliveryReminders: true, paymentReminders: true, etaAlerts: true,
    darkMode: false, compactView: false, soundEffects: false,
    twoFA: false, loginAlerts: true,
  });

  const [paymentHistory, setPaymentHistory] = useState([
    { id: 'PAY001', date: '2024-01-01', plan: 'Standard Plan', amount: '₦10,000', status: 'paid', method: 'Card' },
    { id: 'PAY002', date: '2023-12-01', plan: 'Standard Plan', amount: '₦10,000', status: 'paid', method: 'Bank Transfer' },
    { id: 'PAY003', date: '2023-11-01', plan: 'Basic Plan',    amount: '₦5,000',  status: 'paid', method: 'Card' },
  ]);

  const [activePlan, setActivePlan] = useState('Standard Plan');

  const handlePaymentSuccess = useCallback(({ plan, ref, method }) => {
    setPaymentHistory(p => [{
      id: `PAY${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      plan: plan.name, amount: plan.price, status: 'paid', method,
    }, ...p]);
    setActivePlan(plan.name);
  }, []);

  const deliveries = [
    { id: 'DEL001', date: '2024-01-15', time: '10:30 AM', amount: 500, tanker: 'TKR-001', driver: 'John Danladi',  actualTime: '28 mins' },
    { id: 'DEL002', date: '2024-01-14', time: '02:15 PM', amount: 500, tanker: 'TKR-003', driver: 'Peter Sunday',  actualTime: '32 mins' },
    { id: 'DEL003', date: '2024-01-13', time: '09:00 AM', amount: 500, tanker: 'TKR-002', driver: 'Musa Ibrahim',  actualTime: '30 mins' },
  ];

  const upcomingRequests = [
    { id: 'REQ001', date: '2024-01-20', time: '08:00 AM', status: 'scheduled', amount: 500, tanker: 'TKR-004', driver: 'Yakubu Moses', eta: '25 mins' },
    { id: 'REQ002', date: '2024-01-22', time: '02:00 PM', status: 'pending',   amount: 500, tanker: 'Not assigned', eta: 'Pending' },
  ];

  const activeDelivery = {
    tanker: 'TKR-004', driver: 'Yakubu Moses', eta: '15 minutes', distance: '5.2 km',
    currentLocation: { lat: 9.3265, lng: 8.9947 },
    destination: { lat: 9.3280, lng: 8.9910 },
    waterLevel: 75,
  };

  const paymentPlans = [
    { id: 'plan1', name: 'Basic Plan',    price: '₦5,000',  period: 'month', water: '500L/month',  deliveries: '4 deliveries',
      features: ['500L water per month', '4 scheduled deliveries', 'Basic tracking', 'Email notifications', 'Standard support'],
      popular: false, color: 'from-green-500 to-green-600' },
    { id: 'plan2', name: 'Standard Plan', price: '₦10,000', period: 'month', water: '1000L/month', deliveries: '8 deliveries',
      features: ['1000L water per month', '8 scheduled deliveries', 'Real-time tracking', 'SMS & Email notifications', 'Priority support', 'Delivery history'],
      popular: true,  color: 'from-green-600 to-green-700' },
    { id: 'plan3', name: 'Premium Plan',  price: '₦18,000', period: 'month', water: '2000L/month', deliveries: '12 deliveries',
      features: ['2000L water per month', '12 scheduled deliveries', 'Real-time tracking with map', 'SMS, Email & Push notifications', '24/7 priority support', 'Analytics & history', 'Flexible scheduling'],
      popular: false, color: 'from-green-700 to-green-800' },
  ];

  const consumptionData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ label: 'Water (L)', data: [450, 380, 420, 390, 410, 350, 380], borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }]
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } };

  const TABS = [
    { id: 'overview',  label: 'Overview' },
    { id: 'tracking',  label: 'Live Tracking' },
    { id: 'payments',  label: 'Payments & Plans' },
    { id: 'history',   label: 'Delivery History' },
    { id: 'requests',  label: 'My Requests' },
    { id: 'profile',   label: 'Profile' },
  ];

  const STATS = [
    { icon: <FaTint className="text-green-600" />,          bg: 'bg-green-100',  label: 'Total Water',  val: '6,000L' },
    { icon: <FaTruck className="text-emerald-600" />,       bg: 'bg-emerald-100',label: 'Deliveries',   val: 12 },
    { icon: <FaClock className="text-yellow-600" />,        bg: 'bg-yellow-100', label: 'Pending',      val: 1 },
    { icon: <FaCalendarAlt className="text-purple-600" />,  bg: 'bg-purple-100', label: 'Upcoming',     val: 2 },
    { icon: <FaCheckCircle className="text-pink-600" />,    bg: 'bg-pink-100',   label: 'Satisfaction', val: '95%' },
    { icon: <FaMoneyBillWave className="text-blue-600" />,  bg: 'bg-blue-100',   label: 'Balance',      val: '₦10,000' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <style>{`
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(110%); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── HEADER ── */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                <MdOutlineWaterDrop className="text-xl text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Student Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">Tanker en-route</span>
                <span className="text-xs text-green-600">{activeDelivery.eta}</span>
              </div>
              <button className="relative" onClick={() => addToast('info', '2 new notifications', 'Tanker arriving in 15 min · Payment due in 3 days')}>
                <FaBell className="text-gray-600 text-xl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">2</span>
              </button>
              <button title="Settings" onClick={() => setShowSettings(true)}
                className="w-9 h-9 bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded-full flex items-center justify-center transition-colors">
                <FaCog className="text-gray-600 text-base" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.matricNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── WELCOME BANNER ── */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Welcome back, {user.firstName}! 👋</h2>
              <p className="text-green-100 text-sm">{user.hall}, Room {user.roomNumber} · {user.department} ({user.level} Level)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs bg-green-500 px-2.5 py-1 rounded-full">Active Plan: {activePlan}</span>
                <span className="text-xs bg-green-500 px-2.5 py-1 rounded-full">Next Payment: 2024-02-01</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowSettings(true)}
                className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30 backdrop-blur-sm">
                <FaCog /> Settings
              </button>
              <button onClick={() => { setSelectedPlan(null); setShowPaymentModal(true); }}
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2 shadow-md">
                <FaCreditCard /> Manage Plan
              </button>
              <button onClick={() => setShowRequestModal(true)}
                className="bg-yellow-400 text-green-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow-md">
                <FaPlus /> Request Water
              </button>
            </div>
          </div>
        </div>

        {/* ── ACTIVE DELIVERY CARD ── */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-l-4 border-green-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full animate-pulse">
                <FaTruck className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Active Delivery</h3>
                <p className="text-sm text-gray-600">Tanker {activeDelivery.tanker} is on the way</p>
              </div>
            </div>
            <div className="grid  md:grid-cols-4 gap-4 flex-1">
              <div><p className="text-xs text-gray-500">Driver</p><p className="text-sm font-medium">{activeDelivery.driver}</p></div>
              <div><p className="text-xs text-gray-500">ETA</p><p className="text-sm font-medium text-green-600">{activeDelivery.eta}</p></div>
              <div><p className="text-xs text-gray-500">Distance</p><p className="text-sm font-medium">{activeDelivery.distance}</p></div>
              <div>
                <p className="text-xs text-gray-500">Water Level</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${activeDelivery.waterLevel}%` }} />
                  </div>
                  <span className="text-xs">{activeDelivery.waterLevel}%</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowTankerTracking(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center gap-2 shrink-0 transition-colors">
              <FaMapMarkedAlt /> Track
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid  sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {STATS.map(({ icon, bg, label, val }) => (
            <div key={label} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`${bg} p-2 rounded-lg shrink-0`}>{icon}</div>
                <div><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-bold text-gray-800">{val}</p></div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors
                    ${activeTab === t.id ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Consumption</h3>
                  <div className="h-64"><Line data={consumptionData} options={chartOptions} /></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Deliveries</h3>
                  <div className="space-y-3">
                    {upcomingRequests.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <FaCalendarAlt className="text-green-600 shrink-0" />
                          <div>
                            <p className="font-medium text-gray-800">{r.date} at {r.time}</p>
                            <p className="text-xs text-gray-500">{r.amount}L · Tanker: {r.tanker}</p>
                            {r.eta !== 'Pending' && <p className="text-xs text-green-600 mt-0.5">ETA: {r.eta}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'scheduled' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.status}</span>
                          {r.tanker !== 'Not assigned' && <button onClick={() => setShowTankerTracking(true)} className="text-green-600 hover:text-green-800"><FaMapMarkedAlt /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Deliveries</h3>
                  <div className="space-y-3">
                    {deliveries.slice(0, 3).map(d => (
                      <div key={d.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FaCheckCircle className="text-green-600 shrink-0" />
                          <div>
                            <p className="font-medium text-gray-800">{d.date} at {d.time}</p>
                            <p className="text-xs text-gray-500">{d.amount}L · Driver: {d.driver}</p>
                          </div>
                        </div>
                        <span className="text-xs text-green-600 font-medium">Completed</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* LIVE TRACKING */}
            {activeTab === 'tracking' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Tanker Tracking</h3>
                <div className="h-96 bg-gray-100 rounded-xl overflow-hidden">
                  <MapContainer center={[9.3265, 8.9947]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <Marker position={[activeDelivery.currentLocation.lat, activeDelivery.currentLocation.lng]}>
                      <Popup><div className="p-1"><p className="font-bold">Tanker {activeDelivery.tanker}</p><p className="text-sm">Driver: {activeDelivery.driver}</p><p className="text-sm text-green-600">ETA: {activeDelivery.eta}</p></div></Popup>
                    </Marker>
                    <Marker position={[activeDelivery.destination.lat, activeDelivery.destination.lng]}>
                      <Popup><div className="p-1"><p className="font-bold">Your Location</p><p className="text-sm">Daniel Hall, Room B202</p></div></Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {[['Tanker', activeDelivery.tanker], ['Estimated Arrival', activeDelivery.eta], ['Distance', activeDelivery.distance]].map(([lbl, val]) => (
                    <div key={lbl} className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-xs text-green-600 font-medium">{lbl}</p>
                      <p className="text-lg font-bold text-gray-800 mt-1">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-4">Route Timeline</h4>
                  <div className="space-y-4">
                    {[
                      { color: 'bg-green-500', label: 'Tanker Departure',   sub: 'Water Depot · 08:00 AM', active: false },
                      { color: 'bg-yellow-500', label: 'Current Position',  sub: 'Bokkos Road · 5.2 km away', active: true },
                      { color: 'bg-gray-300',   label: 'Destination',       sub: 'Daniel Hall, Room B202 · ETA 15 min', active: false },
                    ].map(({ color, label, sub, active }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className={`w-3 h-3 ${color} rounded-full mt-1 shrink-0 ${active ? 'animate-pulse' : ''}`}></div>
                        <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="text-xs text-gray-500">{sub}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS & PLANS */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-1">Current Plan: {activePlan}</h3>
                  <p className="text-green-100 mb-4 text-sm">Next payment due: 2024-02-01</p>
                  <div className="flex gap-3">
                    <button onClick={() => { setSelectedPlan(null); setShowPaymentModal(true); }}
                      className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors">Renew Plan</button>
                    <button onClick={() => { setSelectedPlan(null); setShowPaymentModal(true); }}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors">Upgrade</button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Plans</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {paymentPlans.map(plan => (
                      <div key={plan.id} className={`relative bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all hover:shadow-xl
                        ${plan.popular ? 'border-green-500' : 'border-transparent'}`}>
                        {plan.popular && <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">POPULAR</div>}
                        <div className={`p-6 bg-gradient-to-r ${plan.color}`}>
                          <h4 className="text-xl font-bold text-white">{plan.name}</h4>
                          <p className="text-3xl font-black text-white mt-2">{plan.price}</p>
                          <p className="text-green-100 text-sm">per {plan.period}</p>
                        </div>
                        <div className="p-6">
                          <p className="text-sm text-gray-600 mb-4 font-medium">{plan.water} · {plan.deliveries}</p>
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                <span className="text-gray-700">{f}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => { setSelectedPlan(plan); setShowPaymentModal(true); }}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md">
                            Select Plan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>{['Date', 'Plan', 'Amount', 'Method', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paymentHistory.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-700">{p.date}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{p.plan}</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-800">{p.amount}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{p.method}</td>
                            <td className="px-4 py-3"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DELIVERY HISTORY */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery History</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>{['Date/Time', 'Amount', 'Tanker', 'Driver', 'Duration', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {deliveries.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-800">{d.date}<br /><span className="text-xs text-gray-400">{d.time}</span></td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">{d.amount}L</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{d.tanker}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{d.driver}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{d.actualTime}</td>
                          <td className="px-4 py-3"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Completed</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MY REQUESTS */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">My Water Requests</h3>
                  <button onClick={() => setShowRequestModal(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 flex items-center gap-2 transition-all">
                    <FaPlus size={11} /> New Request
                  </button>
                </div>
                <div className="space-y-4">
                  {upcomingRequests.map(r => (
                    <div key={r.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">Request #{r.id}</p>
                          <p className="text-sm text-gray-500">{r.date} at {r.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.tanker !== 'Not assigned' && <button onClick={() => setShowTankerTracking(true)} className="text-green-600 hover:text-green-800"><FaMapMarkedAlt /></button>}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Amount: <strong>{r.amount}L</strong></span>
                        <span>Tanker: <strong>{r.tanker}</strong></span>
                      </div>
                      {r.eta && r.eta !== 'Pending' && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                          <FaStopwatch /><span>ETA: {r.eta}</span>
                        </div>
                      )}
                      {r.status === 'pending' && (
                        <div className="mt-3 flex gap-3">
                          <button onClick={() => addToast('success', `Request #${r.id} cancelled`, 'You will receive a confirmation email.')} className="text-sm text-red-600 hover:text-red-800 font-medium">Cancel</button>
                          <button onClick={() => addToast('info', 'Edit request', 'Request editing opens soon.')} className="text-sm text-green-600 hover:text-green-800 font-medium">Edit</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
                  <button onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors font-medium">
                    <FaCog size={12} /> Edit in Settings
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm">{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</div>, label: 'Full Name', val: `${user.firstName} ${user.lastName}` },
                    { icon: <FaIdCard className="text-2xl text-green-600" />,       label: 'Matric Number', val: user.matricNumber },
                    { icon: <FaGraduationCap className="text-2xl text-green-600" />,label: 'Department',    val: user.department },
                    { icon: <FaHome className="text-2xl text-green-600" />,         label: 'Residence',     val: `${user.hall}, Room ${user.roomNumber}` },
                    { icon: <FaEnvelope className="text-2xl text-green-600" />,     label: 'Email',         val: user.email },
                    { icon: <FaPhone className="text-2xl text-green-600" />,        label: 'Phone',         val: user.phone },
                    { icon: <FaMapMarkerAlt className="text-2xl text-green-600" />, label: 'Level',         val: `${user.level} Level` },
                    { icon: <FaCreditCard className="text-2xl text-green-600" />,   label: 'Current Plan',  val: activePlan },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="shrink-0">{icon}</div>
                      <div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{val}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── REQUEST MODAL ── */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-800">Request Water Delivery</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowRequestModal(false); addToast('success', 'Request submitted! 🚰', 'You will be notified when a tanker is assigned.'); }}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Date</label>
                  <input type="date" required min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Time</label>
                  <select className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    {['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                  <select className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option>500 Liters (Standard)</option>
                    <option>1000 Liters (Large)</option>
                    <option>1500 Liters (Extra Large)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Special Instructions</label>
                  <textarea rows="3" className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Any special requests or delivery notes…" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TANKER TRACKING MODAL ── */}
      {showTankerTracking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Tanker Tracking</h3>
                <button onClick={() => setShowTankerTracking(false)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <div className="h-72 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                <MapContainer center={[9.3265, 8.9947]} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <Marker position={[9.3265, 8.9947]}><Popup>Tanker {activeDelivery.tanker}</Popup></Marker>
                  <Marker position={[9.3280, 8.9910]}><Popup>Daniel Hall, Room B202</Popup></Marker>
                </MapContainer>
              </div>
              <div className="grid  gap-3 mb-4">
                {[['Tanker', activeDelivery.tanker], ['Driver', activeDelivery.driver], ['ETA', activeDelivery.eta], ['Distance', activeDelivery.distance]].map(([lbl, val]) => (
                  <div key={lbl} className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500">{lbl}</p>
                    <p className={`font-semibold text-sm ${lbl === 'ETA' ? 'text-green-600' : 'text-gray-800'}`}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Water Depot</span><span>Your Location</span></div>
                <div className="w-full h-2 bg-gray-200 rounded-full"><div className="w-3/4 h-2 bg-green-500 rounded-full transition-all"></div></div>
              </div>
              <div className="bg-green-50 p-3 rounded-xl mb-4 flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Live Update</p>
                  <p className="text-xs text-green-600 mt-0.5">Tanker is {activeDelivery.distance} away · Arriving in approximately {activeDelivery.eta}</p>
                </div>
              </div>
              <button onClick={() => setShowTankerTracking(false)}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedPlan(null); }}
        selectedPlan={selectedPlan}
        userEmail={user?.email}
        addToast={addToast}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* ── SETTINGS PANEL ── */}
      <SettingsPanel
        show={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        settings={settings}
        setSettings={setSettings}
        addToast={addToast}
      />
    </div>
  );
};

export default StudentDashboard;