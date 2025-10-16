import React, { useState, useEffect } from 'react';
import { Action, ActionKey } from '../types';
import { fetchSuggestionsForAction } from '../services/geminiService';
import { Icons } from './Icons';

interface SuggestionsProps {
    actions: Record<ActionKey, Action>;
    onAction: (handler: (text: string) => void, text: string) => void;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ actions, onAction }) => {
    const [suggestions, setSuggestions] = useState<Record<ActionKey, string[]>>({});
    const [loading, setLoading] = useState<Record<ActionKey, boolean>>({});

    useEffect(() => {
        const fetchAllSuggestions = async () => {
            for (const key in actions) {
                const action = actions[key];
                if (action.suggestions) {
                    setSuggestions(prev => ({ ...prev, [key]: action.suggestions! }));
                } else {
                    setLoading(prev => ({ ...prev, [key]: true }));
                    const fetched = await fetchSuggestionsForAction(action.label);
                    setSuggestions(prev => ({ ...prev, [key]: fetched }));
                    setLoading(prev => ({ ...prev, [key]: false }));
                }
            }
        };
        fetchAllSuggestions();
    }, [actions]);

    return (
        <div className="flex flex-wrap gap-2 p-4 justify-center">
            {Object.entries(actions).map(([key, action]) => (
                <div key={key}>
                    {loading[key] ? (
                        <div className="px-4 py-2 bg-gray-700 rounded-full flex items-center gap-2">
                           <Icons.Spinner className="w-4 h-4" /> <span>{action.label}</span>
                        </div>
                    ) : (
                        (suggestions[key] || []).map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onAction(action.handler, suggestion)}
                                className="px-4 py-2 bg-gray-800 border border-glass-border rounded-full hover:bg-gray-700 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))
                    )}
                </div>
            ))}
        </div>
    );
};
