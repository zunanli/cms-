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
  const { accessToken } = useSelector((state) => state.auth);

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

  const getRoutePermissions = (pathname) => {
    return routePermissions[pathname] || { requiredRoles: [], requiredPermissions: [] };
  };

  if (!accessToken) {
    return children;
  }

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <AuthContext.Provider value={{ getRoutePermissions }}>
      {children}
    </AuthContext.Provider>
  );
}; 