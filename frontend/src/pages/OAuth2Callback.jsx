import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Handles the redirect back from the backend after a successful OAuth2 login.
 * URL shape: /oauth2/callback?token=JWT&userId=1&roles=PATIENT
 */
const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithData } = useAuth();

  useEffect(() => {
    const token  = searchParams.get('token');
    const userId = searchParams.get('userId');
    const roles  = searchParams.get('roles');   // comma-separated e.g. "PATIENT"
    const error  = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // Build the same user object AuthContext expects
    const rolesArray = roles ? roles.split(',') : [];
    const userData = {
      jwt: token,
      userId: Number(userId),
      roles: rolesArray,
    };

    // Sync to AuthContext state + localStorage
    loginWithData(userData);

    // Redirect to home page — the landing page shows a "Dashboard →" button for logged-in users
    navigate('/', { replace: true });
  }, []); // run once on mount

  return (
    <div className="loading-overlay" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
      <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Completing sign-in…</p>
    </div>
  );
};

export default OAuth2Callback;

