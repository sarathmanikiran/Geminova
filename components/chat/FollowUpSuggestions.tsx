import React from 'react';
import { Icons } from '../Icons';

interface FollowUpSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-fade-in-sm">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="px-3 py-1.5 bg-gray-800/60 border border-glass-border rounded-full hover:bg-gray-700/80 transition-all text-sm text-gray-300 hover:text-white hover:shadow-glow-accent flex items-center gap-2"
        >
          <Icons.Sparkles className="w-4 h-4 text-purple-400" />
          {suggestion}
        </button>
      ))}
    </div>
  );
};
