import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, loading, isStokYetkili } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Yükleniyor…</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Special stok role check
  if (requiredRole === 'stok') {
    if (!isStokYetkili) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // Standard role check
  if (requiredRole) {
    const roleRank = { member: 1, leader: 2, admin: 3 };
    const required = roleRank[requiredRole] || 1;
    const current  = roleRank[currentUser.role] || 1;
    if (current < required) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
