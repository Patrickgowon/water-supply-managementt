// src/pages/StaffLogin.jsx
import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import DriverLogin from './DriverLogin';

const StaffLogin = () => {
  const [loginType, setLoginType] = useState('admin');

  return (
    <div>
      {loginType === 'admin' ? (
        <AdminLogin onSwitchToDriver={() => setLoginType('driverlogin')} />
      ) : (
        <DriverLogin onSwitchToAdmin={() => setLoginType('adminlogin')} />
      )}
    </div>
  );
};

export default StaffLogin;