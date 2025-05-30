import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthProvider';

const RouteGuard = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { getRoutePermissions, checkPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { requiredRoles, requiredPermissions } = getRoutePermissions(location.pathname);
  const hasAccess = checkPermission(requiredRoles, requiredPermissions);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RouteGuard; 