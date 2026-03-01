import { BrowserRouter, Routes, Route } from "react-router-dom";
import './style.css';
import "leaflet/dist/leaflet.css";


import { Home as HomeIcon } from "lucide-react"; // renamed icon

import StudentDashboard from "./pages/StudentDashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./adminpages/AdminDashboard";
import DriverDashboard from "./adminpages/DriverDashboard";
import Settings from "./adminpages/Settings";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/student-dashboard" element={<StudentDashboard/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/admine" element={<AdminDashboard/>}/>
        <Route path="/driver" element={<DriverDashboard/>}/>
        <Route path="/admin/settings" element={<Settings/>}/>
        <Route path="/" element={<LandingPage/>}/>
        
      </Routes>
    </BrowserRouter>
  );
};

export default App;
