// src/pages/Settings.jsx
import React, { useState } from 'react';

import { 
  FaUser, 
  FaTruck,
  FaBell, 
  FaLock, 
  FaPalette,
  FaGlobe,
  FaMobile,
  FaEnvelope,
  FaCreditCard,
  FaSave,
  FaToggleOn,
  FaToggleOff,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import { MdOutlineWaterDrop } from 'react-icons/md';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: false,
    delivery: true,
    payment: true,
    marketing: false
  });

  const [profile, setProfile] = useState({
    name: 'John Danladi',
    email: 'john.d@plasu.edu.ng',
    phone: '+234 803 123 4567',
    matricNumber: 'PLASU/2021/CSC/001',
    department: 'Computer Science',
    level: '300'
  });

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const sections = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'payment', label: 'Payment Methods', icon: FaCreditCard }
  ];

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-24">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-green-600 text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <section.icon className={activeSection === section.id ? 'text-white' : 'text-gray-500'} />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Profile Information</h2>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Matric Number</label>
                        <input
                          type="text"
                          value={profile.matricNumber}
                          readOnly
                          className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                        />
                      </div>
                    </div>
                    <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 flex items-center gap-2">
                      <FaSave />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    <NotificationToggle
                      label="Email Notifications"
                      description="Receive updates via email"
                      enabled={notifications.email}
                      onToggle={() => handleNotificationToggle('email')}
                      icon={FaEnvelope}
                    />
                    <NotificationToggle
                      label="SMS Notifications"
                      description="Get text messages for deliveries"
                      enabled={notifications.sms}
                      onToggle={() => handleNotificationToggle('sms')}
                      icon={FaMobile}
                    />
                    <NotificationToggle
                      label="Push Notifications"
                      description="Browser push notifications"
                      enabled={notifications.push}
                      onToggle={() => handleNotificationToggle('push')}
                      icon={FaBell}
                    />
                    <NotificationToggle
                      label="Delivery Updates"
                      description="Real-time delivery status"
                      enabled={notifications.delivery}
                      onToggle={() => handleNotificationToggle('delivery')}
                      icon={FaTruck}
                    />
                    <NotificationToggle
                      label="Payment Alerts"
                      description="Payment confirmations and reminders"
                      enabled={notifications.payment}
                      onToggle={() => handleNotificationToggle('payment')}
                      icon={FaCreditCard}
                    />
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Security Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={password.current}
                        onChange={(e) => setPassword({ ...password, current: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={password.new}
                        onChange={(e) => setPassword({ ...password, new: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={password.confirm}
                        onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800">
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Appearance</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {darkMode ? <FaMoon className="text-gray-600" /> : <FaSun className="text-yellow-500" />}
                        <div>
                          <p className="font-medium text-gray-800">Dark Mode</p>
                          <p className="text-xs text-gray-500">Switch between light and dark themes</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="text-2xl"
                      >
                        {darkMode ? <FaToggleOn className="text-green-600" /> : <FaToggleOff className="text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Toggle Component
const NotificationToggle = ({ label, description, enabled, onToggle, icon: Icon }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <Icon className="text-gray-600" />
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className="text-2xl"
    >
      {enabled ? <FaToggleOn className="text-green-600" /> : <FaToggleOff className="text-gray-400" />}
    </button>
  </div>
);

export default Settings;