import React, { useState, useRef, useEffect } from 'react';
import {
  FiX, FiSend, FiUser, FiAlertCircle, FiRefreshCw,
  FiCpu, FiMinimize2, FiFileText, FiMessageSquare,
} from 'react-icons/fi';
import { aiService, doctorService, adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AiAssistantPopup.css';

const BOT_AVATAR = '🤖';

function formatAnswer(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (t.startsWith('## ')) return <h4 key={i} className="aip-h4">{t.slice(3)}</h4>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} className="aip-li">{t.slice(2)}</li>;
    if (t === '') return <br key={i} />;
    const parts = t.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="aip-p">
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Normalize roles — backend returns Set<RoleType> serialized as ["PATIENT"],
 * OAuth2 callback sets roles as a plain string array.
 * Both cases produce strings; this ensures we always get plain uppercase strings.
 */
function normalizeRoles(roles) {
  if (!roles) return [];
  return roles.map(r => (typeof r === 'string' ? r : r?.name || String(r)).toUpperCase());
}

function getRoleConfig(user) {
  if (!user) return null;
  const roles = normalizeRoles(user.roles);

  if (roles.includes('PATIENT')) return {
    role: 'PATIENT',
    title: 'Health Assistant',
    subtitle: 'Your personal medical AI',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    welcomeTitle: 'Your Health Assistant',
    welcomeText: 'Ask me about your appointments, blood group, insurance, or any health record.',
    placeholder: 'Ask about your health records…',
    defaultMode: 'qa',
  };
  if (roles.includes('DOCTOR')) return {
    role: 'DOCTOR',
    title: 'Doctor AI Assistant',
    subtitle: 'Clinical summaries & patient Q&A',
    color: '#0891b2',
    gradient: 'linear-gradient(135deg,#0891b2,#7c3aed)',
    welcomeTitle: 'Clinical AI Assistant',
    welcomeText: 'Select a patient to get a clinical summary or ask grounded questions about their record.',
    placeholder: 'Ask about this patient…',
    defaultMode: 'qa',
  };
  if (roles.includes('ADMIN')) return {
    role: 'ADMIN',
    title: 'Admin AI Assistant',
    subtitle: 'Full access to all patient records',
    color: '#059669',
    gradient: 'linear-gradient(135deg,#059669,#0891b2)',
    welcomeTitle: 'Admin AI Assistant',
    welcomeText: 'Select any patient to view their clinical summary or ask questions about their record.',
    placeholder: 'Ask about this patient…',
    defaultMode: 'summary',
  };
  return null;
}

const AiAssistantPopup = () => {
  const { user } = useAuth();
  const config = getRoleConfig(user);

  const [open, setOpen]                = useState(false);
  const [messages, setMessages]        = useState([]);
  const [input, setInput]              = useState('');
  const [loading, setLoading]          = useState(false);
  const [error, setError]              = useState(null);
  const [pulse, setPulse]              = useState(true);
  const [unread, setUnread]            = useState(0);
  const [mode, setMode]                = useState(config?.defaultMode || 'qa');
  const [patients, setPatients]        = useState([]);
  const [selectedPatient, setSelected] = useState(null);
  const [patientsLoaded, setPLoaded]   = useState(false);
  const bottomRef                      = useRef(null);
  const inputRef                       = useRef(null);

  // Load patient list for DOCTOR / ADMIN
  useEffect(() => {
    if (!config) return;
    if (config.role === 'DOCTOR') {
      doctorService.getAppointments()
        .then(data => {
          const seen = new Set();
          const unique = data.filter(a => {
            if (seen.has(a.patientId)) return false;
            seen.add(a.patientId); return true;
          });
          setPatients(unique.map(a => ({ id: a.patientId, name: a.patientName || `Patient #${a.patientId}` })));
        })
        .catch(err => console.error('Failed to load doctor appointments:', err))
        .finally(() => setPLoaded(true));
    } else if (config.role === 'ADMIN') {
      adminService.getAllPatients(0, 100)
        .then(data => setPatients((data || []).map(p => ({ id: p.id, name: p.name || `Patient #${p.id}` }))))
        .catch(err => console.error('Failed to load patients:', err))
        .finally(() => setPLoaded(true));
    } else {
      setPLoaded(true);
    }
  }, [config?.role]);

  useEffect(() => {
    if (open) { setPulse(false); setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!config) return null;

  // ── Core AI call helper ───────────────────────────────────────────────────
  const callAi = async (apiCall, userText) => {
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: userText, time: getTime() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await apiCall();
      setMessages(prev => [...prev, {
        role: 'ai', text: res.answer, time: getTime(),
        meta: { model: res.model, latencyMs: res.latencyMs },
      }]);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message
        || err?.response?.data?.error
        || err?.message
        || 'AI service error.';
      if (status === 403) setError('Access denied: you are not authorised to view this patient\'s data.');
      else if (status === 401) setError('Session expired. Please log in again.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Send typed question ───────────────────────────────────────────────────
  const sendMessage = async (textArg) => {
    const msg = (textArg || input).trim();
    if (!msg || loading) return;

    // PATIENT: always use their own userId (== patient primary key via @MapsId)
    if (config.role === 'PATIENT') {
      const patientId = user?.userId;
      if (!patientId) { setError('Could not determine your patient ID. Please log out and back in.'); return; }
      await callAi(() => aiService.qa(patientId, msg), msg);
      return;
    }

    // DOCTOR / ADMIN: need a selected patient
    if (!selectedPatient) { setError('Please select a patient first.'); return; }

    if (mode === 'qa') {
      await callAi(() => aiService.qa(selectedPatient.id, msg), msg);
    }
    // In summary mode, typing is disabled — use the button instead
  };

  // ── Generate summary (DOCTOR / ADMIN only) ────────────────────────────────
  const handleSummary = async () => {
    if (!selectedPatient) { setError('Please select a patient first.'); return; }
    if (loading) return;
    await callAi(
      () => aiService.summary(selectedPatient.id),
      `Generate clinical summary for ${selectedPatient.name}`
    );
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setError(null); };

  const handlePatientChange = (e) => {
    const p = patients.find(p => String(p.id) === e.target.value);
    setSelected(p || null);
    setMessages([]);
    setError(null);
  };

  const handleModeChange = (m) => {
    setMode(m);
    setMessages([]);
    setError(null);
  };

  const needsPatient = config.role === 'DOCTOR' || config.role === 'ADMIN';
  const inputDisabled = loading || (needsPatient && !selectedPatient);

  return (
    <>
      {/* ── FAB ── */}
      <button
        className={`aip-fab${pulse ? ' aip-fab--pulse' : ''}${open ? ' aip-fab--open' : ''}`}
        style={{ background: open ? config.color : config.gradient }}
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Assistant"
      >
        <span className="aip-fab-inner">
          {open ? <FiX size={20} /> : <FiCpu size={20} />}
          {!open && <span className="aip-fab-label">AI Assistant</span>}
        </span>
        {!open && unread > 0 && <span className="aip-badge">{unread}</span>}
      </button>

      {/* ── Panel ── */}
      <div className={`aip-panel${open ? ' aip-panel--open' : ''}`}>

        {/* Header */}
        <div className="aip-header" style={{ background: config.gradient }}>
          <div className="aip-header-bot">
            <div className="aip-bot-avatar">{BOT_AVATAR}</div>
            <div className="aip-online-dot" />
          </div>
          <div className="aip-header-info">
            <div className="aip-header-title">{config.title}</div>
            <div className="aip-header-sub">{config.subtitle}</div>
          </div>
          <div className="aip-header-actions">
            {messages.length > 0 && (
              <button className="aip-hbtn" onClick={clearChat} title="Clear chat">
                <FiMinimize2 size={14} />
              </button>
            )}
            <button className="aip-hbtn" onClick={() => setOpen(false)} title="Close">
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Patient selector + mode tabs (Doctor / Admin only) */}
        {needsPatient && (
          <div className="aip-controls">
            <select
              className="aip-select"
              value={selectedPatient?.id || ''}
              onChange={handlePatientChange}
              disabled={!patientsLoaded || loading}
            >
              <option value="">
                {!patientsLoaded ? 'Loading patients…' : patients.length === 0 ? 'No patients found' : '— Select a patient —'}
              </option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="aip-mode-tabs">
              <button
                className={`aip-mode-tab${mode === 'qa' ? ' active' : ''}`}
                onClick={() => handleModeChange('qa')}
              >
                <FiMessageSquare size={12} /> Q&amp;A
              </button>
              <button
                className={`aip-mode-tab${mode === 'summary' ? ' active' : ''}`}
                onClick={() => handleModeChange('summary')}
              >
                <FiFileText size={12} /> Summary
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="aip-messages">
          <div className="aip-welcome">
            <div className="aip-welcome-emoji">🤖</div>
            <div className="aip-welcome-text">
              <strong>{config.welcomeTitle}</strong>
              <br />{config.welcomeText}
            </div>
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={`aip-msg aip-msg--${msg.role}`}>
              {msg.role === 'ai' && <div className="aip-avatar aip-avatar--ai">{BOT_AVATAR}</div>}
              <div className="aip-msg-content">
                <div className="aip-bubble">{formatAnswer(msg.text)}</div>
                <div className="aip-msg-time">{msg.time}</div>
              </div>
              {msg.role === 'user' && <div className="aip-avatar aip-avatar--user"><FiUser size={13} /></div>}
            </div>
          ))}

          {loading && (
            <div className="aip-msg aip-msg--ai">
              <div className="aip-avatar aip-avatar--ai">{BOT_AVATAR}</div>
              <div className="aip-msg-content">
                <div className="aip-bubble aip-bubble--typing"><span /><span /><span /></div>
              </div>
            </div>
          )}

          {error && (
            <div className="aip-error">
              <FiAlertCircle size={14} /><span>{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Summary button (DOCTOR/ADMIN in summary mode) */}
        {needsPatient && mode === 'summary' && (
          <div className="aip-summary-bar">
            <button
              className="aip-summary-btn"
              style={{ background: config.gradient }}
              onClick={handleSummary}
              disabled={loading || !selectedPatient}
            >
              {loading
                ? <><FiRefreshCw size={14} className="aip-spin" /> Generating…</>
                : <><FiFileText size={14} /> Generate Clinical Summary</>
              }
            </button>
          </div>
        )}

        {/* Input row (PATIENT always; DOCTOR/ADMIN only in QA mode) */}
        {(config.role === 'PATIENT' || mode === 'qa') && (
          <div className="aip-input-area">
            <div className="aip-input-row">
              <textarea
                ref={inputRef}
                className="aip-input"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={needsPatient && !selectedPatient ? 'Select a patient above first…' : config.placeholder}
                disabled={inputDisabled}
              />
              <button
                className={`aip-send${input.trim() && !loading ? ' aip-send--active' : ''}`}
                style={input.trim() && !loading ? { background: config.gradient } : {}}
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                {loading ? <FiRefreshCw size={15} className="aip-spin" /> : <FiSend size={15} />}
              </button>
            </div>
            <div className="aip-powered">⚡ Grounded AI · Based on recorded data only</div>
          </div>
        )}
      </div>

      {open && <div className="aip-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
};

export default AiAssistantPopup;

