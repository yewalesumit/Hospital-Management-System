import React, { useEffect, useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiX, FiUser, FiCalendar, FiShield, FiClock } from 'react-icons/fi';
import { adminService } from '../../services/api';
import { format } from 'date-fns';

// ── Info Card helper ──────────────────────────────────────────────────────────
const InfoCard = ({ label, value }) => (
  <div style={{ background: 'var(--bg-subtle, #f8f9fa)', borderRadius: '10px', padding: '12px 16px' }}>
    <div style={{ fontSize: '11px', color: 'var(--text-muted, #888)', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: 600 }}>{value || '—'}</div>
  </div>
);

// ── Patient Record Modal ──────────────────────────────────────────────────────
const PatientRecordModal = ({ patient, onClose }) => {
  if (!patient) return null;

  const fmt  = (d) => { try { return d ? format(new Date(d), 'dd MMM yyyy') : '—'; } catch { return '—'; } };
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
          background: 'var(--bg-card, #fff)', borderRadius: '16px',
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
              color: '#fff', fontSize: '22px', fontWeight: 700,
            }}>
              {patient.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{patient.name}</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #888)' }}>Patient ID #{patient.id}</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #888)', padding: '4px' }}>
            <FiX size={22} />
          </button>
        </div>

        {/* Section heading helper */}
        {(() => {
          const SectionTitle = ({ icon: Icon, title }) => (
            <h3 style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #888)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: '12px', marginTop: 0,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Icon size={13} /> {title}
            </h3>
          );

          return (
            <>
              {/* Personal Info */}
              <div style={{ marginBottom: '20px' }}>
                <SectionTitle icon={FiUser} title="Personal Information" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <InfoCard label="Email" value={patient.email} />
                  <InfoCard label="Gender" value={patient.gender} />
                  <InfoCard label="Date of Birth" value={fmt(patient.birthDate)} />
                  <InfoCard label="Blood Group" value={patient.bloodGroup?.replace(/_/g, ' ')} />
                </div>
              </div>

              {/* Insurance */}
              <div style={{ marginBottom: '20px' }}>
                <SectionTitle icon={FiShield} title="Insurance" />
                {patient.insurancePolicyNumber ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <InfoCard label="Policy Number" value={patient.insurancePolicyNumber} />
                    <InfoCard label="Provider" value={patient.insuranceProvider} />
                    <InfoCard label="Valid Until" value={fmt(patient.insuranceValidUntil)} />
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted, #888)', fontSize: '14px', margin: 0 }}>No insurance on record.</p>
                )}
              </div>

              {/* Appointments */}
              <div>
                <SectionTitle icon={FiCalendar} title={`Appointment History (${patient.appointments?.length || 0})`} />
                {patient.appointments?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {patient.appointments.map(appt => (
                      <div key={appt.id} style={{
                        border: '1px solid var(--border, #e5e7eb)', borderRadius: '10px',
                        padding: '14px 16px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                            {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Unknown Doctor'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>
                            {appt.doctor?.specialization || ''}
                          </div>
                          {appt.reason && (
                            <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary, #555)' }}>
                              Reason: {appt.reason}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, fontSize: '12px', color: 'var(--text-muted, #888)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiClock size={11} /> {fmtDT(appt.appointmentTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted, #888)', fontSize: '14px', margin: 0 }}>No appointments on record.</p>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const PatientManagement = () => {
  const [patients, setPatients]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [page, setPage]                       = useState(0);
  const [totalPages, setTotalPages]           = useState(1);
  const [search, setSearch]                   = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalLoading, setModalLoading]       = useState(false);
  const [modalError, setModalError]           = useState('');

  const loadPatients = async (pageNum) => {
    setLoading(true);
    try {
      const data = await adminService.getAllPatients(pageNum, 10);
      setPatients(data.content || data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPatients(page); }, [page]);

  const handleViewRecord = async (patientId) => {
    setModalError('');
    setSelectedPatient(null);
    setModalLoading(true);
    try {
      const detail = await adminService.getPatientById(patientId);
      setSelectedPatient(detail);
    } catch (err) {
      setModalError('Failed to load patient record. Please try again.');
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard shell">
      <div className="page-header relative">
        <div style={{ paddingBottom: '20px' }}>
          <h1 className="page-title">Patient Management</h1>
          <p className="page-subtitle">View and manage all registered patients.</p>
        </div>
        <div className="search-bar" style={{ width: '300px' }}>
          <FiSearch className="search-icon" />
          <input type="text" className="form-control" placeholder="Search patients..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {modalError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{modalError}</div>}

      {modalLoading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px 48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, color: 'var(--text-secondary, #555)' }}>Loading patient record…</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper relative">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Patient Name</th><th>Email</th>
                <th>Gender</th><th>Blood Group</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No patients found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id || p.userId}>
                  <td style={{ color: 'var(--text-muted)' }}>#{p.id || p.userId}</td>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.gender || '—'}</td>
                  <td><span className="badge badge-error">{p.bloodGroup?.replace(/_/g, ' ') || '—'}</span></td>
                  <td>
                    <button className="btn btn-primary btn-sm"
                      onClick={() => handleViewRecord(p.id || p.userId)}>
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <div className="pagination" style={{ padding: 0 }}>
              <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <FiChevronLeft /> Prev
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedPatient && (
        <PatientRecordModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </div>
  );
};

export default PatientManagement;
