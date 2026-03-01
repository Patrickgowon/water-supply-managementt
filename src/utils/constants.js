// src/utils/constants.js

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  LIBRARIES: ['places', 'geometry', 'drawing'],
  DEFAULT_ZOOM: 14,
  MAX_ZOOM: 20,
  MIN_ZOOM: 8,
  MAP_STYLES: {
    light: [
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e9e9e9' }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
      }
    ],
    dark: [
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#1a1a1a' }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#2d2d2d' }]
      }
    ]
  }
};

// Bokkos Region Boundaries
export const BOKKOS_REGION = {
  CENTER: {
    lat: 9.3265,
    lng: 8.9947,
    name: 'Bokkos Central'
  },
  BOUNDS: {
    north: 9.3500,
    south: 9.3000,
    east: 9.0200,
    west: 8.9700
  },
  AREAS: [
    { id: 'bokkos-town', name: 'Bokkos Town', lat: 9.3240, lng: 8.9970, population: 15000 },
        { id: 'plasu-campus', name: 'PLASU Campus', lat: 9.3265, lng: 8.9947, population: 5000 },
    { id: 'mangar', name: 'Mangar', lat: 9.3350, lng: 9.0050, population: 3000 },
    { id: 'richa', name: 'Richa', lat: 9.3420, lng: 9.0120, population: 2500 },
    { id: 'butura', name: 'Butura', lat: 9.3150, lng: 8.9850, population: 3500 },
    { id: 'sha', name: 'Sha', lat: 9.3380, lng: 8.9780, population: 2800 },
    { id: 'kwatas', name: 'Kwatas', lat: 9.3300, lng: 9.0150, population: 2200 },
    { id: 'mbat', name: 'Mbat', lat: 9.3450, lng: 8.9900, population: 2000 }
  ]
};

// Tanker Status Types
export const TANKER_STATUS = {
  ACTIVE: 'active',
  EN_ROUTE: 'en-route',
  RETURNING: 'returning',
  MAINTENANCE: 'maintenance',
  IDLE: 'idle',
  OFFLINE: 'offline',
  CHARGING: 'charging',
  EMERGENCY: 'emergency'
};

// Tanker Status Configuration
export const TANKER_STATUS_CONFIG = {
  [TANKER_STATUS.ACTIVE]: {
    label: 'Active',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'FaTruck',
    priority: 1
  },
  [TANKER_STATUS.EN_ROUTE]: {
    label: 'En Route',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'FaRoute',
    priority: 2
  },
  [TANKER_STATUS.RETURNING]: {
    label: 'Returning',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'FaArrowLeft',
    priority: 3
  },
  [TANKER_STATUS.MAINTENANCE]: {
    label: 'Maintenance',
    color: 'bg-gray-500',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'FaTools',
    priority: 4
  },
  [TANKER_STATUS.IDLE]: {
    label: 'Idle',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: 'FaParking',
    priority: 5
  },
  [TANKER_STATUS.OFFLINE]: {
    label: 'Offline',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'FaWifi',
    priority: 6
  },
  [TANKER_STATUS.EMERGENCY]: {
    label: 'Emergency',
    color: 'bg-red-600',
    textColor: 'text-red-700',
    bgColor: 'bg-red-200',
    icon: 'FaExclamationTriangle',
    priority: 0
  }
};

// Delivery Status Types
export const DELIVERY_STATUS = {
  SCHEDULED: 'scheduled',
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  DELAYED: 'delayed'
};

// Delivery Status Configuration
export const DELIVERY_STATUS_CONFIG = {
  [DELIVERY_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    color: 'bg-gray-500',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'FaCalendarAlt'
  },
  [DELIVERY_STATUS.PENDING]: {
    label: 'Pending',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'FaClock'
  },
  [DELIVERY_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'FaSpinner'
  },
  [DELIVERY_STATUS.COMPLETED]: {
    label: 'Completed',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'FaCheckCircle'
  },
  [DELIVERY_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'FaTimesCircle'
  },
  [DELIVERY_STATUS.FAILED]: {
    label: 'Failed',
    color: 'bg-red-600',
    textColor: 'text-red-700',
    bgColor: 'bg-red-200',
    icon: 'FaExclamationCircle'
  },
  [DELIVERY_STATUS.DELAYED]: {
    label: 'Delayed',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: 'FaHourglassHalf'
  }
};

// Priority Levels
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  CRITICAL: 'critical'
};

// Priority Configuration
export const PRIORITY_CONFIG = {
  [PRIORITY.CRITICAL]: {
    label: 'Critical',
    color: 'bg-red-600',
    textColor: 'text-red-700',
    bgColor: 'bg-red-200',
    icon: 'FaExclamationTriangle',
    level: 0
  },
  [PRIORITY.HIGH]: {
    label: 'High',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'FaArrowUp',
    level: 1
  },
  [PRIORITY.MEDIUM]: {
    label: 'Medium',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'FaMinus',
    level: 2
  },
  [PRIORITY.LOW]: {
    label: 'Low',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'FaArrowDown',
    level: 3
  }
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  DRIVER: 'driver',
  DISPATCHER: 'dispatcher',
  MAINTENANCE: 'maintenance',
  VIEWER: 'viewer'
};

// User Role Configuration
export const USER_ROLE_CONFIG = {
  [USER_ROLES.ADMIN]: {
    label: 'Administrator',
    permissions: ['*'],
    color: 'bg-purple-600',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  [USER_ROLES.MANAGER]: {
    label: 'Manager',
    permissions: ['read', 'write', 'update', 'delete', 'manage_users'],
    color: 'bg-blue-600',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  [USER_ROLES.SUPERVISOR]: {
    label: 'Supervisor',
    permissions: ['read', 'write', 'update', 'approve'],
    color: 'bg-green-600',
    textColor: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  [USER_ROLES.DRIVER]: {
    label: 'Driver',
    permissions: ['read_own', 'update_status', 'view_assignments'],
    color: 'bg-orange-600',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  [USER_ROLES.DISPATCHER]: {
    label: 'Dispatcher',
    permissions: ['read', 'write', 'schedule', 'assign'],
    color: 'bg-cyan-600',
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  [USER_ROLES.MAINTENANCE]: {
    label: 'Maintenance',
    permissions: ['read_tankers', 'update_maintenance'],
    color: 'bg-gray-600',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  [USER_ROLES.VIEWER]: {
    label: 'Viewer',
    permissions: ['read'],
    color: 'bg-gray-500',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-50'
  }
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  DELIVERY: 'delivery',
  TANKER: 'tanker',
  ALERT: 'alert',
  MAINTENANCE: 'maintenance'
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    icon: 'FaCheckCircle',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    duration: 5000
  },
  [NOTIFICATION_TYPES.ERROR]: {
    icon: 'FaExclamationCircle',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    duration: 8000
  },
  [NOTIFICATION_TYPES.WARNING]: {
    icon: 'FaExclamationTriangle',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    duration: 6000
  },
  [NOTIFICATION_TYPES.INFO]: {
    icon: 'FaInfoCircle',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    duration: 4000
  },
  [NOTIFICATION_TYPES.DELIVERY]: {
    icon: 'FaTruck',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    duration: 5000
  },
  [NOTIFICATION_TYPES.TANKER]: {
    icon: 'FaOilCan',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    duration: 5000
  },
  [NOTIFICATION_TYPES.ALERT]: {
    icon: 'FaBell',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    duration: 0 // Persistent until dismissed
  }
};

// Time Periods
export const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  TIME_ONLY: 'HH:mm',
  DATE_ONLY: 'YYYY-MM-DD',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  FILENAME: 'YYYYMMDD_HHmmss',
  REPORT: 'DD_MMM_YYYY'
};

// Chart Colors
export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  cyan: '#06B6D4',
  orange: '#F97316',
  teal: '#14B8A6',
  gray: '#6B7280'
};

// Chart Gradients
export const CHART_GRADIENTS = {
  primary: ['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.1)'],
  success: ['rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.1)'],
  warning: ['rgba(245, 158, 11, 0.8)', 'rgba(245, 158, 11, 0.1)'],
  danger: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.1)']
};

// Tanker Capacities
export const TANKER_CAPACITIES = {
  SMALL: 5000,
  MEDIUM: 8000,
  LARGE: 10000,
  EXTRA_LARGE: 15000
};

// Fuel Efficiency (km per liter)
export const FUEL_EFFICIENCY = {
  SMALL: 8.5,
  MEDIUM: 7.5,
  LARGE: 6.5,
  EXTRA_LARGE: 5.5
};

// Water Quality Levels
export const WATER_QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  UNSAFE: 'unsafe'
};

// Water Quality Configuration
export const WATER_QUALITY_CONFIG = {
  [WATER_QUALITY.EXCELLENT]: {
    label: 'Excellent',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-100',
    minScore: 90
  },
  [WATER_QUALITY.GOOD]: {
    label: 'Good',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    minScore: 70
  },
  [WATER_QUALITY.FAIR]: {
    label: 'Fair',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    minScore: 50
  },
  [WATER_QUALITY.POOR]: {
    label: 'Poor',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    minScore: 30
  },
  [WATER_QUALITY.UNSAFE]: {
    label: 'Unsafe',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-100',
    minScore: 0
  }
};

// Alert Types
export const ALERT_TYPES = {
  LOW_WATER: 'low_water',
  TANKER_BREAKDOWN: 'tanker_breakdown',
  DELAY: 'delay',
  EMERGENCY: 'emergency',
  MAINTENANCE_DUE: 'maintenance_due',
  FUEL_LOW: 'fuel_low',
  ROUTE_DEVIATION: 'route_deviation',
  UNAUTHORIZED_USE: 'unauthorized_use'
};

// Alert Severity
export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Alert Configuration
export const ALERT_CONFIG = {
  [ALERT_TYPES.LOW_WATER]: {
    title: 'Low Water Level',
    severity: ALERT_SEVERITY.HIGH,
    icon: 'FaWater',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  [ALERT_TYPES.TANKER_BREAKDOWN]: {
    title: 'Tanker Breakdown',
    severity: ALERT_SEVERITY.CRITICAL,
    icon: 'FaExclamationTriangle',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  [ALERT_TYPES.DELAY]: {
    title: 'Delivery Delay',
    severity: ALERT_SEVERITY.MEDIUM,
    icon: 'FaClock',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  [ALERT_TYPES.EMERGENCY]: {
    title: 'Emergency',
    severity: ALERT_SEVERITY.CRITICAL,
    icon: 'FaBell',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  [ALERT_TYPES.MAINTENANCE_DUE]: {
    title: 'Maintenance Due',
    severity: ALERT_SEVERITY.MEDIUM,
    icon: 'FaTools',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  [ALERT_TYPES.FUEL_LOW]: {
    title: 'Low Fuel',
    severity: ALERT_SEVERITY.HIGH,
    icon: 'FaGasPump',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  }
};

// Report Types
export const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
};

// Report Formats
export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
  JSON: 'json',
  HTML: 'html'
};

// File Export Formats
export const EXPORT_FORMATS = {
  PDF: { mimeType: 'application/pdf', extension: '.pdf' },
  EXCEL: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' },
  CSV: { mimeType: 'text/csv', extension: '.csv' },
  JSON: { mimeType: 'application/json', extension: '.json' }
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
  MAX_LIMIT: 1000
};

// Sort Directions
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'hydrotrack_token',
  USER: 'hydrotrack_user',
  THEME: 'hydrotrack_theme',
  LANGUAGE: 'hydrotrack_language',
  SETTINGS: 'hydrotrack_settings',
  RECENT_SEARCHES: 'hydrotrack_recent_searches',
  DASHBOARD_LAYOUT: 'hydrotrack_dashboard_layout'
};

// Theme Modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Languages
export const LANGUAGES = {
  EN: 'en',
  HA: 'ha', // Hausa
  YO: 'yo', // Yoruba
  IG: 'ig'  // Igbo
};

// App Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/',
  TRACKING: '/tracking',
  FLEET: '/fleet',
  SCHEDULE: '/schedule',
  ROUTE_OPTIMIZATION: '/route-optimization',
  HISTORY: '/history',
  REPORTS: '/reports',
  SOURCES: '/sources',
  ALERTS: '/alerts',
  REQUESTS: '/requests',
  COMMUNITY: '/community',
  MESSAGES: '/messages',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  USERS: '/users',
  MAINTENANCE: '/maintenance'
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_REGEX: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PLATE_NUMBER_REGEX: /^[A-Z]{3}-\d{3}[A-Z]{2}$/ // Nigerian plate format
};

// Toast Messages
export const TOAST_MESSAGES = {
  SAVE_SUCCESS: 'Changes saved successfully',
  SAVE_ERROR: 'Error saving changes',
  DELETE_SUCCESS: 'Item deleted successfully',
  DELETE_ERROR: 'Error deleting item',
  UPDATE_SUCCESS: 'Update successful',
  UPDATE_ERROR: 'Error updating',
  LOGIN_SUCCESS: 'Login successful',
  LOGIN_ERROR: 'Invalid credentials',
  LOGOUT_SUCCESS: 'Logged out successfully',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  UNAUTHORIZED: 'You are not authorized to perform this action'
};

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
};

// Breakpoints (Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
};

// Default export combining all constants
export default {
  API_CONFIG,
  GOOGLE_MAPS_CONFIG,
  BOKKOS_REGION,
  TANKER_STATUS,
  TANKER_STATUS_CONFIG,
  DELIVERY_STATUS,
  DELIVERY_STATUS_CONFIG,
  PRIORITY,
  PRIORITY_CONFIG,
  USER_ROLES,
  USER_ROLE_CONFIG,
  NOTIFICATION_TYPES,
  NOTIFICATION_CONFIG,
  TIME_PERIODS,
  DATE_FORMATS,
  CHART_COLORS,
  CHART_GRADIENTS,
  TANKER_CAPACITIES,
  FUEL_EFFICIENCY,
  WATER_QUALITY,
  WATER_QUALITY_CONFIG,
  ALERT_TYPES,
  ALERT_SEVERITY,
  ALERT_CONFIG,
  REPORT_TYPES,
  REPORT_FORMATS,
  EXPORT_FORMATS,
  PAGINATION,
  SORT_DIRECTIONS,
  STORAGE_KEYS,
  THEME_MODES,
  LANGUAGES,
  ROUTES,
  VALIDATION_RULES,
  TOAST_MESSAGES,
  ANIMATION,
  BREAKPOINTS
};