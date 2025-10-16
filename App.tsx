import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import useChatManager from './hooks/useChatManager';
import { LoginScreen } from './components/LoginScreen';
import Sidebar from './components/chat/Sidebar';
import { ChatView } from './components/chat/ChatView';
import { Icons } from './components/Icons';
import { isApiKeyConfigured } from './services/geminiService';
import { ApiKeyErrorScreen } from './components/ApiKeyErrorScreen';
import useMediaQuery from './hooks/useMediaQuery';

function App() {
  const { user, signIn, signOut, loading, updateUser } = useAuth();
  const chatManager = useChatManager(user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Check API key status on initial render
  const [isApiReady] = useState(isApiKeyConfigured());

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (!isApiReady) {
    return <ApiKeyErrorScreen />;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen justify-center items-center bg-black text-white">
        <Icons.Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onSignIn={signIn} theme="dark" />;
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex font-sans overflow-hidden">
      <Sidebar 
        user={user}
        signOut={signOut}
        chatManager={chatManager}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        updateUser={updateUser}
      />
      <div className="relative flex-1 h-full">
        <main className="h-full w-full">
          <ChatView 
            user={user}
            chatManager={chatManager}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />
        </main>
        {isSidebarOpen && isMobile && (
          <div
            className="absolute inset-0 bg-black/60 z-10 animate-fade-in-sm"
            onClick={handleToggleSidebar}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export default App;
