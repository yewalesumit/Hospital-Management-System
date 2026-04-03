import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FiSend, FiCpu, FiUser, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import './AiChat.css';

const AiChat = forwardRef(({ mode, onSend, placeholder, title, subtitle, autoSummary = false }, ref) => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const bottomRef                 = useRef(null);
  const autoFired                 = useRef(false);

  // Expose sendMessage so parent can trigger it (e.g. chip buttons in FaqBot)
  useImperativeHandle(ref, () => ({
    sendMessage: (text) => {
      if (text && !loading) {
        setMessages(prev => [...prev, { role: 'user', text }]);
        handleSendInternal(text);
      }
    }
  }));

  useEffect(() => {
    if (autoSummary && mode === 'summary' && !autoFired.current) {
      autoFired.current = true;
      handleSendInternal('Generate a clinical summary for this patient.');
    }
  }, [autoSummary, mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendInternal = async (text) => {
    if (!text || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await onSend(text);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: res.answer,
        meta: { model: res.model, provider: res.provider, latencyMs: res.latencyMs }
      }]);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setError('Access denied: you are not authorised to view this patient data.');
      } else {
        setError(err?.response?.data?.error || err?.message || 'AI service error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    handleSendInternal(text);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <div className="ai-chat-header-icon"><FiCpu size={18} /></div>
        <div>
          <div className="ai-chat-title">{title || 'AI Assistant'}</div>
          {subtitle && <div className="ai-chat-subtitle">{subtitle}</div>}
        </div>
        <div className="ai-chat-badge">AI Powered</div>
      </div>
      <div className="ai-chat-messages">
        {messages.length === 0 && !loading && (
          <div className="ai-chat-empty">
            <FiCpu size={32} className="ai-chat-empty-icon" />
            <p>Ask me anything about {mode === 'faq' ? 'MediCare Hospital' : "this patient's records"}.</p>
            <p className="ai-chat-empty-hint">Responses are grounded in {mode === 'faq' ? 'FAQ data only' : 'patient records only'}.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-message ai-message--${msg.role}`}>
            <div className="ai-message-avatar">
              {msg.role === 'user' ? <FiUser size={14} /> : <FiCpu size={14} />}
            </div>
            <div className="ai-message-body">
              <div className="ai-message-text">{formatAnswer(msg.text)}</div>
              {msg.meta && (
                <div className="ai-message-meta">
                  {msg.meta.model} · {msg.meta.provider} · {msg.meta.latencyMs}ms
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai-message--ai">
            <div className="ai-message-avatar"><FiCpu size={14} /></div>
            <div className="ai-message-body">
              <div className="ai-typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        {error && (
          <div className="ai-error">
            <FiAlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="ai-chat-input-row">
        <textarea
          className="ai-chat-input"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || 'Ask a question...'}
          disabled={loading}
        />
        <button
          className="ai-chat-send"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          {loading ? <FiRefreshCw size={16} className="spin" /> : <FiSend size={16} />}
        </button>
      </div>
      <div className="ai-chat-disclaimer">
        AI responses are based on recorded data only. Not a substitute for clinical judgement.
      </div>
    </div>
  );
});

AiChat.displayName = 'AiChat';

function formatAnswer(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (t.startsWith('## ')) return <h4 key={i} className="ai-answer-h4">{t.slice(3)}</h4>;
    if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} className="ai-answer-li">{t.slice(2)}</li>;
    if (t === '') return <br key={i} />;
    const parts = t.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="ai-answer-p">
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

export default AiChat;
