

import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, AIPersonality } from '../../types';
import { Icons } from '../Icons';

interface SettingsMenuProps {
  currentChat: ChatSession;
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ currentChat, setChats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSetting = (key: keyof ChatSession, value: any) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChat.id ? { ...chat, [key]: value } : chat
      )
    );
  };
  
  const personalities: { id: AIPersonality; label: string }[] = [
      { id: 'friendly', label: 'Friendly' },
      { id: 'professional', label: 'Professional' },
      { id: 'humorous', label: 'Humorous' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95"
        title="Chat Settings"
      >
        <Icons.Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-glass-border rounded-lg shadow-xl z-10 animate-menu-in">
          <div className="p-3">
             <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-400 mb-2">AI Personality</label>
                <div className="flex flex-col gap-1">
                    {personalities.map(p => (
                         <button 
                            key={p.id}
                            onClick={() => updateSetting('personality', p.id)}
                            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-all transform hover:scale-[1.02] active:scale-[0.98] ${currentChat.personality === p.id ? 'bg-purple-600/50' : 'hover:bg-white/10'}`}
                         >
                            {p.label}
                         </button>
                    ))}
                </div>
             </div>
             <div>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium">Google Search</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={currentChat.useGoogleSearch}
                            onChange={(e) => updateSetting('useGoogleSearch', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                </label>
                <p className="text-xs text-gray-500 mt-1">Allow the AI to use Google Search for more current information.</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;