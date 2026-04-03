import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FaqPopup from './FaqPopup';
import AiAssistantPopup from './AiAssistantPopup';

/**
 * SmartChatWidget
 *
 * Rules:
 *  - Home page (/) only → FAQ popup (no auth)
 *  - /login, /signup, /faq, /oauth2/callback → nothing (clean pages)
 *  - Authenticated (/patient/*, /doctor/*, /admin/*) → AI Assistant popup
 */
const SmartChatWidget = () => {
  const { isAuthenticated, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return null;

  // Pages that should show nothing at all
  const silentPaths = ['/login', '/signup', '/faq', '/oauth2/callback'];
  if (silentPaths.includes(pathname)) return null;

  // Logged-in users: AI assistant on all protected pages
  if (isAuthenticated) return <AiAssistantPopup />;

  // Unauthenticated: FAQ bot ONLY on the landing/home page
  if (pathname === '/') return <FaqPopup />;

  return null;
};

export default SmartChatWidget;
