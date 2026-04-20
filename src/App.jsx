import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './style.css';
import "leaflet/dist/leaflet.css";

import StudentDashboard from "./pages/StudentDashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./adminpages/AdminDashboard";
import DriverDashboard from "./adminpages/DriverDashboard";
import Settings from "./adminpages/Settings";
import StaffLogin from "./pages/StaffLogin";
import AdminLogin from "./pages/AdminLogin";
import DriverLogin from "./pages/DriverLogin";
import DriverRegister from "./pages/DriverRegister";

// ── Protected Route — checks token + role ────────────────────────────────────
const ProtectedRoute = ({ element, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const userData = JSON.parse(user);
    if (allowedRole && userData.role !== allowedRole) {
      // Wrong role — redirect to their correct dashboard
      if (userData.role === 'admin')   return <Navigate to="/admin-dashboard"   replace />;
      if (userData.role === 'driver')  return <Navigate to="/driver-dashboard"  replace />;
      if (userData.role === 'student') return <Navigate to="/student-dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
    return element;
  } catch {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

// ── Public Route — redirects logged-in users to their dashboard ──────────────
const PublicRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('user');

  if (token && user) {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'admin')   return <Navigate to="/admin-dashboard"   replace />;
      if (userData.role === 'driver')  return <Navigate to="/driver-dashboard"  replace />;
      if (userData.role === 'student') return <Navigate to="/student-dashboard" replace />;
    } catch {
      localStorage.clear();
    }
  }

  return element;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public pages ── */}
        <Route path="/"               element={<LandingPage />} />
        <Route path="/driver-register" element={<DriverRegister />} />

        {/* ── Auth pages (redirect if already logged in) ── */}
        <Route path="/login"        element={<PublicRoute element={<LoginPage />} />} />
        <Route path="/register"     element={<PublicRoute element={<RegisterPage />} />} />
        <Route path="/admin-login"  element={<PublicRoute element={<AdminLogin />} />} />
        <Route path="/driver-login" element={<PublicRoute element={<DriverLogin />} />} />
        <Route path="/staff"        element={<PublicRoute element={<StaffLogin />} />} />

        {/* ── Protected: Student only ── */}
        <Route path="/student-dashboard"
          element={<ProtectedRoute element={<StudentDashboard />} allowedRole="student" />}
        />

        {/* ── Protected: Admin only ── */}
        <Route path="/admin-dashboard"
          element={<ProtectedRoute element={<AdminDashboard />} allowedRole="admin" />}
        />
        <Route path="/admin/settings"
          element={<ProtectedRoute element={<Settings />} allowedRole="admin" />}
        />

        {/* ── Protected: Driver only ── */}
        <Route path="/driver-dashboard"
          element={<ProtectedRoute element={<DriverDashboard />} allowedRole="driver" />}
        />

        {/* ── Catch all — redirect to home ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;