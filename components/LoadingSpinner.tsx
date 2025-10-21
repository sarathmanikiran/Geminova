import React from 'react';

export const LoadingSpinner: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute top-0 left-0 w-full h-full animate-spin-slow" viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="loading-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle
          cx="12" cy="12" r="10" fill="none"
          stroke="url(#loading-gradient)" strokeWidth="2"
          strokeDasharray="50 100"
          strokeLinecap="round"
        ></circle>
      </svg>
    </div>
  );
};
