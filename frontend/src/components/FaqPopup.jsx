import React, { useState, useRef, useEffect } from 'react';
import {
  FiX, FiSend, FiUser, FiAlertCircle,
  FiMessageCircle, FiCalendar, FiDollarSign, FiUserPlus,
  FiActivity, FiShield, FiPhone, FiMinimize2, FiRefreshCw,
  FiHelpCircle, FiChevronRight,
} from 'react-icons/fi';
import { aiService } from '../services/api';
import './FaqPopup.css';

const CATEGORIES = [
  { icon: FiCalendar,   label: 'Book Appointment',  q: 'How do I book an appointment?' },
  { icon: FiDollarSign, label: 'Consultation Fee',   q: 'What is the consultation fee?' },
  { icon: FiUserPlus,   label: 'Register',           q: 'How do I register as a new patient?' },
  { icon: FiActivity,   label: 'Specializations',    q: 'What specializations are available?' },
  { icon: FiShield,     label: 'Data Security',      q: 'Is my health data secure?' },
  { icon: FiPhone,      label: 'Contact Support',    q: 'How do I contact support?' },
];

// Suggested follow-ups based on what was just answered
const FOLLOW_UPS = {
  'book':         ['What is the consultation fee?', 'How do I pay online?'],
  'fee':          ['What payment methods are accepted?', 'How do I book an appointment?'],
  'register':     ['How do I book an appointment?', 'Is my health data secure?'],
  'specializ':    ['How do I book an appointment?', 'How do I find a doctor?'],
  'secure':       ['How do I register as a new patient?', 'How do I contact support?'],
  'contact':      ['How do I book an appointment?', 'How do I register as a new patient?'],
  'cancel':       ['How do I book a new appointment?', 'How do I contact support?'],
  'payment':      ['What is the consultation fee?', 'How do I book an appointment?'],
  'doctor':       ['How do I book an appointment?', 'What specializations are available?'],
  'emergency':    ['How do I contact support?', 'How do I book an appointment?'],
};

function getFollowUps(question) {
  const lower = (question || '').toLowerCase();
  for (const [key, suggestions] of Object.entries(FOLLOW_UPS)) {
    if (lower.includes(key)) return suggestions;
  }
  return ['How do I book an appointment?', 'What is the consultation fee?'];
}

const BOT_AVATAR = '🏥';

function formatAnswer(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (t.startsWith('## ')) return <h4 key={i} className="faqp-h4">{t.slice(3)}</h4>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} className="faqp-li">{t.slice(2)}</li>;
    if (t === '') return null;
    const parts = t.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="faqp-p">
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const TypingDots = () => (
  <div className="faqp-bubble-text faqp-bubble-typing">
    <span /><span /><span />
  </div>
);

const FaqPopup = () => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [pulse, setPulse]       = useState(true);
  const [unread, setUnread]     = useState(0);
  const [lastQ, setLastQ]       = useState('');
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    if (open) { setPulse(false); setUnread(0); setTimeout(() => inputRef.current?.focus(), 150); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setError(null);
    setLastQ(msg);
    setMessages(prev => [...prev, { role: 'user', text: msg, time: getTime() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiService.faq(msg);
      const answer = res.answer || '';
      const isNotFound = answer.toLowerCase().includes('not found') ||
                         answer.toLowerCase().includes('could you please rephrase');
      setMessages(prev => [...prev, {
        role: 'ai',
        text: isNotFound
          ? "I'm not sure about that specific topic. Here are some things I can help with:"
          : answer,
        time: getTime(),
        notFound: isNotFound,
        followUps: getFollowUps(msg),
        meta: { model: res.model, latencyMs: res.latencyMs },
      }]);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      setError('⚠️ Could not connect to the assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setError(null); setLastQ(''); };

  const followUps = messages.length > 0 ? getFollowUps(lastQ) : [];

  return (
    <>
      {/* ── FAB ── */}
      <button
        className={`faqp-fab${pulse ? ' faqp-fab--pulse' : ''}${open ? ' faqp-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open FAQ chatbot"
      >
        <span className="faqp-fab-inner">
          {open ? <FiX size={20} /> : <FiMessageCircle size={20} />}
          {!open && <span className="faqp-fab-label">Ask Us</span>}
        </span>
        {!open && unread > 0 && <span className="faqp-badge">{unread}</span>}
      </button>

      {/* ── Panel ── */}
      <div className={`faqp-panel${open ? ' faqp-panel--open' : ''}`}>

        {/* Header */}
        <div className="faqp-header">
          <div className="faqp-header-bot">
            <div className="faqp-bot-avatar">{BOT_AVATAR}</div>
            <div className="faqp-online-dot" />
          </div>
          <div className="faqp-header-info">
            <div className="faqp-header-title">MediCare Assistant</div>
            <div className="faqp-header-status">
              <span className="faqp-status-dot" />
              Online · Replies instantly
            </div>
          </div>
          <div className="faqp-header-actions">
            {messages.length > 0 && (
              <button className="faqp-hbtn" onClick={clearChat} title="Clear chat">
                <FiRefreshCw size={14} />
              </button>
            )}
            <button className="faqp-hbtn" onClick={() => setOpen(false)} title="Close">
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="faqp-messages">

          {/* Welcome card */}
          <div className="faqp-welcome">
            <div className="faqp-welcome-emoji">👋</div>
            <div className="faqp-welcome-text">
              <strong>Hi! I'm your MediCare assistant.</strong>
              <br />Ask me anything about our services or pick a topic below.
            </div>
          </div>

          {/* Quick topic chips (always at the top if no messages yet) */}
          {messages.length === 0 && (
            <div className="faqp-quick-start">
              <div className="faqp-quick-label">
                <FiHelpCircle size={12} /> Popular questions
              </div>
              <div className="faqp-quick-grid">
                {CATEGORIES.map(({ icon: Icon, label, q }) => (
                  <button
                    key={q}
                    className="faqp-quick-btn"
                    onClick={() => sendMessage(q)}
                    disabled={loading}
                  >
                    <Icon size={14} className="faqp-quick-icon" />
                    <span>{label}</span>
                    <FiChevronRight size={11} className="faqp-quick-arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`faqp-msg faqp-msg--${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="faqp-msg-avatar faqp-msg-avatar--ai">{BOT_AVATAR}</div>
              )}
              <div className="faqp-msg-content">
                <div className={`faqp-bubble-text${msg.notFound ? ' faqp-bubble--warn' : ''}`}>
                  {formatAnswer(msg.text)}
                  {/* Follow-up suggestions after notFound */}
                  {msg.notFound && msg.followUps && (
                    <div className="faqp-followups">
                      {msg.followUps.map(fq => (
                        <button key={fq} className="faqp-followup-btn" onClick={() => sendMessage(fq)} disabled={loading}>
                          <FiChevronRight size={11} /> {fq}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="faqp-msg-time">{msg.time}</div>
                {/* Suggested follow-ups after a real answer */}
                {msg.role === 'ai' && !msg.notFound && idx === messages.length - 1 && followUps.length > 0 && (
                  <div className="faqp-suggestions">
                    <div className="faqp-sug-label">You might also ask:</div>
                    {followUps.map(fq => (
                      <button key={fq} className="faqp-sug-btn" onClick={() => sendMessage(fq)} disabled={loading}>
                        <FiChevronRight size={11} /> {fq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="faqp-msg-avatar faqp-msg-avatar--user"><FiUser size={13} /></div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="faqp-msg faqp-msg--ai">
              <div className="faqp-msg-avatar faqp-msg-avatar--ai">{BOT_AVATAR}</div>
              <div className="faqp-msg-content">
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div className="faqp-error">
              <FiAlertCircle size={14} />
              <span>{error}</span>
              <button className="faqp-retry-btn" onClick={() => lastQ && sendMessage(lastQ)}>Retry</button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Category chips (always shown at the bottom after conversation starts) */}
        {messages.length > 0 && (
          <div className="faqp-categories">
            <div className="faqp-cat-label">Quick Topics</div>
            <div className="faqp-cat-grid">
              {CATEGORIES.map(({ icon: Icon, label, q }) => (
                <button
                  key={q}
                  className="faqp-cat-btn"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                >
                  <Icon size={13} className="faqp-cat-icon" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="faqp-input-area">
          <div className="faqp-input-row">
            <textarea
              ref={inputRef}
              className="faqp-input"
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your question…"
              disabled={loading}
            />
            <button
              className={`faqp-send${input.trim() && !loading ? ' faqp-send--active' : ''}`}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading
                ? <span className="faqp-send-spinner" />
                : <FiSend size={15} />}
            </button>
          </div>
          <div className="faqp-powered">
            ⚡ Powered by MediCare AI · No patient data accessed
          </div>
        </div>
      </div>

      {open && <div className="faqp-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
};

export default FaqPopup;

