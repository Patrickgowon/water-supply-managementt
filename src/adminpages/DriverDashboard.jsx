// src/pages/DriverDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  FaTruck, FaRoute, FaMapMarkedAlt, FaBell, FaClock,
  FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt, FaPhone,
  FaEnvelope, FaTachometerAlt, FaOilCan, FaWrench,
  FaPlay, FaPause, FaStop, FaCheck, FaTimes, FaCog,
  FaStar, FaChartBar, FaMoneyBillWave, FaExclamationTriangle,
  FaCamera, FaSignature, FaToggleOn, FaToggleOff,
  FaGasPump, FaThumbsUp, FaHistory, FaChevronRight,
  FaBolt, FaShieldAlt, FaTools, FaHeadset, FaKey, FaSpinner,FaBars,FaSignOutAlt,
  FaTrashAlt
} from 'react-icons/fa';
import { MdOutlineWaterDrop, MdSpeed, MdDirections, MdWarning } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── TOAST ─────────────────────────────────────────────────────────────────
const Toast = ({ toasts, remove }) => (
  <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id}
        style={{ animation: 'slideInRight .35s cubic-bezier(.22,.68,0,1.2)' }}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium min-w-[270px] max-w-sm pointer-events-auto
          ${t.type==='success'?'bg-gradient-to-r from-green-500 to-emerald-600':
            t.type==='error'  ?'bg-gradient-to-r from-red-500 to-rose-600':
            t.type==='warn'   ?'bg-gradient-to-r from-yellow-500 to-orange-500':
                               'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
        <span className="text-xl mt-0.5 shrink-0">
          {t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warn'?'⚠️':'ℹ️'}
        </span>
        <div className="flex-1"><p>{t.message}</p>{t.sub&&<p className="text-xs opacity-80 mt-0.5">{t.sub}</p>}</div>
        <button onClick={()=>remove(t.id)} className="opacity-70 hover:opacity-100 shrink-0">✕</button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type, message, sub='', ms=5000) => {
    const id = Date.now()+Math.random();
    setToasts(p=>[...p,{id,type,message,sub}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), ms);
  }, []);
  const remove = useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)), []);
  return {toasts, add, remove};
};

// ─── SHIFT TIMER ────────────────────────────────────────────────────────────
const useShiftTimer = (running) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(()=>setSecs(s=>s+1), 1000);
    return ()=>clearInterval(id);
  }, [running]);
  const fmt = s => {
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'00')}`;
  };
  return fmt(secs);
};

// ─── NOTIFICATIONS PANEL ─────────────────────────────────────────────────────
const NotificationsPanel = ({ show, onClose, notifications, onMarkRead, onClearAll }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    if (show) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show, onClose]);

  if (!show) return null;

  const getIcon = (type) => {
    if (type === 'success')                      return '✅';
    if (type === 'warning' || type === 'alert')  return '⚠️';
    if (type === 'error')                        return '❌';
    if (type === 'delivery')                     return '🚚';
    if (type === 'system')                       return '⚙️';
    if (type === 'payment')                      return '💰';
    if (type === 'broadcast')                    return '📢';
    if (type === 'maintenance')                  return '🔧';
    return 'ℹ️';
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden transition-opacity duration-300
          ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Notifications Panel */}
      <div 
        ref={ref}
        className={`fixed 
          inset-y-0 left-0 mt-7
          sm:inset-y-auto sm:left-auto sm:top-12 sm:right-4
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
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button onClick={onMarkRead}
                className="text-xs text-green-600 hover:text-green-700 font-medium">
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={onClearAll}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <FaTrashAlt size={9} /> Clear
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
              <button onClick={onMarkRead}
                className="text-xs text-green-600 hover:text-green-700 font-medium">
                Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={onClearAll}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <FaTrashAlt size={9} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* List - using h-full for mobile percentage height */}
        <div className="h-full sm:max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 sm:py-8 text-center">
              <FaBell className="text-gray-300 text-4xl sm:text-3xl mx-auto mb-3 sm:mb-2" />
              <p className="text-sm text-gray-400">No notifications</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={n._id || n.id || i}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors
                  ${!n.read ? 'bg-blue-50/40' : ''}`}>
                <span className="text-lg sm:text-base shrink-0 mt-0.5">{getIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-xs text-gray-800 ${!n.read ? 'font-bold' : 'font-semibold'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs sm:text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] sm:text-[10px] text-gray-400 mt-1.5 sm:mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                  </p>
                </div>
                {!n.read && <span className="w-2.5 h-2.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

// ─── SIGNATURE CANVAS ────────────────────────────────────────────────────────
const SignatureCanvas = ({ onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };
  const start = e => { setDrawing(true); const c=canvasRef.current; const ctx=c.getContext('2d'); const p=getPos(e,c); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const draw  = e => { if(!drawing)return; const c=canvasRef.current; const ctx=c.getContext('2d'); const p=getPos(e,c); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.stroke(); setHasSig(true); };
  const end   = () => setDrawing(false);
  const clear = () => { const c=canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); setHasSig(false); };
  const save  = () => { onSave(canvasRef.current.toDataURL()); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">✍️ Capture Signature</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-3">Ask recipient to sign below to confirm delivery</p>
        <canvas ref={canvasRef} width={400} height={160}
          className="border-2 border-dashed border-gray-300 rounded-xl w-full bg-gray-50 touch-none cursor-crosshair"
          onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={clear} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">Clear</button>
          <button onClick={save} disabled={!hasSig}
            className="flex-1 py-2 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── INCIDENT MODAL ─────────────────────────────────────────────────────────
const IncidentModal = ({ onClose, onSubmit }) => {
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');
  const TYPES = [
    { id: 'breakdown', label: '🔧 Vehicle Breakdown' },
    { id: 'accident',  label: '💥 Road Accident'     },
    { id: 'flat',      label: '🚗 Flat Tyre'          },
    { id: 'fuel',      label: '⛽ Out of Fuel'        },
    { id: 'delay',     label: '⏳ Traffic Delay'      },
    { id: 'other',     label: '📋 Other'              },
  ];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">⚠️ Report Incident</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Select incident type and describe what happened</p>
        <div className="grid gap-2 mb-4">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all
                ${type===t.id ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-100 hover:border-gray-300 text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4}
          placeholder="Describe the incident in detail…"
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-4" />
        <div className="bg-red-50 rounded-xl p-3 mb-4 flex gap-2 text-xs text-red-700">
          <FaExclamationTriangle className="shrink-0 mt-0.5" />
          <span>In case of emergency, call <strong>112</strong> first, then notify dispatch.</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button>
          <button onClick={() => onSubmit(type, desc)} disabled={!type||!desc}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-40">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS MODAL ─────────────────────────────────────────────────────────
const SettingsModal = ({ show, onClose, settings, setSettings, addToast, onSave }) => {
  if (!show) return null;
  const toggle = (k) => setSettings(p=>({...p,[k]:!p[k]}));
  const handleSave = () => { if (onSave) onSave(settings); onClose(); };
  const TogRow = ({label,sub,k}) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div><p className="text-sm font-medium text-gray-800">{label}</p>{sub&&<p className="text-xs text-gray-500 mt-0.5">{sub}</p>}</div>
      <button onClick={()=>toggle(k)} className="active:scale-90 transition-transform ml-4 shrink-0">
        {settings[k]?<FaToggleOn className="text-3xl text-green-500"/>:<FaToggleOff className="text-3xl text-gray-300"/>}
      </button>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800">⚙️ Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Notifications</p>
        <TogRow label="New Delivery Alerts"   sub="Notify when a job is assigned"     k="newDeliveryAlert" />
        <TogRow label="SMS Confirmation"      sub="Send SMS on delivery complete"      k="smsConfirm" />
        <TogRow label="Low Fuel Warning"      sub="Alert when fuel drops below 20%"    k="lowFuelWarn" />
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-4 mb-2">Availability</p>
        <TogRow label="Auto-Accept Jobs"      sub="Automatically accept nearby jobs"   k="autoAccept" />
        <TogRow label="Weekend Availability"  sub="Show as available on weekends"      k="weekends" />
        <TogRow label="Night Shift (8PM–6AM)" sub="Accept night delivery assignments"  k="nightShift" />
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-4 mb-2">Navigation</p>
        <TogRow label="Voice Navigation"      sub="Turn-by-turn voice instructions"   k="voiceNav" />
        <TogRow label="Traffic Alerts"        sub="Real-time traffic warnings"         k="trafficAlerts" />
        <button onClick={handleSave} className="mt-5 w-full py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 text-sm">Save & Close</button>
      </div>
    </div>
  );
};

// ─── PROFILE TAB COMPONENT ───────────────────────────────────────────────────
const ProfileTab = ({ driverInfo, perf, API_URL, addToast, fetchDriverData }) => {
  const [profileTab, setProfileTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: driverInfo.name.split(' ')[0] || '',
    lastName:  driverInfo.name.split(' ')[1] || '',
    phone:     driverInfo.phone || '',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    setForm({
      firstName: driverInfo.name.split(' ')[0] || '',
      lastName:  driverInfo.name.split(' ')[1] || '',
      phone:     driverInfo.phone || '',
    });
  }, [driverInfo.name, driverInfo.phone]);

  const handleProfileSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/driver/profile`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) { addToast('success', 'Profile updated successfully'); fetchDriverData(); }
    } catch (err) {
      addToast('error', 'Failed to update profile', err.response?.data?.message);
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) return addToast('error', 'New passwords do not match');
    if (pwForm.newPassword.length < 8) return addToast('error', 'Password must be at least 8 characters');
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/driver/change-password`, pwForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        addToast('success', 'Password changed successfully');
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast('error', 'Failed to change password', err.response?.data?.message);
    } finally { setSaving(false); }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 p-5 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl text-white">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
          {driverInfo.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-xl font-black">{driverInfo.name}</p>
          <p className="text-green-100 text-sm">{driverInfo.id} · {driverInfo.tanker}</p>
          <div className="flex items-center gap-1 mt-1">
            {[1,2,3,4,5].map(i => (
              <FaStar key={i} className={`text-xs ${i <= Math.floor(perf.rating) ? 'text-yellow-300' : 'text-white/30'}`} />
            ))}
            <span className="text-xs text-green-100 ml-1">{perf.rating} rating</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
        <div className="flex border-b border-gray-100">
          {[['info', '👤 Profile Info'], ['password', '🔑 Change Password']].map(([id, label]) => (
            <button key={id} onClick={() => setProfileTab(id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors
                ${profileTab === id ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {profileTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">First Name</label>
                  <input value={form.firstName} onChange={e => setForm(p => ({...p, firstName: e.target.value}))} className={inputClass} placeholder="First name" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Last Name</label>
                  <input value={form.lastName} onChange={e => setForm(p => ({...p, lastName: e.target.value}))} className={inputClass} placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Phone Number</label>
                <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className={inputClass} placeholder="Phone number" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
                <input value={driverInfo.email} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support.</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Tanker ID</label>
                <input value={driverInfo.tanker} disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
              </div>
              <button onClick={handleProfileSave} disabled={saving}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : '💾 Save Changes'}
              </button>
            </div>
          )}
          {profileTab === 'password' && (
            <div className="space-y-4">
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
                disabled={saving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><FaSpinner className="animate-spin" /> Changing...</> : '🔑 Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {[
          { icon: <FaPhone />,     label: 'Phone',           val: driverInfo.phone  },
          { icon: <FaEnvelope />,  label: 'Email',           val: driverInfo.email  },
          { icon: <FaTruck />,     label: 'Assigned Tanker', val: driverInfo.tanker },
          { icon: <FaKey />,       label: 'Driver ID',       val: driverInfo.id     },
          { icon: <FaShieldAlt />, label: 'License Exp',     val: 'Dec 2026'        },
        ].map(({ icon, label, val }) => (
          <div key={label} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="text-green-600 w-5 text-center shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold text-gray-800 text-sm truncate">{val}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => addToast('info', 'Support contacted', 'Our team will respond within 30 minutes.')}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 border border-blue-200 transition-colors">
        <FaHeadset /> Contact Support
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
const DriverDashboard = () => {
  const navigate = useNavigate();
  const {toasts, add: addToast, remove: removeToast} = useToast();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const [loading, setLoading]                         = useState(true);
  const [activeTab, setActiveTab]                     = useState('today');
  const [isOnline, setIsOnline]                       = useState(true);
  const [showRoute, setShowRoute]                     = useState(false);
  const [showSignature, setShowSignature]             = useState(false);
  const [showIncident, setShowIncident]               = useState(false);
  const [showSettings, setShowSettings]               = useState(false);
  const [showNotifications, setShowNotifications]     = useState(false);
  const [activeDeliveryId, setActiveDeliveryId]       = useState(null);
  const [shiftRunning, setShiftRunning]               = useState(true);
  const shiftTime = useShiftTimer(shiftRunning);

  const [driverInfo, setDriverInfo] = useState({
    name: '', id: '', tanker: '', phone: '', email: '', rating: 0, totalDeliveries: 0
  });

  const [settings, setSettings] = useState({
    newDeliveryAlert: true, smsConfirm: true, lowFuelWarn: true,
    autoAccept: false, weekends: false, nightShift: false,
    voiceNav: true, trafficAlerts: true,
  });

  const [vehicle, setVehicle] = useState({ fuel: 0, engine: 0, tyres: 0, oil: 0 });

  const [earnings, setEarnings] = useState({
    today: { total: 0, deliveries: 0, km: 0, base: 0, bonus: 0, tips: 0 },
    week:  { total: 0, deliveries: 0, km: 0, base: 0, bonus: 0, tips: 0 },
    month: { total: 0, deliveries: 0, km: 0, base: 0, bonus: 0, tips: 0 }
  });

  const [perf, setPerf]                           = useState({ rating: 0, onTime: 0, total: 0, incidents: 0, targetPct: 0 });
  const [deliveries, setDeliveries]               = useState([]);
  const [historyDeliveries, setHistoryDeliveries] = useState([]);
  const [notifications, setNotifications]         = useState([]);

  const [earningsPeriod, setEarningsPeriod] = useState('today');
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank]     = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawing, setWithdrawing]       = useState(false);
  const [commission, setCommission]         = useState({
    baseRatePerLiter:  100,
    bonusPerDelivery:  200,
    tipAverage:        50,
    commissionPercent: 15,
  });

  // ✅ NEW STATE for withdrawal functionality
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalWithdrawnAmount, setTotalWithdrawnAmount] = useState(0);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: null, lng: null, name: '' });
  const socketRef = useRef(null);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  // ─── Fetch withdrawal balance ──────────────────────────────────────────────
  const fetchWithdrawalBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/withdrawals/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAvailableBalance(res.data.data.availableBalance || 0);
        setTotalWithdrawnAmount(res.data.data.totalWithdrawn || 0);
        setWithdrawalHistory(res.data.data.withdrawals || []);
      }
    } catch (err) {
      console.error('Error fetching withdrawal balance:', err);
    }
  };

  // ─── Save settings ────────────────────────────────────────────────────────
  const saveSettings = async (newSettings) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/driver/settings`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) addToast('success', 'Settings saved successfully');
    } catch (err) {
      addToast('error', 'Failed to save settings', err.response?.data?.message);
    }
  };

  // ─── Mark all notifications as read ──────────────────────────────────────
  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      setNotifications(p => p.map(n => ({ ...n, read: true })));
      const unread = notifications.filter(n => !n.read);
      await Promise.all(
        unread.map(n =>
          axios.put(`${API_URL}/driver/notifications/${n._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {})
        )
      );
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  // ─── Clear all notifications ──────────────────────────────────────────────
  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/driver/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // ─── Fetch all driver data ────────────────────────────────────────────────
  const fetchDriverData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      const profileRes = await axios.get(`${API_URL}/driver/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileRes.data.success) {
        const driver = profileRes.data.data;
        setDriverInfo({
          name:            `${driver.firstName} ${driver.lastName}`,
          id:              driver._id?.slice(-6).toUpperCase() || driver.tankerId || 'DRV-001',
          tanker:          driver.tankerId || 'TKR-001',
          phone:           driver.phone,
          email:           driver.email,
          rating:          driver.rating || 0,
          totalDeliveries: driver.totalDeliveries || 0
        });
        setVehicle({
          fuel:   driver.vehicleHealth?.fuel   || 68,
          engine: driver.vehicleHealth?.engine || 88,
          tyres:  driver.vehicleHealth?.tyres  || 72,
          oil:    driver.vehicleHealth?.oil    || 55
        });
      }

      const settingsRes = await axios.get(`${API_URL}/driver/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (settingsRes.data.success) setSettings(settingsRes.data.data);

      console.log('🚀 Fetching today deliveries...');
      const deliveriesRes = await axios.get(`${API_URL}/driver/deliveries/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📦 Deliveries response:', deliveriesRes.data);
      console.log('📦 Deliveries data array:', deliveriesRes.data.data);
      console.log('📦 Number of deliveries:', deliveriesRes.data.data?.length || 0);
      
      if (deliveriesRes.data.success) {
        setDeliveries(deliveriesRes.data.data);
        const active = deliveriesRes.data.data.find(d => d.status === 'in-progress');
        if (active) setActiveDeliveryId(active.id || active._id);
      } else {
        console.log('❌ Deliveries response not successful:', deliveriesRes.data);
      }

      const historyRes = await axios.get(`${API_URL}/driver/deliveries/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (historyRes.data.success) setHistoryDeliveries(historyRes.data.data);

      const earningsRes = await axios.get(`${API_URL}/driver/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (earningsRes.data.success) {
        setEarnings(earningsRes.data.data);
        if (earningsRes.data.data.rates) {
          setCommission(prev => ({
            ...prev,
            baseRatePerLiter: earningsRes.data.data.rates.baseRatePerLiter,
            bonusPerDelivery: earningsRes.data.data.rates.bonusPerDelivery,
            tipAverage:       earningsRes.data.data.rates.tipAverage,
          }));
        }
      }

      const perfRes = await axios.get(`${API_URL}/driver/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (perfRes.data.success) setPerf(perfRes.data.data);

      try {
        console.log('🔔 Fetching notifications...');
        const notifRes = await axios.get(`${API_URL}/driver/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (notifRes.data.success) {
          console.log('🔔 Notifications count:', notifRes.data.data?.length || 0);
          setNotifications(notifRes.data.data || []);
        }
      } catch (notifErr) {
        console.error('Error fetching notifications:', notifErr);
      }

      try {
        const commissionRes = await axios.get(`${API_URL}/admin/pricing/public`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (commissionRes.data.success) {
          const c = commissionRes.data.data;
          setCommission(prev => ({
            ...prev,
            baseRatePerLiter:  c.baseRatePerLiter  || 100,
            bonusPerDelivery:  c.bonusPerDelivery  || 200,
            tipAverage:        c.tipAverage        || 50,
            commissionPercent: c.commissionPercent || 15,
          }));
        }
      } catch (err) {
        console.error('Error fetching commission:', err);
      }

      // ✅ Fetch withdrawal balance on initial load
      await fetchWithdrawalBalance();

    } catch (err) {
      console.error('Error fetching driver data:', err);
      addToast('error', 'Failed to load dashboard data', err.response?.data?.message);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDriverData(); }, []);

  
  

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_URL}/driver/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setNotifications(res.data.data || []);
      } catch (err) {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const updateLocation = async () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/driver/location`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }, { headers: { Authorization: `Bearer ${token}` } });
          } catch (err) { console.error('Error updating location:', err); }
        });
      }
    };
    updateLocation();
    const interval = setInterval(updateLocation, 30000);
    return () => clearInterval(interval);
  }, [isOnline]);
  

  const startDelivery = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/driver/deliveries/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDeliveries(deliveries.map(d => d.id === id || d._id === id ? { ...d, status: 'in-progress' } : d));
        setActiveDeliveryId(id);
        addToast('success', 'Delivery started!', 'Navigation is now active.');
      }
    } catch (err) { addToast('error', 'Failed to start delivery', err.response?.data?.message); }
  };

  const completeDelivery = (id) => { setActiveDeliveryId(id); setShowSignature(true); };

  const handleSignatureSave = async (signatureData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/driver/deliveries/${activeDeliveryId}/complete`,
        { signature: signatureData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setDeliveries(deliveries.map(d =>
          (d.id === activeDeliveryId || d._id === activeDeliveryId) ? { ...d, status: 'completed' } : d
        ));
        const next = deliveries.find(d => d.status === 'pending');
        setActiveDeliveryId(next ? (next.id || next._id) : null);
        setShowSignature(false);
        addToast('success', 'Delivery confirmed!', 'Signature captured. Receipt sent to recipient.');
        fetchDriverData();
      }
    } catch (err) { addToast('error', 'Failed to complete delivery', err.response?.data?.message); }
  };

  const handleIncidentSubmit = async (type, desc) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/driver/incidents`, { type, description: desc }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setShowIncident(false);
        addToast('warn', 'Incident reported', 'Dispatch has been notified. Stay safe!', 7000);
        setPerf(prev => ({ ...prev, incidents: prev.incidents + 1 }));
      }
    } catch (err) { addToast('error', 'Failed to report incident', err.response?.data?.message); }
  };

  const toggleOnline = async () => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = !isOnline;
      const res = await axios.put(`${API_URL}/driver/status`, { online: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsOnline(newStatus);
        setShiftRunning(newStatus);
        addToast(newStatus ? 'success' : 'info',
          newStatus ? 'You are now online and receiving jobs' : 'You are now offline');
      }
    } catch (err) { addToast('error', 'Failed to update status', err.response?.data?.message); }
  };

  const completedToday = deliveries.filter(d => d.status === 'completed').length;
  const pendingToday   = deliveries.filter(d => d.status === 'pending').length;
  const totalWater     = deliveries.filter(d => d.status === 'completed').reduce((a, d) => a + (d.amount || 0), 0);
  const activeDelivery = deliveries.find(d => (d.id === activeDeliveryId || d._id === activeDeliveryId) && d.status === 'in-progress');
  const unreadCount    = notifications.filter(n => !n.read).length;

  const TABS = [
    { id: 'today',    label: 'Today'    },
    { id: 'map',      label: 'Live Map' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'history',  label: 'History'  },
    { id: 'profile',  label: 'Profile'  },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-green-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <style>{`
        @keyframes slideInRight { from{opacity:0;transform:translateX(110%)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-ring   { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />
      {showSignature && <SignatureCanvas onSave={handleSignatureSave} onClose={() => setShowSignature(false)} />}
      {showIncident  && <IncidentModal onClose={() => setShowIncident(false)} onSubmit={handleIncidentSubmit} />}
      <SettingsModal
        show={showSettings} onClose={() => setShowSettings(false)}
        settings={settings} setSettings={setSettings}
        addToast={addToast} onSave={saveSettings}
      />

   
<header className="bg-white shadow-md sticky top-0 z-40">
<div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
    <div className="flex justify-between items-center">
      
      {/* Left: Logo and Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
          <FaTruck className="text-base sm:text-xl text-white" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 leading-none">
            Driver Dashboard
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
            Shift: <span className="font-mono font-semibold text-green-600">{shiftTime}</span>
          </p>
        </div>
      </div>
      {/* Right: Desktop Actions (hidden on mobile) */}
      <div className="hidden sm:flex items-center gap-2">
        <button onClick={() => setShowIncident(true)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
          <FaExclamationTriangle size={11} /> Report Incident
        </button>

        <button onClick={toggleOnline}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border transition-all
            ${isOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(p => !p)}
            className="relative w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
            <FaBell className="text-gray-500 text-xs sm:text-sm" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white text-[9px] sm:text-[10px] rounded-full flex items-center justify-center font-bold">
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
        

        <button onClick={() => setShowSettings(true)}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
          <FaCog className="text-gray-500 text-xs sm:text-sm" />
        </button>

        <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
          {driverInfo.name.split(' ').map(n => n[0]).join('')}
        </div>
        
      </div>

      {/* Mobile: Hamburger Menu Button + Profile */}
      <div className="flex sm:hidden items-center gap-2">
        {/* Notification Bell - Mobile */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(p => !p)}
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

        {/* Profile Avatar */}
        <div className="h-8 w-8 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-xs">
          {driverInfo.name.split(' ').map(n => n[0]).join('')}
        </div>

        {/* Hamburger Button */}
        
        <button
          onClick={() => setShowMobileMenu(true)}
          className="w-8 h-8 bg-gray-100 hover:bg-green-100 rounded-lg items-center justify-center transition-colors"
          style={{ display: 'none' }}
          ref={el => {
            if (el) {
              const mediaQuery = window.matchMedia('(max-width: 639px)');
              el.style.display = mediaQuery.matches ? 'flex' : 'none';
              mediaQuery.addEventListener('change', (e) => {
                el.style.display = e.matches ? 'flex' : 'none';
              });
            }
          }}>
          <FaBars className="text-gray-600 text-sm" />
        </button>
        <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-medium transition-colors"
            style={{ display: 'none' }}
            ref={el => {
              if (el) {
                const mediaQuery = window.matchMedia('(min-width: 640px)');
                el.style.display = mediaQuery.matches ? 'flex' : 'none';
                mediaQuery.addEventListener('change', (e) => {
                  el.style.display = e.matches ? 'flex' : 'none';
                });
              }
            }}>
            <FaSignOutAlt size={11} /> Logout
      </button>
      </div>
    </div>
  </div>

  {/* Mobile Slide-out Menu Overlay */}
  {showMobileMenu && (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 sm:hidden"
      onClick={() => setShowMobileMenu(false)}
    />
  )}

  {/* Mobile Slide-out Menu - Slides from RIGHT */}
{/* Mobile Slide-out Menu - Slides from LEFT */}
<div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out sm:hidden
  ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
  
  {/* Menu Header */}
  <div className="flex items-center justify-between p-4 border-b border-gray-100">
    <h3 className="font-bold text-gray-800">Menu</h3>
    <button
      onClick={() => setShowMobileMenu(false)}
      className="w-8 h-8 bg-gray-100 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors">
      <FaTimes className="text-gray-600 text-sm" />
    </button>
  </div>

  {/* Menu Items */}
  <div className="p-4 space-y-3">
    {/* Online/Offline Toggle */}
    <button 
      onClick={() => {
        toggleOnline();
        setShowMobileMenu(false);
      }}
      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all
        ${isOnline ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <span className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
        <span className={`text-sm font-medium ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </span>
      <span className="text-xs text-gray-400">Tap to toggle</span>
    </button>

    {/* Report Incident */}
    <button 
      onClick={() => {
        setShowIncident(true);
        setShowMobileMenu(false);
      }}
      className="w-full flex items-center gap-3 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
      <FaExclamationTriangle size={14} />
      <span className="text-sm font-medium">Report Incident</span>
    </button>

    {/* Settings */}
    <button 
      onClick={() => {
        setShowSettings(true);
        setShowMobileMenu(false);
      }}
      className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
      <FaCog size={14} />
      <span className="text-sm font-medium">Settings</span>
    </button>
    <button
      onClick={() => { localStorage.clear(); navigate('/login'); }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-medium transition-colors">
      <FaSignOutAlt size={11} /> Logout
    </button>

    {/* Driver Info */}
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
        <div className="h-10 w-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {driverInfo.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{driverInfo.name}</p>
          <p className="text-xs text-gray-500 truncate">{driverInfo.id}</p>
        </div>
      </div>
    </div>
  </div>
</div>
</header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Active Delivery Banner */}
        {activeDelivery && (
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 border-l-4 border-green-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-3 rounded-xl shrink-0 animate-pulse">
                  <FaRoute className="text-green-600 text-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-800">Active: {activeDelivery.location}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">ETA {activeDelivery.eta || '15 min'}</span>
                  </div>
                  <p className="text-sm text-gray-500">{activeDelivery.address} · {activeDelivery.amount}L</p>
                  {activeDelivery.notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1.5 inline-block">📋 {activeDelivery.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button onClick={() => window.open(`tel:${activeDelivery.phone}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 border border-blue-100 transition-colors">
                  <FaPhone size={11} /> Call
                </button>
                <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeDelivery.lat},${activeDelivery.lng}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 border border-indigo-100 transition-colors">
                  <MdDirections size={14} /> Navigate
                </button>
                <button onClick={() => completeDelivery(activeDelivery.id || activeDelivery._id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-md shadow-green-200">
                  <FaCheck size={10} /> Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Completed',       val: completedToday,                              icon: <FaCheckCircle className="text-green-600" />,            bg: 'bg-green-100'   },
            { label: 'Pending',         val: pendingToday,                                icon: <FaClock className="text-yellow-600" />,                 bg: 'bg-yellow-100'  },
            { label: 'Water Delivered', val: `${totalWater}L`,                            icon: <MdOutlineWaterDrop className="text-blue-600 text-lg" />, bg: 'bg-blue-100'    },
            { label: "Today's Pay",     val: `₦${earnings.today.total.toLocaleString()}`, icon: <FaMoneyBillWave className="text-emerald-600" />,         bg: 'bg-emerald-100' },
          ].map(({ label, val, icon, bg }) => (
            <div key={label} className="bg-white rounded-xl shadow-md p-3.5 hover:shadow-lg transition-shadow">
              <div className={`${bg} w-9 h-9 rounded-lg flex items-center justify-center mb-2`}>{icon}</div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-black text-gray-800">{val}</p>
            </div>
          ))}
        </div>

        {/* Low Fuel Warning */}
        {vehicle.fuel < 25 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-3">
            <FaGasPump className="text-red-500 text-xl shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">Low Fuel — {vehicle.fuel}% remaining</p>
              <p className="text-xs text-red-500">Refuel before next delivery to avoid delays.</p>
            </div>
            <button onClick={() => addToast('info', 'Nearest fuel station noted', '2.3 km away on Bokkos Road')}
              className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-700">
              Find Station
            </button>
          </div>
        )}

        {/* Unread notification banner */}
        {unreadCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex items-center gap-3">
            <FaBell className="text-blue-500 text-lg shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-700">
                You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-500">Tap the bell icon to view them.</p>
            </div>
            <button onClick={() => setShowNotifications(true)}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">
              View
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-100 overflow-x-auto">
            <nav className="flex">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors
                    ${activeTab === t.id ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5">
            {/* Today's Schedule */}
            {activeTab === 'today' && (
              <div>
                <div className="flex justify-between text-sm items-center mb-4">
                  <h3 className="font-bold text-gray-800">Today's Schedule</h3>
                  <button onClick={() => setShowIncident(true)}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium">
                    <FaExclamationTriangle size={10} /> Report Incident
                  </button>
                </div>
                <div className="space-y-3">
                  {deliveries.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                      <FaCalendarAlt className="text-4xl mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No deliveries scheduled for today</p>
                    </div>
                  )}
                  {deliveries.map(d => (
                    <div key={d.id || d._id}
                      className={`rounded-xl border-2 p-4 transition-all
                        ${d.status === 'in-progress' ? 'border-green-400 bg-green-50' :
                          d.status === 'completed'   ? 'border-gray-100 bg-gray-50 opacity-80' :
                          d.status === 'approved'    ? 'border-blue-300 bg-blue-50/30' :
                          'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            d.status === 'completed'   ? 'bg-green-100' :
                            d.status === 'in-progress' ? 'bg-yellow-100 animate-pulse' :
                            d.status === 'approved'    ? 'bg-blue-100' :
                            'bg-gray-100'}`}>
                            {d.status === 'completed'   ? <FaCheckCircle className="text-green-600" /> :
                             d.status === 'in-progress' ? <FaClock className="text-yellow-600" /> :
                             d.status === 'approved'    ? <FaCalendarAlt className="text-blue-600" /> :
                             <FaCalendarAlt className="text-gray-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-800">{d.location}</p>
                              <span className="text-xs text-gray-400">{d.scheduledTime || d.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{d.address}</p>
                            <p className="text-xs text-gray-500">{d.amount}L · {d.recipient}</p>
                            {d.notes && (
                              <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1.5 inline-block max-w-full truncate">
                                📋 {d.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                            ${d.status === 'completed'   ? 'bg-green-100 text-green-700' :
                              d.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                              d.status === 'approved'    ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'}`}>
                            {d.status === 'in-progress' ? 'In Progress' : 
                             d.status === 'approved'    ? 'Approved' : 
                             d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                          </span>
                          
                          {(d.status === 'pending' || d.status === 'approved' || d.status === 'in-progress') && (
                            <button onClick={() => window.open(`tel:${d.phone}`)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                              <FaPhone size={11} />
                            </button>
                          )}
                          
                          {(d.status === 'pending' || d.status === 'approved') && (
                            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`)}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                              <FaMapMarkedAlt size={11} />
                            </button>
                          )}
                          
                          {(d.status === 'pending' || d.status === 'approved') && (
                            <button onClick={() => startDelivery(d.id || d._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">
                              <FaPlay size={9} /> Start
                            </button>
                          )}
                          
                          {d.status === 'in-progress' && (
                            <button onClick={() => completeDelivery(d.id || d._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm">
                              <FaCheck size={9} /> Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Map */}
           {activeTab === 'map' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Live Route Map</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setShowRoute(p => !p)}
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100">
                        {showRoute ? 'Hide Route' : 'Show Route'}
                      </button>
                      {activeDelivery && (
                        <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeDelivery.lat},${activeDelivery.lng}`)}
                          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                          Open Google Maps
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Current Location Badge */}
                  {currentLocation.name && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                      <FaMapMarkerAlt className="text-green-600 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Your current location</p>
                        <p className="text-sm font-semibold text-gray-800">{currentLocation.name}</p>
                      </div>
                      <span className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    </div>
                  )}

                  <div className="h-96 rounded-2xl overflow-hidden shadow-inner">
                    <MapContainer
                      center={currentLocation.lat ? [currentLocation.lat, currentLocation.lng] : [9.3265, 8.9947]}
                      zoom={14}
                      style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                      {showRoute && <Polyline positions={[[9.3265, 8.9947], [9.3280, 8.9910], [9.3310, 8.9870]]} color="#10B981" weight={4} opacity={0.8} />}

                      {/* Driver's real location marker */}
                      {currentLocation.lat && (
                        <Marker
                          position={[currentLocation.lat, currentLocation.lng]}
                          icon={L.divIcon({
                            className: '',
                            html: `<div style="background:#16a34a;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3)">🚚</div>`,
                            iconSize: [44, 44],
                            iconAnchor: [22, 22],
                            popupAnchor: [0, -22]
                          })}>
                          <Popup>
                            <div className="p-1">
                              <strong>📍 {driverInfo.name}</strong><br />
                              <span className="text-xs text-gray-600">{currentLocation.name}</span><br />
                              <span className="text-xs text-gray-400">{driverInfo.tanker}</span>
                            </div>
                          </Popup>
                        </Marker>
                      )}

                      {/* Delivery markers */}
                      {deliveries.filter(d => d.status !== 'completed').map(d => (
                        <Marker key={d.id || d._id} position={[d.lat || 9.3265, d.lng || 8.9947]}>
                          <Popup><strong>{d.location}</strong><br />{d.address}<br />{d.amount}L · {d.recipient}</Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['📍 My Location', currentLocation.name || 'Getting location...'],
                      ['ETA',            activeDelivery?.eta || '—'],
                      ['Stops Left',     `${pendingToday + (activeDelivery ? 1 : 0)} remaining`]
                    ].map(([l, v]) => (
                      <div key={l} className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 font-medium">{l}</p>
                        <p className="text-sm font-bold text-gray-800 mt-1 truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Earnings */}
            {activeTab === 'earnings' && (
              <div className="space-y-5">

                {/* Period Selector */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-800">Earnings</h3>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'week',  label: 'Week'  },
                      { id: 'month', label: 'Month' },
                    ].map(p => (
                      <button  key={p.id} onClick={() => setEarningsPeriod(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                          ${earningsPeriod === p.id
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Earnings Card */}
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-lg p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="relative">
                    <div className="flex justify-between items-start flex-wrap  mb-4">
                      <div>
                        <p className="text-green-100 text-xs  font-medium uppercase tracking-wide mb-1">
                          {earningsPeriod === 'today' ? "Today's" : earningsPeriod === 'week' ? "This Week's" : "This Month's"} Earnings
                        </p>
                        <p className="sm:text-4xl text-1xl font-black">
                          ₦{(earnings[earningsPeriod]?.total || 0).toLocaleString()}
                        </p>
                        <p className="text-green-100 text-sm mt-1">
                          {earnings[earningsPeriod]?.deliveries || 0} deliveries · {earnings[earningsPeriod]?.km || 0} km
                        </p>
                      </div>
                      {/* ✅ UPDATED Withdraw button with fetchWithdrawalBalance */}
                      <button
                        onClick={async () => {
                          await fetchWithdrawalBalance();
                          setShowWithdrawal(true);
                        }}
                        className="bg-white text-green-700 px-4 py-2  rounded-xl text-xs font-black hover:bg-green-50 transition-colors shadow-lg flex items-center gap-1.5">
                        <FaMoneyBillWave size={12} /> Withdraw
                      </button>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-3 gap-3 ">
                      {[
                        { label: 'Base Pay', val: earnings[earningsPeriod]?.base  || 0, icon: '💼' },
                        { label: 'Bonus',    val: earnings[earningsPeriod]?.bonus || 0, icon: '🎯' },
                        { label: 'Tips',     val: earnings[earningsPeriod]?.tips  || 0, icon: '⭐' },
                      ].map(({ label, val, icon }) => (
                        <div key={label} className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                          <p className="text-xs text-green-100">{icon} {label}</p>
                          <p className="font-black sm:text-lg text-xs">₦{val.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Commission Rate Card */}
                <div className="bg-white rounded-xl shadow-md p-4 border border-green-100">
                  <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                    <span className="text-base">📊</span> Your Commission Rates
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Rate per Liter',     val: `₦${commission.baseRatePerLiter}/L`,  color: 'bg-blue-50 text-blue-700'   },
                      { label: 'Bonus per Delivery', val: `₦${commission.bonusPerDelivery}`,     color: 'bg-green-50 text-green-700' },
                      { label: 'Average Tip',        val: `₦${commission.tipAverage}`,           color: 'bg-yellow-50 text-yellow-700'},
                      { label: 'Commission %',       val: `${commission.commissionPercent}%`,     color: 'bg-purple-50 text-purple-700'},
                    ].map(({ label, val, color }) => (
                      <div key={label} className={`${color} rounded-xl p-3`}>
                        <p className="text-xs opacity-70 font-medium">{label}</p>
                        <p className="font-black text-base mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">💡 Earnings per delivery (500L example)</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">
                        {commission.baseRatePerLiter} × 500L + {commission.bonusPerDelivery} bonus + {commission.tipAverage} tip
                      </span>
                      <span className="text-sm font-black text-green-600">
                        ₦{(commission.baseRatePerLiter * 500 + commission.bonusPerDelivery + commission.tipAverage).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="bg-white rounded-xl shadow-lg p-5">
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 mb-4">
                    <FaChartBar className="text-green-600" /> Performance
                  </h3>
                  <div className="grid gap-3">
                    {[
                      { label: 'Rating',          val: `${perf.rating}/5`, icon: <FaStar className="text-yellow-500" />,               bg: 'bg-yellow-50'  },
                      { label: 'On-Time %',        val: `${perf.onTime}%`, icon: <FaClock className="text-blue-500" />,                 bg: 'bg-blue-50'    },
                      { label: 'Total Deliveries', val: perf.total,        icon: <FaCheckCircle className="text-green-500" />,          bg: 'bg-green-50'   },
                      { label: 'Incidents',        val: perf.incidents,    icon: <FaExclamationTriangle className="text-orange-400" />, bg: 'bg-orange-50'  },
                    ].map(({ label, val, icon, bg }) => (
                      <div key={label} className={`${bg} rounded-xl p-3 flex items-center gap-3`}>
                        <div className="text-xl">{icon}</div>
                        <div><p className="text-xs text-gray-500">{label}</p><p className="font-bold text-gray-800">{val}</p></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Monthly Target</span>
                      <span className="font-semibold text-green-600">{perf.targetPct}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${perf.targetPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Vehicle Health */}
                <div className="bg-white rounded-xl shadow-lg p-5">
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 mb-4">
                    <FaWrench className="text-green-600" /> Vehicle Health
                  </h3>
                  <div className="grid gap-4">
                    {[
                      { label: 'Fuel',   val: vehicle.fuel,   color: vehicle.fuel   < 25 ? 'red' : vehicle.fuel   < 50 ? 'yellow' : 'green', icon: <FaGasPump />       },
                      { label: 'Engine', val: vehicle.engine, color: vehicle.engine > 80 ? 'green' : vehicle.engine > 50 ? 'yellow' : 'red',  icon: <FaTachometerAlt /> },
                      { label: 'Tyres',  val: vehicle.tyres,  color: vehicle.tyres  > 70 ? 'green' : vehicle.tyres  > 40 ? 'yellow' : 'red',  icon: <FaTruck />         },
                      { label: 'Oil',    val: vehicle.oil,    color: vehicle.oil    > 60 ? 'green' : vehicle.oil    > 30 ? 'yellow' : 'red',  icon: <FaOilCan />        },
                    ].map(({ label, val, color, icon }) => (
                      <div key={label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">{icon} {label}</span>
                          <span className={`text-xs font-bold ${color==='green'?'text-green-600':color==='yellow'?'text-yellow-600':'text-red-600'}`}>{val}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color==='green'?'bg-green-500':color==='yellow'?'bg-yellow-500':'bg-red-500'} rounded-full transition-all duration-700`}
                            style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Withdrawal Modal */}
                {showWithdrawal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl hidden font-bold text-gray-800 flex items-center gap-2">
                          <FaMoneyBillWave className="text-green-600" /> Withdraw Earnings
                        </h3>
                        <button onClick={() => setShowWithdrawal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
                      </div>

                      {/* ✅ UPDATED Available Balance Section */}
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                        <p className="text-xs text-gray-500 font-medium mb-1">Available Balance</p>
                        <p className="text-3xl font-black text-green-600">
                          ₦{availableBalance.toLocaleString()}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Total earned: <strong className="text-green-600">₦{(availableBalance + totalWithdrawnAmount).toLocaleString()}</strong></span>
                          <span>Withdrawn: <strong className="text-orange-500">₦{totalWithdrawnAmount.toLocaleString()}</strong></span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Amount to Withdraw (₦)</label>
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            placeholder="Enter amount"
                            max={availableBalance}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                          />
                          <div className="flex gap-2 mt-2">
                            {[5000, 10000, 20000].map(amt => (
                              <button key={amt} onClick={() => setWithdrawAmount(String(amt))}
                                className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-green-50 hover:text-green-700 transition-colors">
                                ₦{(amt/1000).toFixed(0)}K
                              </button>
                            ))}
                            <button onClick={() => setWithdrawAmount(String(availableBalance))}
                              className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-green-50 hover:text-green-700 transition-colors">
                              Max
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Bank Name</label>
                          <select
                            value={withdrawBank}
                            onChange={e => setWithdrawBank(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
                            <option value="">Select bank</option>
                            {['Access Bank','First Bank','GT Bank','UBA','Zenith Bank','Fidelity Bank','FCMB','Sterling Bank','Polaris Bank','Wema Bank','Opay','Palmpay','Kuda Bank'].map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Account Number</label>
                          <input
                            type="text"
                            value={withdrawAccount}
                            onChange={e => setWithdrawAccount(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit account number"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                          />
                        </div>

                        {/* Summary */}
                        {withdrawAmount && withdrawBank && withdrawAccount.length === 10 && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                            <p className="font-bold mb-1">Withdrawal Summary</p>
                            <div className="flex justify-between"><span>Amount:</span><span className="font-bold">₦{Number(withdrawAmount).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Bank:</span><span className="font-bold">{withdrawBank}</span></div>
                            <div className="flex justify-between"><span>Account:</span><span className="font-bold">{withdrawAccount}</span></div>
                            <div className="flex justify-between mt-1 pt-1 border-t border-blue-200">
                              <span>Processing fee:</span><span className="font-bold text-orange-600">₦50</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button onClick={() => { setShowWithdrawal(false); setWithdrawAmount(''); setWithdrawBank(''); setWithdrawAccount(''); }}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">
                            Cancel
                          </button>
                          {/* ✅ UPDATED Submit Button onClick */}
                          <button
                            onClick={async () => {
                              if (!withdrawAmount || !withdrawBank || withdrawAccount.length !== 10) {
                                addToast('error', 'Please fill all fields correctly');
                                return;
                              }
                              if (Number(withdrawAmount) < 1000) {
                                addToast('error', 'Minimum withdrawal is ₦1,000');
                                return;
                              }
                              if (Number(withdrawAmount) > availableBalance) {
                                addToast('error', `Insufficient balance. Available: ₦${availableBalance.toLocaleString()}`);
                                return;
                              }
                              try {
                                setWithdrawing(true);  // ✅ correct
                                const token = localStorage.getItem('token');
                                await axios.post(`${API_URL}/withdrawals`, {
                                  amount:        Number(withdrawAmount),
                                  bankName:      withdrawBank,
                                  accountNumber: withdrawAccount,
                                  accountName:   '',
                                }, { headers: { Authorization: `Bearer ${token}` } });

                                addToast('success', 'Withdrawal request submitted!', 'Admin will review and approve shortly.');
                                setShowWithdrawal(false);
                                setWithdrawAmount('');
                                setWithdrawBank('');
                                setWithdrawAccount('');

                                await fetchWithdrawalBalance();
                                fetchDriverData();
                              } catch (err) {
                                console.error('❌ Withdrawal error full:', err);
                                console.error('❌ Withdrawal error response:', err.response?.data);
                                console.error('❌ Withdrawal status:', err.response?.status);
                                addToast('error', 'Withdrawal failed', err.response?.data?.message || 'Please try again.');
                              } finally {
                                setWithdrawing(false);
                              }
                            }}
                            disabled={withdrawing || !withdrawAmount || !withdrawBank || withdrawAccount.length !== 10}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {withdrawing ? <><FaSpinner className="animate-spin" /> Processing...</> : '💸 Withdraw'}
                          </button>
                        </div>
                      </div>

                      {/* ✅ OPTIONAL Withdrawal History */}
                      {withdrawalHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Recent Requests</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {withdrawalHistory.slice(0, 5).map(w => (
                              <div key={w._id} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                                <div>
                                  <p className="text-xs font-semibold text-gray-800">₦{w.amount?.toLocaleString()}</p>
                                  <p className="text-[10px] text-gray-400">{w.bankName} · {w.accountNumber}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                    w.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {w.status === 'approved' ? '✅ Paid' : w.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                  </span>
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {new Date(w.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaHistory className="text-green-600" />Delivery History</h3>
                <div className="space-y-3">
                  {historyDeliveries.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                      <FaHistory className="text-4xl mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No delivery history yet</p>
                    </div>
                  )}
                  {historyDeliveries.map(d => (
                    <div key={d.id || d._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg"><FaCheckCircle className="text-green-600" /></div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{d.location}</p>
                          <p className="text-xs text-gray-500">
                            {d.date ? new Date(d.date).toLocaleDateString() : d.createdAt?.split('T')[0]} · {d.scheduledTime || d.time}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">{d.amount}L</p>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-xl text-center border border-green-100">
                  <p className="text-sm text-green-700 font-semibold">
                    Total this month: <span className="text-green-800 font-black">{perf.total} deliveries · ₦{earnings.month.total.toLocaleString()} earned</span>
                  </p>
                </div>
              </div>
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <ProfileTab
                driverInfo={driverInfo}
                perf={perf}
                API_URL={API_URL}
                addToast={addToast}
                fetchDriverData={fetchDriverData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;