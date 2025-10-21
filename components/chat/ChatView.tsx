import React, { useState } from 'react';
import { User } from '../../types';
import useChatManager from '../../hooks/useChatManager';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import WelcomeScreen from './WelcomeScreen';
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
    setChats,
    createNewChat,
  } = chatManager;
  
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const showWelcomeScreen = messages.length === 0 && currentChat && !isMobile;
  const showInitialWelcome = messages.length === 0 && currentChat && isMobile;


  return (
    <div className="flex flex-col h-full w-full bg-black animate-fade-in">
      <ChatHeader
        currentChat={currentChat}
        onToggleSidebar={onToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        setChats={setChats}
      />
      <div className="flex-1 overflow-y-auto">
        {showWelcomeScreen ? (
          <WelcomeScreen 
            onStartTask={(prompt, useSearch) => sendMessage(prompt, { useSearch })} 
          />
        ) : showInitialWelcome ? (
          <InitialWelcomeMessage />
        ) : (
          <MessageList messages={messages} user={user} sendMessage={(prompt) => sendMessage(prompt)} />
        )}
      </div>

      <div className="flex-shrink-0">
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          currentChatId={currentChat?.id || null}
          createNewChat={createNewChat}
        />
      </div>

    </div>
  );
};