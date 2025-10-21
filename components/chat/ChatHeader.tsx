

import React from 'react';
import { ChatSession } from '../../types';
import { Icons } from '../Icons';
import SettingsMenu from './SettingsMenu';

interface ChatHeaderProps {
  currentChat: ChatSession | null;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ currentChat, onToggleSidebar, isSidebarOpen, setChats }) => {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 border-b border-glass-border bg-black flex-shrink-0">
      <div className="flex items-center gap-4">
        {!isSidebarOpen && (
          <button onClick={onToggleSidebar} className="p-1 rounded-md hover:bg-white/10 md:hidden">
            <Icons.Menu className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-lg font-semibold truncate">{currentChat?.title || 'Geminova'}</h2>
      </div>
      <div className="flex items-center gap-2">
         {currentChat && <SettingsMenu currentChat={currentChat} setChats={setChats} />}
      </div>
    </div>
  );
};

export default ChatHeader;