import React, { useEffect, useState } from 'react';
import { FiUsers, FiActivity, FiUserPlus, FiPieChart, FiCalendar } from 'react-icons/fi';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Don't fetch until auth is resolved and user is available
    if (authLoading || !user) return;

    setLoading(true);
    setError('');
    adminService.getStats()
      .then(data => {
        setStats({
          totalPatients:     data.totalPatients     ?? 0,
          totalDoctors:      data.totalDoctors      ?? 0,
          totalAppointments: data.totalAppointments ?? 0,
        });
      })
      .catch(err => {
        console.error('Stats fetch failed:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load stats');
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const statCards = [
    { icon: FiUsers,    color: 'var(--primary-dark)', bg: 'bg-blue',   value: stats.totalPatients,     label: 'Total Patients'      },
    { icon: FiActivity, color: '#065f46',              bg: 'bg-green',  value: stats.totalDoctors,      label: 'Total Doctors'       },
    { icon: FiCalendar, color: '#5b21b6',              bg: 'bg-purple', value: stats.totalAppointments, label: 'Total Appointments'  },
    { icon: FiUserPlus, color: '#b45309',              bg: 'bg-orange', value: stats.totalDoctors,      label: 'Active Doctors'      },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name || user?.username?.split('@')[0] || 'Admin'}</h1>
          <p className="page-subtitle">Hospital system overview and management.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div className="grid grid-4">
        {statCards.map(({ icon: Icon, color, bg, value, label }) => (
          <div className="stats-card" key={label}>
            <div className={`stats-icon ${bg}`}><Icon color={color} /></div>
            <div className="stats-info">
              <div className="stats-value">
                {loading ? <span className="spinner spinner-sm" /> : value}
              </div>
              <div className="stats-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: '40px' }}>
        <div className="card">
          <div className="card-header"><h3>Recent System Activity</h3></div>
          <div className="card-body">
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <FiActivity className="icon" />
              <p>Activity logs will appear here</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Department Distribution</h3></div>
          <div className="card-body">
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <FiPieChart className="icon" />
              <p>Chart visualization rendering...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
