import React, { useState } from 'react';
import { Icons } from '../Icons';

interface SignupViewProps {
  onSignUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSwitchToSignIn: () => void;
}

const SignupView: React.FC<SignupViewProps> = ({ onSignUp, onSwitchToSignIn }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    setError(null);
    setIsLoading(true);
    const result = await onSignUp(name, email, password);
    if (!result.success) {
      setError(result.error || 'An unknown error occurred.');
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      {error && (
        <div className="bg-red-500/20 text-red-400 text-sm p-3 rounded-md border border-red-500/30">
          {error}
        </div>
      )}
       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          required
        />
      </div>
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
        {isLoading ? <><Icons.Spinner className="w-5 h-5" /><span>Creating Account...</span></> : 'Create Account'}
      </button>
      <p className="text-center text-sm text-gray-400 mt-4">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToSignIn} className="font-semibold text-primary hover:underline">
          Sign In
        </button>
      </p>
    </form>
  );
};

export default SignupView;