import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiActivity, FiGithub, FiArrowLeft } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Email and password required');
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // If user was trying to reach a protected page, send them there; otherwise home
      const intended = location.state?.from?.pathname;
      navigate(intended || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = `http://localhost:8080/api/v1/oauth2/authorization/${provider}`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ← Back to Home */}
        <Link to="/" className="auth-back-home">
          <FiArrowLeft size={15} /> Back to Home
        </Link>

        <div className="auth-header">
          <Link to="/" className="auth-logo"><FiActivity size={24} /></Link>
          <h2>Welcome Back</h2>
          <p>Login to manage your healthcare account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="search-bar">
              <FiMail className="search-icon" />
              <input
                type="email"
                className="form-control"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="search-bar">
              <FiLock className="search-icon" />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <span className="spinner spinner-sm" /> : 'Log In'}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <div className="auth-social">
          <button className="btn btn-ghost" onClick={() => handleOAuth('google')} type="button">
            <FcGoogle size={18} /> Google
          </button>
          <button className="btn btn-ghost" onClick={() => handleOAuth('github')} type="button">
            <FiGithub size={18} /> GitHub
          </button>
        </div>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
