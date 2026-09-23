import React from 'react';

export default function CustomAlert({ type = 'error', title, message, style }) {
  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  // Default Error Style
  let bgColor = '#FEF2F2';
  let borderLeftColor = '#DC2626';
  let textColor = '#B91C1C';

  if (isSuccess) {
    bgColor = '#F0FDF4';
    borderLeftColor = '#16A34A';
    textColor = '#15803D';
  } else if (isWarning) {
    bgColor = '#FFFBEB';
    borderLeftColor = '#D97706';
    textColor = '#92400E';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '12px 16px',
      backgroundColor: bgColor,
      borderLeft: `4px solid ${borderLeftColor}`,
      borderRadius: '8px', // Border radius 8px sesuai permintaan
      margin: '1rem 0',
      ...style
    }}>
      {title && (
        <h4 style={{ 
          color: textColor, 
          fontWeight: 700, 
          margin: 0, 
          fontSize: '14px',
          lineHeight: 1.2
        }}>
          {title}
        </h4>
      )}
      <p style={{ 
        color: textColor, 
        fontWeight: 500, 
        margin: 0, 
        fontSize: '12.5px',
        lineHeight: 1.4,
      }}>
        {message}
      </p>
    </div>
  );
}