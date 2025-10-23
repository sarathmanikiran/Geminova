

import React, { useState, useRef, useEffect } from 'react';
import { User, ChatSession } from '../../types';
import { Icons } from '../Icons';
import useChatManager from '../../hooks/useChatManager';
import { getInitials } from '../../utils';
import ConfirmDialog from '../ConfirmDialog';
import ProfileModal from '../profile/ProfileModal';
import { useToast } from './VoiceMode';

interface SidebarProps {
  user: User;
  signOut: () => void;
  chatManager: ReturnType<typeof useChatManager>;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, signOut, chatManager, isSidebarOpen, onToggleSidebar, updateUser }) => {
  const { chats, currentChat, createNewChat, selectChat, deleteChat, clearAllChats, renameChat, togglePinChat } = chatManager;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ chat: ChatSession, top: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRenameStart = (chat: ChatSession) => {
    setRenamingChatId(chat.id);
    setRenameValue(chat.title);
    setContextMenu(null);
  };

  const handleRenameSubmit = () => {
    if (renamingChatId && renameValue.trim()) {
      renameChat(renamingChatId, renameValue.trim());
      showToast('Chat renamed', 'success');
    }
    setRenamingChatId(null);
  };
  
  const handlePinToggle = (chat: ChatSession) => {
    togglePinChat(chat.id);
    setContextMenu(null);
  };

  const handleDeleteClick = (chat: ChatSession) => {
    setContextMenu(null);
    setChatToDelete(chat);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete.id);
      showToast(`Chat "${chatToDelete.title}" deleted`, 'success');
    }
    setChatToDelete(null);
    setIsDeleteDialogOpen(false);
  };
  
  const confirmClearAll = () => {
    clearAllChats();
    showToast('All chats have been cleared.', 'success');
    setIsClearAllDialogOpen(false);
  };

  const UserAvatar = () => (
    user.profilePicture ? (
      <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full" />
    ) : (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-500">
        {getInitials(user.name)}
      </div>
    )
  );
  
  const handleContextMenu = (e: React.MouseEvent, chat: ChatSession) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ chat, top: rect.top });
  };


  return (
    <>
      <aside className={`absolute md:relative z-20 flex flex-col h-full bg-black border-r border-glass-border transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-full max-w-xs md:w-80 flex-shrink-0`}>
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <Icons.Logo className="w-8 h-8" />
            <span className="font-bold text-lg">Geminova</span>
          </div>
          <button onClick={onToggleSidebar} className="p-1 rounded-md hover:bg-white/10 md:hidden transition-all transform hover:scale-110 active:scale-95">
             <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        <div className="p-2 space-y-1">
            <button onClick={createNewChat} className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-white/10 text-sm transition-all transform hover:scale-[1.02] active:scale-95">
                <Icons.Plus className="w-5 h-5" />
                New Chat
            </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1 border-t border-glass-border">
          {chats.map(chat => (
            <div key={chat.id} className="relative group">
              {renamingChatId === chat.id ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setRenamingChatId(null);
                  }}
                  className="w-full text-left p-2 rounded-md text-sm truncate bg-gray-700 border border-primary focus:ring-1 focus:ring-primary outline-none"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => selectChat(chat.id)}
                  className={`w-full text-left p-2 rounded-md text-sm truncate flex justify-between items-center transition-all transform hover:scale-[1.01] active:scale-95 ${
                    currentChat?.id === chat.id ? 'bg-purple-600/50 shadow-glow-primary' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 truncate">
                    {chat.pinned && <Icons.Pin className="w-4 h-4 text-purple-300 flex-shrink-0" fill="currentColor" />}
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleContextMenu(e, chat)}
                      className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <Icons.MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              )}
            </div>
          ))}
          {contextMenu && (
             <div
                ref={contextMenuRef}
                style={{ top: `${contextMenu.top}px` }}
                className="absolute left-64 z-30 w-40 bg-gray-800 border border-glass-border rounded-lg shadow-xl animate-menu-in p-1"
             >
                <button onClick={() => handleRenameStart(contextMenu.chat)} className="w-full flex items-center gap-2 text-left p-2 text-sm rounded-md hover:bg-white/10"><Icons.Edit className="w-4 h-4" /> Rename</button>
                <button onClick={() => handlePinToggle(contextMenu.chat)} className="w-full flex items-center gap-2 text-left p-2 text-sm rounded-md hover:bg-white/10"><Icons.Pin className="w-4 h-4" /> {contextMenu.chat.pinned ? 'Unpin' : 'Pin'}</button>
                <div className="my-1 h-px bg-glass-border"></div>
                <button onClick={() => handleDeleteClick(contextMenu.chat)} className="w-full flex items-center gap-2 text-left p-2 text-sm rounded-md text-red-400 hover:bg-red-500/20"><Icons.Trash className="w-4 h-4" /> Delete</button>
             </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-glass-border mt-auto space-y-2">
          <button 
            onClick={() => setIsClearAllDialogOpen(true)} 
            className="w-full flex items-center gap-2 p-2 rounded-md text-sm text-red-400 hover:bg-red-500/20 transition-all transform hover:scale-[1.02] active:scale-95"
          >
              <Icons.Trash className="w-5 h-5" />
              Clear History
          </button>
          <div className="flex items-center justify-between">
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 truncate p-1 rounded-md hover:bg-white/10 transition-all transform hover:scale-[1.02] active:scale-95">
                <UserAvatar />
                <span className="font-semibold text-sm truncate">{user.name}</span>
              </button>
              <button onClick={signOut} title="Sign Out" className="p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95">
                  <Icons.Logout className="w-5 h-5" />
              </button>
          </div>
        </div>
      </aside>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSave={updateUser}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Chat"
        message={`Are you sure you want to permanently delete the chat "${chatToDelete?.title}"?`}
        confirmText="Delete"
      />
      
      <ConfirmDialog
        isOpen={isClearAllDialogOpen}
        onClose={() => setIsClearAllDialogOpen(false)}
        onConfirm={confirmClearAll}
        title="Clear All Chat History"
        message="Are you sure you want to permanently delete your entire chat history? This action cannot be undone."
        confirmText="Delete All"
      />
    </>
  );
};

export default Sidebar;