import React, { useState, useEffect } from 'react';
import { aiService, adminService } from '../../services/api';
import AiChat from '../../components/AiChat';
import { FiCpu, FiUser, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import '../AiPage.css';
const AdminAiPanel = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [mode, setMode] = useState('summary');
  const [chatKey, setChatKey] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminService.getAllPatients(0, 100)
      .then(data => setPatients(data))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  }, []);
  const handlePatientChange = (e) => {
    const p = patients.find(p => String(p.id) === e.target.value);
    setSelectedPatientId(e.target.value);
    setSelectedPatientName(p?.name || '');
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
          <h2 className="ai-page-title">Admin AI Assistant</h2>
          <p className="ai-page-subtitle">Grounded patient summaries and Q&A for all patients.</p>
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
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
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
export default AdminAiPanel;
