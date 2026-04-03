import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../services/api';
import AiChat from '../components/AiChat';
import { FiHelpCircle, FiArrowLeft } from 'react-icons/fi';
import './FaqBot.css';

const CHIPS = [
  'How do I book an appointment?',
  'What is the consultation fee?',
  'How do I register as a patient?',
  'What specializations are available?',
  'How do I cancel an appointment?',
  'Are emergency services available?',
];

/**
 * Public FAQ Bot — uses only the FAQ knowledge base; never accesses patient data.
 * Route: /faq (public, no auth required)
 */
const FaqBot = () => {
  const chatRef = useRef(null);
  const handleSend = (question) => aiService.faq(question);

  const sendChip = (q) => {
    chatRef.current?.sendMessage(q);
  };

  return (
    <div className="faq-page">
      {/* Back to home */}
      <Link to="/" className="faq-back-link">
        <FiArrowLeft size={15} /> Back to Home
      </Link>

      {/* Hero */}
      <div className="faq-hero">
        <div className="faq-hero-icon"><FiHelpCircle size={28} /></div>
        <h1 className="faq-hero-title">MediCare FAQ Bot</h1>
        <p className="faq-hero-sub">
          Ask anything about our services, appointments, payments, or how to get started.
          <br />
          <span className="faq-hero-note">This assistant uses only FAQ data — no patient information.</span>
        </p>
      </div>

      {/* Suggested questions */}
      <div className="faq-suggestions">
        {CHIPS.map(q => (
          <button key={q} className="faq-chip" onClick={() => sendChip(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className="faq-chat-wrapper">
        <AiChat
          ref={chatRef}
          mode="faq"
          onSend={handleSend}
          title="Hospital FAQ Assistant"
          subtitle="Powered by MediCare Knowledge Base"
          placeholder="Type your question about MediCare services…"
        />
      </div>
    </div>
  );
};

export default FaqBot;

