import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      maxWidth: '600px',
      margin: '100px auto'
    }}>
      <h1>Unauthorized Access</h1>
      <p style={{ marginBottom: '20px' }}>
        You don't have permission to access this page.
      </p>
      <Link 
        to="/dashboard"
        style={{
          padding: '10px 20px',
          backgroundColor: '#1890ff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized; 