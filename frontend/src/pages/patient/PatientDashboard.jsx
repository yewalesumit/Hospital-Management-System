import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiClock, FiActivity, FiArrowRight,
  FiShield, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiAlertCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/api';
import { format } from 'date-fns';

// ── Insurance Modal ───────────────────────────────────────────────────────────
const InsuranceModal = ({ existing, onSave, onClose }) => {
  const [form, setForm] = useState({
    provider:     existing?.provider     || '',
    policyNumber: existing?.policyNumber || '',
    validUntil:   existing?.validUntil   || '',
  });
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (!form.provider.trim())     e.provider     = 'Provider name is required';
    if (!form.policyNumber.trim()) e.policyNumber = 'Policy number is required';
    if (!form.validUntil)          e.validUntil   = 'Expiry date is required';
    else if (new Date(form.validUntil) <= new Date()) e.validUntil = 'Date must be in the future';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ins-overlay" onClick={onClose}>
      <div className="ins-modal" onClick={e => e.stopPropagation()}>
        <div className="ins-modal-header">
          <div className="ins-modal-title">
            <FiShield size={18} />
            {existing ? 'Update Insurance' : 'Add Insurance'}
          </div>
          <button className="ins-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="ins-form">
          <div className="form-group">
            <label>Insurance Provider</label>
            <input
              className={`form-control${errors.provider ? ' is-invalid' : ''}`}
              placeholder="e.g. Star Health, HDFC Ergo"
              value={form.provider}
              onChange={e => { setForm(f => ({ ...f, provider: e.target.value })); setErrors(er => ({ ...er, provider: '' })); }}
            />
            {errors.provider && <div className="ins-error"><FiAlertCircle size={12}/>{errors.provider}</div>}
          </div>

          <div className="form-group">
            <label>Policy Number</label>
            <input
              className={`form-control${errors.policyNumber ? ' is-invalid' : ''}`}
              placeholder="e.g. POL-2024-123456"
              value={form.policyNumber}
              onChange={e => { setForm(f => ({ ...f, policyNumber: e.target.value })); setErrors(er => ({ ...er, policyNumber: '' })); }}
            />
            {errors.policyNumber && <div className="ins-error"><FiAlertCircle size={12}/>{errors.policyNumber}</div>}
          </div>

          <div className="form-group">
            <label>Valid Until</label>
            <input
              type="date"
              className={`form-control${errors.validUntil ? ' is-invalid' : ''}`}
              value={form.validUntil}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => { setForm(f => ({ ...f, validUntil: e.target.value })); setErrors(er => ({ ...er, validUntil: '' })); }}
            />
            {errors.validUntil && <div className="ins-error"><FiAlertCircle size={12}/>{errors.validUntil}</div>}
          </div>

          <div className="ins-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner spinner-sm"/> : <><FiCheck size={14}/> {existing ? 'Update' : 'Save'} Insurance</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [insurance, setInsurance]       = useState(null);
  const [insLoading, setInsLoading]     = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    patientService.getMyAppointments()
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load appointments:', err))
      .finally(() => setLoading(false));

    patientService.getInsurance()
      .then(data => setInsurance(data))
      .catch(() => setInsurance(null))
      .finally(() => setInsLoading(false));
  }, []);

  const upcoming = appointments.filter(a =>
    a.status !== 'CANCELLED' && new Date(a.appointmentTime) >= new Date(new Date().setHours(0,0,0,0))
  );

  const handleSaveInsurance = async (form) => {
    try {
      const saved = await patientService.saveInsurance(form);
      setInsurance(saved);
      setShowModal(false);
      toast.success(insurance ? 'Insurance updated successfully!' : 'Insurance added successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save insurance');
      throw err;
    }
  };

  const handleDeleteInsurance = async () => {
    if (!window.confirm('Are you sure you want to remove your insurance?')) return;
    setDeleting(true);
    try {
      await patientService.deleteInsurance();
      setInsurance(null);
      toast.success('Insurance removed.');
    } catch {
      toast.error('Failed to remove insurance');
    } finally {
      setDeleting(false);
    }
  };

  const isExpiringSoon = insurance
    ? new Date(insurance.validUntil) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="dashboard">
      {showModal && (
        <InsuranceModal
          existing={insurance}
          onSave={handleSaveInsurance}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name || user?.username?.split('@')[0] || 'there'}!</h1>
          <p className="page-subtitle">Here is your healthcare overview for today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/patient/book')}>
          <FiCalendar /> Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-3">
        <div className="stats-card">
          <div className="stats-icon bg-blue"><FiCalendar color="var(--primary-dark)" /></div>
          <div className="stats-info">
            <div className="stats-value">{loading ? '…' : upcoming.length}</div>
            <div className="stats-label">Upcoming Appointments</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon bg-green"><FiActivity color="#065f46" /></div>
          <div className="stats-info">
            <div className="stats-value">{loading ? '…' : appointments.length}</div>
            <div className="stats-label">Total Appointments</div>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon bg-purple"><FiClock color="#5b21b6" /></div>
          <div className="stats-info">
            <div className="stats-value">{loading ? '…' : appointments.length - upcoming.length}</div>
            <div className="stats-label">Past Visits</div>
          </div>
        </div>
      </div>

      {/* Insurance Card */}
      <div className="divider" style={{ margin: '36px 0 28px' }} />
      <h2 className="page-title" style={{ fontSize: '20px', marginBottom: '16px' }}>
        <FiShield style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Insurance Details
      </h2>

      {insLoading ? (
        <div className="card" style={{ padding: '24px' }}><div className="spinner" /></div>
      ) : insurance ? (
        <div className="ins-card">
          <div className="ins-card-bg" />
          <div className="ins-card-content">
            <div className="ins-card-left">
              <div className="ins-card-icon"><FiShield size={22} /></div>
              <div>
                <div className="ins-card-provider">{insurance.provider}</div>
                <div className="ins-card-policy">Policy: {insurance.policyNumber}</div>
              </div>
            </div>
            <div className="ins-card-right">
              <div className={`ins-card-validity${isExpiringSoon ? ' expiring' : ''}`}>
                <div className="ins-validity-label">{isExpiringSoon ? '⚠ Expiring Soon' : 'Valid Until'}</div>
                <div className="ins-validity-date">
                  {format(new Date(insurance.validUntil), 'dd MMM yyyy')}
                </div>
              </div>
              <div className="ins-card-actions">
                <button className="ins-action-btn ins-action-edit" onClick={() => setShowModal(true)} title="Edit">
                  <FiEdit2 size={14} />
                </button>
                <button className="ins-action-btn ins-action-delete" onClick={handleDeleteInsurance} disabled={deleting} title="Remove">
                  {deleting ? <span className="spinner spinner-sm" /> : <FiTrash2 size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ins-empty">
          <div className="ins-empty-icon"><FiShield size={32} /></div>
          <div className="ins-empty-text">
            <h4>No Insurance Added</h4>
            <p>Add your health insurance details to keep them on record for your visits.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus size={15} /> Add Insurance
          </button>
        </div>
      )}

      {/* Appointments */}
      <div className="divider" style={{ margin: '36px 0 28px' }} />
      <h2 className="page-title" style={{ fontSize: '20px', marginBottom: '20px' }}>Your Appointments</h2>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : appointments.length > 0 ? (
        <div className="grid grid-2">
          {appointments.map(appt => (
            <div key={appt.id} className="appt-card">
              <div className="appt-time">
                <div className="time">{format(new Date(appt.appointmentTime), 'HH:mm')}</div>
                <div className="date">{format(new Date(appt.appointmentTime), 'MMM dd')}</div>
              </div>
              <div className="appt-info">
                <div className="appt-doctor">{appt.doctor?.name ? `Dr. ${appt.doctor.name}` : '—'}</div>
                <div className="appt-reason">{appt.reason || '—'}</div>
              </div>
              <div
                className={`badge badge-${
                  appt.status === 'CANCELLED' ? 'danger' :
                  appt.status === 'COMPLETED' ? 'success' : 'primary'
                }`}
                style={appt.status === 'CANCELLED' ? { background: '#fee2e2', color: '#dc2626' } : {}}
              >
                {appt.status || 'SCHEDULED'}
              </div>
              {appt.status === 'CANCELLED' && appt.cancellationReason && (
                <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontStyle: 'italic' }}>
                  Note: {appt.cancellationReason}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', color: 'var(--border)', marginBottom: '16px' }}><FiCalendar /></div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No upcoming appointments</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You haven't booked any appointments yet.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/patient/book')}>
            Book Your First Appointment <FiArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
