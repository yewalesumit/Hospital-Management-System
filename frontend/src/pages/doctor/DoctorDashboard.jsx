import React, { useEffect, useState } from 'react';
import { FiUsers, FiClock, FiCheckCircle, FiX, FiUser, FiShield, FiCalendar, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { doctorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

// ── Info Card ─────────────────────────────────────────────────────────────────
const InfoCard = ({ label, value }) => (
  <div style={{ background: 'var(--bg-subtle,#f8f9fa)', borderRadius: '10px', padding: '12px 16px' }}>
    <div style={{ fontSize: '11px', color: 'var(--text-muted,#888)', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: 600 }}>{value || '—'}</div>
  </div>
);

// ── Section Title ─────────────────────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, title }) => (
  <h3 style={{
    fontSize: '13px', fontWeight: 600, color: 'var(--text-muted,#888)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '12px', marginTop: 0,
    display: 'flex', alignItems: 'center', gap: '6px',
  }}>
    <Icon size={13} /> {title}
  </h3>
);

// ── Patient Detail Modal ──────────────────────────────────────────────────────
const PatientDetailModal = ({ patient, appointment, onClose }) => {
  if (!patient) return null;

  const fmt   = (d) => { try { return d ? format(new Date(d), 'dd MMM yyyy') : '—'; } catch { return '—'; } };
  const fmtDT = (d) => { try { return d ? format(new Date(d), 'dd MMM yyyy, hh:mm a') : '—'; } catch { return '—'; } };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card,#fff)', borderRadius: '16px',
          width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: '28px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '22px', fontWeight: 700, flexShrink: 0,
            }}>
              {patient.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{patient.name}</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted,#888)' }}>Patient ID #{patient.id}</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted,#888)', padding: '4px' }}>
            <FiX size={22} />
          </button>
        </div>

        {/* Current Appointment highlight */}
        {appointment && (
          <div style={{
            background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)',
            borderRadius: '12px', padding: '16px', marginBottom: '20px',
            border: '1px solid #c7d2fe',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              📅 Current Appointment
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#6366f1', marginBottom: '2px' }}>Date & Time</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{fmtDT(appointment.appointmentTime)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6366f1', marginBottom: '2px' }}>Reason</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{appointment.reason || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Info */}
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle icon={FiUser} title="Personal Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <InfoCard label="Email"        value={patient.email} />
            <InfoCard label="Gender"       value={patient.gender} />
            <InfoCard label="Date of Birth" value={fmt(patient.birthDate)} />
            <InfoCard label="Blood Group"  value={patient.bloodGroup?.replace(/_/g, ' ')} />
          </div>
        </div>

        {/* Insurance */}
        <div style={{ marginBottom: '20px' }}>
          <SectionTitle icon={FiShield} title="Insurance" />
          {patient.insurancePolicyNumber ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <InfoCard label="Policy Number" value={patient.insurancePolicyNumber} />
              <InfoCard label="Provider"      value={patient.insuranceProvider} />
              <InfoCard label="Valid Until"   value={fmt(patient.insuranceValidUntil)} />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted,#888)', fontSize: '14px', margin: 0 }}>No insurance on record.</p>
          )}
        </div>

        {/* Appointment History */}
        <div>
          <SectionTitle icon={FiCalendar} title={`Appointment History (${patient.appointments?.length || 0})`} />
          {patient.appointments?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {patient.appointments.map(appt => (
                <div key={appt.id} style={{
                  border: '1px solid var(--border,#e5e7eb)', borderRadius: '10px',
                  padding: '12px 14px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{appt.reason || 'No reason provided'}</div>
                    {appt.doctor?.name && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted,#888)', marginTop: '2px' }}>
                        Dr. {appt.doctor.name} — {appt.doctor.specialization}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted,#888)', flexShrink: 0 }}>
                    {fmtDT(appt.appointmentTime)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted,#888)', fontSize: '14px', margin: 0 }}>No appointment history.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Cancel Appointment Modal ───────────────────────────────────────────────────
const CancelModal = ({ appointment, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  if (!appointment) return null;
  const fmtDT = (d) => { try { return format(new Date(d), 'dd MMM yyyy, hh:mm a'); } catch { return '—'; } };
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '20px', padding: '32px',
        width: '100%', maxWidth: '460px', boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <FiAlertTriangle size={28} color="#dc2626" />
        </div>
        <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
          Cancel Appointment?
        </h3>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.6 }}>
          You are about to cancel the appointment for{' '}
          <strong>{appointment.patientName}</strong>.<br />
          The patient will receive an email notification.
        </p>
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px',
          padding: '14px 16px', marginBottom: '20px', fontSize: '13px',
        }}>
          <div><span style={{ color: '#9ca3af' }}>Date & Time: </span>
            <strong>{fmtDT(appointment.appointmentTime)}</strong></div>
          <div style={{ marginTop: '6px' }}><span style={{ color: '#9ca3af' }}>Reason: </span>
            <strong>{appointment.reason || '—'}</strong></div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
            Cancellation Note (optional)
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Doctor unavailable, emergency surgery…"
            rows={3}
            style={{
              width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '10px',
              padding: '10px 12px', fontSize: '14px', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
              outline: 'none',
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
            background: loading ? '#fca5a5' : '#dc2626', color: '#fff',
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

// ── Main Component ────────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments]         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedPatient, setSelectedPatient]   = useState(null);
  const [selectedAppt, setSelectedAppt]         = useState(null);
  const [modalLoading, setModalLoading]         = useState(false);
  const [modalError, setModalError]             = useState('');
  const [cancelTarget, setCancelTarget]         = useState(null);
  const [cancelling, setCancelling]             = useState(false);

  useEffect(() => {
    doctorService.getAppointments()
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.appointmentTime);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth()    === today.getMonth()    &&
      d.getDate()     === today.getDate()
    );
  });

  const handleViewDetails = async (appt) => {
    if (!appt.patientId) {
      setModalError('Patient ID not available for this appointment.');
      return;
    }
    setModalError('');
    setSelectedPatient(null);
    setSelectedAppt(appt);
    setModalLoading(true);
    try {
      const detail = await doctorService.getPatientById(appt.patientId);
      setSelectedPatient(detail);
    } catch (err) {
      setModalError('Failed to load patient details. Please try again.');
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedPatient(null);
    setSelectedAppt(null);
    setModalError('');
  };

  const handleCancelConfirm = async (cancellationReason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const updated = await doctorService.cancelAppointment(cancelTarget.id, cancellationReason);
      setAppointments(prev =>
        prev.map(a => a.id === updated.id ? updated : a)
      );
      toast.success(`Appointment cancelled. Patient has been notified by email.`);
      setCancelTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, Dr. {user?.name || user?.username?.split('@')[0] || 'Doctor'}</h1>
          <p className="page-subtitle">Overview of your scheduled patients and appointments.</p>
        </div>
      </div>

      {modalError && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>{modalError}</div>
      )}

      {/* Loading overlay */}
      {modalLoading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px 48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, color: 'var(--text-secondary,#555)' }}>Loading patient details…</p>
          </div>
        </div>
      )}

      <div className="grid grid-3">
        <div className="stats-card">
          <div className="stats-icon bg-blue"><FiUsers color="var(--primary-dark)" /></div>
          <div className="stats-info">
            <div className="stats-value">{todayAppts.length}</div>
            <div className="stats-label">Patients Today</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon bg-green"><FiCheckCircle color="#065f46" /></div>
          <div className="stats-info">
            <div className="stats-value">{appointments.filter(a => a.status === 'COMPLETED').length}</div>
            <div className="stats-label">Completed Consults</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon bg-orange"><FiClock color="#b45309" /></div>
          <div className="stats-info">
            <div className="stats-value">{appointments.length}</div>
            <div className="stats-label">Total Scheduled</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '40px' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Today's Appointments</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted,#888)' }}>
            {format(new Date(), 'EEEE, dd MMM yyyy')}
          </span>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient Name</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                  <span className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : todayAppts.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No appointments scheduled for today.</td></tr>
              ) : (
                todayAppts.map(appt => (
                  <tr key={appt.id}>
                    <td style={{ fontWeight: '600' }}>{format(new Date(appt.appointmentTime), 'HH:mm')}</td>
                    <td>{appt.patientName || `Patient #${appt.patientId}`}</td>
                    <td>{appt.reason || '—'}</td>
                    <td>
                      <span className={`badge ${
                        appt.status === 'CANCELLED' ? 'badge-danger' :
                        appt.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'
                      }`}
                        style={appt.status === 'CANCELLED' ? {
                          background: '#fee2e2', color: '#dc2626'
                        } : {}}>
                        {appt.status || 'SCHEDULED'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewDetails(appt)}
                      >
                        View Details
                      </button>
                      {appt.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-sm"
                          onClick={() => setCancelTarget(appt)}
                          style={{
                            background: '#fee2e2', color: '#dc2626', border: 'none',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <FiXCircle size={13} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          appointment={selectedAppt}
          onClose={handleCloseModal}
        />
      )}

      {/* Cancel Appointment Modal */}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          loading={cancelling}
          onConfirm={handleCancelConfirm}
          onCancel={() => !cancelling && setCancelTarget(null)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
