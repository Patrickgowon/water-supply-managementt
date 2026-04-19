// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaTint, FaTruck, FaUsers, FaBell, FaClock,
  FaCheckCircle, FaExclamationTriangle,
  FaChartBar, FaCog, FaMoneyBillWave, FaRoute,
  FaClipboardList, FaDownload, FaFilter, FaSearch, FaUserPlus,
  FaUserCheck, FaEye, FaEdit, FaTrash, FaCheck, FaTimes,
  FaPhone, FaStar, FaToggleOn, FaToggleOff,
  FaDollarSign, FaChartLine, FaUserTie,
  FaMapMarkedAlt, FaCrosshairs, FaLayerGroup,
  FaBullhorn, FaSignOutAlt,
  FaBolt, FaSpinner, FaIdCard, FaCar, FaShieldAlt,FaBars,
  FaBan, FaMapMarkerAlt, FaCalendarAlt,
  FaExclamationCircle, FaPercentage, FaTag,
} from 'react-icons/fa';
import {
  MdOutlineDashboard, MdOutlinePendingActions,
} from 'react-icons/md';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// ════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════
const Toast = ({ toasts, remove }) => (
  <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} style={{ animation: 'slideInRight .35s cubic-bezier(.22,.68,0,1.2)' }}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium min-w-[270px] max-w-sm pointer-events-auto
          ${t.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            t.type === 'error'   ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            t.type === 'warn'    ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                   'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
        <span className="text-xl mt-0.5 shrink-0">
          {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warn' ? '⚠️' : 'ℹ️'}
        </span>
        <div className="flex-1"><p>{t.message}</p>{t.sub && <p className="text-xs opacity-80 mt-0.5">{t.sub}</p>}</div>
        <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 shrink-0">✕</button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type, message, sub = '', ms = 5500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, type, message, sub }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
};

// ════════════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ════════════════════════════════════════════════════════════
const ConfirmDialog = ({ show, title, message, onConfirm, onCancel, danger = true }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6">
        <div className={`w-14 h-14 ${danger ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-4 text-3xl`}>
          {danger ? '🗑️' : '⚠️'}
        </div>
        <h3 className="text-lg font-bold text-gray-800 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-white rounded-xl font-bold text-sm ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  DRIVER DETAIL MODAL
// ════════════════════════════════════════════════════════════
const DriverDetailModal = ({ show, driver, onClose, onApprove, onSuspend, onDelete, addToast }) => {
  if (!show || !driver) return null;

  const STATUS_COLOR = {
    active:    'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    inactive:  'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-700',
    'on-leave':'bg-orange-100 text-orange-700',
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="text-green-600 text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9997] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-5 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-black border-2 border-white/30">
              {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{driver.firstName} {driver.lastName}</h3>
              <p className="text-green-100 text-sm">{driver.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[driver.status] || 'bg-gray-100 text-gray-600'}`}>
                  {driver.status}
                </span>
                {driver.isVerified && (
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
                    <FaShieldAlt size={9} /> Verified
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${driver.online ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {driver.online ? '🟢 Online' : '⚫ Offline'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">✕</button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 border-b border-gray-100 shrink-0">
          {[
            { label: 'Rating',     value: `⭐ ${driver.rating || 0}` },
            { label: 'Deliveries', value: driver.totalDeliveries || 0 },
            { label: 'Capacity',   value: driver.vehicleCapacity ? `${Number(driver.vehicleCapacity).toLocaleString()}L` : '—' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <p className="text-lg font-black text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="grid md:grid-cols-2 gap-x-6">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Personal Info</p>
              <InfoRow icon={FaPhone}       label="Phone"         value={driver.phone} />
              <InfoRow icon={FaCalendarAlt} label="Date of Birth" value={driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : null} />
              <InfoRow icon={FaMapMarkerAlt}label="Address"       value={driver.address} />
              <InfoRow icon={FaPhone}       label="Emergency Contact" value={driver.emergencyContact} />
              <InfoRow icon={FaPhone}       label="Emergency Phone"   value={driver.emergencyPhone} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Vehicle & License</p>
              <InfoRow icon={FaTruck}    label="Tanker ID"       value={driver.tankerId} />
              <InfoRow icon={FaCar}      label="Vehicle Type"    value={driver.vehicleType} />
              <InfoRow icon={FaIdCard}   label="Plate Number"    value={driver.vehiclePlate} />
              <InfoRow icon={FaCalendarAlt} label="Vehicle Year" value={driver.vehicleYear} />
              <InfoRow icon={FaIdCard}   label="License Number"  value={driver.licenseNumber} />
              <InfoRow icon={FaCalendarAlt} label="License Expiry" value={driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : null} />
              <InfoRow icon={FaStar}     label="Experience"      value={driver.yearsExperience} />
              <InfoRow icon={FaMapMarkerAlt} label="Current Location" value={driver.currentLocation} />
            </div>
          </div>

          {driver.createdAt && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Registered: {new Date(driver.createdAt).toLocaleDateString('en-NG', { dateStyle: 'full' })}
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="border-t border-gray-100 p-4 flex flex-wrap gap-2 shrink-0 bg-gray-50">
          {driver.status === 'pending' && (
            <button
              onClick={() => { onApprove(driver._id || driver.id); onClose(); }}
              className="flex-1 min-w-[120px] py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
            >
              <FaUserCheck size={13} /> Approve Driver
            </button>
          )}
          {(driver.status === 'suspended' || driver.status === 'inactive') && (
            <button
              onClick={() => { onApprove(driver._id || driver.id, 'active'); onClose(); }}
              className="flex-1 min-w-[120px] py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
            >
              <FaCheck size={13} /> Reactivate
            </button>
          )}
          {driver.status === 'active' && (
            <button
              onClick={() => { onSuspend(driver._id || driver.id); onClose(); }}
              className="flex-1 min-w-[120px] py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
            >
              <FaBan size={13} /> Suspend
            </button>
          )}
          <button
            onClick={() => { onDelete(driver._id || driver.id); onClose(); }}
            className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 flex items-center gap-2 transition-colors"
          >
            <FaTrash size={12} /> Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  ADMIN SETTINGS MODAL
// ════════════════════════════════════════════════════════════
const AdminSettings = ({ show, onClose, addToast }) => {
  const [section, setSection]   = useState('profile');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  const [adminInfo, setAdminInfo] = useState({
    firstName: '', lastName: '', phone: '', email: ''
  });

  const [pricing, setPricing] = useState({
  price500L:  5000,
  price1000L: 9000,
  price1500L: 12000,
  baseRatePerLiter: 10,
});

const [commission, setCommission] = useState({
  baseRatePerLiter:   100,  // ₦ per liter delivered
  bonusPerDelivery:   200,  // ₦ bonus per completed delivery
  tipAverage:         50,   // ₦ average tip per delivery
  commissionPercent:  15,   // % of order value
});

const [savingPricing, setSavingPricing] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const [showPw, setShowPw] = useState({
    current: false, new: false, confirm: false
  });

  const [cfg, setCfg] = useState({
    orderAlerts: true, driverAlerts: true, paymentAlerts: true,
    incidentAlerts: true, emailDigest: true, smsAlerts: false, pushAlerts: true,
    autoApprove: false, autoAssign: false,
    twoFA: false, sessionTimeout: true, auditLog: true,
    maintenanceMode: false,
    maxDeliveriesPerDriver: 8,
    defaultDeliveryWindow: 2,
    cancellationWindow: 1,
  });

  useEffect(() => {
    if (!show) return;
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const [profileRes, settingsRes] = await Promise.all([
          axios.get(`${API_URL}/admin/profile`,  { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/admin/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (profileRes.data.success) {
          const a = profileRes.data.data;
          setAdminInfo({
            firstName: a.firstName || '',
            lastName:  a.lastName  || '',
            phone:     a.phone     || '',
            email:     a.email     || '',
          });
        }
        if (settingsRes.data.success) {
          const s = settingsRes.data.data;
           console.log('💰 Settings from API:', s.price500L, s.price1000L, s.price1500L); // ✅ add this
          setCfg(prev => ({ ...prev, ...s }));
          
          // ✅ Also load pricing from saved settings
          setPricing({
            price500L:  s.price500L  || 5000,
            price1000L: s.price1000L || 9000,
            price1500L: s.price1500L || 12000,
          });

  // ✅ Also load commission
        setCommission({
          baseRatePerLiter:  s.baseRatePerLiter  || 100,
          bonusPerDelivery:  s.bonusPerDelivery  || 200,
          tipAverage:        s.tipAverage        || 50,
          commissionPercent: s.commissionPercent || 15,
        });
}
      } catch (err) {
        addToast('error', 'Failed to load settings', err.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [show, addToast]);

  if (!show) return null;

  const token = localStorage.getItem('token');

  const toggle = async (k) => {
    const newVal = !cfg[k];
    setCfg(p => ({ ...p, [k]: newVal }));
    try {
      await axios.put(`${API_URL}/admin/settings`,
        { [k]: newVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('success', 'Setting updated');
    } catch (err) {
      setCfg(p => ({ ...p, [k]: !newVal }));
      addToast('error', 'Failed to update setting');
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      const res = await axios.put(`${API_URL}/admin/profile`,
        { firstName: adminInfo.firstName, lastName: adminInfo.lastName, phone: adminInfo.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) addToast('success', 'Profile updated successfully');
    } catch (err) {
      addToast('error', 'Failed to update profile', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return addToast('error', 'New passwords do not match');
    if (pwForm.newPassword.length < 8)
      return addToast('error', 'Password must be at least 8 characters');
    try {
      setSaving(true);
      const res = await axios.put(`${API_URL}/admin/change-password`, pwForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        addToast('success', 'Password changed successfully');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast('error', 'Failed to change password', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSystemSave = async () => {
    try {
      setSaving(true);
      const res = await axios.put(`${API_URL}/admin/settings/system`, {
        maintenanceMode:        cfg.maintenanceMode,
        maxDeliveriesPerDriver: cfg.maxDeliveriesPerDriver,
        defaultDeliveryWindow:  cfg.defaultDeliveryWindow,
        cancellationWindow:     cfg.cancellationWindow,
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) addToast('success', 'System settings saved!');
    } catch (err) {
      addToast('error', 'Failed to save system settings', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none";

  const TR = ({ label, sub, k }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => toggle(k)} className="active:scale-90 ml-4 shrink-0">
        {cfg[k] ? <FaToggleOn className="text-3xl text-green-500" /> : <FaToggleOff className="text-3xl text-gray-300" />}
      </button>
    </div>
  );

  const SECS = [
    { id: 'profile',       ico: '👤', label: 'Profile'       },
    { id: 'password',      ico: '🔑', label: 'Password'      },
    { id: 'notifications', ico: '🔔', label: 'Notifications' },
    { id: 'automation',    ico: '⚡', label: 'Automation'    },
    { id: 'security',      ico: '🔒', label: 'Security'      },
    { id: 'system',        ico: '⚙️', label: 'System'        },
    { id: 'pricing',       ico: '💰', label: 'Pricing'       }, 
   { id: 'commission',    ico: '📊', label: 'Commission'    }, 
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9997] p-2 sm:p-4">
  <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

    {/* ── SIDEBAR (always top, always horizontal) ── */}
    <div className="w-full bg-gray-50 border-b border-gray-100 p-3 flex flex-col shrink-0">

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaCog className="text-green-600" />
          <span className="font-bold text-gray-800 text-sm">Admin Settings</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
          <FaTimes size={16} />
        </button>
      </div>

      {/* Horizontal scrollable nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {SECS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0
              ${section === s.id
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-200 bg-white border border-gray-200'}`}
          >
            <span>{s.ico}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* ── CONTENT AREA ── */}
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-green-600 text-3xl" />
        </div>
      ) : (
        <>
          {section === 'profile' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-4 sm:mb-5">Admin Profile</h4>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-5 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white text-xl font-black shrink-0">
                  {adminInfo.firstName?.charAt(0)}{adminInfo.lastName?.charAt(0)}
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-gray-800">{adminInfo.firstName} {adminInfo.lastName}</p>
                  <p className="text-sm text-gray-500">{adminInfo.email}</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Administrator</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">First Name</label>
                    <input value={adminInfo.firstName}
                      onChange={e => setAdminInfo(p => ({...p, firstName: e.target.value}))}
                      className={inputClass} placeholder="First name" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Last Name</label>
                    <input value={adminInfo.lastName}
                      onChange={e => setAdminInfo(p => ({...p, lastName: e.target.value}))}
                      className={inputClass} placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Phone Number</label>
                  <input value={adminInfo.phone}
                    onChange={e => setAdminInfo(p => ({...p, phone: e.target.value}))}
                    className={inputClass} placeholder="Phone number" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
                  <input value={adminInfo.email} disabled
                    className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                </div>
                <button onClick={handleProfileSave} disabled={saving}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : '💾 Save Profile'}
                </button>
              </div>
            </div>
          )}

          {section === 'password' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-4 sm:mb-5">Change Password</h4>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  🔒 Password must be at least 8 characters long.
                </div>
                {[
                  { key: 'currentPassword', label: 'Current Password', show: 'current' },
                  { key: 'newPassword', label: 'New Password', show: 'new' },
                  { key: 'confirmPassword', label: 'Confirm New Password', show: 'confirm' },
                ].map(({ key, label, show }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">{label}</label>
                    <div className="relative">
                      <input
                        type={showPw[show] ? 'text' : 'password'}
                        value={pwForm[key]}
                        onChange={e => setPwForm(p => ({...p, [key]: e.target.value}))}
                        className={`${inputClass} pr-10`}
                        placeholder={label}
                      />
                      <button type="button"
                        onClick={() => setShowPw(p => ({...p, [show]: !p[show]}))}
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
                  disabled={saving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><FaSpinner className="animate-spin" /> Changing...</> : '🔑 Change Password'}
                </button>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-4">Notification Preferences</h4>
              <TR label="New Order Alerts" sub="Notify when a student places an order" k="orderAlerts" />
              <TR label="Driver Status Alerts" sub="When drivers go online/offline" k="driverAlerts" />
              <TR label="Payment Alerts" sub="Confirmed and failed payments" k="paymentAlerts" />
              <TR label="Incident Alerts" sub="Driver-reported incidents" k="incidentAlerts" />
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-3">Channels</p>
                <TR label="Email Digest" sub="Daily summary at 8 AM" k="emailDigest" />
                <TR label="SMS Alerts" sub="Critical alerts via SMS" k="smsAlerts" />
                <TR label="Push Notifications" sub="Browser push" k="pushAlerts" />
              </div>
            </div>
          )}

          {section === 'automation' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-4">Automation Rules</h4>
              <TR label="Auto-Approve Orders" sub="Automatically approve paid orders" k="autoApprove" />
              <TR label="Auto-Assign Drivers" sub="Auto-match nearest available driver" k="autoAssign" />
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
                ⚠️ Auto-assign picks the nearest online driver. Manual review is recommended for high-priority orders.
              </div>
            </div>
          )}

          {section === 'security' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-4">Security</h4>
              <TR label="Two-Factor Authentication" sub="Require 2FA for admin login" k="twoFA" />
              <TR label="Session Timeout" sub="Auto-logout after 30 min of inactivity" k="sessionTimeout" />
              <TR label="Audit Log" sub="Track all admin actions" k="auditLog" />
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                <button onClick={() => addToast('info', 'Audit log exported', 'Last 30 days downloaded.')}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2">
                  <FaDownload size={13} /> Export Audit Log
                </button>
                <button onClick={() => addToast('warn', 'All sessions terminated')}
                  className="w-full py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2">
                  <FaSignOutAlt size={13} /> Terminate All Sessions
                </button>
              </div>
            </div>
          )}

          {section === 'system' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-4">System Settings</h4>
              <TR label="Maintenance Mode" sub="Disable student/driver access temporarily" k="maintenanceMode" />
              {cfg.maintenanceMode && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mb-4">
                  ⚠️ Maintenance mode is ON — students and drivers cannot access the system.
                </div>
              )}
              <div className="mt-5 space-y-4">
                {[
                  { label: 'Max deliveries/driver/day', key: 'maxDeliveriesPerDriver' },
                  { label: 'Default delivery window (hrs)', key: 'defaultDeliveryWindow' },
                  { label: 'Order cancellation window (hrs)', key: 'cancellationWindow' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 mb-1 block font-medium">{label}</label>
                    <input type="number" value={cfg[key]}
                      onChange={e => setCfg(p => ({...p, [key]: Number(e.target.value)}))}
                      className={inputClass} />
                  </div>
                ))}
                <button onClick={handleSystemSave} disabled={saving}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : '💾 Save System Settings'}
                </button>
              </div>
            </div>
          )}

          {section === 'pricing' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-2">Water Pricing</h4>
              <p className="text-xs text-gray-500 mb-5">Set the price students pay per water quantity.</p>
              <div className="space-y-4">
                {[
                  { label: '500 Liters (Standard)', key: 'price500L', desc: 'Price for 500L order' },
                  { label: '1000 Liters (Large)', key: 'price1000L', desc: 'Price for 1000L order' },
                  { label: '1500 Liters (Extra)', key: 'price1500L', desc: 'Price for 1500L order' },
                ].map(({ label, key, desc }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">{label}</label>
                    <p className="text-[10px] text-gray-400 mb-1">{desc}</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₦</span>
                      <input type="number" value={pricing[key]}
                        onChange={e => setPricing(p => ({...p, [key]: Number(e.target.value)}))}
                        className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                    </div>
                    <p className="text-xs text-green-600 mt-0.5 font-medium">= ₦{pricing[key].toLocaleString()} per delivery</p>
                  </div>
                ))}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  ℹ️ Price changes will apply to new orders only. Existing paid orders are not affected.
                </div>
                <button type="button"
                  onClick={async () => {
                    try {
                      setSavingPricing(true);
                      const token = localStorage.getItem('token');
                      const res = await axios.put(`${API_URL}/admin/settings/pricing`, pricing, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (res.data.success) addToast('success', 'Pricing updated successfully');
                    } catch (err) {
                      addToast('error', 'Failed to update pricing', err.response?.data?.message);
                    } finally {
                      setSavingPricing(false);
                    }
                  }}
                  disabled={savingPricing}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingPricing ? <><FaSpinner className="animate-spin" /> Saving...</> : '💾 Save Pricing'}
                </button>
              </div>
            </div>
          )}

          {section === 'commission' && (
            <div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-2">Driver Commission</h4>
              <p className="text-xs text-gray-500 mb-5">Configure how drivers are paid per delivery.</p>
              <div className="space-y-4">
                {[
                  { label: 'Base Rate per Liter (₦)', key: 'baseRatePerLiter', desc: 'Amount paid per liter delivered' },
                  { label: 'Bonus per Delivery (₦)', key: 'bonusPerDelivery', desc: 'Fixed bonus for each completed delivery' },
                  { label: 'Average Tip (₦)', key: 'tipAverage', desc: 'Average tip amount per delivery' },
                  { label: 'Commission Percentage (%)', key: 'commissionPercent', desc: '% of order value paid to driver' },
                ].map(({ label, key, desc }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">{label}</label>
                    <p className="text-[10px] text-gray-400 mb-1">{desc}</p>
                    <input type="number" value={commission[key]}
                      onChange={e => setCommission(p => ({...p, [key]: Number(e.target.value)}))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                  </div>
                ))}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-700 mb-2">📊 Example Earnings (500L delivery)</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Base ({commission.baseRatePerLiter} × 500L)</span>
                      <span className="font-bold">₦{(commission.baseRatePerLiter * 500).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonus per delivery</span>
                      <span className="font-bold">₦{commission.bonusPerDelivery.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average tip</span>
                      <span className="font-bold">₦{commission.tipAverage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-green-200 pt-1 mt-1">
                      <span className="font-bold text-green-700">Total per delivery</span>
                      <span className="font-black text-green-700">
                        ₦{(commission.baseRatePerLiter * 500 + commission.bonusPerDelivery + commission.tipAverage).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                  ⚠️ Commission changes affect future earnings calculations. Past earnings are not recalculated.
                </div>
                <button
                  onClick={async () => {
                    try {
                      setSavingPricing(true);
                      const token = localStorage.getItem('token');
                      const res = await axios.put(`${API_URL}/admin/settings/commission`, commission, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (res.data.success) addToast('success', 'Commission rates updated successfully');
                    } catch (err) {
                      addToast('error', 'Failed to update commission', err.response?.data?.message);
                    } finally {
                      setSavingPricing(false);
                    }
                  }}
                  disabled={savingPricing}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingPricing ? <><FaSpinner className="animate-spin" /> Saving...</> : '💾 Save Commission Rates'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
</div>
  );
};

// ════════════════════════════════════════════════════════════
//  BROADCAST MODAL
// ════════════════════════════════════════════════════════════
const BroadcastModal = ({ show, onClose, addToast }) => {
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [priority, setPriority] = useState('normal');

  if (!show) return null;

  const send = async () => {
    if (!title || !msg) return addToast('error', 'Please fill in all fields');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/broadcast`, {
        title,
        message:  msg,
        target,
        priority,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        onClose();
        setTitle('');
        setMsg('');
        addToast('success',
          `Broadcast sent!`,
          `"${title}" delivered to ${res.data.data.totalReached} recipients (${res.data.data.studentsReached} students, ${res.data.data.driversReached} drivers).`
        );
      }
    } catch (err) {
      addToast('error', 'Failed to send broadcast', err.response?.data?.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9997] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaBullhorn className="text-green-600" /> Broadcast Message
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">SEND TO</label>
            <div className="grid grid-cols-3 gap-2">
              {[['all','👥 Everyone'],['drivers','🚚 Drivers'],['students','🎓 Students']].map(([v,l]) => (
                <button key={v} onClick={() => setTarget(v)}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${target===v?'border-green-500 bg-green-50 text-green-700':'border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">PRIORITY</label>
            <div className="grid grid-cols-3 gap-2">
              {[['normal','🔵 Normal'],['high','🟠 High'],['urgent','🔴 Urgent']].map(([v,l]) => (
                <button key={v} onClick={() => setPriority(v)}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${priority===v?'border-green-500 bg-green-50 text-green-700':'border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">TITLE</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">MESSAGE</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder="Your message…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={send} className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-green-700 hover:to-emerald-700">
              Send Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  QUICK ASSIGN MODAL
// ════════════════════════════════════════════════════════════
const QuickAssignModal = ({ show, order, drivers, onAssign, onClose }) => {
  const [sel, setSel] = useState('');
  if (!show || !order) return null;
  const avail = drivers.filter(d => d.status === 'active' && d.online);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9997] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">⚡ Quick Assign</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="bg-green-50 rounded-xl p-3 mb-4 border border-green-100">
          <p className="text-sm font-bold text-gray-800">{order.studentName || order.user?.email}</p>
          <p className="text-xs text-gray-500">{order.location} · {order.amount}L</p>
        </div>
        <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Available Drivers ({avail.length})</p>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {avail.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No drivers currently online</p>}
          {avail.map(d => (
            <button key={d.id || d._id} onClick={() => setSel(d.id || d._id)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${sel===(d.id||d._id)?'border-green-500 bg-green-50':'border-gray-100 hover:border-gray-300'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-gray-800">{d.firstName} {d.lastName}</p>
                  <p className="text-xs text-gray-500">{d.tankerId} · {d.currentLocation}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end"><FaStar className="text-yellow-400 text-xs" /><span className="font-bold text-sm">{d.rating}</span></div>
                  <p className="text-xs text-gray-400">{d.totalDeliveries} deliveries</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => { if (sel) { onAssign(order._id || order.id, sel); onClose(); } }} disabled={!sel}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-40">
            Assign Driver
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  MAP CTRL COMPONENT
// ════════════════════════════════════════════════════════════
const MapCtrl = ({ center }) => {
  const map = useMap();
  React.useEffect(() => { if(center) map.flyTo(center,16); }, [center,map]);
  return null;
};

// ════════════════════════════════════════════════════════════
//  MAIN ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toasts, add: addToast, remove: removeToast } = useToast();
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('overview');
  const [showSettings, setShowSettings]   = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showAssign, setShowAssign]       = useState(false);
  const [assignOrder, setAssignOrder]     = useState(null);
  const [confirmDel, setConfirmDel]   = useState({ show: false, id: null, type: null });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole]   = useState('all');
  const [sortBy, setSortBy]           = useState('newest');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selOrder, setSelOrder]       = useState(null);
  const [showAddDriver, setShowAddDriver]   = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [fleetTab, setFleetTab]       = useState('health');
  const [mapCenter, setMapCenter]     = useState([9.3265, 8.9947]);
  const [mapZoom]                     = useState(13);
  const [showAllDrivers, setShowAllDrivers] = useState(true);
  const [showAllOrders, setShowAllOrders]   = useState(true);
  const [showRoutes, setShowRoutes]   = useState(false);
  const [mapLayer, setMapLayer]       = useState('streets');
  const [selDriverMap, setSelDriverMap] = useState(null);

  // Analytics state
  const [analytics, setAnalytics]         = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod]   = useState('month');

// ✅ PUT IT HERE (after all useState)
  // ✅ PUT IT HERE (after all useState)


  // Driver detail modal state
  const [showDriverDetail, setShowDriverDetail] = useState(false);
  const [selectedDriver, setSelectedDriver]     = useState(null);
  const [driverDetailLoading, setDriverDetailLoading] = useState(false);

  const [students, setStudents]       = useState([]);
  const [drivers, setDrivers]         = useState([]);
  const [orders, setOrders]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0, activeStudents: 0,
    totalDrivers: 0,  activeDrivers: 0,
    totalOrders: 0,   pendingOrders: 0, completedOrders: 0,
    totalRevenue: 0,  todayRevenue: 0,
    avgRating: 0,     totalWater: 0
  });

  const [incidents, setIncidents]         = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);


// ✅ WITHDRAWAL STATE - Add after this line
const [withdrawals, setWithdrawals]               = useState([]);
const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
const [withdrawalFilter, setWithdrawalFilter]     = useState('pending');
const [rejectNote, setRejectNote]                 = useState('');
const [showRejectModal, setShowRejectModal]       = useState(false);
const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);


// Add this state near your other useState declarations
const [showMobileMenu, setShowMobileMenu] = useState(false);

  

  // Fetch analytics function
  const fetchAnalytics = useCallback(async (period = 'month') => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [overviewRes, revenueRes, ordersRes, usersRes, driversRes, waterRes, paymentsRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/overview?period=${period}`,  { headers }),
        axios.get(`${API_URL}/analytics/revenue?period=${period}`,   { headers }),
        axios.get(`${API_URL}/analytics/orders?period=${period}`,    { headers }),
        axios.get(`${API_URL}/analytics/users?period=${period}`,     { headers }),
        axios.get(`${API_URL}/analytics/drivers?period=${period}`,   { headers }),
        axios.get(`${API_URL}/analytics/water?period=${period}`,     { headers }),
        axios.get(`${API_URL}/analytics/payments?period=${period}`,  { headers }),
      ]);

      setAnalytics({
        overview: overviewRes.data.data,
        revenue:  revenueRes.data.data,
        orders:   ordersRes.data.data,
        users:    usersRes.data.data,
        drivers:  driversRes.data.data,
        water:    waterRes.data.data,
        payments: paymentsRes.data.data,
      });
    } catch (err) {
      addToast('error', 'Failed to load analytics', err.response?.data?.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [addToast]);


  // Fetch analytics when analytics tab is opened
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics(analyticsPeriod);
    }
  }, [activeTab, analyticsPeriod, fetchAnalytics]);

    // ─── WITHDRAWAL FUNCTIONS ──────────────────────────────────────────────────
    const fetchWithdrawals = useCallback(async () => {
      try {
        setWithdrawalsLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/withdrawals?status=${withdrawalFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setWithdrawals(res.data.data);
      } catch (err) {
        addToast('error', 'Failed to load withdrawals', err.response?.data?.message);
      } finally {
        setWithdrawalsLoading(false);
      }
    }, [withdrawalFilter, addToast]);
  
    useEffect(() => {
      if (activeTab === 'withdrawals') fetchWithdrawals();
    }, [activeTab, withdrawalFilter, fetchWithdrawals]);
  
    const handleApproveWithdrawal = async (id) => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_URL}/withdrawals/${id}/approve`,
          { adminNote: 'Payment processed and sent' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          addToast('success', 'Withdrawal approved!', 'Driver notified via app and email.');
          fetchWithdrawals();
        }
      } catch (err) {
        addToast('error', 'Failed to approve', err.response?.data?.message);
      }
    };
  
    const handleRejectWithdrawal = async (id, note) => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.put(`${API_URL}/withdrawals/${id}/reject`,
          { adminNote: note || 'Rejected by admin' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          addToast('warn', 'Withdrawal rejected.', 'Driver notified via app and email.');
          setShowRejectModal(false);
          setRejectNote('');
          setSelectedWithdrawal(null);
          fetchWithdrawals();
        }
      } catch (err) {
        addToast('error', 'Failed to reject', err.response?.data?.message);
      }
    };

  // Fetch all dashboard data
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      setLoading(true);

      const [ordersRes, driversRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/water-requests/admin/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/drivers`,                  { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/students`,                 { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (ordersRes.data.success) {
        const data = ordersRes.data.data;
        setOrders(data);
        const pending   = data.filter(o => o.status === 'pending');
        const completed = data.filter(o => o.status === 'completed');
        const totalRevenue = data.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.amountPaid || 0), 0);
        const totalWater   = completed.reduce((s, o) => s + o.amount, 0);
        setStats(prev => ({ ...prev, totalOrders: data.length, pendingOrders: pending.length, completedOrders: completed.length, totalRevenue, totalWater }));
      }

      if (driversRes.data.success) {
        const data = driversRes.data.data;
        setDrivers(data);
        const activeDrivers = data.filter(d => d.online).length;
        const avgRating = data.length > 0
          ? (data.reduce((s, d) => s + (d.rating || 0), 0) / data.length).toFixed(1) : 0;
        setStats(prev => ({ ...prev, totalDrivers: data.length, activeDrivers, avgRating }));
      }

      if (studentsRes.data.success) {
        const data = studentsRes.data.data;
        setStudents(data);
        setStats(prev => ({ ...prev, totalStudents: data.length, activeStudents: data.filter(s => s.status === 'active').length }));
      }

      setNotifications([{ id: 1, message: 'Welcome to Admin Dashboard', time: 'Just now', read: false, type: 'info' }]);
    } catch (err) {
      console.error('Error fetching data:', err);
      addToast('error', 'Failed to load dashboard data', err.response?.data?.message);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  

  // DRIVER ACTIONS
  const viewDriverDetail = async (driverId) => {
    try {
      setDriverDetailLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/drivers/${driverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSelectedDriver(res.data.data);
        setShowDriverDetail(true);
      }
    } catch (err) {
      addToast('error', 'Failed to load driver details', err.response?.data?.message);
    } finally {
      setDriverDetailLoading(false);
    }
  };

  const approveDriver = async (driverId, newStatus = 'active') => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/drivers/${driverId}/status`,
        { status: newStatus, isVerified: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setDrivers(prev => prev.map(d =>
          (d._id === driverId || d.id === driverId)
            ? { ...d, status: newStatus, isVerified: true }
            : d
        ));
        addToast('success', `Driver approved and activated!`, 'Driver can now log in and receive orders.');
      }
    } catch (err) {
      addToast('error', 'Failed to approve driver', err.response?.data?.message);
    }
  };

  const suspendDriver = async (driverId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/drivers/${driverId}/status`,
        { status: 'suspended' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setDrivers(prev => prev.map(d =>
          (d._id === driverId || d.id === driverId) ? { ...d, status: 'suspended' } : d
        ));
        addToast('warn', 'Driver suspended');
      }
    } catch (err) {
      addToast('error', 'Failed to suspend driver', err.response?.data?.message);
    }
  };

  const toggleDriverOnline = async (driverId) => {
    try {
      const token = localStorage.getItem('token');
      const driver = drivers.find(d => (d._id || d.id) === driverId);
      const newStatus = !driver?.online;
      const res = await axios.put(
        `${API_URL}/drivers/${driverId}/status`,
        { online: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setDrivers(prev => prev.map(d => (d._id === driverId || d.id === driverId) ? { ...d, online: newStatus } : d));
        addToast('info', `${driver?.firstName} is now ${newStatus ? 'online' : 'offline'}`);
        setStats(prev => ({ ...prev, activeDrivers: newStatus ? prev.activeDrivers + 1 : prev.activeDrivers - 1 }));
      }
    } catch (err) {
      addToast('error', 'Failed to update driver status', err.response?.data?.message);
    }
  };

  const deleteDriver = async (driverId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_URL}/drivers/${driverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDrivers(prev => prev.filter(d => d._id !== driverId && d.id !== driverId));
        addToast('success', 'Driver deleted successfully');
        setStats(prev => ({ ...prev, totalDrivers: prev.totalDrivers - 1 }));
      }
    } catch (err) {
      addToast('error', 'Failed to delete driver', err.response?.data?.message);
    }
    setConfirmDel({ show: false, id: null, type: null });
  };

  const addDriver = async (driverData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/drivers`, driverData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDrivers(prev => [...prev, res.data.data]);
        addToast('success', 'Driver added successfully');
        setShowAddDriver(false);
        setStats(prev => ({ ...prev, totalDrivers: prev.totalDrivers + 1 }));
      }
    } catch (err) {
      addToast('error', 'Failed to add driver', err.response?.data?.message);
    }
  };

  // ORDER ACTIONS
  const approveOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/water-requests/admin/${orderId}`, { status: 'approved' }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status: 'approved' } : o));
        addToast('success', `Order ${orderId.slice(-6)} approved`, 'Driver assignment pending.');
        setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
      }
    } catch (err) { addToast('error', 'Failed to approve order', err.response?.data?.message); }
  };

  const rejectOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/water-requests/admin/${orderId}`, { status: 'cancelled' }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, status: 'cancelled' } : o));
        addToast('warn', `Order ${orderId.slice(-6)} cancelled`);
        setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
      }
    } catch (err) { addToast('error', 'Failed to cancel order', err.response?.data?.message); }
  };

 const assignDriver = async (orderId, driverId) => {
  try {
    const token = localStorage.getItem('token');
    const driver = drivers.find(d => (d._id || d.id) === driverId);
    
    // ✅ IMPORTANT: Send the driver's _id, NOT the name string
    const res = await axios.put(`${API_URL}/water-requests/admin/${orderId}`,
      { 
        status: 'approved', 
        driver: driverId,  // ✅ Send the ObjectId, not the name
        tanker: driver?.tankerId, 
        estimatedTime: 'Scheduled' 
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (res.data.success) {
      setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? 
        { ...o, status: 'in-progress', assignedDriver: driverId, driver: driverId } : o));
      addToast('success', `Driver ${driver?.firstName} assigned to ${orderId.slice(-6)}`);
      setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
    }
  } catch (err) { 
    addToast('error', 'Failed to assign driver', err.response?.data?.message); 
  }
};

  const deleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_URL}/water-requests/admin/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const was = orders.find(o => o._id === orderId || o.id === orderId);
        setOrders(prev => prev.filter(o => o._id !== orderId && o.id !== orderId));
        addToast('success', 'Order deleted successfully');
        if (was?.status === 'pending') setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
      }
    } catch (err) { addToast('error', 'Failed to delete order', err.response?.data?.message); }
    setConfirmDel({ show: false, id: null, type: null });
  };

  // STUDENT ACTIONS
  const verifyStudent = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/students/${studentId}/status`, { isVerified: true, isActive: true }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, verified: true, status: 'active' } : s));
        addToast('success', 'Student verified and activated');
        setStats(prev => ({ ...prev, activeStudents: prev.activeStudents + 1 }));
      }
    } catch (err) { addToast('error', 'Failed to verify student', err.response?.data?.message); }
  };

  const addStudent = async (studentData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/students`, studentData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setStudents(prev => [...prev, res.data.data]);
        addToast('success', 'Student added successfully');
        setShowAddStudent(false);
        setStats(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));
      }
    } catch (err) { addToast('error', 'Failed to add student', err.response?.data?.message); }
  };

  const deleteStudent = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_URL}/students/${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        addToast('success', 'Student deleted successfully');
        setStats(prev => ({ ...prev, totalStudents: prev.totalStudents - 1 }));
      }
    } catch (err) { addToast('error', 'Failed to delete student', err.response?.data?.message); }
    setConfirmDel({ show: false, id: null, type: null });
  };

  // Filtered lists
  const filteredStudents = students.filter(s => {
    const q = searchTerm.toLowerCase();
    const m = s.firstName?.toLowerCase().includes(q) || s.lastName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.matricNumber?.toLowerCase().includes(q);
    return m && (filterStatus === 'all' || s.status === filterStatus);
  }).sort((a, b) => sortBy === 'name' ? a.firstName?.localeCompare(b.firstName) : new Date(b.registeredAt) - new Date(a.registeredAt));

  const filteredDrivers = drivers.filter(d => {
    const q = searchTerm.toLowerCase();
    const m = d.firstName?.toLowerCase().includes(q) || d.lastName?.toLowerCase().includes(q) || d.tankerId?.toLowerCase().includes(q);
    return m && (filterStatus === 'all' || d.status === filterStatus) && (filterRole === 'all' || (filterRole === 'online' && d.online) || (filterRole === 'offline' && !d.online));
  }).sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : sortBy === 'deliveries' ? b.totalDeliveries - a.totalDeliveries : 0);

  const filteredOrders = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    const m = o.user?.email?.toLowerCase().includes(q) || o._id?.toLowerCase().includes(q) || o.location?.toLowerCase().includes(q);
    return m && (filterStatus === 'all' || o.status === filterStatus);
  }).sort((a, b) => sortBy === 'priority'
    ? ({'high':1,'medium':2,'low':3}[a.priority] - {'high':1,'medium':2,'low':3}[b.priority])
    : new Date(b.requestedAt) - new Date(a.requestedAt));

  const pendingDriverCount = drivers.filter(d => d.status === 'pending').length;

  const STATUS_BADGE = {
    pending:     'bg-yellow-100 text-yellow-700',
    approved:    'bg-blue-100 text-blue-700',
    'in-progress':'bg-purple-100 text-purple-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-700',
    active:      'bg-green-100 text-green-700',
    inactive:    'bg-gray-100 text-gray-600',
    'on-leave':  'bg-orange-100 text-orange-700',
    suspended:   'bg-red-100 text-red-700',
    offline:     'bg-gray-100 text-gray-600'
  };
  const PRI_BADGE = { high:'bg-red-100 text-red-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-green-100 text-green-700' };
  const sb = s => STATUS_BADGE[s] || 'bg-gray-100 text-gray-600';

  // Chart data
  const deliveryTrend = {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [
      { label:'Completed', data:[32,38,35,41,45,38,42], borderColor:'#10B981', backgroundColor:'rgba(16,185,129,.1)', fill:true, tension:.4 },
      { label:'Pending',   data:[8,6,9,7,5,4,3],        borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,.1)', fill:true, tension:.4 },
    ]
  };
  const userGrowth = {
    labels: ['Week 1','Week 2','Week 3','Week 4'],
    datasets: [
      { label:'Students', data:[45,52,58,64], backgroundColor:'#3B82F6', borderRadius:8 },
      { label:'Drivers',  data:[8,9,10,12],  backgroundColor:'#10B981', borderRadius:8 },
    ]
  };
  const orderDist = {
    labels: ['Pending','Approved','In Progress','Completed','Cancelled'],
    datasets: [{
      data: [
        orders.filter(o=>o.status==='pending').length,
        orders.filter(o=>o.status==='approved').length,
        orders.filter(o=>o.status==='in-progress').length,
        orders.filter(o=>o.status==='completed').length,
        orders.filter(o=>o.status==='cancelled').length,
      ],
      backgroundColor:['#F59E0B','#3B82F6','#8B5CF6','#10B981','#EF4444'],
      borderWidth:0
    }]
  };
  const co = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, grid:{color:'rgba(0,0,0,.05)'}}} };
  const po = { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} };

  const tileLayers = {
    streets:   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain:   'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };
  const tileAttr = { streets:'&copy; OpenStreetMap', satellite:'&copy; Esri', terrain:'&copy; OpenTopoMap' };

  const driverLocations = drivers.map(d => ({
    id: d._id || d.id,
    name: `${d.firstName} ${d.lastName}`,
    position: [9.3265+(Math.random()-0.5)*0.02, 8.9947+(Math.random()-0.5)*0.02],
    status: d.online ? 'active' : 'offline',
    tankerId: d.tankerId,
    speed: d.online ? Math.floor(Math.random()*50) : 0,
    lastUpdate: 'Just now',
    currentOrder: null
  }));
 const fetchIncidents = useCallback(async () => {
  try {
    setIncidentsLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_URL}/drivers/admin/incidents`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (res.data.success) {
      setIncidents(res.data.data || []);
    }

  } catch (err) {
    addToast(
      'error',
      'Failed to load incidents',
      err.response?.data?.message
    );
  } finally {
    setIncidentsLoading(false);
  }
}, [addToast]);
// ✅ THEN useEffect
useEffect(() => {
  if (activeTab === 'incidents') {
    fetchIncidents();
  }
}, [activeTab, fetchIncidents]);

const resolveIncident = async (driverId, incidentId) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.put(
      `${API_URL}/admin/drivers/${driverId}/incidents/${incidentId}/resolve`,
      { resolution: 'Resolved by admin' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success) {
      setIncidents(prev => prev.map(inc =>
        (inc._id || inc.id) === incidentId
          ? { ...inc, status: 'resolved', resolvedAt: new Date() }
          : inc
      ));
      addToast('success', 'Incident resolved successfully');
    }
  } catch (err) {
    addToast('error', 'Failed to resolve incident', err.response?.data?.message);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-green-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}`}</style>

      <Toast toasts={toasts} remove={removeToast} />

      <ConfirmDialog
        show={confirmDel.show}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${confirmDel.type}? This action cannot be undone.`}
        onConfirm={() => {
          if (confirmDel.type==='order')   deleteOrder(confirmDel.id);
          if (confirmDel.type==='student') deleteStudent(confirmDel.id);
          if (confirmDel.type==='driver')  deleteDriver(confirmDel.id);
        }}
        onCancel={() => setConfirmDel({ show:false, id:null, type:null })}
      />

      <AdminSettings show={showSettings} onClose={() => setShowSettings(false)} addToast={addToast} />
      <BroadcastModal show={showBroadcast} onClose={() => setShowBroadcast(false)} addToast={addToast} />
      <QuickAssignModal show={showAssign} order={assignOrder} drivers={drivers} onAssign={assignDriver}
        onClose={() => { setShowAssign(false); setAssignOrder(null); }} />

      <DriverDetailModal
        show={showDriverDetail}
        driver={selectedDriver}
        onClose={() => { setShowDriverDetail(false); setSelectedDriver(null); }}
        onApprove={approveDriver}
        onSuspend={suspendDriver}
        onDelete={(id) => setConfirmDel({ show:true, id, type:'driver' })}
        addToast={addToast}
      />

      {/* Header */}
    
  

       <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                <MdOutlineDashboard className="text-xl text-white" />
              </div>
              <h1 className="text-sm sm:text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowBroadcast(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors">
                <FaBullhorn size={11} /> Broadcast
              </button>
              {stats.pendingOrders > 0 && (
                <div className="hidden md:flex items-center gap-1.5 bg-yellow-100 px-3 py-1.5 rounded-full border border-yellow-200 cursor-pointer" onClick={() => setActiveTab('orders')}>
                  <MdOutlinePendingActions className="text-yellow-600" />
                  <span className="text-xs text-yellow-700 font-semibold">{stats.pendingOrders} pending</span>
                </div>
              )}
              {pendingDriverCount > 0 && (
                <div className="hidden md:flex items-center gap-1.5 bg-orange-100 px-3 py-1.5 rounded-full border border-orange-200 cursor-pointer" onClick={() => { setActiveTab('drivers'); setFilterStatus('pending'); }}>
                  <FaTruck className="text-orange-600 text-xs" />
                  <span className="text-xs text-orange-700 font-semibold">{pendingDriverCount} driver{pendingDriverCount>1?'s':''} pending</span>
                </div>
              )}
              <button className="relative" onClick={() => { setNotifications(p => p.map(n=>({...n,read:true}))); addToast('info','All notifications marked as read'); }}>
                <FaBell className="text-gray-600 text-xl" />
                {notifications.filter(n=>!n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {notifications.filter(n=>!n.read).length}
                  </span>
                )}
              </button>
              <button onClick={() => setShowSettings(true)} className="w-9 h-9 hidden bg-gray-100 hover:bg-green-100 rounded-full  items-center justify-center transition-colors">
                <FaCog className="text-gray-500 text-sm" />
              </button>
              <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 sm:px-3 sm:py-1.5 px-1 py-1 rounded-lg transition-colors font-medium">
                <FaSignOutAlt size={12} /> Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white mb-6 shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-black mb-1">Welcome back, Admin 👋</h2>
              <p className="text-green-100 text-sm">Here's what's happening across your system today.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowBroadcast(true)}
                className="bg-white/20 text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30 backdrop-blur-sm text-sm">
                <FaBullhorn size={12} /> Broadcast
              </button>
              <button onClick={() => {
                if (activeTab==='orders') {
                  const csv = filteredOrders.map(o => `${o._id||o.id},${o.user?.email},${o.amount},${o.status},${o.scheduledDate}`).join('\n');
                  const blob = new Blob([csv], {type:'text/csv'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href=url; a.download='orders.csv'; a.click();
                  URL.revokeObjectURL(url);
                  addToast('success','Orders exported successfully');
                }
              }} className="bg-white text-green-600 px-4 py-2 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center gap-2 shadow-md text-sm">
                <FaDownload size={12} /> Export
              </button>
              <button onClick={() => setShowFilters(p=>!p)} className="bg-yellow-400 text-green-900 px-4 py-2 rounded-xl font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow-md text-sm">
                <FaFilter size={12} /> Filters
              </button>
              <button onClick={() => setShowSettings(true)} className="bg-white/20 text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30 text-sm">
                <FaCog size={12} /> Settings
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-4 lg:grid-cols-8 gap-3 relative">
            {[
              { icon:FaUsers,                label:'Students',   value:stats.totalStudents,  sub:`${stats.activeStudents} active`,  color:'bg-blue-500' },
              { icon:FaUserTie,              label:'Drivers',    value:stats.totalDrivers,   sub:`${stats.activeDrivers} online`,   color:'bg-green-500' },
              { icon:FaClipboardList,        label:'Orders',     value:stats.totalOrders,    sub:`${stats.pendingOrders} pending`,  color:'bg-purple-500' },
              { icon:MdOutlinePendingActions,label:'Pending',    value:stats.pendingOrders,  sub:null,                             color:'bg-yellow-500' },
              { icon:FaCheckCircle,          label:'Completed',  value:stats.completedOrders,sub:null,                             color:'bg-emerald-500' },
              { icon:FaMoneyBillWave,        label:'Revenue',    value:`₦${(stats.totalRevenue/1000).toFixed(1)}K`, sub:null,     color:'bg-cyan-500' },
              { icon:FaStar,                 label:'Avg Rating', value:stats.avgRating,      sub:null,                             color:'bg-pink-500' },
              { icon:FaTint,                 label:'Water',      value:`${(stats.totalWater/1000).toFixed(0)}KL`,  sub:null,      color:'bg-orange-500' },
            ].map(s => (
              <div key={s.label} className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`${s.color} p-2 rounded-lg shrink-0`}><s.icon className="text-white text-sm" /></div>
                  <div>
                    <p className="text-[11px] text-white/80 leading-none">{s.label}</p>
                    <p className="text-lg font-black text-white mt-0.5 leading-none">{s.value}</p>
                    {s.sub && <p className="text-[10px] text-white/60 mt-0.5">{s.sub}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">SEARCH</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="text" placeholder="Search anything…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">STATUS</label>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  {['all','pending','approved','in-progress','completed','cancelled','active','inactive','suspended'].map(o=>(
                    <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1).replace('-',' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">SORT BY</label>
                <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  {['newest','oldest','name','priority','rating','deliveries'].map(o=>(
                    <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">ROLE/PRIORITY</label>
                <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  {['all','online','offline','high','medium','low'].map(o=>(
                    <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Left: Main Tabs */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="border-b border-gray-100 overflow-x-auto">
                <nav className="flex px-2">
                  {[
                    { id:'overview',  label:'Overview',   icon:FaChartBar,        badge:0 },
                    { id:'orders',    label:'Orders',     icon:FaClipboardList,   badge:stats.pendingOrders },
                    { id:'students',  label:'Students',   icon:FaUsers,           badge:students.filter(s=>s.status==='pending').length },
                    { id:'drivers',   label:'Drivers',    icon:FaUserTie,         badge:pendingDriverCount },
                    { id:'tracking',  label:'Live Map',   icon:FaMapMarkedAlt,    badge:0 },
                    { id:'analytics', label:'Analytics',  icon:FaChartLine,       badge:0 },
                    { id:'incidents', label:'Incidents', icon:FaExclamationTriangle, badge: incidents.filter(i => i.status === 'pending').length },
                    { id:'withdrawals', label:'Withdrawals', icon:FaMoneyBillWave, badge: withdrawals.filter(w => w.status === 'pending').length },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors
                        ${activeTab===tab.id?'border-green-600 text-green-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      <tab.icon size={13} className={activeTab===tab.id?'text-green-600':'text-gray-400'} />
                      {tab.label}
                      {tab.badge > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{tab.badge}</span>}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-5">
                {/* OVERVIEW TAB - Keep existing code */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-5">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <h3 className="font-bold text-sm text-gray-800 mb-3">Delivery Trends</h3>
                        <div className="h-56"><Line data={deliveryTrend} options={co} /></div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <h3 className="font-bold text-sm text-gray-800 mb-3">Order Distribution</h3>
                        <div className="h-56"><Pie data={orderDist} options={po} /></div>
                      </div>
                    </div>

                    {stats.pendingOrders > 0 && (
                      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                        <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                          <MdOutlinePendingActions className="text-yellow-600" />{stats.pendingOrders} Pending Order{stats.pendingOrders>1?'s':''}
                        </h3>
                        <div className="space-y-2.5">
                          {orders.filter(o=>o.status==='pending').slice(0,3).map(o => (
                            <div key={o._id||o.id} className="bg-white rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{o.user?.email||o.studentName}</p>
                                <p className="text-xs text-gray-500">{o.location} · {o.amount}L</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => { setAssignOrder(o); setShowAssign(true); }}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                  ⚡ Assign
                                </button>
                                <button onClick={() => approveOrder(o._id||o.id)}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                                  ✓ Approve
                                </button>
                                <button onClick={() => rejectOrder(o._id||o.id)}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-100 flex items-center gap-1">
                                  <FaBan size={10} /> Cancel
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {stats.pendingOrders > 3 && (
                          <button onClick={() => setActiveTab('orders')} className="mt-2 text-xs text-yellow-700 font-semibold hover:underline">
                            View all {stats.pendingOrders} pending →
                          </button>
                        )}
                      </div>
                    )}

                    {pendingDriverCount > 0 && (
                      <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                        <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                          <FaTruck className="text-orange-600" />{pendingDriverCount} Driver{pendingDriverCount>1?'s':''} Awaiting Approval
                        </h3>
                        <div className="space-y-2.5">
                          {drivers.filter(d=>d.status==='pending').slice(0,3).map(d => (
                            <div key={d._id||d.id} className="bg-white rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                                  {d.firstName?.charAt(0)}{d.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm">{d.firstName} {d.lastName}</p>
                                  <p className="text-xs text-gray-500">{d.tankerId} · {d.vehicleType}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => viewDriverDetail(d._id||d.id)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 border border-blue-100 flex items-center gap-1">
                                  <FaEye size={10} /> View
                                </button>
                                <button onClick={() => approveDriver(d._id||d.id)}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 flex items-center gap-1">
                                  <FaUserCheck size={10} /> Approve
                                </button>
                                <button onClick={() => setConfirmDel({ show:true, id:d._id||d.id, type:'driver' })}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-100">
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {pendingDriverCount > 3 && (
                          <button onClick={() => { setActiveTab('drivers'); setFilterStatus('pending'); }} className="mt-2 text-xs text-orange-700 font-semibold hover:underline">
                            View all {pendingDriverCount} pending drivers →
                          </button>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live Activity
                        </h3>
                        <button onClick={() => setNotifications(p=>p.map(n=>({...n,read:true})))} className="text-xs text-green-600 hover:underline">Mark all read</button>
                      </div>
                      <div className="space-y-2.5">
                        {notifications.slice(0,5).map(n => (
                          <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${n.read?'bg-gray-50':'bg-blue-50 border border-blue-100'}`}>
                            <div className={`p-2 rounded-lg shrink-0 ${n.type==='order'?'bg-yellow-100':n.type==='delivery'?'bg-green-100':n.type==='incident'?'bg-red-100':n.type==='student'?'bg-blue-100':n.type==='driver'?'bg-orange-100':'bg-purple-100'}`}>
                              {n.type==='order'    ? <MdOutlinePendingActions className="text-yellow-600 text-sm" /> :
                               n.type==='delivery' ? <FaTruck className="text-green-600 text-sm" /> :
                               n.type==='incident' ? <FaExclamationTriangle className="text-red-500 text-sm" /> :
                               n.type==='driver'   ? <FaUserTie className="text-orange-600 text-sm" /> :
                               n.type==='student'  ? <FaUsers className="text-blue-600 text-sm" /> :
                                                     <FaMoneyBillWave className="text-purple-600 text-sm" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{n.message}</p>
                              <p className="text-xs text-gray-500">{n.time}</p>
                            </div>
                            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-gray-800">Order Management</h3>
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                        className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        {['all','pending','approved','in-progress','completed','cancelled'].map(s=>(
                          <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>{['Order','Student','Amount','Date/Time','Status','Priority','Driver','Actions'].map(h=>(
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredOrders.map(o=>(
                            <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-gray-700">{o._id?.slice(-6).toUpperCase()}</td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-semibold text-gray-800">{o.user?.email}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{o.location}</p>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold">{o.amount}L</td>
                              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                {new Date(o.scheduledDate).toLocaleDateString()}<br/>
                                <span className="text-xs text-gray-400">{o.scheduledTime}</span>
                              </td>
                              <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sb(o.status)}`}>{o.status}</span></td>
                              <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRI_BADGE[o.priority]||'bg-gray-100 text-gray-600'}`}>{o.priority}</span></td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {o.assignedDriver ? `${drivers.find(d=>(d._id||d.id)===o.assignedDriver)?.firstName||''} ${drivers.find(d=>(d._id||d.id)===o.assignedDriver)?.lastName||''}` : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5">
                                  <button onClick={() => { setSelOrder(o); setShowOrderModal(true); }}
                                    className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center" title="View">
                                    <FaEye size={11} />
                                  </button>
                                  {o.status==='pending' && (
                                    <>
                                      <button onClick={() => { setAssignOrder(o); setShowAssign(true); }}
                                        className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center justify-center" title="Quick Assign">
                                        <FaBolt size={10} />
                                      </button>
                                      <button onClick={() => approveOrder(o._id)}
                                        className="w-7 h-7 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center" title="Approve">
                                        <FaCheck size={10} />
                                      </button>
                                      <button onClick={() => rejectOrder(o._id)}
                                        className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center" title="Cancel Request">
                                        <FaBan size={10} />
                                      </button>
                                    </>
                                  )}
                                  {o.status==='approved' && (
                                    <button onClick={() => { setAssignOrder(o); setShowAssign(true); }}
                                      className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 flex items-center justify-center" title="Assign Driver">
                                      <FaUserTie size={10} />
                                    </button>
                                  )}
                                  {(o.status==='approved'||o.status==='in-progress') && (
                                    <button onClick={() => rejectOrder(o._id)}
                                      className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 flex items-center justify-center" title="Cancel Request">
                                      <FaBan size={10} />
                                    </button>
                                  )}
                                  <button onClick={() => setConfirmDel({ show:true, id:o._id, type:'order' })}
                                    className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center" title="Delete">
                                    <FaTrash size={10} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredOrders.length===0 && (
                            <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* STUDENTS TAB */}
                {activeTab === 'students' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-gray-800">Student Management</h3>
                      <button onClick={() => setShowAddStudent(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl sm:text-sm text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors">
                        <FaUserPlus size={12} /> Add Student
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>{['Student','Matric','Dept','Level','Hall','Status','Plan','Balance','Actions'].map(h=>(
                            <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredStudents.map(s=>(
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                                    {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{s.firstName} {s.lastName}</p>
                                    <p className="text-xs text-gray-400">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.matricNumber}</td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.department}</td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.level}</td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.hall}, Rm {s.roomNumber}</td>
                              <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sb(s.status)}`}>{s.status}</span></td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.plan}</td>
                              <td className="px-3 py-3 text-sm font-bold">
                                <span className={s.balance<0?'text-red-600':'text-green-600'}>₦{s.balance?.toLocaleString()||0}</span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex gap-1.5">
                                  {!s.verified && (
                                    <button onClick={() => verifyStudent(s.id)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center" title="Verify">
                                      <FaUserCheck size={10} />
                                    </button>
                                  )}
                                  <button onClick={() => addToast('info',`Editing ${s.firstName}`)} className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center" title="Edit">
                                    <FaEdit size={10} />
                                  </button>
                                  <button onClick={() => setConfirmDel({ show:true, id:s.id, type:'student' })} className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center" title="Delete">
                                    <FaTrash size={10} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredStudents.length===0 && (
                            <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DRIVERS TAB */}
                {activeTab === 'drivers' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-sm  text-gray-800 ">Driver M</h3>
                        {pendingDriverCount > 0 && (
                          <span className="px-2.5 py-1 bg-orange-100  text-orange-700 rounded-full text-xs font-bold">
                            {pendingDriverCount} pending approval
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                          className="border border-gray-200 rounded-xl p-1 sm:text-sm text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent">
                          {['all','pending','active','inactive','suspended','on-leave'].map(s=>(
                            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                          ))}
                        </select>
                        <button onClick={() => setShowAddDriver(true)}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl sm:text-sm text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors">
                          <FaUserPlus size={12} /> Add Driver
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>{['Driver','Tanker','Status','Online','Rating','Deliveries','Location','Actions'].map(h=>(
                            <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredDrivers.map(d=>(
                            <tr key={d._id||d.id} className={`hover:bg-gray-50 transition-colors ${d.status==='pending'?'bg-orange-50/40':''}`}>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                                      {d.firstName?.charAt(0)}{d.lastName?.charAt(0)}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${d.online?'bg-green-500':'bg-gray-300'}`} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{d.firstName} {d.lastName}</p>
                                    <p className="text-xs text-gray-400">{d.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">{d.tankerId}</td>
                              <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sb(d.status)}`}>{d.status}</span></td>
                              <td className="px-3 py-3">
                                <button onClick={() => toggleDriverOnline(d._id||d.id)} className="transition-transform active:scale-90" disabled={d.status!=='active'}>
                                  {d.online ? <FaToggleOn className="text-3xl text-green-500" /> : <FaToggleOff className={`text-3xl ${d.status==='active'?'text-gray-300':'text-gray-200'}`} />}
                                </button>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1"><FaStar className="text-yellow-400 text-xs" /><span className="text-sm font-bold">{d.rating}</span></div>
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-700">{d.totalDeliveries}</td>
                              <td className="px-3 py-3 text-xs text-gray-600 max-w-[100px] truncate">{d.currentLocation}</td>
                              <td className="px-3 py-3">
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => viewDriverDetail(d._id||d.id)}
                                    disabled={driverDetailLoading}
                                    className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center" title="View Details">
                                    {driverDetailLoading ? <FaSpinner className="animate-spin" size={10} /> : <FaEye size={10} />}
                                  </button>
                                  {d.status==='pending' && (
                                    <button
                                      onClick={() => approveDriver(d._id||d.id)}
                                      className="w-7 h-7 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center" title="Approve Driver">
                                      <FaUserCheck size={10} />
                                    </button>
                                  )}
                                  {d.status==='active' && (
                                    <button onClick={() => suspendDriver(d._id||d.id)}
                                      className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 flex items-center justify-center" title="Suspend">
                                      <FaBan size={10} />
                                    </button>
                                  )}
                                  {(d.status==='suspended'||d.status==='inactive') && (
                                    <button onClick={() => approveDriver(d._id||d.id,'active')}
                                      className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center" title="Reactivate">
                                      <FaCheck size={10} />
                                    </button>
                                  )}
                                  <button onClick={() => setConfirmDel({ show:true, id:d._id||d.id, type:'driver' })}
                                    className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center" title="Delete">
                                    <FaTrash size={10} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredDrivers.length===0 && (
                            <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No drivers found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* LIVE MAP TAB */}
                {activeTab === 'tracking' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-gray-800">Live Map</h3>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label:'Drivers', ico:FaTruck,        active:showAllDrivers, fn:()=>setShowAllDrivers(p=>!p), color:'green' },
                          { label:'Orders',  ico:FaClipboardList,active:showAllOrders,  fn:()=>setShowAllOrders(p=>!p),  color:'blue' },
                          { label:'Routes',  ico:FaRoute,        active:showRoutes,     fn:()=>setShowRoutes(p=>!p),     color:'purple' },
                        ].map(({label,ico:Ico,active:a,fn,color})=>(
                          <button key={label} onClick={fn}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${a?`bg-${color}-600 text-white shadow`:'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            <Ico size={11}/>{label}
                          </button>
                        ))}
                        <button onClick={() => setMapLayer(p=>({streets:'satellite',satellite:'terrain',terrain:'streets'})[p])}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 flex items-center gap-1.5">
                          <FaLayerGroup size={11}/>{mapLayer}
                        </button>
                        <button onClick={() => setMapCenter([9.3265,8.9947])} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200">
                          <FaCrosshairs size={11}/>
                        </button>
                      </div>
                    </div>
                    <div className="h-[440px] rounded-2xl overflow-hidden shadow-inner">
                      <MapContainer center={mapCenter} zoom={mapZoom} style={{height:'100%',width:'100%'}}>
                        <TileLayer url={tileLayers[mapLayer]} attribution={tileAttr[mapLayer]} />
                        <MapCtrl center={mapCenter} />
                        {showAllDrivers && driverLocations.map(d=>(
                          <Marker key={d.id} position={d.position} icon={L.divIcon({
                            className:'',
                            html:`<div style="background:${d.status==='active'?'#10B981':'#9CA3AF'};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3)">🚚</div>`,
                            iconSize:[40,40],iconAnchor:[20,20],popupAnchor:[0,-20]
                          })}>
                            <Popup>
                              <div className="p-2 min-w-[180px]">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`w-2 h-2 rounded-full ${d.status==='active'?'bg-green-500':'bg-gray-400'}`}/>
                                  <strong>{d.name}</strong>
                                </div>
                                <p className="text-sm">🚛 {d.tankerId}</p>
                                <p className="text-sm">⚡ {d.speed} km/h</p>
                                <p className="text-xs text-gray-400 mt-1">{d.lastUpdate}</p>
                                <button onClick={() => setMapCenter(d.position)} className="mt-2 w-full bg-green-600 text-white text-xs py-1.5 rounded-lg">Track</button>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                        {showAllOrders && orders.filter(o=>o.status!=='completed'&&o.status!=='cancelled').slice(0,5).map((o,i)=>{
                          const pos=[[9.3265,8.9947],[9.3280,8.9910],[9.3300,8.9880],[9.3240,8.9970],[9.3220,9.0000]][i%5];
                          const c=o.status==='pending'?'#F59E0B':o.status==='approved'?'#3B82F6':o.status==='in-progress'?'#8B5CF6':'#10B981';
                          return (
                            <Marker key={o._id||o.id} position={pos} icon={L.divIcon({
                              className:'',
                              html:`<div style="background:${c};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.2)">📍</div>`,
                              iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-14]
                            })}>
                              <Popup>
                                <div className="p-2 min-w-[160px]">
                                  <strong className="text-sm">{o.user?.email||o.studentName}</strong>
                                  <p className="text-xs text-gray-600 mt-1">{o.location}</p>
                                  <p className="text-xs">{o.amount}L</p>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sb(o.status)}`}>{o.status}</span>
                                </div>
                              </Popup>
                            </Marker>
                          );
                        })}
                        {showRoutes&&selDriverMap&&<Polyline positions={[selDriverMap.position,[9.3280,8.9910]]} color="#10B981" weight={3} dashArray="6,4"/>}
                      </MapContainer>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {driverLocations.map(d=>(
                        <div key={d.id} onClick={() => {setSelDriverMap(d);setMapCenter(d.position);}}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selDriverMap?.id===d.id?'border-green-500 bg-green-50':'border-gray-100 bg-white'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${d.status==='active'?'bg-green-500 animate-pulse':'bg-gray-400'}`}/>
                              <p className="text-xs font-bold text-gray-800 truncate">{d.name}</p>
                            </div>
                            <span className="text-xs text-gray-400">{d.tankerId}</span>
                          </div>
                          <p className="text-xs text-gray-500">{d.speed} km/h · {d.lastUpdate}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INCIDENTS TAB */}
                {activeTab === 'incidents' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-gray-800">Incident Reports</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">
                          {incidents.filter(i => i.status === 'pending').length} pending
                        </span>
                        <button onClick={fetchIncidents}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200">
                          🔄 Refresh
                        </button>
                      </div>
                    </div>

                    {incidentsLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <FaSpinner className="animate-spin text-green-600 text-3xl" />
                      </div>
                    ) : incidents.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <FaExclamationTriangle className="text-5xl mx-auto mb-3 opacity-20" />
                        <p>No incidents reported yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {incidents.map(inc => {
                          const driver = drivers.find(d => (d._id || d.id) === (inc.driver?._id || inc.driver || inc.driverId));
                          return (
                            <div key={inc._id || inc.id}
                              className={`rounded-xl border-2 p-4 transition-all ${
                                inc.status === 'pending'  ? 'border-red-200 bg-red-50/40' :
                                inc.status === 'resolved' ? 'border-gray-100 bg-gray-50' :
                                'border-yellow-200 bg-yellow-50/40'
                              }`}>
                              <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  {/* Type Icon */}
                                  <div className={`p-2.5 rounded-xl shrink-0 ${
                                    inc.status === 'pending'  ? 'bg-red-100'    :
                                    inc.status === 'resolved' ? 'bg-green-100'  : 'bg-yellow-100'
                                  }`}>
                                    <FaExclamationTriangle className={`${
                                      inc.status === 'pending'  ? 'text-red-600'    :
                                      inc.status === 'resolved' ? 'text-green-600'  : 'text-yellow-600'
                                    }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        inc.type === 'breakdown' ? 'bg-red-100 text-red-700'      :
                                        inc.type === 'accident'  ? 'bg-red-200 text-red-800'      :
                                        inc.type === 'flat'      ? 'bg-orange-100 text-orange-700':
                                        inc.type === 'fuel'      ? 'bg-yellow-100 text-yellow-700':
                                        inc.type === 'delay'     ? 'bg-blue-100 text-blue-700'    :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {inc.type === 'breakdown' ? '🔧 Breakdown'  :
                                        inc.type === 'accident'  ? '💥 Accident'   :
                                        inc.type === 'flat'      ? '🚗 Flat Tyre'  :
                                        inc.type === 'fuel'      ? '⛽ Out of Fuel':
                                        inc.type === 'delay'     ? '⏳ Delay'      :
                                        '📋 Other'}
                                      </span>
                                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        inc.status === 'pending'  ? 'bg-red-100 text-red-700'    :
                                        inc.status === 'resolved' ? 'bg-green-100 text-green-700': 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {inc.status === 'pending' ? '⏳ Pending' : inc.status === 'resolved' ? '✅ Resolved' : inc.status}
                                      </span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {inc.driver?.firstName
                                        ? `${inc.driver.firstName} ${inc.driver.lastName}`
                                        : driver
                                        ? `${driver.firstName} ${driver.lastName}`
                                        : 'Unknown Driver'}
                                      <span className="text-gray-400 font-normal ml-1">
                                        · {inc.driver?.tankerId || driver?.tankerId || ''}
                                      </span>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{inc.description}</p>
                                    {inc.resolution && (
                                      <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg mt-1.5 inline-block">
                                        ✅ Resolution: {inc.resolution}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1.5">
                                      Reported: {inc.reportedAt ? new Date(inc.reportedAt).toLocaleString() : 'Unknown'}
                                      {inc.resolvedAt && ` · Resolved: ${new Date(inc.resolvedAt).toLocaleString()}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Actions */}
                                {inc.status === 'pending' && (
                                  <button
                                    onClick={() => {
                                      const dId = inc.driver?._id || inc.driver || inc.driverId;
                                      resolveIncident(dId, inc._id || inc.id);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shrink-0 flex items-center gap-1.5">
                                    <FaCheck size={10} /> Mark Resolved
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'withdrawals' && (
                    <div>
                        {/* ── Reject Modal ── */}
                        {showRejectModal && selectedWithdrawal && (
                                      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                        <div className="bg-white text-sm rounded-2xl max-w-sm w-full shadow-2xl p-6">
                                          <h3 className="font-bold text-gray-800 text-lg mb-2">Reject Withdrawal</h3>
                                          <p className="text-sm text-gray-500 mb-4">
                                            Rejecting <strong>₦{selectedWithdrawal.amount?.toLocaleString()}</strong> for{' '}
                                            <strong>{selectedWithdrawal.driver?.firstName} {selectedWithdrawal.driver?.lastName}</strong>
                                          </p>
                                          <textarea
                                            value={rejectNote}
                                            onChange={e => setRejectNote(e.target.value)}
                                            placeholder="Reason for rejection (will be sent to driver)..."
                                            rows={3}
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 resize-none mb-4"
                                          />
                                          <div className="flex gap-3">
                                            <button
                                              onClick={() => { setShowRejectModal(false); setRejectNote(''); setSelectedWithdrawal(null); }}
                                              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">
                                              Cancel
                                            </button>
                                            <button
                                              onClick={() => handleRejectWithdrawal(selectedWithdrawal._id, rejectNote)}
                                              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
                                              Reject & Notify
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                        )}

                                    {/* ── Header ── */}
                        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                                      <h3 className="font-bold text-gray-800">Withdrawal Requests</h3>
                                      <div className="flex gap-2 flex-wrap">
                                        {[
                                          { id: 'pending',  label: 'Pending',  color: 'bg-yellow-500' },
                                          { id: 'approved', label: 'Approved', color: 'bg-green-600'  },
                                          { id: 'rejected', label: 'Rejected', color: 'bg-red-500'    },
                                          { id: 'all',      label: 'All',      color: 'bg-gray-700'   },
                                        ].map(f => (
                                          <button key={f.id} onClick={() => setWithdrawalFilter(f.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                                              ${withdrawalFilter === f.id ? `${f.color} text-white shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            {f.label}
                                          </button>
                                        ))}
                                        <button onClick={fetchWithdrawals}
                                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200">
                                          🔄 Refresh
                                        </button>
                                      </div>
                        </div>

                                    {/* ── Content ── */}
                        {withdrawalsLoading ? (
                                      <div className="flex items-center justify-center py-16">
                                        <FaSpinner className="animate-spin text-green-600 text-3xl" />
                                      </div>
                        ) : withdrawals.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                                        <FaMoneyBillWave className="text-5xl mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No {withdrawalFilter === 'all' ? '' : withdrawalFilter} withdrawal requests</p>
                        </div>
                        ) : (
                        <div className="space-y-4">
                                        {withdrawals.map(w => (
                                          <div key={w._id}
                                            className={`rounded-xl border-2 p-4 transition-all ${
                                              w.status === 'pending'  ? 'border-yellow-200 bg-yellow-50/30' :
                                              w.status === 'approved' ? 'border-green-100 bg-green-50/20' :
                                              'border-red-100 bg-gray-50 opacity-80'
                                            }`}>
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-3">

                                              {/* Left info */}
                                              <div className="flex items-start gap-3 flex-1">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                                                  {w.driver?.firstName?.charAt(0)}{w.driver?.lastName?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  {/* Name + status */}
                                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="font-bold text-gray-800 text-sm">
                                                      {w.driver?.firstName} {w.driver?.lastName}
                                                    </p>
                                                    <span className="text-xs text-gray-400">{w.driver?.tankerId}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                      w.status === 'pending'  ? 'bg-yellow-100  text-yellow-700' :
                                                      w.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                      'bg-red-100 text-red-700'
                                                    }`}>
                                                      {w.status === 'pending' ? '⏳ Pending' : w.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                                                    </span>
                                                  </div>

                                                  {/* Amount */}
                                                  <p className="text-2xl font-black text-gray-800 mb-2">
                                                    ₦{w.amount?.toLocaleString()}
                                                  </p>

                                                  {/* Bank details */}
                                                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                                                    <span className="flex items-center gap-1">🏦 {w.bankName}</span>
                                                    <span className="flex items-center gap-1">💳 {w.accountNumber}</span>
                                                    {w.accountName && <span className="flex items-center gap-1">👤 {w.accountName}</span>}
                                                    <span className="flex items-center gap-1">📞 {w.driver?.phone}</span>
                                                  </div>

                                                  {/* ✅ Driver balance breakdown */}
                                                  {w.driverBalance && (
                                                    <div className="flex flex-wrap bg-white rounded-xl p-3 border border-gray-100 mb-2">
                                                    {/* Total Earned */}
                                                    <div className="flex-1 min-w-[90px] text-center px-2 py-1">
                                                      <p className="text-[12px] sm:text-sm text-gray-400">Total Earned</p>
                                                      <p className="text-xs sm:text-sm font-black text-green-600">₦{w.driverBalance.totalEarnings.toLocaleString()}</p>
                                                    </div>
                                                    
                                                    {/* Withdrawn */}
                                                    <div className="flex-1 min-w-[90px] text-center px-2 py-1 border-l border-r border-gray-100">
                                                      <p className="text-[12px] sm:text-sm text-gray-400">Withdrawn</p>
                                                      <p className="text-xs sm:text-sm font-black text-orange-500">₦{w.driverBalance.totalWithdrawn.toLocaleString()}</p>
                                                    </div>
                                                    
                                                    {/* Available */}
                                                    <div className="flex-1 min-w-[90px] text-center px-2 py-1">
                                                      <p className="text-[12px] sm:text-sm text-gray-400">Available</p>
                                                      <p className={`text-xs sm:text-sm font-black ${w.driverBalance.available >= w.amount ? 'text-blue-600' : 'text-red-600'}`}>
                                                        ₦{w.driverBalance.available.toLocaleString()}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  )}

                                                  {/* Insufficient balance warning */}
                                                  {w.driverBalance && w.driverBalance.available < w.amount && w.status === 'pending' && (
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700 mb-2 flex items-center gap-1">
                                                      <FaExclamationTriangle size={10} />
                                                      ⚠️ Insufficient balance! Driver earned ₦{w.driverBalance.totalEarnings.toLocaleString()} but requesting ₦{w.amount.toLocaleString()}
                                                    </div>
                                                  )}

                                                  {/* Admin note */}
                                                  {w.adminNote && (
                                                    <p className={`text-xs px-2 py-1 rounded-lg inline-block mb-1 ${
                                                      w.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                      📝 {w.adminNote}
                                                    </p>
                                                  )}

                                                  <p className="text-[10px] text-gray-400">
                                                    Requested: {new Date(w.createdAt).toLocaleString()}
                                                    {w.processedAt && ` · Processed: ${new Date(w.processedAt).toLocaleString()}`}
                                                  </p>
                                                </div>
                                              </div>

                                              {/* ✅ Action buttons — only for pending */}
                                              {w.status === 'pending' && (
                                                <div className="flex flex-col gap-2 shrink-0">
                                                  <button
                                                    onClick={() => handleApproveWithdrawal(w._id)}
                                                    disabled={w.driverBalance && w.driverBalance.available < w.amount}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                                                    <FaCheck size={10} /> Approve & Pay
                                                  </button>
                                                  <button
                                                    onClick={() => { setSelectedWithdrawal(w); setShowRejectModal(true); }}
                                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5">
                                                    <FaTimes size={10} /> Reject
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                        </div>
                          )}
                    </div>
                )}
                  
                {/* ANALYTICS TAB - Now properly inside the component */}

                {activeTab === 'analytics' && (
                  <div className="space-y-6">

                    {/* Period Selector */}
                    <div className="flex flex-wrap   items-center justify-between gap-3">
                      <h3 className="font-bold text-gray-800 text-sm sm:text-lg">Analytics Dashboard</h3>
                      <div className="flex gap-2">
                        {[
                          { id: 'today',   label: 'Today'   },
                          { id: 'week',    label: 'Week'    },
                          { id: 'month',   label: 'Month'   },
                          { id: 'quarter', label: 'Quarter' },
                          { id: 'year',    label: 'Year'    },
                        ].map(p => (
                          <button key={p.id} onClick={() => setAnalyticsPeriod(p.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                              ${analyticsPeriod === p.id
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Loading */}
                    {analyticsLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                          <FaSpinner className="animate-spin text-green-600 text-4xl mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">Loading analytics...</p>
                        </div>
                      </div>
                    ) : analytics ? (
                      <>
                        {/* ── Overview KPI Cards ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            {
                              label: 'Total Revenue',
                              value: `₦${(analytics.overview.totalRevenue || 0).toLocaleString()}`,
                              sub:   `₦${(analytics.overview.periodRevenue || 0).toLocaleString()} this ${analyticsPeriod}`,
                              icon:  FaMoneyBillWave,
                              color: 'bg-green-500',
                              trend: '↑',
                              trendColor: 'text-green-600',
                            },
                            {
                              label: 'Completion Rate',
                              value: `${analytics.overview.completionRate || 0}%`,
                              sub:   `${analytics.overview.completedOrders} of ${analytics.overview.totalOrders} orders`,
                              icon:  FaCheckCircle,
                              color: 'bg-blue-500',
                              trend: '↑',
                              trendColor: 'text-green-600',
                            },
                            {
                              label: 'Total Water',
                              value: `${((analytics.overview.totalWater || 0) / 1000).toFixed(1)}KL`,
                              sub:   `${analytics.overview.totalOrders} total orders`,
                              icon:  FaTint,
                              color: 'bg-cyan-500',
                              trend: '↑',
                              trendColor: 'text-green-600',
                            },
                            {
                              label: 'New Students',
                              value: analytics.overview.newStudents || 0,
                              sub:   `${analytics.overview.totalStudents} total students`,
                              icon:  FaUsers,
                              color: 'bg-purple-500',
                              trend: '↑',
                              trendColor: 'text-green-600',
                            },
                          ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between sm:items-start gap-2 mb-2">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                                <p className="text-xl sm:text-2xl font-black text-gray-800 mt-1 break-all">{s.value}</p>
                              </div>
                              <div className={`${s.color} p-3 rounded-xl self-start sm:self-auto`}>
                                <s.icon className="text-white text-lg" />
                              </div>
                            </div>
                            <p className={`text-xs ${s.trendColor} font-medium`}>{s.trend} {s.sub}</p>
                          </div>
                          ))}
                        </div>

                        {/* ── Revenue Chart ── */}
                        <div className="bg-white rounded-2xl shadow-md p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Revenue Over Time</h3>
                            <span className="text-sm font-bold text-green-600">
                              ₦{(analytics.revenue.totalRevenue || 0).toLocaleString()} total
                            </span>
                          </div>
                          <div className="h-64">
                            <Line
                              data={{
                                labels: analytics.revenue.labels.map(l => {
                                  const d = new Date(l);
                                  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
                                }),
                                datasets: [{
                                  label:           'Revenue (₦)',
                                  data:            analytics.revenue.revenues,
                                  borderColor:     '#10B981',
                                  backgroundColor: 'rgba(16,185,129,0.1)',
                                  fill:            true,
                                  tension:         0.4,
                                  pointRadius:     3,
                                  pointHoverRadius:6,
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                    ticks: {
                                      callback: v => `₦${(v/1000).toFixed(0)}K`
                                    }
                                  },
                                  x: { grid: { display: false } }
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* ── Order Trends + Distribution ── */}
                        <div className="grid lg:grid-cols-2 gap-5">
                          <div className="bg-white rounded-2xl shadow-md p-5">
                            <h3 className="font-bold text-gray-800 mb-4">Order Trends (Last 7 Days)</h3>
                            <div className="h-56">
                              <Bar
                                data={{
                                  labels: analytics.orders.trend.labels.map(l => {
                                    const d = new Date(l);
                                    return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' });
                                  }),
                                  datasets: [
                                    {
                                      label:           'Completed',
                                      data:            analytics.orders.trend.completed,
                                      backgroundColor: '#10B981',
                                      borderRadius:    6,
                                    },
                                    {
                                      label:           'Pending',
                                      data:            analytics.orders.trend.pending,
                                      backgroundColor: '#F59E0B',
                                      borderRadius:    6,
                                    },
                                    {
                                      label:           'Cancelled',
                                      data:            analytics.orders.trend.cancelled,
                                      backgroundColor: '#EF4444',
                                      borderRadius:    6,
                                    },
                                  ]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                                  scales: {
                                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                                    x: { grid: { display: false } }
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl shadow-md p-5">
                            <h3 className="font-bold text-gray-800 mb-4">Order Status Distribution</h3>
                            <div className="h-56">
                              <Pie
                                data={{
                                  labels: analytics.orders.statusDistribution.map(s => s._id),
                                  datasets: [{
                                    data: analytics.orders.statusDistribution.map(s => s.count),
                                    backgroundColor: ['#F59E0B','#3B82F6','#8B5CF6','#10B981','#EF4444','#6B7280'],
                                    borderWidth: 0,
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* ── User Growth ── */}
                        <div className="bg-white rounded-2xl shadow-md p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">User Growth (Last 12 Months)</h3>
                            <div className="flex gap-4 text-xs">
                              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"/>{analytics.users.totals.totalStudents} students</span>
                              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"/>{analytics.users.totals.totalDrivers} drivers</span>
                            </div>
                          </div>
                          <div className="h-64">
                            <Bar
                              data={{
                                labels: analytics.users.labels.map(l => {
                                  const [y, m] = l.split('-');
                                  return new Date(y, m - 1).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' });
                                }),
                                datasets: [
                                  {
                                    label:           'Students',
                                    data:            analytics.users.studentCounts,
                                    backgroundColor: '#3B82F6',
                                    borderRadius:    6,
                                  },
                                  {
                                    label:           'Drivers',
                                    data:            analytics.users.driverCounts,
                                    backgroundColor: '#10B981',
                                    borderRadius:    6,
                                  },
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                                scales: {
                                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                                  x: { grid: { display: false } }
                                }
                              }}
                            />
                          </div>
                          {/* User breakdown stats */}
                          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                            {[
                              { label: 'Total Students',    value: analytics.users.totals.totalStudents },
                              { label: 'Verified Students', value: analytics.users.totals.verifiedStudents },
                              { label: 'Active Drivers',    value: analytics.users.totals.activeDrivers },
                            ].map(s => (
                              <div key={s.label} className="text-center">
                                <p className="text-xl font-black text-gray-800">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Hall Breakdown + Department Breakdown ── */}
                        <div className="grid lg:grid-cols-2 gap-5">
                          <div className="bg-white rounded-2xl shadow-md p-5">
                            <h3 className="font-bold text-gray-800 mb-4">Students by Hall</h3>
                            <div className="space-y-2.5">
                              {analytics.users.hallBreakdown.map((h, i) => {
                                const max = analytics.users.hallBreakdown[0]?.count || 1;
                                const pct = ((h.count / max) * 100).toFixed(0);
                                return (
                                  <div key={h._id || i}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="font-medium text-gray-700">{h._id || 'Unknown'}</span>
                                      <span className="font-bold text-gray-800">{h.count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                              {analytics.users.hallBreakdown.length === 0 && (
                                <p className="text-center text-gray-400 py-4 text-sm">No data yet</p>
                              )}
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl shadow-md p-5">
                            <h3 className="font-bold text-gray-800 mb-4">Students by Department</h3>
                            <div className="space-y-2.5">
                              {analytics.users.deptBreakdown.map((d, i) => {
                                const max = analytics.users.deptBreakdown[0]?.count || 1;
                                const pct = ((d.count / max) * 100).toFixed(0);
                                return (
                                  <div key={d._id || i}>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="font-medium text-gray-700 truncate max-w-[200px]">{d._id || 'Unknown'}</span>
                                      <span className="font-bold text-gray-800 shrink-0 ml-2">{d.count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                              {analytics.users.deptBreakdown.length === 0 && (
                                <p className="text-center text-gray-400 py-4 text-sm">No data yet</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ── Driver Performance ── */}
                        <div className="bg-white rounded-2xl shadow-md p-5">
                          <h3 className="font-bold text-gray-800 mb-4">Top Driver Performance</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  {['Rank','Driver','Tanker','Status','Rating','Deliveries','Vehicle'].map(h => (
                                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {analytics.drivers.topDrivers.map((d, i) => (
                                  <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2.5 text-sm font-bold text-gray-500">
                                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                                          {d.firstName?.charAt(0)}{d.lastName?.charAt(0)}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{d.firstName} {d.lastName}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-sm text-gray-600">{d.tankerId}</td>
                                    <td className="px-3 py-2.5">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                      }`}>{d.status}</span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-1">
                                        <FaStar className="text-yellow-400 text-xs" />
                                        <span className="text-sm font-bold">{d.rating}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-sm font-bold text-gray-800">{d.totalDeliveries}</td>
                                    <td className="px-3 py-2.5 text-xs text-gray-500">{d.vehicleType}</td>
                                  </tr>
                                ))}
                                {analytics.drivers.topDrivers.length === 0 && (
                                  <tr><td colSpan="7" className="px-3 py-8 text-center text-gray-400">No driver data yet</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          {/* Driver stats row */}
                          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                            {[
                              { label: 'Online Now',    value: analytics.drivers.onlineCount },
                              { label: 'Offline',       value: analytics.drivers.offlineCount },
                              { label: 'Avg Rating',    value: `⭐ ${analytics.drivers.avgRating}` },
                              { label: 'Total Incidents', value: analytics.drivers.totalIncidents },
                            ].map(s => (
                              <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3">
                                <p className="text-lg font-black text-gray-800">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Water Delivery Analytics ── */}
                        <div className="bg-white rounded-2xl shadow-md p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">Water Delivery Volume</h3>
                            <span className="text-sm font-bold text-blue-600">
                              {((analytics.water.allTimeWater || 0) / 1000).toFixed(1)}KL all time
                            </span>
                          </div>
                          <div className="h-56">
                            <Line
                              data={{
                                labels: analytics.water.labels.map(l => {
                                  const d = new Date(l);
                                  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
                                }),
                                datasets: [{
                                  label:           'Liters Delivered',
                                  data:            analytics.water.waterVolumes,
                                  borderColor:     '#3B82F6',
                                  backgroundColor: 'rgba(59,130,246,0.1)',
                                  fill:            true,
                                  tension:         0.4,
                                }]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                    ticks: { callback: v => `${v}L` }
                                  },
                                  x: { grid: { display: false } }
                                }
                              }}
                            />
                          </div>
                          {/* Quantity popularity */}
                          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
                            {analytics.water.quantityPopularity.map(q => (
                              <div key={q._id} className="bg-blue-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-blue-700">{q.count}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{q._id}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Payment Analytics ── */}
                        <div className="grid lg:grid-cols-2 gap-5">
                          <div className="bg-white rounded-2xl shadow-md p-5">
                            <h3 className="font-bold text-gray-800 mb-4">Payment Overview</h3>
                            <div className="space-y-3">
                              {[
                                { label: 'Total Revenue',   value: `₦${(analytics.payments.totalRevenue || 0).toLocaleString()}`,  color: 'bg-green-500'  },
                                { label: 'Period Revenue',  value: `₦${(analytics.payments.periodRevenue || 0).toLocaleString()}`, color: 'bg-blue-500'   },
                                { label: 'Unpaid Amount',   value: `₦${(analytics.payments.unpaidAmount  || 0).toLocaleString()}`, color: 'bg-red-400'    },
                                { label: 'Avg Transaction', value: `₦${(analytics.payments.avgTransaction || 0).toLocaleString()}`,color: 'bg-purple-500' },
                              ].map(s => (
                                <div key={s.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                  <div className={`${s.color} w-3 h-3 rounded-full shrink-0`} />
                                  <p className="text-sm text-gray-600 flex-1">{s.label}</p>
                                  <p className="text-sm font-black text-gray-800">{s.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl shadow-md p-5">
                            <h3 className="font-bold text-gray-800 mb-4">Payment Status Breakdown</h3>
                            {analytics.payments.paymentStatus.length > 0 ? (
                              <div className="h-48">
                                <Pie
                                  data={{
                                    labels: analytics.payments.paymentStatus.map(p => p._id),
                                    datasets: [{
                                      data: analytics.payments.paymentStatus.map(p => p.count),
                                      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                                      borderWidth: 0,
                                    }]
                                  }}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
                                  }}
                                />
                              </div>
                            ) : (
                              <p className="text-center text-gray-400 py-8 text-sm">No payment data yet</p>
                            )}
                          </div>
                        </div>

                        {/* ── Peak Delivery Times ── */}
                        <div className="bg-white rounded-2xl shadow-md p-5">
                          <h3 className="font-bold text-gray-800 mb-4">Peak Delivery Times</h3>
                          <div className="space-y-3">
                            {analytics.orders.peakTimes.map((t, i) => {
                              const max = analytics.orders.peakTimes[0]?.count || 1;
                              const pct = ((t.count / max) * 100).toFixed(0);
                              return (
                                <div key={t._id || i}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{t._id}</span>
                                    <span className="font-bold text-gray-800">{t.count} orders</span>
                                  </div>
                                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${
                                      i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : 'bg-gray-400'
                                    }`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                            {analytics.orders.peakTimes.length === 0 && (
                              <p className="text-center text-gray-400 py-4 text-sm">No data yet</p>
                            )}
                          </div>
                        </div>

                      </>
                    ) : (
                      <div className="text-center py-20">
                        <FaChartBar className="text-gray-300 text-5xl mx-auto mb-3" />
                        <p className="text-gray-400">No analytics data available yet</p>
                        <button onClick={() => fetchAnalytics(analyticsPeriod)}
                          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700">
                          Load Analytics
                        </button>
                      </div>
                    )}
                  </div>
                )}
                

                
              </div>
            </div>
          </div>

          {/* Right: Fleet Sidebar */}
          <div className="hidden xl:block w-80 shrink-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {[
                  { id:'health',      icon:'🔧', label:'Fleet' },
                  { id:'incidents',   icon:'⚠️', label:'Incidents' },
                  { id:'earnings',    icon:'💰', label:'Earnings' },
                  { id:'leaderboard', icon:'🏆', label:'Top' },
                  { id:'shifts',      icon:'⏱️', label:'Shifts' },
                ].map(t=>(
                  <button key={t.id} onClick={() => setFleetTab(t.id)}
                    className={`flex-1 py-3 text-xs font-semibold whitespace-nowrap flex flex-col items-center gap-0.5 border-b-2 transition-colors ${fleetTab===t.id?'border-green-600 text-green-600':'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    <span className="text-base leading-none">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {fleetTab==='health' && (
                  <div className="space-y-3">
                    {drivers.filter(d=>d.status==='active').map(d=>(
                      <div key={d._id||d.id} className="bg-white rounded-xl p-4 border-l-4 shadow-sm border-green-400">
                        <div className="flex justify-between items-center mb-3">
                          <div><p className="font-bold text-gray-800 text-sm">{d.tankerId}</p><p className="text-xs text-gray-500">{d.firstName} {d.lastName}</p></div>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Active</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                          {[['Fuel',68,'green'],['Engine',90,'green']].map(([lbl,val,col])=>(
                            <div key={lbl} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-16">{lbl}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-${col}-500 rounded-full`} style={{width:`${val}%`}}/>
                              </div>
                              <span className={`text-xs font-bold w-7 text-right text-${col}-600`}>{val}%</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Next service: {new Date().toLocaleDateString()}</p>
                      </div>
                    ))}
                    {drivers.filter(d=>d.status==='active').length===0 && <p className="text-center text-gray-400 py-6 text-sm">No active drivers</p>}
                  </div>
                )}
                {fleetTab==='incidents' && <p className="text-center text-gray-500 py-8">No incidents reported</p>}
                {fleetTab==='earnings' && (
                  <div>
                    <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-4 text-white mb-4">
                      <p className="text-xs text-green-100">Total Disbursed (Month)</p>
                      <p className="text-3xl font-black mt-1">₦{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-green-100 text-xs mt-1">{drivers.length} drivers</p>
                    </div>
                    <button className="w-full mt-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
                      <FaDownload size={12}/> Export Payroll
                    </button>
                  </div>
                )}
                {fleetTab==='leaderboard' && (
                  <div className="space-y-2.5">
                    {[...drivers].sort((a,b)=>b.rating-a.rating).map((d,i)=>(
                      <div key={d._id||d.id} className="flex items-center gap-3 p-3.5 rounded-xl border bg-white border-gray-100">
                        <span className="text-xl w-8 shrink-0 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{d.firstName} {d.lastName}</p>
                          <p className="text-xs text-gray-500">{d.tankerId} · {d.totalDeliveries} deliveries</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 justify-end"><FaStar className="text-yellow-400 text-sm"/><span className="font-black text-gray-800">{d.rating}</span></div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${d.online?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{d.online?'Online':'Offline'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {fleetTab==='shifts' && (
                  <div className="space-y-2.5">
                    {drivers.map(d=>(
                      <div key={d._id||d.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {d.firstName?.charAt(0)}{d.lastName?.charAt(0)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${d.online?'bg-green-500':'bg-gray-300'}`}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{d.firstName} {d.lastName}</p>
                          <p className="text-xs text-gray-500">{d.tankerId}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${d.online?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                          {d.online?'Active':'Off Shift'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fleet Panel */}
        <div className="xl:hidden mt-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {[
                { id:'health',      icon:'🔧', label:'Fleet Health' },
                { id:'incidents',   icon:'⚠️', label:'Incidents' },
                { id:'earnings',    icon:'💰', label:'Earnings' },
                { id:'leaderboard', icon:'🏆', label:'Leaderboard' },
                { id:'shifts',      icon:'⏱️', label:'Shifts' },
              ].map(t=>(
                <button key={t.id} onClick={() => setFleetTab(t.id)}
                  className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${fleetTab===t.id?'border-green-600 text-green-600':'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {fleetTab==='health' && (
                <div className="space-y-3">
                  {drivers.filter(d=>d.status==='active').map(d=>(
                    <div key={d._id||d.id} className="bg-white rounded-xl p-4 border-l-4 shadow-sm border-green-400">
                      <div className="flex justify-between items-center mb-2">
                        <div><p className="font-bold text-gray-800 text-sm">{d.tankerId}</p><p className="text-xs text-gray-500">{d.firstName} {d.lastName}</p></div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Good</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16">Fuel</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{width:'68%'}}/></div>
                        <span className="text-xs font-bold w-7 text-right text-green-600">68%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {fleetTab==='incidents' && <p className="text-center text-gray-500 py-8">No incidents reported</p>}
              {fleetTab==='earnings' && (
                <div>
                  <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-4 text-white mb-4">
                    <p className="text-xs text-green-100">Total Disbursed</p>
                    <p className="text-3xl font-black mt-1">₦{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <button className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Export Payroll</button>
                </div>
              )}
              {fleetTab==='leaderboard' && (
                <div className="space-y-2.5">
                  {[...drivers].sort((a,b)=>b.rating-a.rating).slice(0,3).map((d,i)=>(
                    <div key={d._id||d.id} className="flex items-center gap-3 p-3.5 rounded-xl border bg-white border-gray-100">
                      <span className="text-xl w-8 shrink-0 text-center">{i===0?'🥇':i===1?'🥈':'🥉'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{d.firstName} {d.lastName}</p>
                        <p className="text-xs text-gray-500">{d.tankerId}</p>
                      </div>
                      <div className="flex items-center gap-1"><FaStar className="text-yellow-400 text-sm"/><span className="font-black text-gray-800">{d.rating}</span></div>
                    </div>
                  ))}
                </div>
              )}
              {fleetTab==='shifts' && (
                <div className="space-y-2.5">
                  {drivers.slice(0,3).map(d=>(
                    <div key={d._id||d.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {d.firstName?.charAt(0)}{d.lastName?.charAt(0)}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${d.online?'bg-green-500':'bg-gray-300'}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{d.firstName} {d.lastName}</p>
                        <p className="text-xs text-gray-500">{d.tankerId}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${d.online?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                        {d.online?'Active':'Off'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Order Detail Modal */}
      {showOrderModal && selOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Order Details — {(selOrder._id||selOrder.id)?.slice(-6).toUpperCase()||'N/A'}</h3>
                <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
              </div>
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${sb(selOrder.status)}`}>{selOrder.status||'N/A'}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${PRI_BADGE[selOrder.priority]||'bg-gray-100 text-gray-600'}`}>{selOrder.priority||'normal'} priority</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div><p className="text-xs text-gray-500">STUDENT</p><p className="text-sm font-semibold text-gray-800">{selOrder.user?.email||selOrder.studentName||'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">LOCATION</p><p className="text-sm text-gray-700">{selOrder.location||'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">AMOUNT</p><p className="text-sm font-semibold">{selOrder.amount||0}L</p></div>
                <div><p className="text-xs text-gray-500">SCHEDULED</p><p className="text-sm">{selOrder.scheduledDate?new Date(selOrder.scheduledDate).toLocaleDateString():'N/A'} {selOrder.scheduledTime||''}</p></div>
                <div><p className="text-xs text-gray-500">PAYMENT</p><p className="text-sm">{selOrder.paymentStatus||'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">AMOUNT PAID</p><p className="text-sm font-bold text-green-600">₦{(selOrder.amountPaid||0).toLocaleString()}</p></div>
              </div>
              {selOrder.notes && <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-sm text-amber-800">📋 {selOrder.notes}</div>}
              {selOrder.status!=='cancelled'&&selOrder.status!=='completed' && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">ASSIGN DRIVER</p>
                  <select defaultValue={selOrder.assignedDriver||''} onChange={e => { if(e.target.value){assignDriver(selOrder._id||selOrder.id,e.target.value);setShowOrderModal(false);}}}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select driver…</option>
                    {drivers.filter(d=>d.status==='active'&&d.online).map(d=>(
                      <option key={d._id||d.id} value={d._id||d.id}>{d.firstName} {d.lastName} — {d.tankerId} (⭐ {d.rating})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                {selOrder.status==='pending' && (
                  <>
                    <button onClick={() => {approveOrder(selOrder._id||selOrder.id);setShowOrderModal(false);}} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm">Approve</button>
                    <button onClick={() => {rejectOrder(selOrder._id||selOrder.id);setShowOrderModal(false);}} className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold text-sm flex items-center gap-1.5">
                      <FaBan size={12}/> Cancel Request
                    </button>
                  </>
                )}
                {(selOrder.status==='approved'||selOrder.status==='in-progress') && (
                  <button onClick={() => {rejectOrder(selOrder._id||selOrder.id);setShowOrderModal(false);}} className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold text-sm flex items-center gap-1.5">
                    <FaBan size={12}/> Cancel Request
                  </button>
                )}
                <button onClick={() => setShowOrderModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800">Add New Driver</h3>
              <button onClick={() => setShowAddDriver(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.target);addDriver({firstName:fd.get('firstName'),lastName:fd.get('lastName'),email:fd.get('email'),phone:fd.get('phone'),licenseNumber:fd.get('licenseNumber'),tankerId:fd.get('tankerId'),vehicleType:fd.get('vehicleType'),emergencyContact:fd.get('emergencyContact'),address:fd.get('address')});}} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">FIRST NAME</label><input name="firstName" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">LAST NAME</label><input name="lastName" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">EMAIL</label><input name="email" type="email" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">PHONE</label><input name="phone" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">LICENSE NUMBER</label><input name="licenseNumber" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">TANKER ID</label><input name="tankerId" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">VEHICLE TYPE</label>
                <select name="vehicleType" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500">
                  {['5,000L Tanker','8,000L Tanker','10,000L Tanker','15,000L Tanker'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">EMERGENCY CONTACT</label><input name="emergencyContact" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">ADDRESS</label><input name="address" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddDriver(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Add Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800">Add New Student</h3>
              <button onClick={() => setShowAddStudent(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.target);addStudent({firstName:fd.get('firstName'),lastName:fd.get('lastName'),email:fd.get('email'),phone:fd.get('phone'),matricNumber:fd.get('matricNumber'),department:fd.get('department'),level:fd.get('level'),hall:fd.get('hall'),roomNumber:fd.get('roomNumber'),plan:fd.get('plan')});}} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">FIRST NAME</label><input name="firstName" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">LAST NAME</label><input name="lastName" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">EMAIL</label><input name="email" type="email" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">PHONE</label><input name="phone" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">MATRIC NUMBER</label><input name="matricNumber" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">DEPARTMENT</label><input name="department" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">LEVEL</label>
                  <select name="level" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500">
                    {['100','200','300','400','500'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">PLAN</label>
                  <select name="plan" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500">
                    {['Basic','Standard','Premium'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">HALL</label><input name="hall" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">ROOM NUMBER</label><input name="roomNumber" required className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500"/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;