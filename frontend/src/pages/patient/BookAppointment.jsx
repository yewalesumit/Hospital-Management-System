import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiCalendar, FiClock, FiFileText, FiCheck,
  FiArrowRight, FiCreditCard, FiShield, FiAlertCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { publicService, patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ── Load Razorpay checkout.js ─────────────────────────────────────────── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* ── Step Bar ──────────────────────────────────────────────────────────── */
const StepBar = ({ step }) => (
  <div className="steps" style={{ marginBottom: 0 }}>
    {[['1','Select Doctor'],['2','Date & Time'],['3','Payment']].map(([n, label], i) => (
      <React.Fragment key={n}>
        {i > 0 && <div className={`step-line ${step > i ? 'done' : ''}`} />}
        <div className={`step ${step >= i+1 ? 'active' : ''} ${step > i+1 ? 'done' : ''}`}>
          <div className="step-circle">{step > i+1 ? <FiCheck /> : n}</div>
          <span className="step-label">{label}</span>
        </div>
      </React.Fragment>
    ))}
  </div>
);

/* ── Main Page ─────────────────────────────────────────────────────────── */
const BookAppointment = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [step,      setStep]      = useState(1);
  const [doctors,   setDoctors]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [fee,       setFee]       = useState(50000);
  const [payError,  setPayError]  = useState('');

  const [formData, setFormData] = useState({ doctorId: '', date: '', time: '', reason: '' });
  const selectedDoctor = doctors.find(d => d.id === Number(formData.doctorId));

  useEffect(() => {
    // Pre-load Razorpay script in background
    loadRazorpayScript();

    publicService.getAllDoctors()
      .then(data => setDoctors(data))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  /* Fetch fee once on step 3 */
  useEffect(() => {
    if (step === 3) {
      patientService.getPaymentConfig()
        .then(cfg => setFee(cfg.fee || 50000))
        .catch(() => {});
    }
  }, [step]);

  const handlePay = useCallback(async () => {
    setPayError('');
    setPreparing(true);

    try {
      /* 1. Make sure Razorpay JS is loaded */
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const appointmentTime = `${formData.date}T${formData.time}:00`;

      /* 2. Create order on backend -> Razorpay API */
      const order = await patientService.createPaymentOrder({
        patientId: user.userId,
        doctorId:  Number(formData.doctorId),
        appointmentTime,
        reason:    formData.reason,
      });

      /* 3. Open Razorpay Checkout */
      const options = {
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency || 'INR',
        name:        'MediCare Hospital',
        description: `Consultation with Dr. ${selectedDoctor?.name}`,
        image:       'https://cdn-icons-png.flaticon.com/512/2382/2382461.png',
        order_id:    order.orderId,
        prefill: {
          name:    order.patientName  || user?.name  || '',
          email:   order.patientEmail || user?.email || '',
          contact: user?.phone || '',
        },
        notes: {
          doctorName: selectedDoctor?.name || '',
          reason:     formData.reason,
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setPreparing(false);
            toast.info('Payment cancelled.');
          },
          animation: true,
          backdropclose: false,
          escape: true,
        },
        config: {
          display: {
            blocks: {
              banks: { name: 'Pay via Net Banking', instruments: [{ method: 'netbanking' }] },
              upi:   { name: 'Pay via UPI',         instruments: [{ method: 'upi' }] },
              card:  { name: 'Pay via Card',         instruments: [{ method: 'card' }] },
            },
            sequence: ['block.card', 'block.upi', 'block.banks'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async (response) => {
          /* 4. Verify payment + create appointment */
          try {
            await patientService.verifyPayment({
              orderId:         response.razorpay_order_id,
              paymentId:       response.razorpay_payment_id,
              signature:       response.razorpay_signature,
              patientId:       user.userId,
              doctorId:        Number(formData.doctorId),
              appointmentTime,
              reason:          formData.reason,
            });
            toast.success('Payment successful! Appointment booked.');
            navigate('/patient/dashboard');
          } catch (err) {
            toast.error(err.response?.data?.error || 'Booking failed after payment. Contact support.');
          } finally {
            setPreparing(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setPreparing(false);
        setPayError(`Payment failed: ${resp.error.description}`);
        toast.error('Payment failed: ' + resp.error.description);
      });
      rzp.open();

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to initiate payment.';
      setPayError(msg);
      toast.error(msg);
      setPreparing(false);
    }
  }, [formData, user, selectedDoctor, navigate]);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="book-appointment">
      <div className="page-header">
        <h1 className="page-title">Book an Appointment</h1>
        <p className="page-subtitle">Select a specialist, choose your time, and pay securely via Razorpay.</p>
      </div>

      <div className="card" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div className="card-header" style={{ padding: '30px 40px' }}>
          <StepBar step={step} />
        </div>

        <div className="card-body" style={{ padding: '40px' }}>

          {/* ── Step 1: Select Doctor ── */}
          {step === 1 && (
            <div className="step-1 animate-fade">
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Available Specialists</h3>
              {doctors.length === 0
                ? <div className="empty-state"><p>No doctors available yet.</p></div>
                : (
                  <div className="grid grid-3">
                    {doctors.map(doc => (
                      <div
                        key={doc.id}
                        className={`doctor-card ${Number(formData.doctorId) === doc.id ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, doctorId: doc.id })}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="doctor-avatar"><FiUser color="var(--primary-dark)" /></div>
                        <div>
                          <div className="doctor-name">{`Dr. ${doc.name}`}</div>
                          <div className="doctor-spec">{doc.specialization}</div>
                        </div>
                        {Number(formData.doctorId) === doc.id && (
                          <FiCheck style={{ color: 'var(--success)', marginLeft: 'auto' }} />
                        )}
                      </div>
                    ))}
                  </div>
                )
              }
              <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <button className="btn btn-primary btn-lg" onClick={() => setStep(2)} disabled={!formData.doctorId}>
                  Continue <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Date & Time ── */}
          {step === 2 && (
            <div className="step-2 animate-slide-up">
              <div className="alert alert-info" style={{ marginBottom: '24px' }}>
                <FiUser size={18} />&nbsp;Selected: <strong>Dr. {selectedDoctor?.name}</strong> — {selectedDoctor?.specialization}
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Appointment Date</label>
                  <div className="search-bar">
                    <FiCalendar className="search-icon" />
                    <input
                      type="date" className="form-control" required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Preferred Time</label>
                  <div className="search-bar">
                    <FiClock className="search-icon" />
                    <input
                      type="time" className="form-control" required
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Reason for Visit</label>
                  <div className="search-bar">
                    <FiFileText className="search-icon" style={{ top: '20px' }} />
                    <textarea
                      className="form-control" rows="4" required
                      placeholder="Briefly describe your symptoms or reason for visit..."
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button
                  className="btn btn-primary btn-lg"
                  disabled={!formData.date || !formData.time || !formData.reason}
                  onClick={() => setStep(3)}
                >
                  Proceed to Payment <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment Summary ── */}
          {step === 3 && (
            <div className="step-3 animate-fade">
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>Booking Summary</h3>

              {/* Summary grid */}
              <div style={{ background: 'var(--bg-subtle,#f8f9fa)', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {Object.entries({
                  Doctor:         `Dr. ${selectedDoctor?.name}`,
                  Specialization: selectedDoctor?.specialization ?? '—',
                  Date:           formData.date ? new Date(formData.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—',
                  Time:           formData.time || '—',
                  Reason:         formData.reason || '—',
                  Patient:        user?.name || user?.username || '—',
                }).map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Fee card */}
              <div style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '18px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#4338ca', fontWeight: 700 }}>Consultation Fee</div>
                  <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '3px' }}>Inclusive of all charges</div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#4338ca' }}>&#8377;{Math.round(fee / 100)}</div>
              </div>

              {/* Razorpay trust badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
                <img
                  src="https://checkout.razorpay.com/v1/razorpay.js"
                  onError={e => e.target.style.display='none'}
                  alt=""
                  width={0} height={0}
                />
                <svg width="90" height="20" viewBox="0 0 245 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M62.3 44.2L50 15h8.4l7.8 19.4L74 15h8.2L69.8 44.2H62.3z" fill="#072654"/>
                  <path d="M82.6 44.2V15h7.6v29.2H82.6zM93.4 44.2V15h7.6v22.8h14v6.4H93.4zM117.4 44.2V15h7.6v29.2h-7.6z" fill="#072654"/>
                </svg>
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                  Secure payment powered by <strong>Razorpay</strong>
                </span>
                <FiShield size={14} color="#22c55e" style={{ marginLeft: 'auto' }} />
              </div>

              {/* What you can pay with */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {['VISA', 'Mastercard', 'UPI', 'Net Banking', 'Wallets'].map(m => (
                  <span key={m} style={{ fontSize: '11px', padding: '4px 10px', background: '#f3f4f6', borderRadius: '20px', color: '#374151', fontWeight: 600, border: '1px solid #e5e7eb' }}>
                    {m}
                  </span>
                ))}
              </div>

              {payError && (
                <div className="alert alert-error" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                  <FiAlertCircle size={16} /> {payError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={preparing}>Back</button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handlePay}
                  disabled={preparing}
                  style={{ minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {preparing
                    ? <><span className="spinner spinner-sm" /> Opening Razorpay...</>
                    : <><FiCreditCard /> Pay &#8377;{Math.round(fee / 100)} via Razorpay</>
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
