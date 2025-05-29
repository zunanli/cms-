import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RouteGuard = ({ children, requiredRoles = [], requiredPermissions = [] }) => {
  const location = useLocation();
  const { user, roles, permissions } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRequiredRole = requiredRoles.length === 0 || 
    requiredRoles.some(role => roles.includes(role));

  const hasRequiredPermission = requiredPermissions.length === 0 || 
    requiredPermissions.some(permission => permissions.includes(permission));

  if (!hasRequiredRole || !hasRequiredPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RouteGuard; 