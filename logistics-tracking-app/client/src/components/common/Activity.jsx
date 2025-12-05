// Activity.js
import React from 'react';

const Activity = () => {
  const spinnerStyle = {
    width: '50px',
    height: '50px',
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto'
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div style={spinnerStyle}></div>
      <p>Loading...</p>

      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Activity;