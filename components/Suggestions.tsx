
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
                const actionKey = key as ActionKey;
                const action = actions[actionKey];
                if (action.suggestions) {
                    setSuggestions(prev => ({ ...prev, [actionKey]: action.suggestions! }));
                } else {
                    setLoading(prev => ({ ...prev, [actionKey]: true }));
                    const fetched = await fetchSuggestionsForAction(action.label);
                    setSuggestions(prev => ({ ...prev, [actionKey]: fetched }));
                    setLoading(prev => ({ ...prev, [actionKey]: false }));
                }
            }
        };
        fetchAllSuggestions();
    }, [actions]);

    return (
        <div className="flex flex-wrap gap-2 p-4 justify-center">
            {/* Fix: Replaced Object.entries with Object.keys to ensure proper type inference for the 'action' object. */}
            {Object.keys(actions).map((key) => {
                const actionKey = key as ActionKey;
                const action = actions[actionKey];
                return (
                    <div key={key} className="flex flex-wrap gap-2">
                        {loading[actionKey] ? (
                            <div className="px-4 py-2 bg-gray-700 rounded-full flex items-center gap-2 text-sm">
                               <Icons.Spinner className="w-4 h-4" /> <span>{action.label}</span>
                            </div>
                        ) : (
                            (suggestions[actionKey] || []).map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => onAction(action.handler, suggestion)}
                                    className="px-4 py-2 text-sm bg-gray-800 border border-glass-border rounded-full hover:bg-gray-700 transition-all transform hover:scale-105 active:scale-100"
                                >
                                    {suggestion}
                                </button>
                            ))
                        )}
                    </div>
                );
            })}
        </div>
    );
};