import React, { useState, useEffect } from 'react';
import { aiService, doctorService } from '../../services/api';
import AiChat from '../../components/AiChat';
import { FiCpu, FiUser, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import '../AiPage.css';
const DoctorAiPanel = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [mode, setMode] = useState('qa');
  const [chatKey, setChatKey] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    doctorService.getAppointments()
      .then(data => {
        const seen = new Set();
        const unique = data.filter(a => {
          if (seen.has(a.patientId)) return false;
          seen.add(a.patientId);
          return true;
        });
        setAppointments(unique);
      })
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);
  const handlePatientChange = (e) => {
    const appt = appointments.find(a => String(a.patientId) === e.target.value);
    setSelectedPatientId(e.target.value);
    setSelectedPatientName(appt?.patientName || '');
    setChatKey(k => k + 1);
  };
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setChatKey(k => k + 1);
  };
  const handleSend = (question) => {
    if (!selectedPatientId) return Promise.reject(new Error('Select a patient first'));
    if (mode === 'summary') return aiService.summary(Number(selectedPatientId));
    return aiService.qa(Number(selectedPatientId), question);
  };
  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <FiCpu size={22} className="ai-page-header-icon" />
        <div>
          <h2 className="ai-page-title">Doctor AI Assistant</h2>
          <p className="ai-page-subtitle">Grounded summaries and Q&A for your appointment patients.</p>
        </div>
      </div>
      <div className="ai-controls">
        <div className="ai-control-group">
          <label className="ai-control-label"><FiUser size={14} /> Select Patient</label>
          <select
            className="ai-control-select"
            value={selectedPatientId}
            onChange={handlePatientChange}
            disabled={loading}
          >
            <option value="">— Select a patient —</option>
            {appointments.map(a => (
              <option key={a.patientId} value={a.patientId}>{a.patientName}</option>
            ))}
          </select>
        </div>
        <div className="ai-control-group">
          <label className="ai-control-label"><FiFileText size={14} /> Mode</label>
          <div className="ai-mode-toggle">
            <button className={`ai-mode-btn${mode === 'summary' ? ' active' : ''}`} onClick={() => handleModeChange('summary')}>Summary</button>
            <button className={`ai-mode-btn${mode === 'qa' ? ' active' : ''}`} onClick={() => handleModeChange('qa')}>Q&A</button>
          </div>
        </div>
      </div>
      <AiChat
        key={chatKey}
        mode={mode}
        onSend={handleSend}
        title={mode === 'summary' ? 'Patient Summary' : 'Patient Q&A'}
        subtitle={selectedPatientName ? `Patient: ${selectedPatientName}` : 'No patient selected'}
        placeholder={!selectedPatientId ? 'Select a patient above first...' : mode === 'summary' ? 'Click send to generate a clinical summary...' : 'Ask about this patient records...'}
        autoSummary={mode === 'summary' && !!selectedPatientId}
      />
    </div>
  );
};
export default DoctorAiPanel;
