import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiLogOut, FiUser, FiActivity, FiMenu, FiHome } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ onMenu }) => {
  const { user, logout, isAdmin, isDoctor } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    if (isAdmin())  return { label: 'Administrator', color: 'var(--error)' };
    if (isDoctor()) return { label: 'Doctor',        color: 'var(--success)' };
    return              { label: 'Patient',          color: 'var(--primary)' };
  };

  const { label, color } = getRoleLabel();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onMenu} aria-label="Menu">
          <FiMenu size={20} />
        </button>
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <FiActivity size={20} />
          </div>
          <span className="navbar-brand-text">MediCare</span>
          <span className="navbar-brand-sub">HMS</span>
        </Link>

        {/* Home button */}
        <Link
          to="/"
          className="navbar-home-btn"
          title="Go to Home"
        >
          <FiHome size={15} />
          <span>Home</span>
        </Link>
      </div>

      <div className="navbar-right">
        <button className="navbar-icon-btn" aria-label="Notifications">
          <FiBell size={18} />
          <span className="notif-dot" />
        </button>

        <div className="navbar-profile" onClick={() => setDropOpen(!dropOpen)}>
          <div className="navbar-avatar">
            {(user?.name || user?.username)?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-username">
              {user?.name || user?.username?.split('@')[0] || 'User'}
            </span>
            <span className="navbar-role" style={{ color }}>
              {label}
            </span>
          </div>

          {dropOpen && (
            <div className="navbar-dropdown">
              <div className="dropdown-item disabled">
                <FiUser size={14} />
                <span>{user?.name || user?.username}</span>
              </div>
              <div className="dropdown-item disabled" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{user?.username}</span>
              </div>
              <hr className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <FiLogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
