import React, { useEffect, useState, useCallback } from 'react';
import {
  FiSearch, FiTrash2, FiAlertTriangle, FiCalendar,
  FiUser, FiRefreshCw, FiFilter, FiXCircle,
} from 'react-icons/fi';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

/* ── Confirm Delete Modal ── */
const ConfirmModal = ({ appointment, onConfirm, onCancel, loading }) => (
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
        width: '100%', maxWidth: '440px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}
    >
      {/* Warning icon */}
      <div style={{
        width: '60px', height: '60px', borderRadius: '50%',
        background: '#fee2e2', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <FiAlertTriangle size={28} color="#dc2626" />
      </div>

      <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
        Delete Appointment?
      </h3>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.6 }}>
        This will permanently delete the appointment for{' '}
        <strong>{appointment?.patientName}</strong> with{' '}
        <strong>Dr. {appointment?.doctor?.name}</strong>.<br />
        This action cannot be undone.
      </p>

      {/* Appointment summary */}
      <div style={{
        background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '24px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div><span style={{ color: '#9ca3af' }}>Patient:</span> <strong>{appointment?.patientName}</strong></div>
          <div><span style={{ color: '#9ca3af' }}>Doctor:</span> <strong>Dr. {appointment?.doctor?.name}</strong></div>
          <div><span style={{ color: '#9ca3af' }}>Date:</span> <strong>
            {appointment?.appointmentTime ? format(new Date(appointment.appointmentTime), 'dd MMM yyyy') : '—'}
          </strong></div>
          <div><span style={{ color: '#9ca3af' }}>Time:</span> <strong>
            {appointment?.appointmentTime ? format(new Date(appointment.appointmentTime), 'hh:mm a') : '—'}
          </strong></div>
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
          {loading ? <><span className="spinner spinner-sm" /> Deleting…</> : <><FiTrash2 size={14} /> Delete</>}
        </button>
      </div>
    </div>
  </div>
);

/* ── Confirm Cancel Modal ── */
const CancelModal = ({ appointment, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = React.useState('');
  if (!appointment) return null;
  const fmt = d => { try { return format(new Date(d), 'dd MMM yyyy, hh:mm a'); } catch { return '—'; } };
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '20px', padding: '32px',
        width: '100%', maxWidth: '460px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%', background: '#fef3c7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <FiXCircle size={28} color="#d97706" />
        </div>
        <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
          Cancel Appointment?
        </h3>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.6 }}>
          Cancel appointment for <strong>{appointment?.patientName}</strong> with{' '}
          <strong>Dr. {appointment?.doctor?.name}</strong>?<br />
          The patient will be notified by email.
        </p>
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px',
          padding: '14px 16px', marginBottom: '20px', fontSize: '13px',
        }}>
          <div><span style={{ color: '#9ca3af' }}>Date: </span>
            <strong>{fmt(appointment?.appointmentTime)}</strong></div>
          <div style={{ marginTop: '6px' }}><span style={{ color: '#9ca3af' }}>Reason: </span>
            <strong>{appointment?.reason || '—'}</strong></div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
            Cancellation Note (optional — sent to patient)
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Doctor unavailable, please reschedule…"
            rows={3}
            style={{
              width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '10px',
              padding: '10px 12px', fontSize: '14px', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: '12px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
            background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
          }}>Keep Appointment</button>
          <button onClick={() => onConfirm(reason)} disabled={loading} style={{
            flex: 1, padding: '12px', border: 'none', borderRadius: '10px',
            background: loading ? '#fcd34d' : '#d97706', color: '#fff',
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {loading
              ? <><span className="spinner spinner-sm" /> Cancelling…</>
              : <><FiXCircle size={14} /> Cancel Appointment</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState('all'); // all | scheduled | cancelled | past
  const [toDelete,     setToDelete]     = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toCancel,     setToCancel]     = useState(null);
  const [cancelling,   setCancelling]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminService.getAllAppointments()
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminService.deleteAppointment(toDelete.id);
      setAppointments(prev => prev.filter(a => a.id !== toDelete.id));
      toast.success(`Appointment #${toDelete.id} deleted successfully`);
      setToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete appointment');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = async (cancellationReason) => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      const updated = await adminService.cancelAppointment(toCancel.id, cancellationReason);
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast.success(`Appointment cancelled. Patient notified by email.`);
      setToCancel(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const now        = new Date();
  const fmt        = d => { try { return format(new Date(d), 'dd MMM yyyy'); }  catch { return '—'; } };
  const fmtT       = d => { try { return format(new Date(d), 'hh:mm a'); }       catch { return '—'; } };
  const isUpcoming = d => { try { return new Date(d) >= now; }                   catch { return false; } };

  const filtered = appointments.filter(a => {
    const matchSearch =
      a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.reason?.toLowerCase().includes(search.toLowerCase()) ||
      String(a.id).includes(search);
    const matchFilter =
      filter === 'all' ||
      (filter === 'scheduled' && a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && isUpcoming(a.appointmentTime)) ||
      (filter === 'cancelled' && a.status === 'CANCELLED') ||
      (filter === 'past'      && (a.status === 'COMPLETED' || (!isUpcoming(a.appointmentTime) && a.status !== 'CANCELLED')));
    return matchSearch && matchFilter;
  });


  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointment Management</h1>
          <p className="page-subtitle">View, cancel, and delete all patient appointments.</p>
        </div>
        <button className="btn btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-3" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Appointments', value: appointments.length,                               color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Scheduled',          value: appointments.filter(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && isUpcoming(a.appointmentTime)).length, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Cancelled',          value: appointments.filter(a => a.status === 'CANCELLED').length, color: '#dc2626', bg: '#fee2e2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stats-card" style={{ border: `1.5px solid ${bg}` }}>
            <div className="stats-icon" style={{ background: bg }}>
              <FiCalendar color={color} />
            </div>
            <div className="stats-info">
              <div className="stats-value" style={{ color }}>{loading ? '…' : value}</div>
              <div className="stats-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '240px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text" className="form-control"
            placeholder="Search by patient, doctor or reason…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <FiFilter size={14} color="#9ca3af" />
          {['all', 'scheduled', 'cancelled', 'past'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: '1.5px solid',
                borderColor: filter === f ? '#4f46e5' : '#e5e7eb',
                background: filter === f ? '#eef2ff' : '#fff',
                color: filter === f ? '#4f46e5' : '#374151',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                    <FiCalendar size={32} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                    No appointments found.
                  </td>
                </tr>
              ) : filtered.map(appt => (
                <tr key={appt.id}>
                  <td style={{ color: '#9ca3af', fontSize: '12px' }}>#{appt.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                        color: '#fff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                      }}>
                        {appt.patientName?.charAt(0)?.toUpperCase() || <FiUser size={12}/>}
                      </div>
                      <span style={{ fontWeight: 600 }}>{appt.patientName || '—'}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : '—'}
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '13px' }}>
                    {appt.doctor?.specialization || '—'}
                  </td>
                  <td>{fmt(appt.appointmentTime)}</td>
                  <td>{fmtT(appt.appointmentTime)}</td>
                  <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: '#6b7280' }}>
                    {appt.reason || '—'}
                  </td>
                  <td>
                    <span className={`badge ${
                      appt.status === 'CANCELLED'  ? 'badge-danger' :
                      appt.status === 'COMPLETED'  ? 'badge-success' :
                      isUpcoming(appt.appointmentTime) ? 'badge-primary' : 'badge-success'
                    }`}
                      style={
                        appt.status === 'CANCELLED' ? { background: '#fee2e2', color: '#dc2626' } :
                        appt.status === 'COMPLETED' ? { background: '#dcfce7', color: '#16a34a' } : {}
                      }>
                      {appt.status === 'CANCELLED' ? 'Cancelled' :
                       appt.status === 'COMPLETED' ? 'Completed' :
                       isUpcoming(appt.appointmentTime) ? 'Scheduled' : 'Completed'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {appt.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-sm"
                          onClick={() => setToCancel(appt)}
                          style={{
                            background: '#fef3c7', color: '#d97706', border: 'none',
                            display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600,
                          }}
                        >
                          <FiXCircle size={13} /> Cancel
                        </button>
                      )}
                      <button
                        className="btn btn-sm"
                        onClick={() => setToDelete(appt)}
                        style={{
                          background: '#fee2e2', color: '#dc2626', border: 'none',
                          display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600,
                        }}
                      >
                        <FiTrash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="card-footer" style={{ fontSize: '13px', color: '#9ca3af' }}>
            Showing {filtered.length} of {appointments.length} appointments
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {toDelete && (
        <ConfirmModal
          appointment={toDelete}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setToDelete(null)}
        />
      )}

      {/* Cancel Appointment Modal */}
      {toCancel && (
        <CancelModal
          appointment={toCancel}
          loading={cancelling}
          onConfirm={handleCancel}
          onCancel={() => !cancelling && setToCancel(null)}
        />
      )}
    </div>
  );
};

export default AppointmentManagement;

