import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StaffRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  if (!['admin', 'instructor'].includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

export default StaffRoute;
