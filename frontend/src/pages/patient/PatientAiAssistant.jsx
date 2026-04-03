import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/api';
import AiChat from '../../components/AiChat';
import { FiCpu } from 'react-icons/fi';
import '../AiPage.css';

/**
 * Patient AI Assistant — grounded Q&A on the patient's own record.
 * Route: /patient/ai
 * Auth:  PATIENT only — patientId is always the caller's own userId.
 */
const PatientAiAssistant = () => {
  const { user } = useAuth();
  const patientId = user?.userId;  // backend LoginResponseDto field is 'userId'

  const handleSend = (question) => aiService.qa(patientId, question);

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <FiCpu size={22} className="ai-page-header-icon" />
        <div>
          <h2 className="ai-page-title">My Health Assistant</h2>
          <p className="ai-page-subtitle">
            Ask questions about your own health records. Answers are grounded in your data only.
          </p>
        </div>
      </div>

      <AiChat
        mode="qa"
        onSend={handleSend}
        title="Patient Q&A"
        subtitle="Your records · Grounded answers"
        placeholder="Ask about your appointments, blood group, insurance…"
      />
    </div>
  );
};

export default PatientAiAssistant;
