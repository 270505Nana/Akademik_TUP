import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function CustomAlert({ type = 'error', title, message, style }) {
  const isError = type === 'error';
  const isSuccess = type === 'success';
  const isWarning = type === 'warning';

  let bgColor = '#fff5f5';
  let borderColor = '#feb2b2';
  let textColor = '#c53030';
  let iconBg = '#fed7d7';
  let Icon = AlertTriangle;

  if (isSuccess) {
    bgColor = '#f0fff4';
    borderColor = '#9ae6b4';
    textColor = '#22543d';
    iconBg = '#c6f6d5';
    Icon = CheckCircle2;
  } else if (isWarning) {
    bgColor = '#fffaf0';
    borderColor = '#fbd38d';
    textColor = '#744210';
    iconBg = '#feebc8';
    Icon = Info;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: title ? 'flex-start' : 'center',
      gap: '1rem',
      padding: '1.25rem 1.5rem',
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      margin: '1rem 0 2rem 0',
      ...style
    }}>
      <div style={{
        width: '42px',
        height: '42px',
        backgroundColor: iconBg,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${borderColor}`
      }}>
        <Icon size={24} color={textColor} strokeWidth={2.5} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {title && (
          <h4 style={{ 
            color: textColor, 
            fontWeight: 800, 
            margin: 0, 
            fontSize: '1.1rem',
            lineHeight: 1.2
          }}>
            {title}
          </h4>
        )}
        <p style={{ 
          color: textColor, 
          fontWeight: 500, 
          margin: 0, 
          fontSize: '0.9rem',
          lineHeight: 1.4,
          opacity: 0.9
        }}>
          {message}
        </p>
      </div>
    </div>
  );
}
