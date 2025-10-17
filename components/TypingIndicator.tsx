import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 py-3 px-1">
      <span className="h-2 w-2 rounded-full bg-gray-400 animate-float-dot" style={{ animationDelay: '0s' }}></span>
      <span className="h-2 w-2 rounded-full bg-gray-400 animate-float-dot" style={{ animationDelay: '0.2s' }}></span>
      <span className="h-2 w-2 rounded-full bg-gray-400 animate-float-dot" style={{ animationDelay: '0.4s' }}></span>
    </div>
  );
};
