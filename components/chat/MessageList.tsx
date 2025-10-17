
import React, { useRef, useEffect } from 'react';
import { Message, User } from '../../types';
import { ChatMessage } from '../ChatMessage';

interface MessageListProps {
  messages: Message[];
  user: User;
  sendMessage: (message: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, user, sendMessage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto">
      {messages.map((message) => (
        <ChatMessage 
            key={message.id} 
            message={message} 
            user={user}
            onSuggestionClick={handleSuggestionClick}
        />
      ))}
    </div>
  );
};

export default MessageList;
