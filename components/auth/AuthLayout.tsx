import React from 'react';
import { Icons } from '../Icons';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="flex h-screen w-screen justify-center items-center bg-background-light dark:bg-black font-sans animate-fade-in">
      <div className="text-center p-8 max-w-md w-full">
        <Icons.Logo className="w-16 h-16 mb-4 mx-auto animate-title-glow rounded-2xl" />
        <h1 className="text-3xl font-bold font-display text-text-primary-light dark:text-text-primary-dark">
          {title}
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2 mb-8">
          {subtitle}
        </p>
        <div className="animate-float-in">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
