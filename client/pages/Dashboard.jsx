import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>Welcome, {user.username}!</h3>
        <p>Roles: {user.roles.join(', ')}</p>
        <p>Permissions: {user.permissions.join(', ')}</p>
      </div>
      
      {user.roles.includes('admin') && (
        <div style={{ marginTop: '20px' }}>
          <Link 
            to="/upload"
            style={{
              padding: '10px 20px',
              backgroundColor: '#1890ff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Go to Upload Page
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 