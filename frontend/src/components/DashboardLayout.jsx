import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="page-wrapper">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar onMenu={() => setSidebarOpen(true)} />
      <main className="main-content animate-fade">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
