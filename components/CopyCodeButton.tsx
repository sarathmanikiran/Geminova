import React, { useState } from 'react';
import { Icons } from './Icons';

interface CopyCodeButtonProps {
  code: string;
}

export const CopyCodeButton: React.FC<CopyCodeButtonProps> = ({ code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button onClick={handleCopy} className="flex items-center gap-1 hover:text-white rounded-md p-1 transition-all hover:shadow-glow-accent">
      {isCopied ? <Icons.Check className="w-4 h-4 text-green-500" /> : <Icons.Copy className="w-4 h-4" />}
      <span className="text-xs">{isCopied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
};