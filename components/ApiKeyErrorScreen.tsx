import React from 'react';
import { Icons } from './Icons';

export const ApiKeyErrorScreen: React.FC = () => {
  return (
    <div className="flex h-screen w-screen justify-center items-center bg-black text-white font-sans">
      <div className="text-center p-8 max-w-lg w-full animate-fade-in">
        <Icons.Error className="w-16 h-16 text-error mx-auto mb-6" />
        <h1 className="text-3xl font-bold font-display text-text-primary-dark mb-3">Service Not Available</h1>
        <p className="text-text-secondary-dark mb-8">
          The connection to the AI service could not be established.
          This may be due to a missing or invalid API key in the application's configuration.
        </p>
        <p className="text-sm text-gray-500">
          Please ensure the application is configured correctly by the administrator.
        </p>
      </div>
    </div>
  );
};
