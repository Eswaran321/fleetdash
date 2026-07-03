import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div className="error-banner">
      <AlertOctagon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px', fontWeight: 600 }}>
          Telemetry Error Alert
        </strong>
        <span style={{ fontSize: '0.85rem' }}>{message}</span>
      </div>
    </div>
  );
};

export default ErrorAlert;
