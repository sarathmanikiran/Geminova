import React, { useState } from 'react';
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
  const { chats, currentChat, createNewChat, selectChat, deleteChat, clearAllChats } = chatManager;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatSession | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const { showToast } = useToast();

  const handleDeleteClick = (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
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

  return (
    <>
      <aside className={`absolute md:relative z-20 flex flex-col h-full bg-gray-900/70 backdrop-blur-xl border-r border-glass-border transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 flex-shrink-0`}>
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
            <button
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              className={`w-full text-left p-2 rounded-md text-sm truncate flex justify-between items-center group transition-all transform hover:scale-[1.01] active:scale-95 ${
                currentChat?.id === chat.id ? 'bg-purple-600/50 shadow-glow-primary' : 'hover:bg-white/10'
              }`}
            >
              <span className="flex-1 truncate pr-2">{chat.title}</span>
              <span 
                onClick={(e) => handleDeleteClick(e, chat)}
                className="opacity-0 group-hover:opacity-100 transition-all transform hover:scale-125 text-gray-400 hover:text-red-400 p-1"
              >
                  <Icons.Trash className="w-4 h-4" />
              </span>
            </button>
          ))}
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