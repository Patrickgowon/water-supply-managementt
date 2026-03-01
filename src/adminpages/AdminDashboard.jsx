// src/pages/AdminDashboard.jsx  (COMPLETE - import this file directly)
// All sub-components are inlined for single-file usage.

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTint, FaTruck, FaUsers, FaBell, FaUserCircle, FaClock,
  FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaMapMarkerAlt,
  FaChartBar, FaCog, FaMoneyBillWave, FaRoute, FaWrench,
  FaClipboardList, FaDownload, FaFilter, FaSearch, FaUserPlus,
  FaUserCheck, FaEye, FaEdit, FaTrash, FaCheck, FaTimes,
  FaPlus, FaPhone, FaStar, FaToggleOn, FaToggleOff, FaHistory,
  FaDownload as FaDl, FaDollarSign, FaChartLine, FaUserTie,
  FaMapMarkedAlt, FaCrosshairs, FaLayerGroup, FaGasPump,
  FaBullhorn, FaShieldAlt, FaSignOutAlt, FaWrench as FaTools,
  FaMedal, FaBolt,
} from 'react-icons/fa';
import {
  MdOutlineWaterDrop, MdOutlineDashboard, MdOutlinePendingActions,
  MdNotifications, MdSecurity,
} from 'react-icons/md';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
          ${t.type==='success'?'bg-gradient-to-r from-green-500 to-emerald-600':
            t.type==='error'  ?'bg-gradient-to-r from-red-500 to-rose-600':
            t.type==='warn'   ?'bg-gradient-to-r from-yellow-500 to-orange-500':
                               'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
        <span className="text-xl mt-0.5 shrink-0">{t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warn'?'⚠️':'ℹ️'}</span>
        <div className="flex-1"><p>{t.message}</p>{t.sub&&<p className="text-xs opacity-80 mt-0.5">{t.sub}</p>}</div>
        <button onClick={()=>remove(t.id)} className="opacity-70 hover:opacity-100 shrink-0">✕</button>
      </div>
    ))}
  </div>
);
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type,message,sub='',ms=5500) => {
    const id = Date.now()+Math.random();
    setToasts(p=>[...p,{id,type,message,sub}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), ms);
  }, []);
  const remove = useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)), []);
  return {toasts,add,remove};
};

// ════════════════════════════════════════════════════════════
//  CONFIRM DIALOG
// ════════════════════════════════════════════════════════════
const ConfirmDialog = ({ show, title, message, onConfirm, onCancel, danger=true }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6">
        <div className={`w-14 h-14 ${danger?'bg-red-100':'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-4 text-3xl`}>
          {danger?'🗑️':'⚠️'}
        </div>
        <h3 className="text-lg font-bold text-gray-800 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-white rounded-xl font-bold text-sm ${danger?'bg-red-600 hover:bg-red-700':'bg-yellow-500 hover:bg-yellow-600'}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  ADMIN SETTINGS
// ════════════════════════════════════════════════════════════
const AdminSettings = ({ show, onClose, addToast }) => {
  const [section, setSection] = useState('notifications');
  const [cfg, setCfg] = useState({
    orderAlerts:true, driverAlerts:true, paymentAlerts:true, incidentAlerts:true,
    autoApprove:false, autoAssign:false, maintenanceMode:false,
    twoFA:true, sessionTimeout:true, auditLog:true,
    emailDigest:true, smsAlerts:false, pushAlerts:true,
  });
  if (!show) return null;
  const toggle = k => { setCfg(p=>({...p,[k]:!p[k]})); addToast('info','Setting updated'); };
  const TR = ({label,sub,k}) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div><p className="text-sm font-medium text-gray-800">{label}</p>{sub&&<p className="text-xs text-gray-500 mt-0.5">{sub}</p>}</div>
      <button onClick={()=>toggle(k)} className="active:scale-90 ml-4 shrink-0">
        {cfg[k]?<FaToggleOn className="text-3xl text-green-500"/>:<FaToggleOff className="text-3xl text-gray-300"/>}
      </button>
    </div>
  );
  const SECS = [
    {id:'notifications',ico:'🔔',label:'Notifications'},
    {id:'automation',   ico:'⚡',label:'Automation'},
    {id:'security',     ico:'🔒',label:'Security'},
    {id:'system',       ico:'⚙️', label:'System'},
  ];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex max-h-[90vh]">
        <div className="w-52 bg-gray-50 border-r border-gray-100 p-4 flex flex-col shrink-0">
          <div className="flex items-center gap-2 mb-5"><FaCog className="text-green-600"/><span className="font-bold text-gray-800">Admin Settings</span></div>
          {SECS.map(s=>(
            <button key={s.id} onClick={()=>setSection(s.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 text-left transition-all
                ${section===s.id?'bg-green-600 text-white shadow-md':'text-gray-600 hover:bg-gray-200'}`}>
              <span>{s.ico}</span>{s.label}
            </button>
          ))}
          <button onClick={onClose} className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl"><FaTimes size={12}/> Close</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {section==='notifications' && (<div><h4 className="font-bold text-gray-800 text-lg mb-4">Notification Preferences</h4><TR label="New Order Alerts" sub="Notify when a student places an order" k="orderAlerts"/><TR label="Driver Status Alerts" sub="When drivers go online/offline" k="driverAlerts"/><TR label="Payment Alerts" sub="Confirmed and failed payments" k="paymentAlerts"/><TR label="Incident Alerts" sub="Driver-reported incidents" k="incidentAlerts"/><div className="mt-5 pt-4 border-t border-gray-100"><p className="text-xs text-gray-400 uppercase font-semibold mb-3">Channels</p><TR label="Email Digest" sub="Daily summary at 8 AM" k="emailDigest"/><TR label="SMS Alerts" sub="Critical alerts via SMS" k="smsAlerts"/><TR label="Push Notifications" sub="Browser push" k="pushAlerts"/></div></div>)}
          {section==='automation' && (<div><h4 className="font-bold text-gray-800 text-lg mb-4">Automation Rules</h4><TR label="Auto-Approve Orders" sub="Automatically approve paid orders" k="autoApprove"/><TR label="Auto-Assign Drivers" sub="Auto-match nearest available driver" k="autoAssign"/><div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">⚠️ Auto-assign will pick the nearest online driver automatically. Review is still recommended for high-priority orders.</div></div>)}
          {section==='security' && (<div><h4 className="font-bold text-gray-800 text-lg mb-4">Security</h4><TR label="Two-Factor Authentication" sub="Require 2FA for admin login" k="twoFA"/><TR label="Session Timeout" sub="Auto-logout after 30 min of inactivity" k="sessionTimeout"/><TR label="Audit Log" sub="Track all admin actions" k="auditLog"/><div className="mt-5 pt-4 border-t border-gray-100 space-y-3"><button onClick={()=>addToast('info','Audit log exported','Last 30 days downloaded.')} className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2"><FaDownload size={13}/> Export Audit Log</button><button onClick={()=>addToast('warn','All sessions terminated')} className="w-full py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2"><FaSignOutAlt size={13}/> Terminate All Sessions</button></div></div>)}
          {section==='system' && (<div><h4 className="font-bold text-gray-800 text-lg mb-4">System Settings</h4><TR label="Maintenance Mode" sub="Disable student/driver access temporarily" k="maintenanceMode"/><div className="mt-5 space-y-3">{[['Max deliveries/driver/day','8'],['Default delivery window (hrs)','2'],['Order cancellation window (hrs)','1']].map(([l,v])=><div key={l}><label className="text-xs text-gray-500 mb-1 block font-medium">{l}</label><input type="number" defaultValue={v} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"/></div>)}<button onClick={()=>addToast('success','System settings saved!')} className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Save System Settings</button></div></div>)}
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
  const send = () => {
    if (!title||!msg) return addToast('error','Please fill in all fields');
    onClose(); setTitle(''); setMsg('');
    addToast('success',`Broadcast sent!`,`"${title}" delivered to ${target==='all'?'everyone':target}.`);
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FaBullhorn className="text-green-600"/> Broadcast Message</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">SEND TO</label>
            <div className="grid grid-cols-3 gap-2">
              {[['all','👥 Everyone'],['drivers','🚚 Drivers'],['students','🎓 Students']].map(([v,l])=>(
                <button key={v} onClick={()=>setTarget(v)}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${target===v?'border-green-500 bg-green-50 text-green-700':'border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">PRIORITY</label>
            <div className="grid grid-cols-3 gap-2">
              {[['normal','🔵 Normal'],['high','🟠 High'],['urgent','🔴 Urgent']].map(([v,l])=>(
                <button key={v} onClick={()=>setPriority(v)}
                  className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${priority===v?'border-green-500 bg-green-50 text-green-700':'border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">TITLE</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notification title…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">MESSAGE</label>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} placeholder="Your message…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"/>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={send} className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm">Send Broadcast</button>
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
  if (!show||!order) return null;
  const avail = drivers.filter(d=>d.status==='active'&&d.online);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">⚡ Quick Assign</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="bg-green-50 rounded-xl p-3 mb-4 border border-green-100">
          <p className="text-sm font-bold text-gray-800">{order.studentName}</p>
          <p className="text-xs text-gray-500">{order.location} · {order.amount}L</p>
        </div>
        <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Available Drivers ({avail.length})</p>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {avail.length===0 && <p className="text-center py-8 text-gray-400 text-sm">No drivers currently online</p>}
          {avail.map(d=>(
            <button key={d.id} onClick={()=>setSel(d.id)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all ${sel===d.id?'border-green-500 bg-green-50':'border-gray-100 hover:border-gray-300'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-gray-800">{d.firstName} {d.lastName}</p>
                  <p className="text-xs text-gray-500">{d.tankerId} · {d.currentLocation}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end"><FaStar className="text-yellow-400 text-xs"/><span className="font-bold text-sm">{d.rating}</span></div>
                  <p className="text-xs text-gray-400">{d.totalDeliveries} deliveries</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={()=>{if(sel){onAssign(order.id,sel);onClose();}}} disabled={!sel}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-40">
            Assign Driver
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  FLEET HEALTH PANEL
// ════════════════════════════════════════════════════════════
const FleetHealthPanel = ({ addToast }) => {
  const fleet = [
    {id:'TKR-001',driver:'John Danladi',   fuel:68,engine:90,tyres:72,oil:55,next:'2024-03-10'},
    {id:'TKR-002',driver:'Musa Ibrahim',   fuel:22,engine:85,tyres:60,oil:40,next:'2024-02-15'},
    {id:'TKR-003',driver:'Peter Sunday',   fuel:45,engine:78,tyres:85,oil:70,next:'2024-03-05'},
    {id:'TKR-004',driver:'Yakubu Moses',   fuel:81,engine:92,tyres:68,oil:80,next:'2024-03-18'},
    {id:'TKR-005',driver:'Hauwa Mohammed', fuel:55,engine:88,tyres:90,oil:65,next:'2024-01-20'},
  ];
  const bar = val => {
    const c = val<25?'bg-red-500':val<50?'bg-yellow-500':'bg-green-500';
    const t = val<25?'text-red-600':val<50?'text-yellow-600':'text-green-600';
    return (<div className="flex items-center gap-1.5 flex-1"><div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${c} rounded-full transition-all`} style={{width:`${val}%`}}/></div><span className={`text-xs font-bold w-7 text-right shrink-0 ${t}`}>{val}%</span></div>);
  };
  return (
    <div className="space-y-3">
      {fleet.map(v=>{
        const crit = v.fuel<25||v.engine<60||v.tyres<40||v.oil<30;
        const warn = !crit&&(v.fuel<50||v.engine<75||v.tyres<60||v.oil<50);
        return (
          <div key={v.id} className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${crit?'border-red-400':warn?'border-yellow-400':'border-green-400'}`}>
            <div className="flex justify-between items-center mb-3">
              <div><p className="font-bold text-gray-800 text-sm">{v.id}</p><p className="text-xs text-gray-500">{v.driver}</p></div>
              <div className="flex items-center gap-2">
                {crit&&<span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">⚠️ Critical</span>}
                {warn&&<span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">⚡ Warning</span>}
                {!crit&&!warn&&<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Good</span>}
                <button onClick={()=>addToast('success',`Maintenance scheduled for ${v.id}`,'Driver has been notified.')}
                  className="w-7 h-7 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center justify-center" title="Schedule maintenance">
                  <FaWrench size={11}/>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[['⛽ Fuel',v.fuel],['🔧 Engine',v.engine],['🚗 Tyres',v.tyres],['🛢️ Oil',v.oil]].map(([l,val])=>(
                <div key={l} className="flex items-center gap-2"><span className="text-xs text-gray-500 w-16 shrink-0">{l}</span>{bar(val)}</div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Next service: <span className="font-medium text-gray-600">{v.next}</span></p>
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  INCIDENT REPORTS
// ════════════════════════════════════════════════════════════
const IncidentReports = ({ addToast }) => {
  const [incidents, setIncidents] = useState([
    {id:'INC001',driver:'Musa Ibrahim', tanker:'TKR-002',type:'flat',      desc:'Front left tyre went flat on Bokkos Road. Replaced spare.',       time:'Today 09:30 AM',    status:'resolved', priority:'medium'},
    {id:'INC002',driver:'John Danladi', tanker:'TKR-001',type:'delay',     desc:'Heavy traffic at Bokkos junction delayed delivery by 40 minutes.', time:'Today 11:00 AM',    status:'noted',    priority:'low'},
    {id:'INC003',driver:'Yakubu Moses', tanker:'TKR-004',type:'breakdown', desc:'Engine warning light came on. Pulled over and called mechanic.',    time:'Yesterday 03:15 PM',status:'open',     priority:'high'},
    {id:'INC004',driver:'Peter Sunday', tanker:'TKR-003',type:'fuel',      desc:'Tank ran low due to longer route. Stopped to refuel.',             time:'2 days ago 01:00 PM',status:'resolved', priority:'medium'},
  ]);
  const TYPES = {flat:'🚗 Flat Tyre',delay:'⏳ Traffic Delay',breakdown:'🔧 Breakdown',fuel:'⛽ Fuel Issue',accident:'💥 Accident',other:'📋 Other'};
  const PC = {high:'bg-red-100 text-red-700',medium:'bg-yellow-100 text-yellow-700',low:'bg-green-100 text-green-700'};
  const SC = {open:'bg-red-100 text-red-700',noted:'bg-blue-100 text-blue-700',resolved:'bg-green-100 text-green-700'};
  const resolve = id => { setIncidents(p=>p.map(i=>i.id===id?{...i,status:'resolved'}:i)); addToast('success','Incident marked as resolved'); };
  const openCount = incidents.filter(i=>i.status==='open').length;
  return (
    <div>
      {openCount>0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <FaExclamationTriangle className="text-red-500 shrink-0"/>
          <p className="text-sm font-semibold text-red-700">{openCount} open incident{openCount>1?'s':''} require{openCount===1?'s':''} your attention</p>
        </div>
      )}
      <div className="space-y-3">
        {incidents.map(inc=>(
          <div key={inc.id} className={`bg-white rounded-xl p-4 border-l-4 shadow-sm ${inc.status==='open'?'border-red-400':inc.status==='noted'?'border-blue-400':'border-green-400'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-bold text-gray-800 text-sm">{inc.driver}</p>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{inc.tanker}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PC[inc.priority]}`}>{inc.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${SC[inc.status]}`}>{inc.status}</span>
                </div>
                <p className="text-xs font-semibold text-gray-600">{TYPES[inc.type]||inc.type}</p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-2">{inc.time}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{inc.desc}</p>
            {inc.status!=='resolved' && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={()=>resolve(inc.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                  <FaCheck size={10}/> Mark Resolved
                </button>
                <button onClick={()=>addToast('info',`Contacting ${inc.driver}…`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 border border-blue-100">
                  <FaPhone size={10}/> Contact Driver
                </button>
                {inc.status==='open' && (
                  <button onClick={()=>{ setIncidents(p=>p.map(i=>i.id===inc.id?{...i,status:'noted'}:i)); addToast('info','Incident acknowledged'); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-semibold hover:bg-yellow-100 border border-yellow-100">
                    👁️ Acknowledge
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  PERFORMANCE LEADERBOARD
// ════════════════════════════════════════════════════════════
const PerformanceLeaderboard = ({ drivers }) => {
  const ranked = [...drivers].sort((a,b)=>b.rating-a.rating);
  const MEDALS = ['🥇','🥈','🥉'];
  return (
    <div className="space-y-2.5">
      {ranked.map((d,i)=>(
        <div key={d.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm
          ${i===0?'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200':
            i===1?'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200':
            i===2?'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200':'bg-white border-gray-100'}`}>
          <span className="text-xl w-8 shrink-0 text-center">{MEDALS[i]||`#${i+1}`}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm">{d.firstName} {d.lastName}</p>
            <p className="text-xs text-gray-500">{d.tankerId} · {d.totalDeliveries} deliveries</p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end"><FaStar className="text-yellow-400 text-sm"/><span className="font-black text-gray-800">{d.rating}</span></div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${d.online?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
              {d.online?'Online':'Offline'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  EARNINGS OVERVIEW
// ════════════════════════════════════════════════════════════
const EarningsOverview = ({ drivers, addToast }) => {
  const [period, setPeriod] = useState('today');
  const earningsData = {
    today: [4500,3800,0,5200,0],
    week:  [28000,22000,18000,31000,12000],
    month: [112000,88000,75000,124000,48000],
  };
  const vals = earningsData[period];
  const total = vals.reduce((a,b)=>a+b,0);
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-bold text-gray-700">Driver Earnings</p>
        <div className="flex bg-gray-100 rounded-xl p-0.5 text-xs">
          {['today','week','month'].map(v=>(
            <button key={v} onClick={()=>setPeriod(v)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${period===v?'bg-white text-green-700 shadow':'text-gray-500 hover:text-gray-700'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-4 text-white mb-4">
        <p className="text-xs text-green-100">Total Disbursed ({period})</p>
        <p className="text-3xl font-black mt-1">₦{total.toLocaleString()}</p>
        <p className="text-green-100 text-xs mt-1">{drivers.length} drivers</p>
      </div>
      <div className="space-y-2.5">
        {drivers.map((d,i)=>(
          <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {d.firstName.charAt(0)}{d.lastName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{d.firstName} {d.lastName}</p>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{width:`${total>0?(vals[i]/total)*100:0}%`}}/>
              </div>
            </div>
            <p className="font-bold text-green-700 text-sm shrink-0">₦{(vals[i]||0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <button onClick={()=>addToast('success','Payroll report exported','Driver earnings CSV downloaded.')}
        className="w-full mt-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
        <FaDownload size={12}/> Export Payroll Report
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  SHIFT TRACKER
// ════════════════════════════════════════════════════════════
const ShiftTracker = ({ drivers }) => {
  const shifts = [
    {driverId:'DRV001',start:'07:00 AM',deliveries:3,target:8,status:'active'},
    {driverId:'DRV002',start:'06:30 AM',deliveries:5,target:8,status:'active'},
    {driverId:'DRV003',start:'—',       deliveries:0,target:8,status:'off'},
    {driverId:'DRV004',start:'08:00 AM',deliveries:2,target:8,status:'active'},
    {driverId:'DRV005',start:'—',       deliveries:0,target:8,status:'leave'},
  ];
  return (
    <div className="space-y-2.5">
      {drivers.map((d,i)=>{
        const s = shifts[i];
        return (
          <div key={d.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow transition-shadow">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                {d.firstName.charAt(0)}{d.lastName.charAt(0)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${d.online?'bg-green-500':'bg-gray-300'}`}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">{d.firstName} {d.lastName}</p>
              <p className="text-xs text-gray-500">{d.tankerId} · Shift since {s.start}</p>
              {s.status==='active' && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{width:`${(s.deliveries/s.target)*100}%`}}/>
                  </div>
                  <span className="text-xs text-gray-500">{s.deliveries}/{s.target}</span>
                </div>
              )}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0
              ${s.status==='active'?'bg-green-100 text-green-700':s.status==='leave'?'bg-orange-100 text-orange-700':'bg-gray-100 text-gray-500'}`}>
              {s.status==='active'?`${s.deliveries} done`:s.status==='leave'?'On Leave':'Off Shift'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ════════════════════════════════════════════════════════════
const MapCtrl = ({ center }) => { const map = useMap(); useEffect(()=>{ if(center) map.flyTo(center,16); },[center,map]); return null; };

const TabBtn = ({ active, onClick, icon:Icon, label, badge }) => (
  <button onClick={onClick}
    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors
      ${active?'border-green-600 text-green-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
    <Icon size={13} className={active?'text-green-600':'text-gray-400'}/>
    {label}
    {badge>0&&<span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{badge}</span>}
  </button>
);

const StatCard = ({ icon:Icon, label, value, subvalue, color }) => (
  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 hover:bg-white/30 transition-colors">
    <div className="flex items-center gap-2">
      <div className={`${color} p-2 rounded-lg shrink-0`}><Icon className="text-white text-sm"/></div>
      <div>
        <p className="text-[11px] text-white/80 leading-none">{label}</p>
        <p className="text-lg font-black text-white mt-0.5 leading-none">{value}</p>
        {subvalue&&<p className="text-[10px] text-white/60 mt-0.5">{subvalue}</p>}
      </div>
    </div>
  </div>
);

const MetricCard = ({ title, value, change, icon:Icon, color }) => (
  <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start">
      <div><p className="text-xs text-gray-500">{title}</p><p className="text-2xl font-black text-gray-800 mt-1">{value}</p></div>
      <div className={`${color} p-3 rounded-xl`}><Icon className="text-white text-lg"/></div>
    </div>
    <p className="text-xs text-green-600 mt-2 font-medium">{change} from last period</p>
  </div>
);

const InfoRow = ({label,value}) => (<div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-semibold text-gray-800">{value}</p></div>);

// CSV export helper
const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row=>keys.map(k=>JSON.stringify(row[k]??'')).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
};

// ════════════════════════════════════════════════════════════
//  MAIN ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const {toasts, add:addToast, remove:removeToast} = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignOrder, setAssignOrder] = useState(null);
  const [confirmDel, setConfirmDel] = useState({show:false,id:null,type:null});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selOrder, setSelOrder] = useState(null);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [fleetTab, setFleetTab] = useState('health');       // health | earnings | shifts | leaderboard | incidents
  const [mapCenter, setMapCenter] = useState([9.3265,8.9947]);
  const [mapZoom] = useState(13);
  const [showAllDrivers, setShowAllDrivers] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(true);
  const [showRoutes, setShowRoutes] = useState(false);
  const [mapLayer, setMapLayer] = useState('streets');
  const [selDriverMap, setSelDriverMap] = useState(null);

  // ── DATA ────────────────────────────────────────────────
  const [students, setStudents] = useState([
    {id:'STU001',firstName:'John',   lastName:'Danladi',  email:'john.d@plasu.edu.ng',    phone:'+234 803 123 4567',matricNumber:'PLASU/2021/CSC/001',department:'Computer Science',    level:'300',hall:'Daniel Hall',roomNumber:'B202',status:'active',  registeredAt:'2024-01-15',plan:'Standard',balance:10000,totalOrders:12,totalSpent:60000, verified:true},
    {id:'STU002',firstName:'Amina',  lastName:'Mohammed', email:'amina.m@plasu.edu.ng',   phone:'+234 804 567 8901',matricNumber:'PLASU/2022/IT/045',  department:'Information Tech',    level:'200',hall:'Mary Hall',  roomNumber:'A105',status:'active',  registeredAt:'2024-01-10',plan:'Basic',   balance:5000, totalOrders:8, totalSpent:40000, verified:true},
    {id:'STU003',firstName:'Peter',  lastName:'Sunday',   email:'peter.s@plasu.edu.ng',   phone:'+234 805 678 9012',matricNumber:'PLASU/2020/CVE/112',  department:'Civil Engineering',   level:'400',hall:'Peter Hall', roomNumber:'C308',status:'inactive',registeredAt:'2023-09-05',plan:'Premium',  balance:-2000,totalOrders:24,totalSpent:432000,verified:true},
    {id:'STU004',firstName:'Esther', lastName:'Yakubu',   email:'esther.y@plasu.edu.ng',  phone:'+234 806 789 0123',matricNumber:'PLASU/2023/EEE/078',  department:'Electrical Eng',      level:'100',hall:'Esther Hall',roomNumber:'D412',status:'pending', registeredAt:'2024-01-19',plan:'Basic',   balance:0,    totalOrders:0, totalSpent:0,     verified:false},
  ]);

  const [drivers, setDrivers] = useState([
    {id:'DRV001',firstName:'Musa',   lastName:'Ibrahim',  email:'musa.i@hydromail.com',   phone:'+234 802 234 5678',licenseNumber:'DL-2023-0456',tankerId:'TKR-002',status:'active',   online:true, rating:4.8,totalDeliveries:342,joinedAt:'2023-06-15',lastActive:'Just now',   currentLocation:'Bokkos Road',   vehicleType:'8000L Tanker',verified:true},
    {id:'DRV002',firstName:'John',   lastName:'Danladi',  email:'john.d@hydromail.com',   phone:'+234 803 123 4567',licenseNumber:'DL-2022-0890',tankerId:'TKR-001',status:'active',   online:true, rating:4.9,totalDeliveries:421,joinedAt:'2022-11-20',lastActive:'2 min ago', currentLocation:'PLASU Campus',  vehicleType:'5000L Tanker',verified:true},
    {id:'DRV003',firstName:'Peter',  lastName:'Sunday',   email:'peter.s@hydromail.com',  phone:'+234 805 345 6789',licenseNumber:'DL-2023-0123',tankerId:'TKR-003',status:'offline',  online:false,rating:4.7,totalDeliveries:267,joinedAt:'2023-03-10',lastActive:'1 hour ago',currentLocation:'Workshop',      vehicleType:'5000L Tanker',verified:true},
    {id:'DRV004',firstName:'Yakubu', lastName:'Moses',    email:'yakubu.m@hydromail.com', phone:'+234 806 456 7890',licenseNumber:'DL-2023-0789',tankerId:'TKR-004',status:'active',   online:true, rating:4.6,totalDeliveries:189,joinedAt:'2023-08-01',lastActive:'5 min ago', currentLocation:'Bokkos Market', vehicleType:'6000L Tanker',verified:true},
    {id:'DRV005',firstName:'Hauwa',  lastName:'Mohammed', email:'hauwa.m@hydromail.com',  phone:'+234 807 567 8901',licenseNumber:'DL-2023-0456',tankerId:'TKR-005',status:'on-leave', online:false,rating:4.9,totalDeliveries:156,joinedAt:'2023-09-15',lastActive:'2 days ago',currentLocation:'Home',          vehicleType:'5000L Tanker',verified:true},
  ]);

  const [orders, setOrders] = useState([
    {id:'ORD001',studentId:'STU001',studentName:'John Danladi',   location:'Daniel Hall, Room B202',  amount:500, status:'pending',    priority:'high',  requestedAt:'2024-01-20 08:30',scheduledDate:'2024-01-20',scheduledTime:'10:00–12:00',paymentStatus:'paid',   amountPaid:500,  notes:'Please deliver before noon', assignedDriver:null,   assignedTanker:null,   estimatedArrival:null},
    {id:'ORD002',studentId:'STU002',studentName:'Amina Mohammed', location:'Mary Hall, Room A105',    amount:500, status:'approved',   priority:'medium',requestedAt:'2024-01-20 09:15',scheduledDate:'2024-01-20',scheduledTime:'02:00–04:00',paymentStatus:'paid',   amountPaid:500,  notes:'',                           assignedDriver:'DRV001',assignedTanker:'TKR-002',estimatedArrival:'02:30'},
    {id:'ORD003',studentId:'STU003',studentName:'Peter Sunday',   location:'Peter Hall, Room C308',   amount:1000,status:'in-progress',priority:'high',  requestedAt:'2024-01-20 07:45',scheduledDate:'2024-01-20',scheduledTime:'09:00–11:00',paymentStatus:'paid',   amountPaid:1000, notes:'Urgent - Running low',        assignedDriver:'DRV002',assignedTanker:'TKR-001',estimatedArrival:'09:45'},
    {id:'ORD004',studentId:'STU004',studentName:'Esther Yakubu',  location:'Esther Hall, Room D412',  amount:500, status:'pending',    priority:'low',   requestedAt:'2024-01-20 10:00',scheduledDate:'2024-01-21',scheduledTime:'10:00–12:00',paymentStatus:'unpaid', amountPaid:0,    notes:'New student, first order',   assignedDriver:null,   assignedTanker:null,   estimatedArrival:null},
    {id:'ORD005',studentId:'STU001',studentName:'John Danladi',   location:'Daniel Hall, Room B202',  amount:500, status:'completed',  priority:'medium',requestedAt:'2024-01-19 14:30',scheduledDate:'2024-01-19',scheduledTime:'04:00–06:00',paymentStatus:'paid',   amountPaid:500,  notes:'',                           assignedDriver:'DRV003',assignedTanker:'TKR-003',estimatedArrival:'05:15'},
    {id:'ORD006',studentId:'STU002',studentName:'Amina Mohammed', location:'Mary Hall, Room A105',    amount:500, status:'cancelled',  priority:'low',   requestedAt:'2024-01-19 11:00',scheduledDate:'2024-01-19',scheduledTime:'01:00–03:00',paymentStatus:'refunded',amountPaid:500,  notes:'Student cancelled',          assignedDriver:null,   assignedTanker:null,   estimatedArrival:null},
  ]);

  const [driverLocations, setDriverLocations] = useState([
    {id:'DRV001',name:'Musa Ibrahim', position:[9.3265,8.9947],status:'active', tankerId:'TKR-002',speed:35,lastUpdate:'Just now',currentOrder:'ORD002'},
    {id:'DRV002',name:'John Danladi', position:[9.3300,8.9900],status:'active', tankerId:'TKR-001',speed:0, lastUpdate:'2 min ago',currentOrder:'ORD003'},
    {id:'DRV003',name:'Peter Sunday', position:[9.3230,9.0010],status:'offline',tankerId:'TKR-003',speed:0, lastUpdate:'1 hr ago', currentOrder:null},
    {id:'DRV004',name:'Yakubu Moses', position:[9.3240,8.9970],status:'active', tankerId:'TKR-004',speed:25,lastUpdate:'5 min ago',currentOrder:null},
  ]);

  const [notifications, setNotifications] = useState([
    {id:1,message:'New order pending approval — John Danladi',  time:'2 min ago', read:false,type:'order'},
    {id:2,message:'Driver DRV002 completed delivery ORD003',    time:'15 min ago',read:false,type:'delivery'},
    {id:3,message:'New student registered — Esther Yakubu',     time:'25 min ago',read:false,type:'student'},
    {id:4,message:'Payment ₦10,000 received from STU001',       time:'1 hr ago',  read:true, type:'payment'},
    {id:5,message:'Incident reported: TKR-004 breakdown',       time:'2 hrs ago', read:false,type:'incident'},
  ]);

  // Simulate real-time driver movement
  useEffect(() => {
    const id = setInterval(() => {
      setDriverLocations(p=>p.map(d=>{
        if (d.status==='active'&&d.speed>0) return {...d,position:[d.position[0]+(Math.random()-.5)*.001,d.position[1]+(Math.random()-.5)*.001],lastUpdate:'Just now'};
        return d;
      }));
    }, 5000);
    return ()=>clearInterval(id);
  }, []);

  // ── COMPUTED ────────────────────────────────────────────
  const pending    = orders.filter(o=>o.status==='pending');
  const pendingStus = students.filter(s=>s.status==='pending');
  const unreadNot  = notifications.filter(n=>!n.read).length;

  const stats = {
    totalStudents:   students.length,
    activeStudents:  students.filter(s=>s.status==='active').length,
    totalDrivers:    drivers.length,
    activeDrivers:   drivers.filter(d=>d.online).length,
    totalOrders:     orders.length,
    pendingOrders:   pending.length,
    completedOrders: orders.filter(o=>o.status==='completed').length,
    totalRevenue:    orders.filter(o=>o.paymentStatus==='paid').reduce((s,o)=>s+o.amountPaid,0),
    todayRevenue:    orders.filter(o=>o.requestedAt.includes('2024-01-20')&&o.paymentStatus==='paid').reduce((s,o)=>s+o.amountPaid,0),
    avgRating:       (drivers.reduce((s,d)=>s+d.rating,0)/drivers.length).toFixed(1),
    totalWater:      orders.filter(o=>o.status==='completed').reduce((s,o)=>s+o.amount,0),
  };

  // ── FILTERS ─────────────────────────────────────────────
  const filteredStudents = students.filter(s=>{
    const q = searchTerm.toLowerCase();
    const match = s.firstName.toLowerCase().includes(q)||s.lastName.toLowerCase().includes(q)||s.email.toLowerCase().includes(q)||s.matricNumber.toLowerCase().includes(q);
    return match && (filterStatus==='all'||s.status===filterStatus);
  }).sort((a,b)=>sortBy==='name'?a.firstName.localeCompare(b.firstName):new Date(b.registeredAt)-new Date(a.registeredAt));

  const filteredDrivers = drivers.filter(d=>{
    const q = searchTerm.toLowerCase();
    const match = d.firstName.toLowerCase().includes(q)||d.lastName.toLowerCase().includes(q)||d.tankerId.toLowerCase().includes(q);
    return match && (filterStatus==='all'||d.status===filterStatus) && (filterRole==='all'||(filterRole==='online'&&d.online)||(filterRole==='offline'&&!d.online));
  }).sort((a,b)=>sortBy==='rating'?b.rating-a.rating:sortBy==='deliveries'?b.totalDeliveries-a.totalDeliveries:0);

  const filteredOrders = orders.filter(o=>{
    const q = searchTerm.toLowerCase();
    const match = o.studentName.toLowerCase().includes(q)||o.id.toLowerCase().includes(q)||o.location.toLowerCase().includes(q);
    return match && (filterStatus==='all'||o.status===filterStatus);
  }).sort((a,b)=>sortBy==='priority'?({'high':1,'medium':2,'low':3}[a.priority]-{'high':1,'medium':2,'low':3}[b.priority]):new Date(b.requestedAt)-new Date(a.requestedAt));

  // ── ACTIONS ─────────────────────────────────────────────
  const approveOrder = id => {
    setOrders(p=>p.map(o=>o.id===id?{...o,status:'approved'}:o));
    addToast('success',`Order ${id} approved`,'Driver assignment pending.');
    setNotifications(p=>[{id:Date.now(),message:`Order ${id} approved`,time:'Just now',read:false,type:'order'},...p]);
  };
  const rejectOrder = id => {
    setOrders(p=>p.map(o=>o.id===id?{...o,status:'cancelled'}:o));
    addToast('warn',`Order ${id} rejected`);
  };
  const assignDriver = (orderId, driverId) => {
    const drv = drivers.find(d=>d.id===driverId);
    setOrders(p=>p.map(o=>o.id===orderId?{...o,status:'in-progress',assignedDriver:driverId,assignedTanker:drv?.tankerId,estimatedArrival:'Scheduled'}:o));
    addToast('success',`Driver ${drv?.firstName} assigned to ${orderId}`);
  };
  const verifyStudent = id => {
    setStudents(p=>p.map(s=>s.id===id?{...s,verified:true,status:'active'}:s));
    addToast('success','Student verified and activated');
  };
  const toggleDriverOnline = id => {
    const drv = drivers.find(d=>d.id===id);
    setDrivers(p=>p.map(d=>d.id===id?{...d,online:!d.online}:d));
    addToast('info',`${drv?.firstName} is now ${drv?.online?'offline':'online'}`);
  };
  const deleteUser = (id, type) => {
    if (type==='student') setStudents(p=>p.filter(s=>s.id!==id));
    else setDrivers(p=>p.filter(d=>d.id!==id));
    addToast('success',`${type.charAt(0).toUpperCase()+type.slice(1)} removed`);
    setConfirmDel({show:false,id:null,type:null});
  };

  const doExport = () => {
    if      (activeTab==='orders')   exportToCSV(filteredOrders.map(o=>({ID:o.id,Student:o.studentName,Amount:o.amount+'L',Status:o.status,Date:o.scheduledDate,Payment:o.paymentStatus})),'orders.csv');
    else if (activeTab==='students') exportToCSV(filteredStudents.map(s=>({ID:s.id,Name:`${s.firstName} ${s.lastName}`,Email:s.email,Matric:s.matricNumber,Status:s.status,Plan:s.plan})),'students.csv');
    else if (activeTab==='drivers')  exportToCSV(filteredDrivers.map(d=>({ID:d.id,Name:`${d.firstName} ${d.lastName}`,Tanker:d.tankerId,Rating:d.rating,Deliveries:d.totalDeliveries,Status:d.status})),'drivers.csv');
    addToast('success','Report exported','CSV file has been downloaded.');
  };

  const STATUS_BADGE = { pending:'bg-yellow-100 text-yellow-700',approved:'bg-blue-100 text-blue-700','in-progress':'bg-purple-100 text-purple-700',completed:'bg-green-100 text-green-700',cancelled:'bg-red-100 text-red-700',active:'bg-green-100 text-green-700',inactive:'bg-gray-100 text-gray-600','on-leave':'bg-orange-100 text-orange-700',offline:'bg-gray-100 text-gray-600',pending:'bg-yellow-100 text-yellow-700' };
  const PRI_BADGE = { high:'bg-red-100 text-red-700',medium:'bg-yellow-100 text-yellow-700',low:'bg-green-100 text-green-700' };
  const sb = s=>STATUS_BADGE[s]||'bg-gray-100 text-gray-600';

  // ── CHART DATA ───────────────────────────────────────────
  const deliveryTrend = {
    labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets:[
      {label:'Completed',data:[32,38,35,41,45,38,42],borderColor:'#10B981',backgroundColor:'rgba(16,185,129,.1)',fill:true,tension:.4},
      {label:'Pending',  data:[8,6,9,7,5,4,3],       borderColor:'#F59E0B',backgroundColor:'rgba(245,158,11,.1)', fill:true,tension:.4},
    ]
  };
  const userGrowth = {
    labels:['Week 1','Week 2','Week 3','Week 4'],
    datasets:[
      {label:'Students',data:[45,52,58,64],backgroundColor:'#3B82F6',borderRadius:8},
      {label:'Drivers', data:[8,9,10,12],  backgroundColor:'#10B981',borderRadius:8},
    ]
  };
  const orderDist = {
    labels:['Pending','Approved','In Progress','Completed','Cancelled'],
    datasets:[{data:[orders.filter(o=>o.status==='pending').length,orders.filter(o=>o.status==='approved').length,orders.filter(o=>o.status==='in-progress').length,orders.filter(o=>o.status==='completed').length,orders.filter(o=>o.status==='cancelled').length],backgroundColor:['#F59E0B','#3B82F6','#8B5CF6','#10B981','#EF4444'],borderWidth:0}]
  };
  const co = {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.05)'}}}};
  const po = {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}};

  const tileLayers = {streets:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',satellite:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',terrain:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'};
  const tileAttr = {streets:'&copy; OpenStreetMap',satellite:'&copy; Esri',terrain:'&copy; OpenTopoMap'};

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}`}</style>

      <Toast toasts={toasts} remove={removeToast}/>
      <ConfirmDialog show={confirmDel.show} title="Confirm Deletion"
        message={`Are you sure you want to remove this ${confirmDel.type}? This action cannot be undone.`}
        onConfirm={()=>deleteUser(confirmDel.id,confirmDel.type)}
        onCancel={()=>setConfirmDel({show:false,id:null,type:null})}/>
      <AdminSettings show={showSettings} onClose={()=>setShowSettings(false)} addToast={addToast}/>
      <BroadcastModal show={showBroadcast} onClose={()=>setShowBroadcast(false)} addToast={addToast}/>
      <QuickAssignModal show={showAssign} order={assignOrder} drivers={drivers} onAssign={assignDriver} onClose={()=>{setShowAssign(false);setAssignOrder(null);}}/>

      {/* ── HEADER ── */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md"><MdOutlineDashboard className="text-xl text-white"/></div>
              <h1 className="text-sm sm:text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setShowBroadcast(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors">
                <FaBullhorn size={11}/> Broadcast
              </button>
              {pending.length>0 && (
                <div className="hidden md:flex items-center gap-1.5 bg-yellow-100 px-3 py-1.5 rounded-full border border-yellow-200 cursor-pointer" onClick={()=>setActiveTab('orders')}>
                  <MdOutlinePendingActions className="text-yellow-600"/>
                  <span className="text-xs text-yellow-700 font-semibold">{pending.length} pending</span>
                </div>
              )}
              <button className="relative" onClick={()=>{setNotifications(p=>p.map(n=>({...n,read:true}))); addToast('info','All notifications marked as read');}}>
                <FaBell className="text-gray-600 text-xl"/>
                {unreadNot>0&&<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadNot}</span>}
              </button>
              <button onClick={()=>setShowSettings(true)}
                className="w-9 h-9 bg-gray-100 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
                <FaCog className="text-gray-500 text-sm"/>
              </button>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm">AD</div>
                <div className="hidden md:block"><p className="text-sm font-semibold text-gray-800">Admin User</p><p className="text-xs text-gray-500">Super Admin</p></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ── WELCOME BANNER ── */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white mb-6 shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none"/>
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
            <div>
              <h2 className="text-2xl font-black mb-1">Welcome back, Admin 👋</h2>
              <p className="text-green-100 text-sm">Here's what's happening across your system today.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>setShowBroadcast(true)}
                className="bg-white/20 text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30 backdrop-blur-sm text-sm">
                <FaBullhorn size={12}/> Broadcast
              </button>
              <button onClick={doExport}
                className="bg-white text-green-600 px-4 py-2 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center gap-2 shadow-md text-sm">
                <FaDownload size={12}/> Export
              </button>
              <button onClick={()=>setShowFilters(p=>!p)}
                className="bg-yellow-400 text-green-900 px-4 py-2 rounded-xl font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow-md text-sm">
                <FaFilter size={12}/> Filters
              </button>
              <button onClick={()=>setShowSettings(true)}
                className="bg-white/20 text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30 text-sm">
                <FaCog size={12}/> Settings
              </button>
            </div>
          </div>
          <div className="grid  sm:grid-cols-4 lg:grid-cols-8 gap-3 relative">
            {[
              {icon:FaUsers,           label:'Students',  value:stats.totalStudents,  sub:`${stats.activeStudents} active`,      color:'bg-blue-500'},
              {icon:FaUserTie,         label:'Drivers',   value:stats.totalDrivers,   sub:`${stats.activeDrivers} online`,       color:'bg-green-500'},
              {icon:FaClipboardList,   label:'Orders',    value:stats.totalOrders,    sub:`${stats.pendingOrders} pending`,      color:'bg-purple-500'},
              {icon:MdOutlinePendingActions,label:'Pending',value:stats.pendingOrders, sub:null,                                  color:'bg-yellow-500'},
              {icon:FaCheckCircle,     label:'Completed', value:stats.completedOrders,sub:null,                                  color:'bg-emerald-500'},
              {icon:FaMoneyBillWave,   label:'Revenue',   value:`₦${(stats.totalRevenue/1000).toFixed(1)}K`,sub:null,            color:'bg-cyan-500'},
              {icon:FaStar,            label:'Avg Rating',value:stats.avgRating,      sub:null,                                  color:'bg-pink-500'},
              {icon:FaTint,            label:'Water',     value:`${(stats.totalWater/1000).toFixed(0)}KL`,sub:null,              color:'bg-orange-500'},
            ].map(s=><StatCard key={s.label} {...s}/>)}
          </div>
        </div>

        {/* ── FILTERS ── */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">SEARCH</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                  <input type="text" placeholder="Search anything…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"/>
                </div>
              </div>
              {[
                {label:'STATUS',val:filterStatus,set:setFilterStatus,opts:['all','pending','approved','in-progress','completed','cancelled','active','inactive']},
                {label:'SORT BY',val:sortBy,set:setSortBy,opts:['newest','oldest','name','priority','rating','deliveries']},
                {label:'ROLE/PRIORITY',val:filterRole,set:setFilterRole,opts:['all','online','offline','high','medium','low']},
              ].map(({label,val,set,opts})=>(
                <div key={label}>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
                  <select value={val} onChange={e=>set(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    {opts.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1).replace('-',' ')}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="flex gap-6">
          {/* LEFT: Main Tabs */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="border-b border-gray-100 overflow-x-auto">
                <nav className="flex px-2">
                  <TabBtn active={activeTab==='overview'}  onClick={()=>setActiveTab('overview')}  icon={FaChartBar}           label="Overview"/>
                  <TabBtn active={activeTab==='orders'}    onClick={()=>setActiveTab('orders')}    icon={FaClipboardList}      label="Orders"   badge={pending.length}/>
                  <TabBtn active={activeTab==='students'}  onClick={()=>setActiveTab('students')}  icon={FaUsers}              label="Students" badge={pendingStus.length}/>
                  <TabBtn active={activeTab==='drivers'}   onClick={()=>setActiveTab('drivers')}   icon={FaUserTie}            label="Drivers"/>
                  <TabBtn active={activeTab==='tracking'}  onClick={()=>setActiveTab('tracking')}  icon={FaMapMarkedAlt}       label="Live Map"/>
                  <TabBtn active={activeTab==='analytics'} onClick={()=>setActiveTab('analytics')} icon={FaChartLine}          label="Analytics"/>
                </nav>
              </div>

              <div className="p-5">
                {/* ── OVERVIEW ── */}
                {activeTab==='overview' && (
                  <div className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-5">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <h3 className="font-bold text-gray-800 mb-3">Delivery Trends</h3>
                        <div className="h-56"><Line data={deliveryTrend} options={co}/></div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <h3 className="font-bold text-gray-800 mb-3">Order Distribution</h3>
                        <div className="h-56"><Pie data={orderDist} options={po}/></div>
                      </div>
                    </div>

                    {/* Pending quick actions */}
                    {pending.length>0 && (
                      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                        <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                          <MdOutlinePendingActions className="text-yellow-600"/>{pending.length} Pending Order{pending.length>1?'s':''}
                        </h3>
                        <div className="space-y-2.5">
                          {pending.slice(0,3).map(o=>(
                            <div key={o.id} className="bg-white rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{o.studentName}</p>
                                <p className="text-xs text-gray-500">{o.location} · {o.amount}L · {o.scheduledDate}</p>
                                {o.notes&&<p className="text-xs text-amber-700 mt-0.5">📋 {o.notes}</p>}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={()=>{setAssignOrder(o);setShowAssign(true);}}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                  ⚡ Quick Assign
                                </button>
                                <button onClick={()=>approveOrder(o.id)}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                                  ✓ Approve
                                </button>
                                <button onClick={()=>rejectOrder(o.id)}
                                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-100">
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {pending.length>3&&<button onClick={()=>setActiveTab('orders')} className="mt-2 text-xs text-yellow-700 font-semibold hover:underline">View all {pending.length} pending →</button>}
                      </div>
                    )}

                    {/* Activity feed */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                          Live Activity
                        </h3>
                        <button onClick={()=>setNotifications(p=>p.map(n=>({...n,read:true})))} className="text-xs text-green-600 hover:underline">Mark all read</button>
                      </div>
                      <div className="space-y-2.5">
                        {notifications.slice(0,5).map(n=>(
                          <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${n.read?'bg-gray-50':'bg-blue-50 border border-blue-100'}`}>
                            <div className={`p-2 rounded-lg shrink-0 ${n.type==='order'?'bg-yellow-100':n.type==='delivery'?'bg-green-100':n.type==='incident'?'bg-red-100':n.type==='student'?'bg-blue-100':'bg-purple-100'}`}>
                              {n.type==='order'?<MdOutlinePendingActions className="text-yellow-600 text-sm"/>:n.type==='delivery'?<FaTruck className="text-green-600 text-sm"/>:n.type==='incident'?<FaExclamationTriangle className="text-red-500 text-sm"/>:n.type==='student'?<FaUsers className="text-blue-600 text-sm"/>:<FaMoneyBillWave className="text-purple-600 text-sm"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{n.message}</p>
                              <p className="text-xs text-gray-500">{n.time}</p>
                            </div>
                            {!n.read&&<span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"/>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ORDERS ── */}
                {activeTab==='orders' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">Order Management</h3>
                      <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                        className="border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        {['all','pending','approved','in-progress','completed','cancelled'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>{['Order','Student','Amount','Date/Time','Status','Priority','Driver','Actions'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredOrders.map(o=>(
                            <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-gray-700">{o.id}</td>
                              <td className="px-4 py-3 text-sm text-gray-800">{o.studentName}</td>
                              <td className="px-4 py-3 text-sm font-semibold">{o.amount}L</td>
                              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{o.scheduledDate}<br/><span className="text-xs text-gray-400">{o.scheduledTime}</span></td>
                              <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sb(o.status)}`}>{o.status}</span></td>
                              <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRI_BADGE[o.priority]}`}>{o.priority}</span></td>
                              <td className="px-4 py-3 text-sm text-gray-700">{o.assignedDriver?drivers.find(d=>d.id===o.assignedDriver)?.firstName+' '+drivers.find(d=>d.id===o.assignedDriver)?.lastName:'—'}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5">
                                  <button onClick={()=>{setSelOrder(o);setShowOrderModal(true);}} className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center" title="View"><FaEye size={11}/></button>
                                  {o.status==='pending'&&<>
                                    <button onClick={()=>{setAssignOrder(o);setShowAssign(true);}} className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center justify-center" title="Quick Assign"><FaBolt size={10}/></button>
                                    <button onClick={()=>approveOrder(o.id)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center" title="Approve"><FaCheck size={10}/></button>
                                    <button onClick={()=>rejectOrder(o.id)} className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center" title="Reject"><FaTimes size={10}/></button>
                                  </>}
                                  {o.status==='approved'&&<button onClick={()=>{setAssignOrder(o);setShowAssign(true);}} className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 flex items-center justify-center" title="Assign Driver"><FaUserTie size={10}/></button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── STUDENTS ── */}
                {activeTab==='students' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">Student Management</h3>
                      <button onClick={()=>setShowAddStudent(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors">
                        <FaUserPlus size={12}/> Add Student
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>{['Student','Matric','Dept','Level','Hall','Status','Plan','Balance','Actions'].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredStudents.map(s=>(
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs shrink-0">{s.firstName.charAt(0)}{s.lastName.charAt(0)}</div>
                                  <div><p className="text-sm font-semibold text-gray-800">{s.firstName} {s.lastName}</p><p className="text-xs text-gray-400">{s.email}</p></div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.matricNumber}</td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.department}</td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.level}</td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.hall}, Rm {s.roomNumber}</td>
                              <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sb(s.status)}`}>{s.status}</span></td>
                              <td className="px-3 py-3 text-xs text-gray-600">{s.plan}</td>
                              <td className="px-3 py-3 text-sm font-bold"><span className={s.balance<0?'text-red-600':'text-green-600'}>₦{s.balance.toLocaleString()}</span></td>
                              <td className="px-3 py-3">
                                <div className="flex gap-1.5">
                                  {!s.verified&&<button onClick={()=>verifyStudent(s.id)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center" title="Verify"><FaUserCheck size={10}/></button>}
                                  <button className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center" title="Edit" onClick={()=>addToast('info',`Editing ${s.firstName}`)}><FaEdit size={10}/></button>
                                  <button onClick={()=>setConfirmDel({show:true,id:s.id,type:'student'})} className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center" title="Delete"><FaTrash size={10}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── DRIVERS ── */}
                {activeTab==='drivers' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800">Driver Management</h3>
                      <button onClick={()=>setShowAddDriver(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 flex items-center gap-1.5 transition-colors">
                        <FaUserPlus size={12}/> Add Driver
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>{['Driver','Tanker','Status','Online','Rating','Deliveries','Location','Actions'].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredDrivers.map(d=>(
                            <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">{d.firstName.charAt(0)}{d.lastName.charAt(0)}</div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${d.online?'bg-green-500':'bg-gray-300'}`}/>
                                  </div>
                                  <div><p className="text-sm font-semibold text-gray-800">{d.firstName} {d.lastName}</p><p className="text-xs text-gray-400">{d.phone}</p></div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-sm font-medium text-gray-700">{d.tankerId}</td>
                              <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sb(d.status)}`}>{d.status}</span></td>
                              <td className="px-3 py-3">
                                <button onClick={()=>toggleDriverOnline(d.id)} className="transition-transform active:scale-90">
                                  {d.online?<FaToggleOn className="text-3xl text-green-500"/>:<FaToggleOff className="text-3xl text-gray-300"/>}
                                </button>
                              </td>
                              <td className="px-3 py-3"><div className="flex items-center gap-1"><FaStar className="text-yellow-400 text-xs"/><span className="text-sm font-bold">{d.rating}</span></div></td>
                              <td className="px-3 py-3 text-sm text-gray-700">{d.totalDeliveries}</td>
                              <td className="px-3 py-3 text-xs text-gray-600 max-w-[100px] truncate">{d.currentLocation}</td>
                              <td className="px-3 py-3">
                                <div className="flex gap-1.5">
                                  <button onClick={()=>addToast('info',`Viewing ${d.firstName}'s profile`)} className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center"><FaEdit size={10}/></button>
                                  <button onClick={()=>setConfirmDel({show:true,id:d.id,type:'driver'})} className="w-7 h-7 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center"><FaTrash size={10}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── LIVE MAP ── */}
                {activeTab==='tracking' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Live Tracking Map</h3>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          {label:'Drivers',ico:FaTruck,active:showAllDrivers,fn:()=>setShowAllDrivers(p=>!p),color:'green'},
                          {label:'Orders', ico:FaClipboardList,active:showAllOrders,fn:()=>setShowAllOrders(p=>!p),color:'blue'},
                          {label:'Routes', ico:FaRoute,active:showRoutes,fn:()=>setShowRoutes(p=>!p),color:'purple'},
                        ].map(({label,ico:Ico,active:a,fn,color})=>(
                          <button key={label} onClick={fn}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all
                              ${a?`bg-${color}-600 text-white shadow`:`bg-gray-100 text-gray-600 hover:bg-gray-200`}`}>
                            <Ico size={11}/>{label}
                          </button>
                        ))}
                        <button onClick={()=>setMapLayer(p=>({streets:'satellite',satellite:'terrain',terrain:'streets'})[p])}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 flex items-center gap-1.5">
                          <FaLayerGroup size={11}/>{mapLayer}
                        </button>
                        <button onClick={()=>setMapCenter([9.3265,8.9947])}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200">
                          <FaCrosshairs size={11}/>
                        </button>
                      </div>
                    </div>
                    <div className="h-[440px] rounded-2xl overflow-hidden shadow-inner">
                      <MapContainer center={mapCenter} zoom={mapZoom} style={{height:'100%',width:'100%'}}>
                        <TileLayer url={tileLayers[mapLayer]} attribution={tileAttr[mapLayer]}/>
                        <MapCtrl center={mapCenter}/>
                        {showAllDrivers && driverLocations.map(d=>(
                          <Marker key={d.id} position={d.position}
                            icon={L.divIcon({className:'',html:`<div style="background:${d.status==='active'?'#10B981':'#9CA3AF'};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3)">🚚</div>`,iconSize:[40,40],iconAnchor:[20,20],popupAnchor:[0,-20]})}>
                            <Popup><div className="p-2 min-w-[180px]">
                              <div className="flex items-center gap-2 mb-2"><span className={`w-2 h-2 rounded-full ${d.status==='active'?'bg-green-500':'bg-gray-400'}`}/><strong>{d.name}</strong></div>
                              <p className="text-sm">🚛 {d.tankerId}</p>
                              <p className="text-sm">⚡ {d.speed} km/h</p>
                              {d.currentOrder&&<p className="text-sm">📦 {d.currentOrder}</p>}
                              <p className="text-xs text-gray-400 mt-1">{d.lastUpdate}</p>
                              <button onClick={()=>setMapCenter(d.position)} className="mt-2 w-full bg-green-600 text-white text-xs py-1.5 rounded-lg">Track</button>
                            </div></Popup>
                          </Marker>
                        ))}
                        {showAllOrders && orders.filter(o=>o.status!=='completed'&&o.status!=='cancelled').map((o,i)=>{
                          const pos = [[9.3265,8.9947],[9.3280,8.9910],[9.3300,8.9880],[9.3240,8.9970]][i%4];
                          const c = o.status==='pending'?'#F59E0B':o.status==='approved'?'#3B82F6':o.status==='in-progress'?'#8B5CF6':'#10B981';
                          return (<Marker key={o.id} position={pos}
                            icon={L.divIcon({className:'',html:`<div style="background:${c};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.2)">📍</div>`,iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-14]})}>
                            <Popup><div className="p-2 min-w-[160px]">
                              <strong className="text-sm">{o.studentName}</strong>
                              <p className="text-xs text-gray-600 mt-1">{o.location}</p>
                              <p className="text-xs">{o.amount}L</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sb(o.status)}`}>{o.status}</span>
                            </div></Popup>
                          </Marker>);
                        })}
                        {showRoutes && selDriverMap && <Polyline positions={[selDriverMap.position,[9.3280,8.9910]]} color="#10B981" weight={3} dashArray="6,4"/>}
                      </MapContainer>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {driverLocations.map(d=>(
                        <div key={d.id} onClick={()=>{setSelDriverMap(d);setMapCenter(d.position);}}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md
                            ${selDriverMap?.id===d.id?'border-green-500 bg-green-50':'border-gray-100 bg-white'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${d.status==='active'?'bg-green-500 animate-pulse':'bg-gray-400'}`}/>
                              <p className="text-xs font-bold text-gray-800 truncate">{d.name}</p>
                            </div>
                            <span className="text-xs text-gray-400">{d.tankerId}</span>
                          </div>
                          <p className="text-xs text-gray-500">{d.speed} km/h · {d.lastUpdate}</p>
                          {d.currentOrder&&<p className="text-xs bg-blue-50 text-blue-600 mt-1 px-2 py-0.5 rounded-lg">📦 {d.currentOrder}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ANALYTICS ── */}
                {activeTab==='analytics' && (
                  <div className="space-y-5">
                    <div className="grid  md:grid-cols-4 gap-4">
                      <MetricCard title="Total Revenue"    value={`₦${stats.totalRevenue.toLocaleString()}`} change="+12.5%" icon={FaMoneyBillWave}  color="bg-green-500"/>
                      <MetricCard title="Avg Order Value"  value={`₦${(stats.totalRevenue/(stats.completedOrders||1)).toFixed(0)}`} change="+5.2%" icon={FaDollarSign} color="bg-blue-500"/>
                      <MetricCard title="Completion Rate"  value={`${((stats.completedOrders/stats.totalOrders)*100||0).toFixed(1)}%`} change="+2.3%" icon={FaCheckCircle} color="bg-purple-500"/>
                      <MetricCard title="Active Users"     value={stats.activeStudents+stats.activeDrivers} change="+8" icon={FaUsers} color="bg-orange-500"/>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h3 className="font-bold text-gray-800 mb-3">User Growth</h3>
                      <div className="h-72"><Bar data={userGrowth} options={co}/></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Fleet & Operations Sidebar */}
          <div className="hidden xl:block w-80 shrink-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-24">
              {/* Sidebar tabs */}
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {[
                  {id:'health',    icon:'🔧',label:'Fleet'},
                  {id:'incidents', icon:'⚠️', label:'Incidents'},
                  {id:'earnings',  icon:'💰',label:'Earnings'},
                  {id:'leaderboard',icon:'🏆',label:'Top'},
                  {id:'shifts',   icon:'⏱️',label:'Shifts'},
                ].map(t=>(
                  <button key={t.id} onClick={()=>setFleetTab(t.id)}
                    className={`flex-1 py-3 text-xs font-semibold whitespace-nowrap flex flex-col items-center gap-0.5 border-b-2 transition-colors
                      ${fleetTab===t.id?'border-green-600 text-green-600':'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    <span className="text-base leading-none">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {fleetTab==='health'     && <FleetHealthPanel addToast={addToast}/>}
                {fleetTab==='incidents'  && <IncidentReports addToast={addToast}/>}
                {fleetTab==='earnings'   && <EarningsOverview drivers={drivers} addToast={addToast}/>}
                {fleetTab==='leaderboard'&& <PerformanceLeaderboard drivers={drivers}/>}
                {fleetTab==='shifts'     && <ShiftTracker drivers={drivers}/>}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fleet Panel (visible on smaller screens) */}
        <div className="xl:hidden mt-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {[{id:'health',icon:'🔧',label:'Fleet Health'},{id:'incidents',icon:'⚠️',label:'Incidents'},{id:'earnings',icon:'💰',label:'Earnings'},{id:'leaderboard',icon:'🏆',label:'Leaderboard'},{id:'shifts',icon:'⏱️',label:'Shifts'}].map(t=>(
                <button key={t.id} onClick={()=>setFleetTab(t.id)}
                  className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors
                    ${fleetTab===t.id?'border-green-600 text-green-600':'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {fleetTab==='health'     && <FleetHealthPanel addToast={addToast}/>}
              {fleetTab==='incidents'  && <IncidentReports addToast={addToast}/>}
              {fleetTab==='earnings'   && <EarningsOverview drivers={drivers} addToast={addToast}/>}
              {fleetTab==='leaderboard'&& <PerformanceLeaderboard drivers={drivers}/>}
              {fleetTab==='shifts'     && <ShiftTracker drivers={drivers}/>}
            </div>
          </div>
        </div>
      </main>

      {/* ── ORDER DETAIL MODAL ── */}
      {showOrderModal && selOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Order Details — {selOrder.id}</h3>
                <button onClick={()=>setShowOrderModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${sb(selOrder.status)}`}>{selOrder.status}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${PRI_BADGE[selOrder.priority]}`}>{selOrder.priority} priority</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[['Student',selOrder.studentName],['Location',selOrder.location],['Amount',`${selOrder.amount}L`],['Scheduled',`${selOrder.scheduledDate} ${selOrder.scheduledTime}`],['Payment',selOrder.paymentStatus],['Amount Paid',`₦${selOrder.amountPaid.toLocaleString()}`]].map(([l,v])=><InfoRow key={l} label={l} value={v}/>)}
              </div>
              {selOrder.notes&&<div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-sm text-amber-800">📋 {selOrder.notes}</div>}
              {selOrder.status!=='cancelled'&&selOrder.status!=='completed'&&(
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">ASSIGN DRIVER</p>
                  <select defaultValue={selOrder.assignedDriver||''}
                    onChange={e=>{ if(e.target.value) assignDriver(selOrder.id, e.target.value); }}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select driver…</option>
                    {drivers.filter(d=>d.status==='active'&&d.online).map(d=>(
                      <option key={d.id} value={d.id}>{d.firstName} {d.lastName} — {d.tankerId} (⭐ {d.rating})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                {selOrder.status==='pending'&&<>
                  <button onClick={()=>{approveOrder(selOrder.id);setShowOrderModal(false);}} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm">Approve</button>
                  <button onClick={()=>{rejectOrder(selOrder.id);setShowOrderModal(false);}} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-sm">Reject</button>
                </>}
                <button onClick={()=>setShowOrderModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD DRIVER MODAL ── */}
      {showAddDriver && <AddDriverModal onClose={()=>setShowAddDriver(false)} onAdd={d=>{setDrivers(p=>[...p,{...d,id:`DRV${String(p.length+1).padStart(3,'0')}`}]);setShowAddDriver(false);addToast('success','Driver added successfully!');}} />}

      {/* ── ADD STUDENT MODAL ── */}
      {showAddStudent && <AddStudentModal onClose={()=>setShowAddStudent(false)} onAdd={s=>{setStudents(p=>[...p,{...s,id:`STU${String(p.length+1).padStart(3,'0')}`}]);setShowAddStudent(false);addToast('success','Student added successfully!');}} />}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  ADD DRIVER MODAL
// ════════════════════════════════════════════════════════════
const AddDriverModal = ({ onClose, onAdd }) => {
  const [f, setF] = useState({firstName:'',lastName:'',email:'',phone:'',licenseNumber:'',tankerId:'',vehicleType:'5000L Tanker',emergencyContact:'',address:''});
  const submit = e => { e.preventDefault(); onAdd({...f,status:'active',online:false,rating:0,totalDeliveries:0,joinedAt:new Date().toISOString().split('T')[0],lastActive:'Just now',currentLocation:'Depot',verified:true}); };
  const inp = (label,k,type='text',required=true) => (
    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">{label.toUpperCase()}</label>
      <input type={type} required={required} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"/></div>
  );
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-center mb-5"><h3 className="text-xl font-bold text-gray-800">Add New Driver</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button></div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">{inp('First Name','firstName')}{inp('Last Name','lastName')}</div>
          {inp('Email','email','email')}{inp('Phone','phone','tel')}{inp('License Number','licenseNumber')}
          <div className="grid grid-cols-2 gap-3">{inp('Tanker ID','tankerId')}
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">VEHICLE TYPE</label>
              <select value={f.vehicleType} onChange={e=>setF(p=>({...p,vehicleType:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                {['5000L Tanker','8000L Tanker','10000L Tanker'].map(o=><option key={o}>{o}</option>)}
              </select></div>
          </div>
          {inp('Emergency Contact','emergencyContact','tel')}{inp('Address','address')}
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Add Driver</button></div>
        </form>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  ADD STUDENT MODAL
// ════════════════════════════════════════════════════════════
const AddStudentModal = ({ onClose, onAdd }) => {
  const [f, setF] = useState({firstName:'',lastName:'',email:'',phone:'',matricNumber:'',department:'',level:'100',hall:'',roomNumber:'',plan:'Basic'});
  const submit = e => { e.preventDefault(); onAdd({...f,status:'pending',balance:0,totalOrders:0,totalSpent:0,registeredAt:new Date().toISOString().split('T')[0],lastActive:'Just now',verified:false}); };
  const inp = (label,k,type='text') => (
    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">{label.toUpperCase()}</label>
      <input type={type} required value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"/></div>
  );
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-center mb-5"><h3 className="text-xl font-bold text-gray-800">Add New Student</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button></div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">{inp('First Name','firstName')}{inp('Last Name','lastName')}</div>
          {inp('Email','email','email')}{inp('Phone','phone','tel')}{inp('Matric Number','matricNumber')}{inp('Department','department')}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">LEVEL</label><select value={f.level} onChange={e=>setF(p=>({...p,level:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500">{['100','200','300','400','500'].map(o=><option key={o}>{o}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">PLAN</label><select value={f.plan} onChange={e=>setF(p=>({...p,plan:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500">{['Basic','Standard','Premium'].map(o=><option key={o}>{o}</option>)}</select></div>
          </div>
          {inp('Hall of Residence','hall')}{inp('Room Number','roomNumber')}
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">Add Student</button></div>
        </form>
      </div>
    </div>
  );
};

// Helper components used inline



export default AdminDashboard;