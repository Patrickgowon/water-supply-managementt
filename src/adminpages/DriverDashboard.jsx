// src/pages/DriverDashboard.jsx

//  ✅ Shift timer

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaTruck, FaRoute, FaMapMarkedAlt, FaBell, FaClock,
  FaCheckCircle, FaCalendarAlt, FaMapMarkerAlt, FaPhone,
  FaEnvelope, FaTachometerAlt, FaOilCan, FaWrench,
  FaPlay, FaPause, FaStop, FaCheck, FaTimes, FaCog,
  FaStar, FaChartBar, FaMoneyBillWave, FaExclamationTriangle,
  FaCamera, FaSignature, FaToggleOn, FaToggleOff,
  FaGasPump, FaThumbsUp, FaHistory, FaChevronRight,
  FaBolt, FaShieldAlt, FaTools, FaHeadset, FaKey,
} from 'react-icons/fa';
import { MdOutlineWaterDrop, MdSpeed, MdDirections, MdWarning } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };
  return fmt(secs);
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
    { id: 'breakdown', label: '🔧 Vehicle Breakdown', color: 'red' },
    { id: 'accident',  label: '💥 Road Accident',     color: 'red' },
    { id: 'flat',      label: '🚗 Flat Tyre',          color: 'orange' },
    { id: 'fuel',      label: '⛽ Out of Fuel',        color: 'orange' },
    { id: 'delay',     label: '⏳ Traffic Delay',      color: 'yellow' },
    { id: 'other',     label: '📋 Other',              color: 'gray' },
  ];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">⚠️ Report Incident</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Select incident type and describe what happened</p>
        <div className="grid  gap-2 mb-4">
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
const SettingsModal = ({ show, onClose, settings, setSettings, addToast }) => {
  if (!show) return null;
  const toggle = k => { setSettings(p=>({...p,[k]:!p[k]})); addToast('info', `${k.replace(/([A-Z])/g,' $1')} ${settings[k]?'off':'on'}`); };
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
        <TogRow label="New Delivery Alerts"     sub="Notify when a job is assigned"       k="newDeliveryAlert" />
        <TogRow label="SMS Confirmation"        sub="Send SMS on delivery complete"        k="smsConfirm" />
        <TogRow label="Low Fuel Warning"        sub="Alert when fuel drops below 20%"      k="lowFuelWarn" />
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-4 mb-2">Availability</p>
        <TogRow label="Auto-Accept Jobs"        sub="Automatically accept nearby jobs"     k="autoAccept" />
        <TogRow label="Weekend Availability"    sub="Show as available on weekends"        k="weekends" />
        <TogRow label="Night Shift (8PM–6AM)"   sub="Accept night delivery assignments"    k="nightShift" />
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-4 mb-2">Navigation</p>
        <TogRow label="Voice Navigation"        sub="Turn-by-turn voice instructions"     k="voiceNav" />
        <TogRow label="Traffic Alerts"          sub="Real-time traffic warnings"           k="trafficAlerts" />
        <button onClick={onClose} className="mt-5 w-full py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 text-sm">Save & Close</button>
      </div>
    </div>
  );
};

// ─── VEHICLE HEALTH CARD ────────────────────────────────────────────────────
const VehicleHealth = ({ vehicle }) => {
  const items = [
    { label:'Fuel',     val:vehicle.fuel,   color:vehicle.fuel<25?'red':vehicle.fuel<50?'yellow':'green', icon:<FaGasPump/> },
    { label:'Engine',   val:vehicle.engine, color:vehicle.engine>80?'green':vehicle.engine>50?'yellow':'red', icon:<FaTachometerAlt/> },
    { label:'Tyres',    val:vehicle.tyres,  color:vehicle.tyres>70?'green':vehicle.tyres>40?'yellow':'red', icon:<FaTruck/> },
    { label:'Oil',      val:vehicle.oil,    color:vehicle.oil>60?'green':vehicle.oil>30?'yellow':'red', icon:<FaOilCan/> },
  ];
  const barColor = c => c==='green'?'bg-green-500':c==='yellow'?'bg-yellow-500':'bg-red-500';
  const textColor = c => c==='green'?'text-green-600':c==='yellow'?'text-yellow-600':'text-red-600';
  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2"><FaWrench className="text-green-600"/>Vehicle Health</h3>
        <span className="text-xs text-gray-400">TKR-002</span>
      </div>
      <div className="grid  gap-4">
        {items.map(({label,val,color,icon})=>(
          <div key={label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">{icon} {label}</span>
              <span className={`text-xs font-bold ${textColor(color)}`}>{val}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${barColor(color)} rounded-full transition-all duration-700`} style={{width:`${val}%`}}/>
            </div>
          </div>
        ))}
      </div>
      {(vehicle.fuel<25||vehicle.engine<50||vehicle.tyres<40||vehicle.oil<30) && (
        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-xs text-red-700">
          <FaExclamationTriangle className="shrink-0 mt-0.5"/>
          <span>Vehicle requires attention. Contact maintenance.</span>
        </div>
      )}
    </div>
  );
};

// ─── EARNINGS CARD ──────────────────────────────────────────────────────────
const EarningsCard = ({ earnings }) => {
  const [view, setView] = useState('today');
  const data = { today: earnings.today, week: earnings.week, month: earnings.month };
  return (
    <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-lg p-5 mb-6 text-white">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-base flex items-center gap-2"><FaMoneyBillWave/> Earnings</h3>
        <div className="flex bg-green-500/40 rounded-lg p-0.5 text-xs">
          {['today','week','month'].map(v=>(
            <button key={v} onClick={()=>setView(v)}
              className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all
                ${view===v?'bg-white text-green-700 shadow':'text-green-100 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <p className="text-4xl font-black mb-1">₦{data[view].total.toLocaleString()}</p>
      <p className="text-green-100 text-sm mb-4">{data[view].deliveries} deliveries · {data[view].km} km covered</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'Base Pay', val:data[view].base},
          {label:'Bonus',    val:data[view].bonus},
          {label:'Tips',     val:data[view].tips},
        ].map(({label,val})=>(
          <div key={label} className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-xs text-green-100">{label}</p>
            <p className="font-bold">₦{val.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PERFORMANCE CARD ───────────────────────────────────────────────────────
const PerformanceCard = ({ perf }) => (
  <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
    <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 mb-4"><FaChartBar className="text-green-600"/>Performance</h3>
    <div className="grid  gap-3">
      {[
        {label:'Rating',         val:`${perf.rating}/5`,    icon:<FaStar className="text-yellow-500"/>,  bg:'bg-yellow-50'},
        {label:'On-Time %',      val:`${perf.onTime}%`,     icon:<FaClock className="text-blue-500"/>,   bg:'bg-blue-50'},
        {label:'Total Deliveries',val:perf.total,           icon:<FaCheckCircle className="text-green-500"/>, bg:'bg-green-50'},
        {label:'Incidents',      val:perf.incidents,        icon:<FaExclamationTriangle className="text-orange-400"/>, bg:'bg-orange-50'},
      ].map(({label,val,icon,bg})=>(
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
        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700" style={{width:`${perf.targetPct}%`}}/>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
const DriverDashboard = () => {
  const {toasts, add: addToast, remove: removeToast} = useToast();
  const [activeTab, setActiveTab] = useState('today');
  const [isOnline, setIsOnline] = useState(true);
  const [showRoute, setShowRoute] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeDeliveryId, setActiveDeliveryId] = useState('DEL-002');
  const [shiftRunning, setShiftRunning] = useState(true);
  const shiftTime = useShiftTimer(shiftRunning);

  const [settings, setSettings] = useState({
    newDeliveryAlert:true, smsConfirm:true, lowFuelWarn:true,
    autoAccept:false, weekends:false, nightShift:false,
    voiceNav:true, trafficAlerts:true,
  });

  const driverInfo = {
    name:'Musa Ibrahim', id:'DRV-002', tanker:'TKR-002',
    phone:'+234 802 234 5678', email:'musa.i@hydromail.com',
  };

  const vehicle = { fuel:22, engine:88, tyres:65, oil:45 };

  const earnings = {
    today: { total:4500, deliveries:3, km:28, base:3500, bonus:700, tips:300 },
    week:  { total:28000, deliveries:18, km:164, base:22000, bonus:4000, tips:2000 },
    month: { total:112000, deliveries:72, km:680, base:88000, bonus:16000, tips:8000 },
  };

  const perf = { rating:4.7, onTime:92, total:312, incidents:2, targetPct:76 };

  const [deliveries, setDeliveries] = useState([
    {
      id:'DEL-001', time:'08:00 AM', location:'PLASU Main Campus',
      address:'Daniel Hall, Room B202', amount:500,
      status:'completed', recipient:'John Danladi', phone:'+234 803 123 4567',
      notes:'Ring bell twice. Gate code: 4412.',
      lat:9.3280, lng:8.9910,
    },
    {
      id:'DEL-002', time:'10:30 AM', location:'Bokkos General Hospital',
      address:'Main Ward, Block C', amount:800,
      status:'in-progress', recipient:'Matron Esther', phone:'+234 804 567 8901',
      eta:'12 min', notes:'Use staff entrance. Ask for Matron Esther.',
      lat:9.3310, lng:8.9870,
    },
    {
      id:'DEL-003', time:'02:00 PM', location:'Bokkos Market',
      address:'Shop 45, Market Road', amount:600,
      status:'pending', recipient:'Alhaji Musa', phone:'+234 805 678 9012',
      notes:'Call ahead 10 minutes before arrival.',
      lat:9.3240, lng:8.9960,
    },
    {
      id:'DEL-004', time:'04:30 PM', location:'St. Peters Secondary School',
      address:'Admin Block', amount:1000,
      status:'pending', recipient:'Mr. Chukwu', phone:'+234 806 789 0123',
      notes:'Large tank at back of school. Coordinate with security.',
      lat:9.3290, lng:8.9920,
    },
  ]);

  const historyDeliveries = [
    {id:'H001', date:'Yesterday', location:'Bokkos LGA Office', amount:1200, status:'completed', time:'09:00 AM'},
    {id:'H002', date:'Yesterday', location:'PLASU Hostel Block A', amount:500, status:'completed', time:'02:30 PM'},
    {id:'H003', date:'2 days ago', location:'Barkin Ladi Market', amount:800, status:'completed', time:'11:00 AM'},
    {id:'H004', date:'2 days ago', location:'Community Clinic', amount:600, status:'completed', time:'03:00 PM'},
  ];

  const routePoints = [[9.3265,8.9947],[9.3280,8.9910],[9.3310,8.9870],[9.3240,8.9960]];

  const startDelivery = id => {
    setDeliveries(p=>p.map(d=>d.id===id?{...d,status:'in-progress'}:d));
    setActiveDeliveryId(id);
    addToast('success','Delivery started!','Navigation is now active.');
  };

  const pauseDelivery = id => {
    addToast('warn','Delivery paused','Tap Resume when ready to continue.');
  };

  const completeDelivery = id => {
    setShowSignature(true);
  };

  const handleSignatureSave = () => {
    setDeliveries(p=>p.map(d=>d.id===activeDeliveryId?{...d,status:'completed'}:d));
    const next = deliveries.find(d=>d.status==='pending');
    if(next){ setActiveDeliveryId(next.id); }
    else { setActiveDeliveryId(null); }
    setShowSignature(false);
    addToast('success','Delivery confirmed!','Signature captured. Receipt sent to recipient.');
  };

  const handleIncidentSubmit = (type, desc) => {
    setShowIncident(false);
    addToast('warn','Incident reported','Dispatch has been notified. Stay safe!', 7000);
  };

  const openMaps = (lat, lng, label) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`, '_blank');
  };

  const callRecipient = phone => {
    window.open(`tel:${phone}`);
    addToast('info',`Calling ${phone}`);
  };

  const activeDelivery = deliveries.find(d=>d.id===activeDeliveryId && d.status==='in-progress');

  const TABS = [
    {id:'today',   label:'Today'},
    {id:'map',     label:'Live Map'},
    {id:'earnings',label:'Earnings'},
    {id:'history', label:'History'},
    {id:'profile', label:'Profile'},
  ];

  const completedToday = deliveries.filter(d=>d.status==='completed').length;
  const pendingToday   = deliveries.filter(d=>d.status==='pending').length;
  const totalWater     = deliveries.filter(d=>d.status==='completed').reduce((a,d)=>a+d.amount,0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <style>{`
        @keyframes slideInRight { from{opacity:0;transform:translateX(110%)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-ring   { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />
      {showSignature && <SignatureCanvas onSave={handleSignatureSave} onClose={()=>setShowSignature(false)} />}
      {showIncident  && <IncidentModal onClose={()=>setShowIncident(false)} onSubmit={handleIncidentSubmit} />}
      <SettingsModal show={showSettings} onClose={()=>setShowSettings(false)} settings={settings} setSettings={setSettings} addToast={addToast} />

      {/* ── HEADER ── */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                <FaTruck className="text-xl text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 leading-none">Driver Dashboard</h1>
                <p className="text-xs text-gray-400 mt-0.5">Shift: <span className="font-mono font-semibold text-green-600">{shiftTime}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Panic / Incident button */}
              <button onClick={()=>setShowIncident(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors">
                <FaExclamationTriangle size={11}/> Report Incident
              </button>

              {/* Online toggle */}
              <button onClick={()=>{setIsOnline(p=>!p); setShiftRunning(p=>!p); addToast(isOnline?'info':'success', isOnline?'You are now offline':'You are now online and receiving jobs');}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${isOnline?'bg-green-100 text-green-700 border-green-200':'bg-gray-100 text-gray-600 border-gray-200'}`}>
                <span className={`w-2 h-2 rounded-full ${isOnline?'bg-green-500 animate-pulse':'bg-gray-400'}`}></span>
                {isOnline?'Online':'Offline'}
              </button>

              <button className="relative" onClick={()=>addToast('info','2 new notifications','New job assigned · Low fuel warning')}>
                <FaBell className="text-gray-500 text-lg"/>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">2</span>
              </button>

              <button onClick={()=>setShowSettings(true)}
                className="w-9 h-9 bg-gray-100 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
                <FaCog className="text-gray-500 text-sm"/>
              </button>

              <div className="h-9 w-9 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                MI
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ── ACTIVE DELIVERY BANNER ── */}
        {activeDelivery && (
          <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 border-l-4 border-green-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
            <div className="relative flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-3 rounded-xl shrink-0 animate-pulse">
                  <FaRoute className="text-green-600 text-xl"/>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-800">Active: {activeDelivery.location}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">ETA {activeDelivery.eta}</span>
                  </div>
                  <p className="text-sm text-gray-500">{activeDelivery.address} · {activeDelivery.amount}L</p>
                  {activeDelivery.notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mt-1.5 inline-block">
                      📋 {activeDelivery.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button onClick={()=>callRecipient(activeDelivery.phone)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 border border-blue-100 transition-colors">
                  <FaPhone size={11}/> Call
                </button>
                <button onClick={()=>openMaps(activeDelivery.lat, activeDelivery.lng, activeDelivery.location)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 border border-indigo-100 transition-colors">
                  <MdDirections size={14}/> Navigate
                </button>
                <button onClick={()=>pauseDelivery(activeDelivery.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-xl text-xs font-semibold hover:bg-yellow-100 border border-yellow-100 transition-colors">
                  <FaPause size={10}/> Pause
                </button>
                <button onClick={()=>completeDelivery(activeDelivery.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-md shadow-green-200">
                  <FaCheck size={10}/> Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── QUICK STATS ROW ── */}
        <div className="grid  sm:grid-cols-4 gap-3 mb-6">
          {[
            {label:'Completed',  val:completedToday, icon:<FaCheckCircle className="text-green-600"/>,  bg:'bg-green-100'},
            {label:'Pending',    val:pendingToday,   icon:<FaClock className="text-yellow-600"/>,        bg:'bg-yellow-100'},
            {label:'Water Delivered', val:`${totalWater}L`, icon:<MdOutlineWaterDrop className="text-blue-600 text-lg"/>, bg:'bg-blue-100'},
            {label:"Today's Pay",val:`₦${earnings.today.total.toLocaleString()}`, icon:<FaMoneyBillWave className="text-emerald-600"/>, bg:'bg-emerald-100'},
          ].map(({label,val,icon,bg})=>(
            <div key={label} className="bg-white rounded-xl shadow-md p-3.5 hover:shadow-lg transition-shadow">
              <div className={`${bg} w-9 h-9 rounded-lg flex items-center justify-center mb-2`}>{icon}</div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-black text-gray-800">{val}</p>
            </div>
          ))}
        </div>

        {/* ── VEHICLE HEALTH WARNING (if critical) ── */}
        {vehicle.fuel < 25 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-center gap-3">
            <FaGasPump className="text-red-500 text-xl shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">Low Fuel — {vehicle.fuel}% remaining</p>
              <p className="text-xs text-red-500">Refuel before next delivery to avoid delays.</p>
            </div>
            <button onClick={()=>addToast('info','Nearest fuel station noted','2.3 km away on Bokkos Road')}
              className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-700">
              Find Station
            </button>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-100 overflow-x-auto">
            <nav className="flex">
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setActiveTab(t.id)}
                  className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors
                    ${activeTab===t.id?'border-b-2 border-green-600 text-green-600':'text-gray-500 hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5">
            {/* TODAY'S SCHEDULE */}
            {activeTab==='today' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Today's Schedule</h3>
                  <button onClick={()=>setShowIncident(true)}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium">
                    <FaExclamationTriangle size={10}/> Report Incident
                  </button>
                </div>
                <div className="space-y-3">
                  {deliveries.map(d=>(
                    <div key={d.id}
                      className={`rounded-xl border-2 p-4 transition-all
                        ${d.status==='in-progress'?'border-green-400 bg-green-50':
                          d.status==='completed'  ?'border-gray-100 bg-gray-50 opacity-80':
                                                   'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            d.status==='completed'  ?'bg-green-100':
                            d.status==='in-progress'?'bg-yellow-100 animate-pulse':
                                                     'bg-gray-100'}`}>
                            {d.status==='completed'  ?<FaCheckCircle className="text-green-600"/>:
                             d.status==='in-progress'?<FaClock className="text-yellow-600"/>:
                                                      <FaCalendarAlt className="text-gray-500"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-800">{d.location}</p>
                              <span className="text-xs text-gray-400">{d.time}</span>
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
                            ${d.status==='completed'  ?'bg-green-100 text-green-700':
                              d.status==='in-progress'?'bg-yellow-100 text-yellow-700':
                                                       'bg-gray-100 text-gray-600'}`}>
                            {d.status==='in-progress'?'In Progress':d.status.charAt(0).toUpperCase()+d.status.slice(1)}
                          </span>
                          {d.status==='pending' && (
                            <>
                              <button onClick={()=>callRecipient(d.phone)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Call recipient">
                                <FaPhone size={11}/>
                              </button>
                              <button onClick={()=>openMaps(d.lat, d.lng, d.location)}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Navigate">
                                <FaMapMarkedAlt size={11}/>
                              </button>
                              <button onClick={()=>startDelivery(d.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">
                                <FaPlay size={9}/> Start
                              </button>
                            </>
                          )}
                          {d.status==='in-progress' && (
                            <>
                              <button onClick={()=>callRecipient(d.phone)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Call">
                                <FaPhone size={11}/>
                              </button>
                              <button onClick={()=>completeDelivery(d.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm">
                                <FaCheck size={9}/> Complete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIVE MAP */}
            {activeTab==='map' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Live Route Map</h3>
                  <div className="flex gap-2">
                    <button onClick={()=>setShowRoute(p=>!p)}
                      className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100">
                      {showRoute?'Hide Route':'Show Route'}
                    </button>
                    {activeDelivery && (
                      <button onClick={()=>openMaps(activeDelivery.lat, activeDelivery.lng, activeDelivery.location)}
                        className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                        Open Google Maps
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-96 rounded-2xl overflow-hidden shadow-inner">
                  <MapContainer center={[9.3265,8.9947]} zoom={14} style={{height:'100%',width:'100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap'/>
                    {showRoute && <Polyline positions={routePoints} color="#10B981" weight={4} opacity={0.8}/>}
                    <Marker position={[9.3265,8.9947]}><Popup><strong>📍 Current Position</strong><br/>Musa Ibrahim · TKR-002</Popup></Marker>
                    {deliveries.filter(d=>d.status!=='completed').map(d=>(
                      <Marker key={d.id} position={[d.lat, d.lng]}>
                        <Popup>
                          <strong>{d.location}</strong><br/>
                          {d.address}<br/>
                          {d.amount}L · {d.recipient}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Current Stop',activeDelivery?.location||'None active'],['ETA',activeDelivery?.eta||'—'],['Stops Left',`${pendingToday+(activeDelivery?1:0)} remaining`]].map(([l,v])=>(
                    <div key={l} className="bg-green-50 p-3 rounded-xl border border-green-100">
                      <p className="text-xs text-green-600 font-medium">{l}</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EARNINGS */}
            {activeTab==='earnings' && (
              <div>
                <EarningsCard earnings={earnings}/>
                <PerformanceCard perf={perf}/>
                <VehicleHealth vehicle={vehicle}/>
              </div>
            )}

            {/* HISTORY */}
            {activeTab==='history' && (
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaHistory className="text-green-600"/>Delivery History</h3>
                <div className="space-y-3">
                  {[...historyDeliveries].map(d=>(
                    <div key={d.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg"><FaCheckCircle className="text-green-600"/></div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{d.location}</p>
                          <p className="text-xs text-gray-500">{d.date} · {d.time}</p>
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
                  <p className="text-sm text-green-700 font-semibold">Total this month: <span className="text-green-800 font-black">72 deliveries · 4,200L water</span></p>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeTab==='profile' && (
              <div>
                <div className="flex items-center gap-4 mb-6 p-5 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">MI</div>
                  <div>
                    <p className="text-xl font-black">{driverInfo.name}</p>
                    <p className="text-green-100 text-sm">{driverInfo.id} · {driverInfo.tanker}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map(i=><FaStar key={i} className={`text-xs ${i<=Math.floor(perf.rating)?'text-yellow-300':'text-white/30'}`}/>)}
                      <span className="text-xs text-green-100 ml-1">{perf.rating} rating</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    {icon:<FaPhone/>,  label:'Phone',        val:driverInfo.phone},
                    {icon:<FaEnvelope/>,label:'Email',       val:driverInfo.email},
                    {icon:<FaTruck/>,  label:'Assigned Tanker', val:driverInfo.tanker},
                    {icon:<FaKey/>,    label:'Driver ID',     val:driverInfo.id},
                    {icon:<FaShieldAlt/>,label:'License Exp', val:'Dec 2026'},
                  ].map(({icon,label,val})=>(
                    <div key={label} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="text-green-600 w-5 text-center shrink-0">{icon}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800 text-sm truncate">{val}</p></div>
                    </div>
                  ))}
                </div>

                <div className="grid  gap-3">
                  <button onClick={()=>setShowSettings(true)}
                    className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100 border border-green-200 transition-colors">
                    <FaCog/> Settings
                  </button>
                  <button onClick={()=>addToast('info','Support contacted','Our team will respond within 30 minutes.')}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 border border-blue-200 transition-colors">
                    <FaHeadset/> Support
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;