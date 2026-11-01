import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export default function ProtectedRoute({ children, requireHost = false, requireAdmin = false }) {
  const { isLoggedIn, isHost, isAdmin, openAuthModal } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal('login');
    }
  }, [isLoggedIn, openAuthModal]);

  if (!isLoggedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    showToast('Admin access required');
    return <Navigate to="/" replace />;
  }

  if (requireHost && !isHost) {
    showToast('Please become a host first');
    return <Navigate to="/" replace />;
  }

  return children;
}
