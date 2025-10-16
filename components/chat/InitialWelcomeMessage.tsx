import React from 'react';
import { Icons } from '../Icons';

export const InitialWelcomeMessage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
      <Icons.Logo className="w-16 h-16 mb-4" />
      <h1 className="text-2xl font-display font-bold mb-2">How can I help you today?</h1>
      <p className="text-md text-secondary-text">I'm Geminova, your multimodal AI assistant.</p>
    </div>
  );
};