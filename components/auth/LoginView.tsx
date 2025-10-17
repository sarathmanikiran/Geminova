import React, { useState } from 'react';
import { Icons } from '../Icons';

interface LoginViewProps {
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSwitchToSignUp: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onSignIn, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowSignUpPrompt(false);
    setIsLoading(true);
    const result = await onSignIn(email, password);
    if (!result.success) {
      if (result.error === 'No account found with this email.') {
        setShowSignUpPrompt(true);
      } else {
        setError(result.error || 'An unknown error occurred.');
      }
    }
    // On success, the App component will handle the redirect
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      {error && (
        <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded-md border border-red-500/30">
          {error}
        </div>
      )}
      {showSignUpPrompt && (
        <div className="bg-purple-500/10 text-purple-300 text-sm p-3 rounded-md border border-purple-500/20 text-center">
          No account found.{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-semibold text-white bg-primary hover:bg-primary-hover transition-all animate-pulse-glow shadow-glow-primary rounded-md px-3 py-1 text-xs"
          >
            Sign Up?
          </button>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-primary hover:bg-primary-hover rounded-lg font-semibold transition-all disabled:bg-gray-600 transform hover:scale-[1.02] active:scale-95"
      >
        {isLoading ? <><Icons.Spinner className="w-5 h-5" /><span>Signing In...</span></> : 'Sign In'}
      </button>
      <p className="text-center text-sm text-gray-400 mt-4">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignUp} className="font-semibold text-primary hover:underline">
          Sign Up
        </button>
      </p>
    </form>
  );
};

export default LoginView;