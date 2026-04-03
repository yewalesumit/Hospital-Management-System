import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiCalendar, FiActivity, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', email: '',
    birthDate: '', gender: 'MALE', bloodGroup: 'O_POSITIVE'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login, isAuthenticated, isAdmin, isDoctor } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin())       navigate('/admin/dashboard',   { replace: true });
      else if (isDoctor()) navigate('/doctor/dashboard',  { replace: true });
      else                 navigate('/patient/dashboard', { replace: true });
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      return setError('Name, email, and password are required');
    }
    try {
      setError('');
      setLoading(true);
      const payload = {
        username: formData.email,
        password: formData.password,
        name: formData.name,
        roles: ['PATIENT'],
        birthDate: formData.birthDate || null,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
      };
      await signup(payload);
      // Auto-login after signup
      await login(formData.email, formData.password);
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '600px' }}>

        {/* ← Back to Home */}
        <Link to="/" className="auth-back-home">
          <FiArrowLeft size={15} /> Back to Home
        </Link>

        <div className="auth-header">
          <Link to="/" className="auth-logo"><FiActivity size={24} /></Link>
          <h2>Create Account</h2>
          <p>Join MediCare as a patient to book appointments</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Full Name</label>
              <div className="search-bar">
                <FiUser className="search-icon" />
                <input required type="text" name="name" className="form-control" placeholder="John Doe" value={formData.name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <div className="search-bar">
                <FiMail className="search-icon" />
                <input required type="email" name="email" className="form-control" placeholder="john@example.com" value={formData.email} onChange={handleChange} />
              </div>
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Password</label>
              <div className="search-bar">
                <FiLock className="search-icon" />
                <input required type="password" name="password" className="form-control" placeholder="Create a strong password" value={formData.password} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <div className="search-bar">
                <FiCalendar className="search-icon" />
                <input required type="date" name="birthDate" className="form-control" value={formData.birthDate} onChange={handleChange} />
              </div>
            </div>
            
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Blood Group</label>
              <select name="bloodGroup" className="form-control" value={formData.bloodGroup} onChange={handleChange}>
                <option value="O_POSITIVE">O+</option>
                <option value="O_NEGATIVE">O-</option>
                <option value="A_POSITIVE">A+</option>
                <option value="A_NEGATIVE">A-</option>
                <option value="B_POSITIVE">B+</option>
                <option value="B_NEGATIVE">B-</option>
                <option value="AB_POSITIVE">AB+</option>
                <option value="AB_NEGATIVE">AB-</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? <span className="spinner spinner-sm" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
