 import React, { useEffect, useState } from 'react';
import {
  FiShield, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck,
  FiAlertCircle, FiCalendar, FiFileText, FiInfo,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { patientService } from '../../services/api';
import { format } from 'date-fns';
import './PatientInsurance.css';

// ── Modal ─────────────────────────────────────────────────────────────────────
const InsuranceModal = ({ existing, onSave, onClose }) => {
  const [form, setForm] = useState({
    provider:     existing?.provider     || '',
    policyNumber: existing?.policyNumber || '',
    validUntil:   existing?.validUntil   || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
    try { await onSave(form); } finally { setSaving(false); }
  };

  const Field = ({ name, label, type = 'text', placeholder, min }) => (
    <div className="ins-form-group">
      <label className="ins-label">{label}</label>
      <div className={`ins-input-wrap${errors[name] ? ' is-invalid' : ''}`}>
        <input
          type={type}
          className="ins-input"
          placeholder={placeholder}
          value={form[name]}
          min={min}
          onChange={e => {
            setForm(f => ({ ...f, [name]: e.target.value }));
            setErrors(er => ({ ...er, [name]: '' }));
          }}
        />
      </div>
      {errors[name] && (
        <div className="ins-field-error"><FiAlertCircle size={12} />{errors[name]}</div>
      )}
    </div>
  );

  return (
    <div className="ins-modal-overlay" onClick={onClose}>
      <div className="ins-modal-box" onClick={e => e.stopPropagation()}>
        <div className="ins-modal-head">
          <div className="ins-modal-title-row">
            <div className="ins-modal-icon"><FiShield size={18} /></div>
            <h3>{existing ? 'Update Insurance' : 'Add Insurance'}</h3>
          </div>
          <button className="ins-modal-close-btn" onClick={onClose}><FiX size={18} /></button>
        </div>
        <p className="ins-modal-desc">
          {existing
            ? 'Update your insurance details below.'
            : 'Add your health insurance to keep it on record for your hospital visits.'}
        </p>
        <form onSubmit={handleSubmit} className="ins-modal-form">
          <Field name="provider"     label="Insurance Provider" placeholder="e.g. Star Health, HDFC Ergo, LIC" />
          <Field name="policyNumber" label="Policy Number"      placeholder="e.g. POL-2024-123456" />
          <Field name="validUntil"   label="Valid Until"        type="date" min={new Date().toISOString().split('T')[0]} />
          <div className="ins-modal-actions">
            <button type="button" className="ins-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="ins-btn-save" disabled={saving}>
              {saving
                ? <><span className="ins-spinner" /> Saving…</>
                : <><FiCheck size={14} /> {existing ? 'Update' : 'Save Insurance'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const PatientInsurance = () => {
  const [insurance, setInsurance] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    patientService.getInsurance()
      .then(data => setInsurance(data))
      .catch(() => setInsurance(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    const saved = await patientService.saveInsurance(form);
    setInsurance(saved);
    setShowModal(false);
    toast.success(insurance ? 'Insurance updated!' : 'Insurance added successfully!');
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove your insurance from the record?')) return;
    setDeleting(true);
    try {
      await patientService.deleteInsurance();
      setInsurance(null);
      toast.success('Insurance removed.');
    } catch { toast.error('Failed to remove insurance.'); }
    finally { setDeleting(false); }
  };

  const isExpiringSoon = insurance
    ? new Date(insurance.validUntil) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;
  const isExpired = insurance
    ? new Date(insurance.validUntil) < new Date()
    : false;

  const statusColor = isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : '#16a34a';
  const statusBg    = isExpired ? '#fee2e2' : isExpiringSoon ? '#fef3c7' : '#dcfce7';
  const statusLabel = isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active';

  return (
    <div className="ins-page">
      {showModal && (
        <InsuranceModal
          existing={insurance}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiShield style={{ marginRight: 10, verticalAlign: 'middle', color: '#6366f1' }} />
            Health Insurance
          </h1>
          <p className="page-subtitle">Manage your insurance details for hospital visits.</p>
        </div>
        {!loading && !insurance && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus size={16} /> Add Insurance
          </button>
        )}
      </div>

      {loading ? (
        <div className="ins-skeleton">
          <div className="ins-skeleton-card" />
        </div>
      ) : insurance ? (
        <>
          {/* Insurance Card */}
          <div className="ins-card-big">
            <div className="ins-card-gradient" />
            <div className="ins-card-inner">
              <div className="ins-card-top">
                <div className="ins-card-logo">
                  <FiShield size={28} />
                </div>
                <div className="ins-card-status-badge" style={{ background: statusBg, color: statusColor }}>
                  {statusLabel}
                </div>
              </div>
              <div className="ins-card-details">
                <div className="ins-detail-group">
                  <div className="ins-detail-label">Insurance Provider</div>
                  <div className="ins-detail-value">{insurance.provider}</div>
                </div>
                <div className="ins-detail-group">
                  <div className="ins-detail-label">Policy Number</div>
                  <div className="ins-detail-value ins-policy">{insurance.policyNumber}</div>
                </div>
                <div className="ins-detail-group">
                  <div className="ins-detail-label">
                    <FiCalendar size={12} style={{ marginRight: 4 }} />
                    Valid Until
                  </div>
                  <div className="ins-detail-value" style={{ color: statusColor }}>
                    {format(new Date(insurance.validUntil), 'dd MMMM yyyy')}
                  </div>
                </div>
              </div>
              <div className="ins-card-actions">
                <button className="ins-edit-btn" onClick={() => setShowModal(true)}>
                  <FiEdit2 size={15} /> Edit Details
                </button>
                <button className="ins-delete-btn" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <span className="ins-spinner ins-spinner--sm" /> : <FiTrash2 size={15} />}
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Info boxes */}
          <div className="ins-info-grid">
            <div className="ins-info-box">
              <FiInfo size={16} className="ins-info-icon" />
              <div>
                <div className="ins-info-title">How to use</div>
                <div className="ins-info-text">
                  Show your policy number at the hospital reception. Our staff will verify your coverage before your visit.
                </div>
              </div>
            </div>
            <div className="ins-info-box">
              <FiFileText size={16} className="ins-info-icon" />
              <div>
                <div className="ins-info-title">Keep it updated</div>
                <div className="ins-info-text">
                  Make sure your insurance details are up to date to avoid any delays during your hospital visits.
                </div>
              </div>
            </div>
          </div>

          {isExpiringSoon && !isExpired && (
            <div className="ins-warning-banner">
              <FiAlertCircle size={18} />
              <div>
                <strong>Your insurance is expiring soon!</strong>
                <p>It expires on {format(new Date(insurance.validUntil), 'dd MMM yyyy')}. Please renew it and update your details.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>Update Now</button>
            </div>
          )}

          {isExpired && (
            <div className="ins-expired-banner">
              <FiAlertCircle size={18} />
              <div>
                <strong>Your insurance has expired!</strong>
                <p>Please update your insurance details with a valid policy.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>Update Now</button>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className="ins-empty-page">
          <div className="ins-empty-illustration">
            <FiShield size={64} />
          </div>
          <h2>No Insurance on Record</h2>
          <p>
            Add your health insurance details to keep them readily available for your hospital visits.
            Our staff will use this to speed up your check-in process.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            <FiPlus size={16} /> Add Insurance Now
          </button>
          <div className="ins-benefits">
            <div className="ins-benefit"><FiCheck size={14} /><span>Faster check-in at reception</span></div>
            <div className="ins-benefit"><FiCheck size={14} /><span>Insurance coverage verification</span></div>
            <div className="ins-benefit"><FiCheck size={14} /><span>Policy details always accessible</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInsurance;

