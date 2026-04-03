import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiCalendar, FiUsers, FiUserPlus,
  FiActivity, FiLogOut, FiX, FiClipboard, FiUserMinus, FiCpu, FiShield,
} from 'react-icons/fi';
import './Sidebar.css';

const patientLinks = [
  { to: '/patient/dashboard', icon: FiHome,     label: 'Dashboard' },
  { to: '/patient/book',      icon: FiCalendar, label: 'Book Appointment' },
  { to: '/patient/insurance', icon: FiShield,   label: 'My Insurance' },
  { to: '/patient/ai',        icon: FiCpu,      label: 'AI Assistant' },
];

const doctorLinks = [
  { to: '/doctor/dashboard',    icon: FiHome,      label: 'Dashboard' },
  { to: '/doctor/appointments', icon: FiClipboard, label: 'Appointments' },
  { to: '/doctor/ai',           icon: FiCpu,       label: 'AI Assistant' },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: FiHome,       label: 'Dashboard' },
  { to: '/admin/patients',     icon: FiUsers,      label: 'Patients' },
  { to: '/admin/doctors',      icon: FiUserMinus,  label: 'Doctors' },
  { to: '/admin/appointments', icon: FiCalendar,   label: 'Appointments' },
  { to: '/admin/onboard',      icon: FiUserPlus,   label: 'Onboard Doctor' },
  { to: '/admin/ai',           icon: FiCpu,        label: 'AI Assistant' },
];

const Sidebar = ({ open, onClose }) => {
  const { isAdmin, isDoctor, logout, user } = useAuth();
  const navigate = useNavigate();

  const links = isAdmin() ? adminLinks : isDoctor() ? doctorLinks : patientLinks;

  const sectionLabel = isAdmin() ? 'Admin Panel' : isDoctor() ? 'Doctor Portal' : 'Patient Portal';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo"><FiActivity size={18} /></div>
            <div>
              <div className="sidebar-brand-name">MediCare</div>
              <div className="sidebar-brand-sub">{sectionLabel}</div>
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(user?.name || user?.username)?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || user?.username?.split('@')[0] || 'User'}</div>
            <div className="sidebar-user-email">{user?.username}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
