// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTint, FaTruck, FaBell, FaUserCircle, FaClock,
  FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt,
  FaPhone, FaEnvelope, FaGraduationCap, FaHome, FaIdCard,
  FaPlus, FaCreditCard, FaMoneyBillWave, FaMapMarkedAlt,
  FaStopwatch, FaCog, FaToggleOn, FaToggleOff,
  FaTimes, FaEdit, FaSave, FaChevronRight,
  FaShieldAlt, FaTrash, FaKey, FaSignOutAlt, FaSpinner,
  FaCheck, FaExclamationCircle, FaInfoCircle, FaTrashAlt,
  FaBars, 
} from 'react-icons/fa';
import { MdOutlineWaterDrop, MdOutlinePayment, MdNotifications, MdSecurity } from 'react-icons/md';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PAYSTACK_PUBLIC_KEY = 'pk_test_bed221a6bf478e70a90fe3238af9d4162bfa99e5';

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium min-w-[280px] max-w-sm pointer-events-auto
          ${t.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            t.type === 'error'   ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            t.type === 'info'    ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                   'bg-gradient-to-r from-yellow-500 to-orange-500'}`}>
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

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
const NotificationsPanel = ({ show, onClose, notifications, onMarkRead, onClearAll }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    if (show) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show, onClose]);

  if (!show) return null;

  const getIcon = (type) => {
    if (type === 'success') return <FaCheckCircle className="text-green-500 shrink-0 mt-0.5" />;
    if (type === 'warning') return <FaExclamationCircle className="text-yellow-500 shrink-0 mt-0.5" />;
    if (type === 'error')   return <FaExclamationCircle className="text-red-500 shrink-0 mt-0.5" />;
    return <FaInfoCircle className="text-blue-500 shrink-0 mt-0.5" />;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40   sm:hidden transition-opacity duration-300
          ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Notifications Panel */}
      <div 
        ref={ref}
        className={`fixed sm:absolute sm:right-0 sm:top-12  mt-7
          inset-y-0 left-0 sm:inset-y-auto sm:left-auto
          w-72 xs:w-80 sm:w-80 
          bg-white shadow-2xl border border-gray-100 z-50 overflow-hidden
          transform transition-all duration-300 ease-in-out
          sm:rounded-2xl
          ${show ? 'translate-x-0' : '-translate-x-full'}
          sm:transform-none sm:transition-none sm:translate-x-0
          ${!show ? 'sm:hidden' : ''}`}>
        
        {/* Mobile Header with Close Button */}
        <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
            <FaTimes className="text-gray-600 text-sm" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button onClick={onMarkRead} className="text-xs text-green-600 hover:text-green-700 font-medium">
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={onClearAll} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <FaTrashAlt size={10} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Actions Bar */}
        <div className="sm:hidden flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.read).length} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {notifications.some(n => !n.read) && (
              <button onClick={onMarkRead} className="text-xs text-green-600 hover:text-green-700 font-medium">
                Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={onClearAll} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <FaTrashAlt size={10} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* List - with percentage height on mobile */}
        <div className="h-full sm:max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 sm:py-8 text-center">
              <FaBell className="text-gray-300 text-4xl sm:text-3xl mx-auto mb-3 sm:mb-2" />
              <p className="text-sm text-gray-400">No notifications</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} 
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                {getIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-xs font-semibold text-gray-800 ${!n.read ? 'font-bold' : ''}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-[11px] sm:text-[10px] text-gray-400 mt-1.5 sm:mt-1">{n.time}</p>
                </div>
                {!n.read && <span className="w-2.5 h-2.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────
const SettingsModal = ({ show, onClose, notifSettings, setNotifSettings, onSave }) => {
  if (!show) return null;

  const toggle = (key) => setNotifSettings(p => ({ ...p, [key]: !p[key] }));

  const TogRow = ({ label, sub, k }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => toggle(k)} className="active:scale-90 transition-transform ml-4 shrink-0">
        {notifSettings[k]
          ? <FaToggleOn className="text-3xl text-green-500" />
          : <FaToggleOff className="text-3xl text-gray-300" />}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">⚙️ Preferences</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
        </div>

        {/* Notifications */}
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">🔔 Notifications</p>
        <TogRow label="Delivery Alerts"       sub="Notify when tanker is on the way"     k="deliveryAlerts" />
        <TogRow label="Payment Reminders"     sub="Alert before payment is due"          k="paymentReminders" />
        <TogRow label="Request Updates"       sub="Status changes on your requests"      k="requestUpdates" />
        <TogRow label="Email Notifications"   sub="Receive updates via email"            k="emailNotifications" />
        <TogRow label="SMS Alerts"            sub="Receive SMS for urgent updates"       k="smsAlerts" />

        {/* Preferences */}
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-5 mb-2">🎛️ Preferences</p>
        <TogRow label="Auto-Renew Plan"       sub="Automatically renew water plan"       k="autoRenew" />
        <TogRow label="Show Consumption Tips" sub="Water saving tips on dashboard"       k="consumptionTips" />
        <TogRow label="Dark Mode"             sub="Switch to dark theme (coming soon)"   k="darkMode" />

        <button onClick={() => { onSave(notifSettings); onClose(); }}
          className="mt-5 w-full py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 text-sm">
          Save Preferences
        </button>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('overview');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activePlan, setActivePlan]     = useState('Standard Plan');
  const [requests, setRequests]         = useState([]);
  const [selectedQuantity, setSelectedQuantity] = useState(null);
  const [quantityPrice, setQuantityPrice]       = useState(0);
  const [pendingRequestData, setPendingRequestData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // ── Header UI state ──────────────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUserMenu, setShowUserMenu]           = useState(false);
  const userMenuRef = useRef(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ── Notifications ────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info',    title: 'Tanker Arriving Soon',   message: 'Your scheduled tanker arrives in 2 hours.',          time: '10 mins ago', read: false },
    { id: 2, type: 'warning', title: 'Payment Due',            message: 'Your water plan payment is due in 3 days.',          time: '1 hour ago',  read: false },
    { id: 3, type: 'success', title: 'Request Confirmed',      message: 'Your water request #A1B2C3 has been confirmed.',     time: '2 hours ago', read: true  },
    { id: 4, type: 'info',    title: 'New Plan Available',     message: 'Premium plan now available at ₦15,000/month.',      time: 'Yesterday',   read: true  },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const clearAllNotifications = () => setNotifications([]);

  // ── Settings state (loaded from API) ──────────────────────────────────────
  const [settings, setSettings] = useState(null);
  const [notifSettings, setNotifSettings] = useState({
    deliveryAlerts:     true,
    paymentReminders:   true,
    requestUpdates:     true,
    emailNotifications: true,
    smsAlerts:          false,
    autoRenew:          false,
    consumptionTips:    true,
    darkMode:           false,
  });

  const handleSavePreferences = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/student/settings`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifSettings(newSettings);
      addToast('success', 'Preferences saved successfully');
    } catch (err) {
      addToast('error', 'Failed to save preferences', err.response?.data?.message);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalWater: 0, totalDeliveries: 0,
    pendingRequests: 0, upcomingRequests: 0,
    satisfaction: 95, balance: 10000
  });

  // ── Settings tab state ───────────────────────────────────────────────────
  const [settingsTab, setSettingsTab]       = useState('profile');
  const [savingProfile, setSavingProfile]   = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', hall: '', roomNumber: '' });
  const [pwForm, setPwForm]           = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw]           = useState({ current: false, new: false, confirm: false });

  const [pricing, setPricing] = useState({
    price500L:  5000,
    price1000L: 9000,
    price1500L: 12000,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName:  user.firstName  || '',
        lastName:   user.lastName   || '',
        phone:      user.phone      || '',
        hall:       user.hall       || '',
        roomNumber: user.roomNumber || '',
      });
    }
  }, [user]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const quantityPrices = {
    '500 Liters (Standard)':   pricing.price500L,
    '1000 Liters (Large)':     pricing.price1000L,
    '1500 Liters (Extra Large)': pricing.price1500L,
  };

  // Paystack check
  useEffect(() => {
    const checkPaystack = () => {
      if (window.PaystackPop) { setPaystackLoaded(true); }
      else setTimeout(checkPaystack, 500);
    };
    checkPaystack();
  }, []);

  // ─── FETCH FULL PROFILE (GET /api/student/profile) ───────────────────────
  const fetchFullProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const profileData = response.data.data;
        setUser(prev => ({ ...prev, ...profileData }));
        localStorage.setItem('user', JSON.stringify({ ...user, ...profileData }));
        return profileData;
      }
    } catch (err) {
      console.error('Error fetching full profile:', err);
    }
    return null;
  };

  // ─── FETCH SETTINGS (GET /api/student/settings) ──────────────────────────
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/student/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const settingsData = response.data.data;
        setSettings(settingsData);
        if (settingsData.notifications) {
          setNotifSettings(prev => ({ ...prev, ...settingsData.notifications }));
        }
        if (settingsData.preferences) {
          setNotifSettings(prev => ({ ...prev, ...settingsData.preferences }));
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Fetch user and settings
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          addToast('error', 'Session expired', 'Please log in again');
          setTimeout(() => navigate('/login', { replace: true }), 1000);
          return;
        }

        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored);
            setUser(parsedUser);
          } catch(e) {}
        }

        try {
          const pricingRes = await axios.get(`${API_URL}/admin/pricing/public`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (pricingRes.data.success) {
            const p = pricingRes.data.data;
            setPricing({
              price500L:  p.price500L  || 5000,
              price1000L: p.price1000L || 9000,
              price1500L: p.price1500L || 12000,
            });
          }
        } catch (pricingErr) {
          console.error('Error fetching pricing:', pricingErr);
        }

        try {
          const notifRes = await axios.get(`${API_URL}/student/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const inAppNotifs = notifRes.data.notifications || notifRes.data.data?.notifications || [];
          if (inAppNotifs.length > 0) {
            setNotifications(inAppNotifs.map(n => ({
              id:      n._id || n.id,
              type:    n.type || 'info',
              title:   n.title,
              message: n.message,
              time:    n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now',
              read:    n.read || false,
            })));
          }
        } catch (notifErr) {
          console.error('Error fetching notifications:', notifErr);
        }

        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });

        if (response.data?.data) {
          setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
          await fetchFullProfile();
        }

        await fetchSettings();

      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/login', { replace: true }), 1500);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate, addToast]);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/water-requests/my-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setRequests(response.data.data);
        const pending  = response.data.data.filter(r => r.status === 'pending').length;
        const upcoming = response.data.data.filter(r => r.status === 'scheduled' || r.status === 'assigned').length;
        const totalDeliveries = response.data.data.filter(r => r.status === 'completed').length;
        const totalWater = response.data.data.reduce((sum, r) => sum + (r.quantityValue || 0), 0);
        setStats(prev => ({ ...prev, totalWater, totalDeliveries, pendingRequests: pending, upcomingRequests: upcoming }));
      }
    } catch (err) { console.error('Error fetching requests:', err); }
  }, []);

  useEffect(() => { if (activeTab === 'requests') fetchRequests(); }, [activeTab, fetchRequests]);

  // Payment handlers
  const handlePaymentSuccess = async (reference) => {
    try {
      const token = localStorage.getItem('token');
      const verifyResponse = await axios.post(`${API_URL}/payment/verify`, { reference, amount: quantityPrice }, { headers: { Authorization: `Bearer ${token}` } });
      if (verifyResponse.data.success) {
        const requestResponse = await axios.post(`${API_URL}/water-requests`, { ...pendingRequestData, paymentReference: reference, amount: quantityPrice }, { headers: { Authorization: `Bearer ${token}` } });
        if (requestResponse.data.success) {
          addToast('success', 'Payment successful!', 'Your water request has been submitted.');
          setShowRequestModal(false); setPendingRequestData(null); setIsProcessing(false);
          fetchRequests();
          setNotifications(p => [{ id: Date.now(), type: 'success', title: 'Request Submitted', message: 'Your water request has been submitted successfully.', time: 'Just now', read: false }, ...p]);
        }
      }
    } catch (err) { addToast('error', 'Payment verification failed', 'Please contact support.'); setIsProcessing(false); }
  };

  const handlePaymentClose = () => { setIsProcessing(false); addToast('info', 'Payment cancelled', 'You can try again anytime.'); };

  const initializePayment = (email, amount, metadata) => {
    try {
      if (typeof window.PaystackPop === 'undefined') { addToast('error', 'Payment system not available', 'Refresh and try again'); return; }
      setIsProcessing(true);
      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY, email, amount: amount * 100, metadata,
        callback: (response) => handlePaymentSuccess(response.reference),
        onClose: handlePaymentClose
      });
      handler.openIframe();
    } catch (error) { addToast('error', 'Payment Error', error.message); setIsProcessing(false); }
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    const formData     = new FormData(e.target);
    const deliveryDate = formData.get('deliveryDate');
    const preferredTime= formData.get('preferredTime');
    const quantity     = formData.get('quantity');
    const specialInstructions = formData.get('specialInstructions') || '';
    if (!deliveryDate || !preferredTime || !quantity) { addToast('error', 'Missing fields', 'Please fill in all required fields'); return; }
    const price = quantityPrices[quantity];
    if (!price)          { addToast('error', 'Invalid quantity', 'Please select a valid quantity'); return; }
    if (!paystackLoaded) { addToast('error', 'Payment system loading', 'Please wait a moment and try again.'); return; }
    setSelectedQuantity(quantity); setQuantityPrice(price);
    setPendingRequestData({ deliveryDate, preferredTime, quantity, quantityValue: parseInt(quantity), specialInstructions });
    initializePayment(user.email, price, { custom_fields: [
      { display_name: 'Student Name',   variable_name: 'student_name',   value: `${user.firstName} ${user.lastName}` },
      { display_name: 'Matric Number',  variable_name: 'matric_number',  value: user.matricNumber },
      { display_name: 'Water Quantity', variable_name: 'water_quantity', value: quantity }
    ]});
  };

  const cancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/water-requests/${requestId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) { addToast('success', 'Request cancelled', 'Your request has been cancelled successfully'); fetchRequests(); }
    } catch (err) { addToast('error', 'Failed to cancel request', err.response?.data?.message || 'Please try again'); }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) await axios.post(`${API_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }).catch(() => {});
    } catch (e) {}
    finally { localStorage.removeItem('token'); localStorage.removeItem('user'); setTimeout(() => navigate('/login', { replace: true }), 100); }
  };

  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/student/profile`, profileForm, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) {
        const updatedUser = { ...user, ...profileForm };
        setUser(updatedUser); 
        localStorage.setItem('user', JSON.stringify(updatedUser));
        addToast('success', 'Profile updated successfully');
        await fetchFullProfile();
      }
    } catch (err) { 
      addToast('error', 'Failed to update profile', err.response?.data?.message); 
    } finally { 
      setSavingProfile(false); 
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) return addToast('error', 'New passwords do not match');
    if (pwForm.newPassword.length < 8) return addToast('error', 'Password must be at least 8 characters');
    try {
      setSavingPassword(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/student/change-password`, {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
        confirmPassword: pwForm.confirmPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        addToast('success', 'Password changed successfully');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast('error', 'Failed to change password', err.response?.data?.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const updateNotificationSettings = async (newNotifSettings) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/student/settings/notifications`, newNotifSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifSettings(prev => ({ ...prev, ...newNotifSettings }));
        addToast('success', 'Notification settings updated');
      }
    } catch (err) {
      addToast('error', 'Failed to update notification settings', err.response?.data?.message);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/student/settings/preferences`, newPreferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotifSettings(prev => ({ ...prev, ...newPreferences }));
        addToast('success', 'Preferences updated');
      }
    } catch (err) {
      addToast('error', 'Failed to update preferences', err.response?.data?.message);
    }
  };

  const resetSettingsToDefaults = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/student/settings/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const defaultSettings = res.data.data;
        if (defaultSettings.notifications) {
          setNotifSettings(prev => ({ ...prev, ...defaultSettings.notifications }));
        }
        if (defaultSettings.preferences) {
          setNotifSettings(prev => ({ ...prev, ...defaultSettings.preferences }));
        }
        addToast('success', 'Settings reset to defaults');
      }
    } catch (err) {
      addToast('error', 'Failed to reset settings', err.response?.data?.message);
    }
  };

  const handleToggleNotifSetting = async (key) => {
    const newValue = !notifSettings[key];
    const update = { [key]: newValue };
    setNotifSettings(prev => ({ ...prev, ...update }));
    await updateNotificationSettings(update);
  };

  const handleTogglePreference = async (key) => {
    if (key === 'darkMode') {
      addToast('info', 'Dark mode coming soon!');
      return;
    }
    const newValue = !notifSettings[key];
    const update = { [key]: newValue };
    setNotifSettings(prev => ({ ...prev, ...update }));
    await updatePreferences(update);
  };

  // Chart
  const consumptionData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ label: 'Water (L)', data: [450, 380, 420, 390, 410, 350, 380], borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }]
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } };

  const TABS = [
    { id: 'overview',  label: 'Overview' },
    { id: 'history',   label: 'Delivery History' },
    { id: 'requests',  label: 'My Requests' },
    { id: 'profile',   label: 'Profile' },
    { id: 'settings',  label: 'Settings' },
  ];

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none";

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-green-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session expired. Please log in again.</p>
          <button onClick={() => navigate('/login', { replace: true })} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Toast toasts={toasts} removeToast={removeToast} />

      <SettingsModal
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        notifSettings={notifSettings}
        setNotifSettings={setNotifSettings}
        onSave={handleSavePreferences}
      />

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
    


<header className="bg-white shadow-md sticky top-0 z-40">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
    <div className="flex justify-between items-center">
      
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
          <MdOutlineWaterDrop className="text-base sm:text-xl text-white" />
        </div>
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-gray-800 leading-none">
            Student Dashboard
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">PLASU HydroTrack</p>
        </div>
      </div>

      {/* Right: Desktop Actions */}
      <div className="hidden md:flex items-center gap-2">
        <button onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm">
          <FaPlus size={10} /> Request Water
        </button>

        <button onClick={() => setShowSettingsModal(true)}
          className="w-9 h-9 bg-gray-100 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors"
          title="Preferences">
          <FaCog className="text-gray-500 text-sm" />
        </button>

        <div className="relative">
          <button
            onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
            className="relative w-9 h-9 bg-gray-100 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors"
            title="Notifications">
            <FaBell className="text-gray-500 text-sm" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel
            show={showNotifications}
            onClose={() => setShowNotifications(false)}
            notifications={notifications}
            onMarkRead={markAllRead}
            onClearAll={clearAllNotifications}
          />
        </div>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-2 py-1 transition-colors">
            <div className="h-9 w-9 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.matricNumber}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                <p className="text-sm font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {[
                { label: '👤 My Profile',  action: () => { setActiveTab('profile');  setShowUserMenu(false); } },
                { label: '⚙️ Settings',    action: () => { setActiveTab('settings'); setShowUserMenu(false); } },
                { label: '📋 My Requests', action: () => { setActiveTab('requests'); setShowUserMenu(false); } },
              ].map(({ label, action }) => (
                <button key={label} onClick={action}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  {label}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2">
                <FaSignOutAlt size={12} /> Sign Out
              </button>
            </div>
          )}
        </div>

        <button onClick={handleLogout}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-xl transition-colors font-medium">
          <FaSignOutAlt size={12} />
          <span>Logout</span>
        </button>
      </div>

      {/* Mobile: Actions Row */}
      <div className="flex md:hidden  items-center gap-1.5">
        {/* Request Water Button - Mobile */}
        <button onClick={() => setShowRequestModal(true)}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-[11px] font-semibold hover:bg-green-700 transition-colors">
          <FaPlus size={9} /> Request
        </button>

        {/* Notification Bell - Mobile */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
            className="relative w-8 h-8 bg-gray-100 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
            <FaBell className="text-gray-500 text-xs" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel
            show={showNotifications}
            onClose={() => setShowNotifications(false)}
            notifications={notifications}
            onMarkRead={markAllRead}
            onClearAll={clearAllNotifications}
          />
        </div>

        {/* Profile Avatar - Mobile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
            className="h-8 w-8 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
          </button>

          {/* Mobile User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-3 py-2.5 bg-green-50 border-b border-green-100">
                <p className="text-xs font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
              {[
                { label: '👤 Profile',  action: () => { setActiveTab('profile');  setShowUserMenu(false); } },
                { label: '⚙️ Settings', action: () => { setActiveTab('settings'); setShowUserMenu(false); } },
                { label: '📋 Requests', action: () => { setActiveTab('requests'); setShowUserMenu(false); } },
              ].map(({ label, action }) => (
                <button key={label} onClick={action}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  {label}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2">
                <FaSignOutAlt size={10} /> Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="w-8 h-8 bg-gray-100 hover:bg-green-100 rounded-lg flex items-center justify-center transition-colors">
          <FaBars className="text-gray-600 text-sm" />
        </button>
      </div>
    </div>
  </div>

  {/* Mobile Slide-out Menu Overlay */}
  {showMobileMenu && (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
      onClick={() => setShowMobileMenu(false)}
    />
  )}

  {/* Mobile Slide-out Menu - Slides from LEFT */}
  <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out md:hidden
    ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
    
    {/* Menu Header */}
    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
          <MdOutlineWaterDrop className="text-white text-sm" />
        </div>
        <h3 className="font-bold text-gray-800 text-sm">Menu</h3>
      </div>
      <button
        onClick={() => setShowMobileMenu(false)}
        className="w-8 h-8 bg-white hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors shadow-sm">
        <FaTimes className="text-gray-600 text-xs" />
      </button>
    </div>

    {/* User Info in Menu */}
    <div className="p-4 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0">
          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-500 truncate">{user.matricNumber}</p>
          <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
        </div>
      </div>
    </div>

    {/* Menu Items */}
    <div className="p-4 space-y-2">
      {/* Request Water */}
      <button 
        onClick={() => {
          setShowRequestModal(true);
          setShowMobileMenu(false);
        }}
        className="w-full flex items-center gap-3 p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm">
        <FaPlus size={14} />
        <span className="text-sm font-medium">Request Water</span>
      </button>

      {/* Settings */}
      <button 
        onClick={() => {
          setShowSettingsModal(true);
          setShowMobileMenu(false);
        }}
        className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
        <FaCog size={14} />
        <span className="text-sm font-medium">Settings</span>
      </button>

      {/* Divider */}
      <div className="my-2 border-t border-gray-100"></div>

      {/* Navigation Items */}
      {[
        { label: '👤 My Profile',  tab: 'profile' },
        { label: '📋 My Requests', tab: 'requests' },
        { label: '💰 Payments',    tab: 'payments' },
      ].map(({ label, tab }) => (
        <button 
          key={tab}
          onClick={() => {
            setActiveTab(tab);
            setShowMobileMenu(false);
          }}
          className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left">
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}

      {/* Divider */}
      <div className="my-2 border-t border-gray-100"></div>

      {/* Logout */}
      <button 
        onClick={() => {
          handleLogout();
          setShowMobileMenu(false);
        }}
        className="w-full flex items-center gap-3 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
        <FaSignOutAlt size={14} />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </div>
  </div>
</header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Welcome back, {user.firstName}! 👋</h2>
              <p className="text-green-100 text-sm">
                {user.hall || 'Hall not set'}, Room {user.roomNumber || 'Not set'} · {user.department || 'Department not set'} ({user.level || 'N/A'} Level)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs bg-green-500 px-2.5 py-1 rounded-full">Matric: {user.matricNumber}</span>
                <span className="text-xs bg-green-500 px-2.5 py-1 rounded-full">Active Plan: {activePlan}</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-full font-semibold">
                    🔔 {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowRequestModal(true)}
                className="bg-yellow-400 text-green-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow-md">
                <FaPlus /> Request Water
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { icon: <FaTint className="text-green-600" />,         bg: 'bg-green-100',   label: 'Total Water', val: `${stats.totalWater.toLocaleString()}L` },
            { icon: <FaTruck className="text-emerald-600" />,      bg: 'bg-emerald-100', label: 'Deliveries',  val: stats.totalDeliveries },
            { icon: <FaClock className="text-yellow-600" />,       bg: 'bg-yellow-100',  label: 'Pending',     val: stats.pendingRequests },
            { icon: <FaCalendarAlt className="text-purple-600" />, bg: 'bg-purple-100',  label: 'Upcoming',    val: stats.upcomingRequests },
            { icon: <FaCheckCircle className="text-pink-600" />,   bg: 'bg-pink-100',    label: 'Satisfaction',val: `${stats.satisfaction}%` },
            { icon: <FaMoneyBillWave className="text-blue-600" />, bg: 'bg-blue-100',    label: 'Balance',     val: `₦${stats.balance.toLocaleString()}` },
          ].map(({ icon, bg, label, val }) => (
            <div key={label} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`${bg} p-2 rounded-lg shrink-0`}>{icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-lg font-bold text-gray-800">{val}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
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

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="sm:text-lg text-sm font-semibold text-gray-800 mb-4">Weekly Consumption</h3>
                  <div className="h-64"><Line data={consumptionData} options={chartOptions} /></div>
                </div>
                <div>
                  <h3 className="sm:text-lg text-sm font-semibold text-gray-800 mb-4">Upcoming Deliveries</h3>
                  <div className="space-y-3">
                    {requests.filter(r => r.status === 'scheduled' || r.status === 'assigned').slice(0, 3).map(r => (
                      <div key={r._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <FaCalendarAlt className="text-green-600 shrink-0" />
                          <div>
                            <p className="font-medium text-gray-800">{new Date(r.deliveryDate).toLocaleDateString()} at {r.preferredTime}</p>
                            <p className="text-xs text-gray-500">{r.quantity} · Tanker: {r.tanker}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === 'scheduled' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                    {requests.filter(r => r.status === 'scheduled' || r.status === 'assigned').length === 0 && (
                      <p className="text-center text-gray-500 py-4">No upcoming deliveries</p>
                    )}
                  </div>
                </div>

                {unreadCount > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="sm:text-lg text-sm font-semibold text-gray-800">Recent Notifications</h3>
                      <button onClick={markAllRead} className="text-xs text-green-600 font-medium hover:text-green-700">Mark all read</button>
                    </div>
                    <div className="space-y-2">
                      {notifications.filter(n => !n.read).slice(0, 3).map(n => (
                        <div key={n.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <span className="text-lg shrink-0">
                            {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : 'ℹ️'}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                            <p className="text-xs text-gray-500">{n.message}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-auto">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── History ── */}
            {activeTab === 'history' && (
              <div>
                <h3 className="sm:text-lg text-sm font-semibold text-gray-800 mb-4"></h3>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Date/Time','Amount','Tanker','Driver','Amount Paid','Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requests.filter(r => r.status === 'completed').map(r => (
                        <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-800">{new Date(r.deliveryDate).toLocaleDateString()}<br /><span className="text-xs text-gray-400">{r.preferredTime}</span></td>
                          <td className="px-4 py-3 sm:text-sm text-xs font-semibold text-gray-800">{r.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.tanker}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {r.driver
                              ? typeof r.driver === 'object'
                                ? `${r.driver.firstName || ''} ${r.driver.lastName || ''}`.trim() || r.driver.tankerId || '—'
                                : r.driver
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">₦{r.amount?.toLocaleString() || quantityPrices[r.quantity]?.toLocaleString()}</td>
                          <td className="px-4 py-3"><span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Completed</span></td>
                        </tr>
                      ))}
                      {requests.filter(r => r.status === 'completed').length === 0 && (
                        <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No delivery history yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Requests ── */}
            {activeTab === 'requests' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="sm:text-lg text-sm font-semibold text-gray-800">My Water Requests</h3>
                  <button onClick={() => setShowRequestModal(true)}
                    className="bg-gradient-to-r sm:text-lg text-xs from-green-600 to-green-700 text-white px-4 py-2 rounded-xl  font-semibold hover:from-green-700 hover:to-green-800 flex items-center gap-2">
                    <FaPlus size={11} /> New Request
                  </button>
                </div>
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No water requests yet.</p>
                      <button onClick={() => setShowRequestModal(true)} className="mt-2 text-green-600 font-semibold hover:text-green-700">Create your first request →</button>
                    </div>
                  ) : (
                    requests.map(r => (
                      <div key={r._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-sm text-gray-800">Request #{r._id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-gray-500">{new Date(r.deliveryDate).toLocaleDateString()} at {r.preferredTime}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                            r.status === 'assigned'  ? 'bg-blue-100 text-blue-700' :
                            r.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                            r.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{r.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>Amount: <strong>{r.quantity}</strong></span>
                          <span>Price: <strong className="text-green-600">₦{(r.amount || quantityPrices[r.quantity]).toLocaleString()}</strong></span>
                          <span>Tanker: <strong>{r.tanker}</strong></span>
                          {r.estimatedTime !== 'Pending' && <span>ETA: <strong>{r.estimatedTime}</strong></span>}
                        </div>
                        {r.status === 'pending' && (
                          <div className="mt-3">
                            <button onClick={() => cancelRequest(r._id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Cancel Request</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Profile ── */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="sm:text-lg text-sm font-semibold text-gray-800 mb-5">Profile Information</h3>
                <div className="flex items-center gap-4 mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="sm:h-16 sm:w-16 h-10 w-10 text-sm bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold sm:text-2xl shrink-0">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="sm:text-xl text-sm font-bold text-gray-800">{user.firstName} {user.lastName}</p>
                    <p className="sm:text-sm text-xs text-gray-500">{user.email}</p>
                    <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {user.isVerified ? '✓ Verified' : '⚠ Not Verified'}
                    </span>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 sm:text-xl text-sm">
                  {[
                    { icon: <FaIdCard className="text-green-600 text-xl" />,        label: 'Matric Number', val: user.matricNumber },
                    { icon: <FaGraduationCap className="text-green-600 text-xl" />, label: 'Department',    val: user.department || 'Not set' },
                    { icon: <FaCalendarAlt className="text-green-600 text-xl" />,   label: 'Level',         val: `${user.level || 'N/A'} Level` },
                    { icon: <FaHome className="text-green-600 text-xl" />,          label: 'Hall',          val: user.hall || 'Not set' },
                    { icon: <FaMapMarkerAlt className="text-green-600 text-xl" />,  label: 'Room Number',   val: user.roomNumber || 'Not set' },
                    { icon: <FaPhone className="text-green-600 text-xl" />,         label: 'Phone',         val: user.phone || 'Not set' },
                    { icon: <FaEnvelope className="text-green-600 text-xl" />,      label: 'Email',         val: user.email },
                    { icon: <FaCreditCard className="text-green-600 text-xl" />,    label: 'Active Plan',   val: activePlan },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="shrink-0">{icon}</div>
                      <div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{val || '—'}</p></div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3 pt-4 border-t border-gray-200">
                  <button onClick={() => setActiveTab('settings')}
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 border border-green-200 hover:bg-green-50 px-4 py-2 rounded-lg transition-colors font-medium">
                    <FaCog size={12} /> Edit Profile
                  </button>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium">
                    <FaSignOutAlt size={12} /> Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* ── Settings ── */}
            {activeTab === 'settings' && (
              <div>
                <h3 className="sm:text-lg text-sm font-semibold text-gray-800 mb-5">Account Settings</h3>

                <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                  {[
                    ['profile',       '👤 Edit Profile'],
                    ['password',      '🔑 Change Password'],
                    ['notifications', '🔔 Notifications'],
                    ['preferences',   '🎛️ Preferences'],
                  ].map(([id, label]) => (
                    <button key={id} onClick={() => setSettingsTab(id)}
                      className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors
                        ${settingsTab === id ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Edit Profile */}
                {settingsTab === 'profile' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">First Name</label>
                        <input value={profileForm.firstName} onChange={e => setProfileForm(p => ({...p, firstName: e.target.value}))} className={inputClass} placeholder="First name" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Last Name</label>
                        <input value={profileForm.lastName} onChange={e => setProfileForm(p => ({...p, lastName: e.target.value}))} className={inputClass} placeholder="Last name" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Phone Number</label>
                      <input value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} className={inputClass} placeholder="Phone number" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Hall of Residence</label>
                      <select value={profileForm.hall} onChange={e => setProfileForm(p => ({...p, hall: e.target.value}))} className={inputClass}>
                        <option value="">Select Hall</option>
                        {['Daniel Hall','Joseph Hall','Mary Hall','Peter Hall','Paul Hall','Esther Hall','Ruth Hall','Samuel Hall'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Room Number</label>
                      <input value={profileForm.roomNumber} onChange={e => setProfileForm(p => ({...p, roomNumber: e.target.value.toUpperCase()}))} className={inputClass} placeholder="e.g. B202" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
                      <input value={user?.email} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                      <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin.</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Matric Number</label>
                      <input value={user?.matricNumber} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                    </div>
                    <button onClick={handleProfileSave} disabled={savingProfile}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {savingProfile ? <><FaSpinner className="animate-spin" /> Saving...</> : '💾 Save Changes'}
                    </button>
                  </div>
                )}

                {/* Change Password */}
                {settingsTab === 'password' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                      🔒 Password must be at least 8 characters long.
                    </div>
                    {[
                      { key: 'currentPassword', label: 'Current Password',     show: 'current' },
                      { key: 'newPassword',     label: 'New Password',         show: 'new'     },
                      { key: 'confirmPassword', label: 'Confirm New Password', show: 'confirm' },
                    ].map(({ key, label, show }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">{label}</label>
                        <div className="relative">
                          <input type={showPw[show] ? 'text' : 'password'} value={pwForm[key]}
                            onChange={e => setPwForm(p => ({...p, [key]: e.target.value}))}
                            className={`${inputClass} pr-10`} placeholder={label} />
                          <button type="button" onClick={() => setShowPw(p => ({...p, [show]: !p[show]}))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                            {showPw[show] ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {pwForm.newPassword && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Password strength</span>
                          <span className={pwForm.newPassword.length >= 12 ? 'text-green-600 font-semibold' : pwForm.newPassword.length >= 8 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {pwForm.newPassword.length >= 12 ? 'Strong' : pwForm.newPassword.length >= 8 ? 'Good' : 'Too short'}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${pwForm.newPassword.length >= 12 ? 'w-full bg-green-500' : pwForm.newPassword.length >= 8 ? 'w-2/3 bg-yellow-500' : 'w-1/3 bg-red-500'}`} />
                        </div>
                      </div>
                    )}
                    {pwForm.confirmPassword && (
                      <p className={`text-xs font-medium flex items-center gap-1 ${pwForm.newPassword === pwForm.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                        {pwForm.newPassword === pwForm.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                      </p>
                    )}
                    <button onClick={handlePasswordChange}
                      disabled={savingPassword || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {savingPassword ? <><FaSpinner className="animate-spin" /> Changing...</> : '🔑 Change Password'}
                    </button>
                  </div>
                )}

                {/* Notifications Settings */}
                {settingsTab === 'notifications' && (
                  <div className="max-w-lg space-y-1">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-gray-400">Control how and when you receive notifications.</p>
                      <button onClick={resetSettingsToDefaults} className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Reset to Defaults
                      </button>
                    </div>
                    {[
                      { label: 'Delivery Alerts',       sub: 'Notify when tanker is on the way',     k: 'deliveryAlerts'     },
                      { label: 'Payment Reminders',     sub: 'Alert before payment is due',          k: 'paymentReminders'   },
                      { label: 'Request Updates',       sub: 'Status changes on your water requests',k: 'requestUpdates'     },
                      { label: 'Email Notifications',   sub: 'Receive updates via email',            k: 'emailNotifications' },
                      { label: 'SMS Alerts',            sub: 'Receive SMS for urgent updates',       k: 'smsAlerts'          },
                    ].map(({ label, sub, k }) => (
                      <div key={k} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                        </div>
                        <button onClick={() => handleToggleNotifSetting(k)} className="active:scale-90 transition-transform ml-4 shrink-0">
                          {notifSettings[k] ? <FaToggleOn className="text-3xl text-green-500" /> : <FaToggleOff className="text-3xl text-gray-300" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preferences */}
                {settingsTab === 'preferences' && (
                  <div className="max-w-lg space-y-1">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-gray-400">Customize your dashboard experience.</p>
                      <button onClick={resetSettingsToDefaults} className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Reset to Defaults
                      </button>
                    </div>
                    {[
                      { label: 'Auto-Renew Plan',       sub: 'Automatically renew your water plan',   k: 'autoRenew'        },
                      { label: 'Consumption Tips',      sub: 'Show water saving tips on dashboard',   k: 'consumptionTips'  },
                      { label: 'Dark Mode',             sub: 'Switch to dark theme (coming soon)',     k: 'darkMode'         },
                    ].map(({ label, sub, k }) => (
                      <div key={k} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                        </div>
                        <button onClick={() => handleTogglePreference(k)} className="active:scale-90 transition-transform ml-4 shrink-0">
                          {notifSettings[k] ? <FaToggleOn className="text-3xl text-green-500" /> : <FaToggleOff className="text-3xl text-gray-300" />}
                        </button>
                      </div>
                    ))}

                    <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-sm font-semibold text-gray-800 mb-1">Current Plan: {activePlan}</p>
                      <p className="text-xs text-gray-500 mb-3">Upgrade to get more water deliveries per month at a better rate.</p>
                      <button onClick={() => addToast('info', 'Plan upgrade coming soon!', 'Contact admin to upgrade your plan.')}
                        className="text-xs font-semibold text-green-700 hover:text-green-800 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                        View Available Plans →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-800">Request Water Delivery</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Date</label>
                  <input type="date" name="deliveryDate" required min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Time</label>
                  <select name="preferredTime" required className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select time slot</option>
                    {['08:00 - 10:00','10:00 - 12:00','12:00 - 14:00','14:00 - 16:00','16:00 - 18:00'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                  <select name="quantity" required
                    onChange={e => {
                        const price = quantityPrices[e.target.value];
                        document.getElementById('priceDisplay').textContent = price ? `₦${price.toLocaleString()}` : '₦0';
                      }}
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select quantity</option>
                    <option value="500 Liters (Standard)">
                      500 Liters (Standard) - ₦{pricing.price500L.toLocaleString()}
                    </option>
                    <option value="1000 Liters (Large)">
                      1000 Liters (Large) - ₦{pricing.price1000L.toLocaleString()}
                    </option>
                    <option value="1500 Liters (Extra Large)">
                      1500 Liters (Extra Large) - ₦{pricing.price1500L.toLocaleString()}
                    </option>
                  </select>
                </div>
                <div className="bg-green-50 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                    <span id="priceDisplay" className="text-xl font-bold text-green-600">₦0</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Special Instructions</label>
                  <textarea name="specialInstructions" rows="3"
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any special requests or delivery notes…" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRequestModal(false)} disabled={isProcessing}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={isProcessing || !paystackLoaded}
                    className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isProcessing ? 'Processing...' : !paystackLoaded ? 'Loading Payment...' : 'Pay & Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;