import React, { useState } from 'react';
import AuthLayout from './auth/AuthLayout';
import LoginView from './auth/LoginView';
import SignupView from './auth/SignupView';

interface LoginScreenProps {
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn, onSignUp }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');

  const titles = {
    login: {
      title: 'Welcome Back',
      subtitle: (
        <>
          Sign in to continue your journey with{' '}
          <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-text-gradient bg-[length:200%_auto]">
            Geminova
          </span>
          .
        </>
      ),
    },
    signup: {
      title: 'Create an Account',
      subtitle: (
        <>
          Join{' '}
          <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-text-gradient bg-[length:200%_auto]">
            Geminova
          </span>{' '}
          to explore the future of AI.
        </>
      ),
    },
  };

  return (
    <AuthLayout title={titles[view].title} subtitle={titles[view].subtitle}>
      {view === 'login' ? (
        <LoginView
          onSignIn={onSignIn}
          onSwitchToSignUp={() => setView('signup')}
        />
      ) : (
        <SignupView
          onSignUp={onSignUp}
          onSwitchToSignIn={() => setView('login')}
        />
      )}
    </AuthLayout>
  );
};
