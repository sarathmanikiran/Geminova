import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import useChatManager from './hooks/useChatManager';
import { LoginScreen } from './components/LoginScreen';
import Sidebar from './components/chat/Sidebar';
import { ChatView } from './components/chat/ChatView';
import { Icons } from './components/Icons';

function App() {
  const { user, signIn, signOut, loading, updateUser } = useAuth();
  const chatManager = useChatManager(user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

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
      <main className="flex-1 h-full">
        <ChatView 
          user={user}
          chatManager={chatManager}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
      </main>
    </div>
  );
}

export default App;