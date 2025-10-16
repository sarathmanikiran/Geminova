import React, { useState } from 'react';
import { User } from '../../types';
import useChatManager from '../../hooks/useChatManager';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import WelcomeScreen from './WelcomeScreen';
import { ImageGenerationModal } from '../image/ImageGenerationModal';
import { ImageEditModal } from '../image/ImageEditModal';

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
    sendImage,
    setChats,
    createNewChat,
    addImageToChat,
    addImageEditResultToChat,
  } = chatManager;
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  
  const handleImageGenerated = (imageDataUrl: string, prompt: string) => {
    addImageToChat(imageDataUrl, prompt);
    setIsImageModalOpen(false);
  };

  const handleImageEdited = (imageDataUrl: string, description: string) => {
    addImageEditResultToChat(imageDataUrl, description);
    setIsImageEditModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 animate-fade-in">
      <ChatHeader
        currentChat={currentChat}
        onToggleSidebar={onToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        setChats={setChats}
      />
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && currentChat ? (
          <WelcomeScreen 
            onStartTask={(prompt, useSearch) => sendMessage(prompt, useSearch)} 
            onGenerateImageClick={() => setIsImageModalOpen(true)}
          />
        ) : (
          <MessageList messages={messages} user={user} sendMessage={sendMessage} />
        )}
      </div>
      <ChatInput
        onSendMessage={sendMessage}
        onSendImage={sendImage}
        isLoading={isLoading}
        currentChatId={currentChat?.id || null}
        createNewChat={createNewChat}
        onGenerateImageClick={() => setIsImageModalOpen(true)}
        onEditImageClick={() => setIsImageEditModalOpen(true)}
      />
      {error && (
        <div className="p-4 text-center text-red-400 bg-red-900/50">
          Error: {error.content as string}
        </div>
      )}
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