import React, { useRef, useLayoutEffect } from 'react';
import { Message, User } from '../../types';
import { ChatMessage } from '../ChatMessage';

interface MessageListProps {
  messages: Message[];
  user: User;
  sendMessage: (message: string, useGoogleSearch?: boolean) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, user, sendMessage }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // useLayoutEffect fires synchronously after all DOM mutations, ensuring that
  // the new message is rendered before we try to scroll to it. This provides
  // a more reliable smooth scroll than using a timed delay.
  useLayoutEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} user={user} sendMessage={sendMessage} />
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;