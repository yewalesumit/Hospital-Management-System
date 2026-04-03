import React, { useEffect, useState, useCallback } from 'react';
import {
  FiSearch, FiTrash2, FiAlertTriangle,
  FiUser, FiRefreshCw, FiUserPlus,
} from 'react-icons/fi';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

/* ── Confirm Remove Modal ── */
const ConfirmModal = ({ doctor, onConfirm, onCancel, loading }) => (
  <div
    onClick={onCancel}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: '#fff', borderRadius: '20px', padding: '32px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{
        width: '60px', height: '60px', borderRadius: '50%',
        background: '#fee2e2', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <FiAlertTriangle size={28} color="#dc2626" />
      </div>

      <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
        Remove Doctor?
      </h3>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
        This will permanently remove <strong>Dr. {doctor?.name}</strong> from the system
        and revoke their doctor access. This action cannot be undone.
      </p>

      {/* Doctor summary */}
      <div style={{
        background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '18px',
          }}>
            {doctor?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Dr. {doctor?.name}</div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>{doctor?.specialization}</div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>{doctor?.email}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
            background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            flex: 1, padding: '12px', border: 'none', borderRadius: '10px',
            background: loading ? '#fca5a5' : '#dc2626', color: '#fff',
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {loading ? <><span className="spinner spinner-sm" /> Removing…</> : <><FiTrash2 size={14} /> Remove</>}
        </button>
      </div>
    </div>
  </div>
);

/* ── Main Component ── */
const DoctorManagement = () => {
  const navigate = useNavigate();
  const [doctors,  setDoctors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminService.getAllDoctors()
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async () => {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await adminService.removeDoctor(toRemove.id);
      setDoctors(prev => prev.filter(d => d.id !== toRemove.id));
      toast.success(`Dr. ${toRemove.name} removed successfully`);
      setToRemove(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove doctor');
    } finally {
      setRemoving(false);
    }
  };

  const filtered = doctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  const colors = ['#4f46e5','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed'];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Management</h1>
          <p className="page-subtitle">View and remove doctors from the system.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/onboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiUserPlus size={14} /> Add Doctor
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-card" style={{ marginBottom: '28px', maxWidth: '240px' }}>
        <div className="stats-icon bg-blue"><FiUser color="var(--primary-dark)" /></div>
        <div className="stats-info">
          <div className="stats-value" style={{ color: '#4f46e5' }}>{loading ? '…' : doctors.length}</div>
          <div className="stats-label">Total Doctors</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: '360px', marginBottom: '20px' }}>
        <FiSearch className="search-icon" />
        <input
          type="text" className="form-control"
          placeholder="Search by name, specialization or email…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="loading-overlay" style={{ minHeight: '300px', position: 'relative' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FiUser size={40} style={{ color: '#d1d5db', marginBottom: '12px' }} />
          <p style={{ color: '#9ca3af', margin: 0 }}>No doctors found.</p>
        </div>
      ) : (
        <div className="grid grid-3" style={{ gap: '20px' }}>
          {filtered.map((doc, i) => (
            <div key={doc.id} className="card" style={{
              padding: '24px', borderRadius: '16px', transition: 'all 0.2s',
              border: '1.5px solid #e8eeff',
            }}>
              {/* Avatar + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i+1) % colors.length]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '20px',
                }}>
                  {doc.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                    Dr. {doc.name}
                  </div>
                  <div style={{
                    fontSize: '12px', color: '#fff', fontWeight: 600, marginTop: '4px',
                    display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                    background: colors[i % colors.length],
                  }}>
                    {doc.specialization}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{
                background: '#f8faff', borderRadius: '8px', padding: '10px 12px',
                fontSize: '12px', color: '#6b7280', marginBottom: '16px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                ✉️ {doc.email || '—'}
              </div>

              {/* ID */}
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '16px' }}>
                Doctor ID: #{doc.id}
              </div>

              {/* Remove button */}
              <button
                onClick={() => setToRemove(doc)}
                style={{
                  width: '100%', padding: '10px', border: '1.5px solid #fecaca',
                  borderRadius: '10px', background: '#fff', color: '#dc2626',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                <FiTrash2 size={13} /> Remove Doctor
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {toRemove && (
        <ConfirmModal
          doctor={toRemove}
          loading={removing}
          onConfirm={handleRemove}
          onCancel={() => !removing && setToRemove(null)}
        />
      )}
    </div>
  );
};

export default DoctorManagement;

