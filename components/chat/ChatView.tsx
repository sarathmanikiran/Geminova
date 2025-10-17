import React, { useState } from 'react';
import { User } from '../../types';
import useChatManager from '../../hooks/useChatManager';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import WelcomeScreen from './WelcomeScreen';
import { ImageGenerationModal } from '../image/ImageGenerationModal';
import { ImageEditModal } from '../image/ImageEditModal';
import { Icons } from '../Icons';
import useMediaQuery from '../../hooks/useMediaQuery';
import { InitialWelcomeMessage } from './InitialWelcomeMessage';

interface ChatViewProps {
  user: User;
  chatManager: ReturnType<typeof useChatManager>;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ user, chatManager, onToggleSidebar, isSidebarOpen }) => {
  const {
    currentChat,
    messages,
    sendMessage,
    isLoading,
    error,
    // Fix: Removed 'sendImage' as it does not exist on the object returned by useChatManager.
    setChats,
    createNewChat,
    addImageToChat,
    addImageEditResultToChat,
  } = chatManager;
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const handleImageGenerated = (imageDataUrl: string, prompt: string) => {
    addImageToChat(imageDataUrl, prompt);
    setIsImageModalOpen(false);
  };

  const handleImageEdited = (imageDataUrl: string, description: string) => {
    addImageEditResultToChat(imageDataUrl, description);
    setIsImageEditModalOpen(false);
  };

  const showWelcomeScreen = messages.length === 0 && currentChat && !isMobile;
  const showInitialWelcome = messages.length === 0 && currentChat && isMobile;


  return (
    <div className="flex flex-col h-full w-full bg-gray-900 animate-fade-in">
      <ChatHeader
        currentChat={currentChat}
        onToggleSidebar={onToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        setChats={setChats}
      />
      <div className="flex-1 overflow-y-auto">
        {showWelcomeScreen ? (
          <WelcomeScreen 
            onStartTask={(prompt, useSearch) => sendMessage(prompt, useSearch)} 
            onGenerateImageClick={() => setIsImageModalOpen(true)}
          />
        ) : showInitialWelcome ? (
          <InitialWelcomeMessage />
        ) : (
          <MessageList messages={messages} user={user} sendMessage={sendMessage} />
        )}
      </div>

      <ChatInput
        onSendMessage={sendMessage}
        isLoading={isLoading}
        currentChatId={currentChat?.id || null}
        createNewChat={createNewChat}
        onGenerateImageClick={() => setIsImageModalOpen(true)}
        onEditImageClick={() => setIsImageEditModalOpen(true)}
      />
      <ImageGenerationModal 
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageGenerated={handleImageGenerated}
      />
      <ImageEditModal
        isOpen={isImageEditModalOpen}
        onClose={() => setIsImageEditModalOpen(false)}
        onImageEdited={handleImageEdited}
      />
    </div>
  );
};