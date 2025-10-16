import React, { useState, useRef, useEffect } from 'react';
import { AIPersonality, ChatSession } from '../../types';
import { Icons } from '../Icons';

interface SettingsMenuProps {
  currentChat: ChatSession;
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const personalities: {
  value: AIPersonality;
  label: string;
  description: string;
  // Fix: Changed JSX.Element to React.ReactElement to resolve namespace issue.
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}[] = [
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable, and empathetic.',
    icon: Icons.Sparkles,
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal, precise, and knowledgeable.',
    icon: Icons.Briefcase,
  },
  {
    value: 'humorous',
    label: 'Humorous',
    description: 'Witty, clever, and lighthearted.',
    icon: Icons.Brain,
  },
];


const SettingsMenu: React.FC<SettingsMenuProps> = ({ currentChat, setChats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handlePersonalityChange = (personality: AIPersonality) => {
    setChats(prev => prev.map(c => c.id === currentChat.id ? { ...c, personality } : c));
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-white/10 transition-all hover:shadow-glow-accent">
        <Icons.Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-glass-border rounded-lg shadow-xl z-10 animate-fade-in-sm">
          <div className="p-3">
            <p className="text-sm font-semibold text-gray-300 mb-2 px-2">AI Personality</p>
            <div className="flex flex-col gap-1">
              {personalities.map(p => {
                const Icon = p.icon;
                const isSelected = currentChat.personality === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => handlePersonalityChange(p.value)}
                    className={`w-full text-left p-2 rounded-md transition-all duration-300 flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-purple-600 text-white shadow-glow-primary' 
                        : 'hover:bg-gray-700/80 text-gray-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className={`text-xs ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;