// src/services/apiService.js

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

// Helper function for making API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle token expiration
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth Services
export const authAPI = {
  login: (credentials) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  
  logout: () => {
    localStorage.removeItem('token');
    return apiRequest('/auth/logout', { method: 'POST' });
  },
  
  register: (userData) => 
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  
  forgotPassword: (email) => 
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  
  resetPassword: (token, password) => 
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    }),
  
  verifyEmail: (token) => 
    apiRequest(`/auth/verify-email/${token}`, { method: 'GET' }),
  
  getCurrentUser: () => 
    apiRequest('/auth/me', { method: 'GET' }),
  
  updateProfile: (userData) => 
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
};

// Tanker Services
export const tankerAPI = {
  getAllTankers: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/tankers${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getTankerById: (id) => 
    apiRequest(`/tankers/${id}`, { method: 'GET' }),
  
  createTanker: (tankerData) => 
    apiRequest('/tankers', {
      method: 'POST',
      body: JSON.stringify(tankerData)
    }),
  
  updateTanker: (id, tankerData) => 
    apiRequest(`/tankers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tankerData)
    }),
  
  deleteTanker: (id) => 
    apiRequest(`/tankers/${id}`, { method: 'DELETE' }),
  
  getTankerLocation: (id) => 
    apiRequest(`/tankers/${id}/location`, { method: 'GET' }),
  
  updateTankerLocation: (id, location) => 
    apiRequest(`/tankers/${id}/location`, {
      method: 'PUT',
      body: JSON.stringify(location)
    }),
  
  getTankerStatus: (id) => 
    apiRequest(`/tankers/${id}/status`, { method: 'GET' }),
  
  updateTankerStatus: (id, status) => 
    apiRequest(`/tankers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  
  assignDriver: (tankerId, driverId) => 
    apiRequest(`/tankers/${tankerId}/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ driverId })
    }),
  
  getTankerMaintenance: (id) => 
    apiRequest(`/tankers/${id}/maintenance`, { method: 'GET' }),
  
  scheduleMaintenance: (id, maintenanceData) => 
    apiRequest(`/tankers/${id}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(maintenanceData)
    })
};

// Delivery Services
export const deliveryAPI = {
  getAllDeliveries: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/deliveries${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getDeliveryById: (id) => 
    apiRequest(`/deliveries/${id}`, { method: 'GET' }),
  
  createDelivery: (deliveryData) => 
    apiRequest('/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryData)
    }),
  
  updateDelivery: (id, deliveryData) => 
    apiRequest(`/deliveries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deliveryData)
    }),
  
  deleteDelivery: (id) => 
    apiRequest(`/deliveries/${id}`, { method: 'DELETE' }),
  
  startDelivery: (id) => 
    apiRequest(`/deliveries/${id}/start`, { method: 'POST' }),
  
  completeDelivery: (id, completionData) => 
    apiRequest(`/deliveries/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData)
    }),
  
  cancelDelivery: (id, reason) => 
    apiRequest(`/deliveries/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  
  getDeliveryHistory: (tankerId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/deliveries/history/${tankerId}${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getTodaysSchedule: () => 
    apiRequest('/deliveries/schedule/today', { method: 'GET' }),
  
  getUpcomingDeliveries: (days = 7) => 
    apiRequest(`/deliveries/upcoming?days=${days}`, { method: 'GET' })
};

// Driver Services
export const driverAPI = {
  getAllDrivers: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/drivers${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getDriverById: (id) => 
    apiRequest(`/drivers/${id}`, { method: 'GET' }),
  
  createDriver: (driverData) => 
    apiRequest('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData)
    }),
  
  updateDriver: (id, driverData) => 
    apiRequest(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData)
    }),
  
  deleteDriver: (id) => 
    apiRequest(`/drivers/${id}`, { method: 'DELETE' }),
  
  getDriverSchedule: (id, date) => 
    apiRequest(`/drivers/${id}/schedule?date=${date}`, { method: 'GET' }),
  
  updateDriverStatus: (id, status) => 
    apiRequest(`/drivers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  
  getDriverPerformance: (id, period = 'month') => 
    apiRequest(`/drivers/${id}/performance?period=${period}`, { method: 'GET' })
};

// Route Services
export const routeAPI = {
  getOptimizedRoute: (waypoints, options = {}) => 
    apiRequest('/routes/optimize', {
      method: 'POST',
      body: JSON.stringify({ waypoints, ...options })
    }),
  
  saveRoute: (routeData) => 
    apiRequest('/routes', {
      method: 'POST',
      body: JSON.stringify(routeData)
    }),
  
  getRouteById: (id) => 
    apiRequest(`/routes/${id}`, { method: 'GET' }),
  
  updateRoute: (id, routeData) => 
    apiRequest(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routeData)
    }),
  
  deleteRoute: (id) => 
    apiRequest(`/routes/${id}`, { method: 'DELETE' }),
  
  getRouteHistory: (tankerId) => 
    apiRequest(`/routes/history/${tankerId}`, { method: 'GET' }),
  
  calculateETA: (origin, destination, waypoints = []) => 
    apiRequest('/routes/eta', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, waypoints })
    })
};

// Water Source Services
export const waterSourceAPI = {
  getAllSources: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/water-sources${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getSourceById: (id) => 
    apiRequest(`/water-sources/${id}`, { method: 'GET' }),
  
  createSource: (sourceData) => 
    apiRequest('/water-sources', {
      method: 'POST',
      body: JSON.stringify(sourceData)
    }),
  
  updateSource: (id, sourceData) => 
    apiRequest(`/water-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sourceData)
    }),
  
  deleteSource: (id) => 
    apiRequest(`/water-sources/${id}`, { method: 'DELETE' }),
  
  getWaterQuality: (id) => 
    apiRequest(`/water-sources/${id}/quality`, { method: 'GET' }),
  
  updateWaterQuality: (id, qualityData) => 
    apiRequest(`/water-sources/${id}/quality`, {
      method: 'PUT',
      body: JSON.stringify(qualityData)
    }),
  
  getSourceCapacity: (id) => 
    apiRequest(`/water-sources/${id}/capacity`, { method: 'GET' }),
  
  updateSourceCapacity: (id, capacityData) => 
    apiRequest(`/water-sources/${id}/capacity`, {
      method: 'PUT',
      body: JSON.stringify(capacityData)
    })
};

// Report Services
export const reportAPI = {
  generateReport: (reportConfig) => 
    apiRequest('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportConfig)
    }),
  
  getSavedReports: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/reports${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getReportById: (id) => 
    apiRequest(`/reports/${id}`, { method: 'GET' }),
  
  deleteReport: (id) => 
    apiRequest(`/reports/${id}`, { method: 'DELETE' }),
  
  downloadReport: (id, format = 'pdf') => 
    apiRequest(`/reports/${id}/download?format=${format}`, { method: 'GET' }),
  
  scheduleReport: (scheduleData) => 
    apiRequest('/reports/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    }),
  
  getReportTemplates: () => 
    apiRequest('/reports/templates', { method: 'GET' }),
  
  getDashboardStats: (period = 'week') => 
    apiRequest(`/reports/dashboard-stats?period=${period}`, { method: 'GET' }),
  
  getDeliveryAnalytics: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/reports/analytics/deliveries${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getTankerAnalytics: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/reports/analytics/tankers${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  exportData: (exportConfig) => 
    apiRequest('/reports/export', {
      method: 'POST',
      body: JSON.stringify(exportConfig)
    })
};

// Notification Services
export const notificationAPI = {
  getNotifications: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/notifications${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  markAsRead: (id) => 
    apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  
  markAllAsRead: () => 
    apiRequest('/notifications/read-all', { method: 'PUT' }),
  
  deleteNotification: (id) => 
    apiRequest(`/notifications/${id}`, { method: 'DELETE' }),
  
  getUnreadCount: () => 
    apiRequest('/notifications/unread-count', { method: 'GET' }),
  
  subscribeToAlerts: (subscription) => 
    apiRequest('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    }),
  
  unsubscribeFromAlerts: (subscriptionId) => 
    apiRequest(`/notifications/unsubscribe/${subscriptionId}`, { method: 'DELETE' })
};

// User Services
export const userAPI = {
  getAllUsers: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/users${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  getUserById: (id) => 
    apiRequest(`/users/${id}`, { method: 'GET' }),
  
  updateUser: (id, userData) => 
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),
  
  deleteUser: (id) => 
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
  
  updateUserRole: (id, role) => 
    apiRequest(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
  
  getActivityLog: (id, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/users/${id}/activity${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  }
};

// Settings Services
export const settingsAPI = {
  getSettings: () => 
    apiRequest('/settings', { method: 'GET' }),
  
  updateSettings: (settingsData) => 
    apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    }),
  
  getSystemHealth: () => 
    apiRequest('/settings/system-health', { method: 'GET' }),
  
  getAuditLogs: (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return apiRequest(`/settings/audit-logs${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
  
  backupData: () => 
    apiRequest('/settings/backup', { method: 'POST' }),
  
  restoreData: (backupId) => 
    apiRequest(`/settings/restore/${backupId}`, { method: 'POST' })
};

// WebSocket connection for real-time updates
export const initializeWebSocket = (token) => {
  const ws = new WebSocket(`ws://localhost:3000?token=${token}`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle different message types
    switch (data.type) {
      case 'LOCATION_UPDATE':
        // Handle location update
        break;
      case 'DELIVERY_UPDATE':
        // Handle delivery update
        break;
      case 'ALERT':
        // Handle alert
        break;
      default:
        console.log('Unknown message type:', data);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };
  
  return ws;
};

// Export all services
export default {
  auth: authAPI,
  tankers: tankerAPI,
  deliveries: deliveryAPI,
  drivers: driverAPI,
  routes: routeAPI,
  waterSources: waterSourceAPI,
  reports: reportAPI,
  notifications: notificationAPI,
  users: userAPI,
  settings: settingsAPI,
  initializeWebSocket
};