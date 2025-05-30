import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [routePermissions, setRoutePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const { accessToken, roles = [], permissions = [] } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchRoutePermissions = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/route-permissions', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        setRoutePermissions(response.data.routePermissions);
      } catch (err) {
        console.error('Failed to fetch route permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutePermissions();
  }, [accessToken]);

  // 获取路由权限配置
  const getRoutePermissions = (pathname) => {
    return routePermissions[pathname] || { requiredRoles: [], requiredPermissions: [] };
  };

  // 检查权限组合
  const checkPermission = (requiredRoles = [], requiredPermissions = []) => {
    const hasRequiredRole = requiredRoles.length === 0 || 
      requiredRoles.some(role => roles.includes(role));

    const hasRequiredPermission = requiredPermissions.length === 0 || 
      requiredPermissions.some(permission => permissions.includes(permission));

    return hasRequiredRole && hasRequiredPermission;
  };

  // 检查单个权限
  const hasPermission = (permission) => permissions.includes(permission);

  // 检查单个角色
  const hasRole = (role) => roles.includes(role);

  if (!accessToken) {
    return children;
  }

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      getRoutePermissions,
      checkPermission,
      hasPermission,
      hasRole,
      roles,
      permissions
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 