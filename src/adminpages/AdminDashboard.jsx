import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
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
  FaBolt, FaSpinner, FaIdCard, FaCar, FaShieldAlt, FaBars,
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

const API_URL = import.meta.env.VITE_API_URL || 'https://plasu-hydrotrack-backend.onrender.com/api';

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
//  DRIVER DETAIL MODAL (unchanged, kept for completeness)
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
//  ADMIN SETTINGS MODAL (unchanged, kept for completeness)
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
  baseRatePerLiter:   100,
  bonusPerDelivery:   200,
  tipAverage:         50,
  commissionPercent:  15,
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
           console.log('💰 Settings from API:', s.price500L, s.price1000L, s.price1500L);
          setCfg(prev => ({ ...prev, ...s }));
          
          setPricing({
            price500L:  s.price500L  || 5000,
            price1000L: s.price1000L || 9000,
            price1500L: s.price1500L || 12000,
          });

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
//  BROADCAST MODAL (unchanged)
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
//  QUICK ASSIGN MODAL (unchanged)
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
//  MAIN ADMIN DASHBOARD (UPDATED)
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

  // Withdrawal state
  const [withdrawals, setWithdrawals]               = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter]     = useState('pending');
  const [rejectNote, setRejectNote]                 = useState('');
  const [showRejectModal, setShowRejectModal]       = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const [liveDriverLocations, setLiveDriverLocations] = useState({});
  const socketRef = useRef(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://plasu-hydrotrack-backend.onrender.com';

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

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics(analyticsPeriod);
    }
  }, [activeTab, analyticsPeriod, fetchAnalytics]);

  // Socket.io
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('🔌 Admin socket connected');
      socketRef.current.emit('admin:joinTracking');
    });

    socketRef.current.on('driver:locationUpdate', (data) => {
      const { driverId, lat, lng, locationName, timestamp } = data;
      setLiveDriverLocations(prev => ({
        ...prev,
        [driverId]: { lat, lng, locationName, timestamp }
      }));
      setDrivers(prev => prev.map(d =>
        (d._id || d.id) === driverId
          ? { ...d, currentLocation: locationName, currentLat: lat, currentLng: lng }
          : d
      ));
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Admin socket disconnected');
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Withdrawal functions
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

      // Changed from /water-requests/admin/all to /admin/orders
      const [ordersRes, driversRes, studentsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/drivers`,       { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/students`,      { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (ordersRes.data.success) {
        const data = ordersRes.data.orders; // assuming backend returns { orders: [...] }
        setOrders(data);
        // Update stats based on real order statuses: preparing, on-the-way, etc.
        const pending = data.filter(o => o.orderStatus === 'preparing' || o.orderStatus === 'pending');
        const completed = data.filter(o => o.orderStatus === 'delivered');
        const totalRevenue = data.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0);
        const totalWater = completed.reduce((s, o) => s + o.items.reduce((sum, item) => sum + item.quantity, 0), 0);
        setStats(prev => ({
          ...prev,
          totalOrders: data.length,
          pendingOrders: pending.length,
          completedOrders: completed.length,
          totalRevenue,
          totalWater
        }));
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

  // DRIVER ACTIONS (unchanged)
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

  // ORDER ACTIONS (updated endpoints to admin/orders)
  const approveOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      // Assuming backend has PUT /admin/orders/:orderId/status with body { status }
      const res = await axios.put(`${API_URL}/admin/orders/${orderId}/status`, { status: 'preparing' }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, orderStatus: 'preparing' } : o));
        addToast('success', `Order ${orderId.slice(-6)} approved`);
        setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
      }
    } catch (err) { addToast('error', 'Failed to approve order', err.response?.data?.message); }
  };

  const rejectOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/admin/orders/${orderId}/status`, { status: 'cancelled' }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, orderStatus: 'cancelled' } : o));
        addToast('warn', `Order ${orderId.slice(-6)} cancelled`);
        setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
      }
    } catch (err) { addToast('error', 'Failed to cancel order', err.response?.data?.message); }
  };

  const assignDriver = async (orderId, driverId) => {
    try {
      const token = localStorage.getItem('token');
      const driver = drivers.find(d => (d._id || d.id) === driverId);
      // Assuming a separate endpoint for assigning driver; using same status endpoint with driver field.
      const res = await axios.put(`${API_URL}/admin/orders/${orderId}/status`, {
        status: 'on-the-way', // or 'preparing' depending on flow
        driver: driverId,
        tanker: driver?.tankerId
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setOrders(prev => prev.map(o => (o._id === orderId || o.id === orderId) ? { ...o, orderStatus: 'on-the-way', assignedDriver: driverId } : o));
        addToast('success', `Driver ${driver?.firstName} assigned`);
        setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
      }
    } catch (err) {
      addToast('error', 'Failed to assign driver', err.response?.data?.message);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API_URL}/admin/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const was = orders.find(o => o._id === orderId || o.id === orderId);
        setOrders(prev => prev.filter(o => o._id !== orderId && o.id !== orderId));
        addToast('success', 'Order deleted successfully');
        if (was?.orderStatus === 'preparing' || was?.orderStatus === 'pending') setStats(prev => ({ ...prev, pendingOrders: prev.pendingOrders - 1 }));
      }
    } catch (err) { addToast('error', 'Failed to delete order', err.response?.data?.message); }
    setConfirmDel({ show: false, id: null, type: null });
  };

  // STUDENT ACTIONS (unchanged)
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

  // UPDATED: filteredOrders now uses real order fields
  const filteredOrders = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    // Search in user email or order ID
    const m = o.user?.email?.toLowerCase().includes(q) || o._id?.toLowerCase().includes(q);
    return m && (filterStatus === 'all' || o.orderStatus === filterStatus);
  }).sort((a, b) => {
    // Sort by newest first (createdAt)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pendingDriverCount = drivers.filter(d => d.status === 'pending').length;

  const STATUS_BADGE = {
    pending:     'bg-yellow-100 text-yellow-700',
    preparing:   'bg-blue-100 text-blue-700',
    'on-the-way':'bg-purple-100 text-purple-700',
    delivered:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-700',
    active:      'bg-green-100 text-green-700',
    inactive:    'bg-gray-100 text-gray-600',
    'on-leave':  'bg-orange-100 text-orange-700',
    suspended:   'bg-red-100 text-red-700',
    offline:     'bg-gray-100 text-gray-600'
  };
  const PRI_BADGE = { high:'bg-red-100 text-red-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-green-100 text-green-700' };
  const sb = s => STATUS_BADGE[s] || 'bg-gray-100 text-gray-600';

  // Chart data (unchanged sample data)
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
    labels: ['Pending','Preparing','On The Way','Delivered','Cancelled'],
    datasets: [{
      data: [
        orders.filter(o=>o.orderStatus==='pending' || o.orderStatus==='preparing').length,
        orders.filter(o=>o.orderStatus==='preparing').length,
        orders.filter(o=>o.orderStatus==='on-the-way').length,
        orders.filter(o=>o.orderStatus==='delivered').length,
        orders.filter(o=>o.orderStatus==='cancelled').length,
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

  const driverLocations = drivers.map(d => {
  const live = liveDriverLocations[d._id || d.id];
  return {
    id:           d._id || d.id,
    name:         `${d.firstName} ${d.lastName}`,
    position:     live ? [live.lat, live.lng] : [9.3265+(Math.random()-0.5)*0.02, 8.9947+(Math.random()-0.5)*0.02],
    locationName: live?.locationName || d.currentLocation || 'Location unknown',
    status:       d.online ? 'active' : 'offline',
    tankerId:     d.tankerId,
    isLive:       !!live,
    lastUpdate:   live ? new Date(live.timestamp).toLocaleTimeString() : 'No data',
  };
});

 const fetchIncidents = useCallback(async () => {
  try {
    setIncidentsLoading(true);
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/drivers/admin/incidents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      setIncidents(res.data.data || []);
    }
  } catch (err) {
    addToast('error', 'Failed to load incidents', err.response?.data?.message);
  } finally {
    setIncidentsLoading(false);
  }
}, [addToast]);

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
        {/* ... same header as before ... */}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner (unchanged) */}
        {/* Filters (unchanged) */}
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
                {/* OVERVIEW TAB - keep existing */}
                {/* ... same as original ... */}

                {/* ORDERS TAB - UPDATED */}
                {activeTab === 'orders' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-gray-800">Order Management</h3>
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                        className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        {['all','pending','preparing','on-the-way','delivered','cancelled'].map(s=>(
                          <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Order','Student & Address','Quantity','Date/Time','Status','Actions'].map(h=>(
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredOrders.map(o=>{
                            // Compute address from user fields
                            const addressParts = [];
                            if (o.user?.hallName) addressParts.push(o.user.hallName);
                            if (o.user?.roomNumber) addressParts.push(`Room ${o.user.roomNumber}`);
                            const address = addressParts.length > 0 ? addressParts.join(', ') : (o.user?.deliveryAddress || o.deliveryAddress || 'No address');
                            return (
                              <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-bold text-gray-700">{o._id?.slice(-6).toUpperCase()}</td>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-semibold text-gray-800">{o.user?.name || o.user?.email || 'Guest'}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{address}</p>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold">
                                  {o.items?.reduce((sum, item) => sum + item.quantity, 0) || '-'} L
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                  {new Date(o.createdAt).toLocaleDateString()}<br/>
                                  <span className="text-xs text-gray-400">
                                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sb(o.orderStatus)}`}>{o.orderStatus}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1.5">
                                    <button onClick={() => { setSelOrder(o); setShowOrderModal(true); }}
                                      className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center" title="View">
                                      <FaEye size={11} />
                                    </button>
                                    {o.orderStatus === 'preparing' && (
                                      <>
                                        <button onClick={() => { setAssignOrder(o); setShowAssign(true); }}
                                          className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center justify-center" title="Quick Assign">
                                          <FaBolt size={10} />
                                        </button>
                                        <button onClick={() => rejectOrder(o._id)}
                                          className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center" title="Cancel">
                                          <FaBan size={10} />
                                        </button>
                                      </>
                                    )}
                                    {o.orderStatus === 'on-the-way' && (
                                      <button onClick={() => rejectOrder(o._id)}
                                        className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 flex items-center justify-center" title="Cancel">
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
                            );
                          })}
                          {filteredOrders.length===0 && (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* STUDENTS TAB - unchanged */}
                {/* ... rest of the tabs unchanged ... */}

                {/* Order Detail Modal - UPDATED */}
                {showOrderModal && selOrder && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-gray-800">Order Details — {(selOrder._id||selOrder.id)?.slice(-6).toUpperCase()||'N/A'}</h3>
                          <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
                        </div>
                        <div className="flex gap-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${sb(selOrder.orderStatus)}`}>{selOrder.orderStatus||'N/A'}</span>
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">Order</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div><p className="text-xs text-gray-500">STUDENT</p><p className="text-sm font-semibold text-gray-800">{selOrder.user?.name || selOrder.user?.email || 'Guest'}</p></div>
                          <div><p className="text-xs text-gray-500">ADDRESS</p><p className="text-sm text-gray-700">
                            {selOrder.user?.hallName && selOrder.user?.roomNumber 
                              ? `${selOrder.user.hallName}, Room ${selOrder.user.roomNumber}`
                              : selOrder.user?.deliveryAddress || selOrder.deliveryAddress || 'N/A'}
                          </p></div>
                          <div><p className="text-xs text-gray-500">QUANTITY</p><p className="text-sm font-semibold">{selOrder.items?.reduce((s,i)=>s+i.quantity,0)||0}L</p></div>
                          <div><p className="text-xs text-gray-500">ORDERED</p><p className="text-sm">{new Date(selOrder.createdAt).toLocaleString()}</p></div>
                          <div><p className="text-xs text-gray-500">PAYMENT</p><p className="text-sm">{selOrder.paymentStatus||'N/A'}</p></div>
                          <div><p className="text-xs text-gray-500">AMOUNT PAID</p><p className="text-sm font-bold text-green-600">₦{(selOrder.total||0).toLocaleString()}</p></div>
                        </div>
                        {selOrder.notes && <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-sm text-amber-800">📋 {selOrder.notes}</div>}
                        {selOrder.orderStatus!=='cancelled'&&selOrder.orderStatus!=='delivered' && (
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
                          {selOrder.orderStatus==='preparing' && (
                            <>
                              <button onClick={() => {rejectOrder(selOrder._id||selOrder.id);setShowOrderModal(false);}} className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-semibold text-sm flex items-center gap-1.5">
                                <FaBan size={12}/> Cancel
                              </button>
                            </>
                          )}
                          <button onClick={() => setShowOrderModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium">Close</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Driver Modal (unchanged) */}
                {/* Add Student Modal (unchanged) */}
              </div>
            </div>
          </div>

          {/* Right: Fleet Sidebar (unchanged) */}
          {/* ... same as original ... */}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;