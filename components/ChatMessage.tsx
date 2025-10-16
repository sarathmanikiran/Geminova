import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, User } from '../types';
import { getInitials } from '../utils';
import { Icons } from './Icons';
import { CopyCodeButton } from './CopyCodeButton';
import { StructuredResponse } from './StructuredResponse';
import { useTTS } from '../hooks/useTTS';
import { FollowUpSuggestions } from './chat/FollowUpSuggestions';

interface ChatMessageProps {
  message: Message;
  user: User;
  sendMessage: (message: string, useGoogleSearch?: boolean) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, user, sendMessage }) => {
  const isUser = message.role === 'user';
  const { ttsState, activeMessageId, start, audioProgress, audioDuration, seekAudio } = useTTS();

  const isActive = activeMessageId === message.id;
  const isPlaying = ttsState === 'playing' && isActive;
  const isPaused = ttsState === 'paused' && isActive;
  const isLoadingAudio = ttsState === 'loading' && isActive;

  const handlePlayAudio = () => {
      if (typeof message.content === 'string') {
          start(message.content, message.id);
      }
  };

  const renderAudioButtonIcon = () => {
    if (isLoadingAudio) return <Icons.Spinner className="w-4 h-4" />;
    if (isPlaying) return <Icons.Pause className="w-4 h-4" />;
    if (isPaused) return <Icons.Play className="w-4 h-4" />;
    return <Icons.Volume className="w-4 h-4" />;
  };

  const Avatar = ({ name, picture }: { name: string; picture?: string }) => (
    picture ? (
      <img src={picture} alt={name} className="w-8 h-8 rounded-full" />
    ) : (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isUser ? 'bg-indigo-500' : 'bg-purple-500'}`}>
        {getInitials(name)}
      </div>
    )
  );
  
  const LoadingIndicator = () => (
    <div className="flex items-center space-x-1 p-2">
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
    </div>
  );

  const renderContent = () => {
    if (message.isLoading) {
      return <LoadingIndicator />;
    }
  
    if (message.type === 'error') {
      return (
        <div className="text-red-400 bg-red-900/30 p-3 rounded-lg">
          <p className="font-bold mb-2">An error occurred:</p>
          <div dangerouslySetInnerHTML={{ __html: message.content as string }} />
        </div>
      );
    }

    if (message.type === 'recipe' || message.type === 'story') {
        return <StructuredResponse message={message} />;
    }

    if (message.image) {
      return (
        <div className="space-y-2">
            {typeof message.content === 'string' && <p>{message.content}</p>}
            <img src={message.image} alt="Generated or uploaded content" className="max-w-xs md:max-w-sm rounded-lg" />
        </div>
      )
    }
    
    if (typeof message.content !== 'string') return null;

    const content = message.content;
    const isStreaming = content.endsWith('▋');
    const displayContent = isStreaming ? content.slice(0, -1) : content;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');
            const finalCode = isStreaming && codeText.endsWith('▋') ? codeText.slice(0, -1) : codeText;
            
            return !inline && match ? (
              <div className="my-2 bg-gray-800 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center px-4 py-1 bg-gray-900 text-xs text-gray-400">
                  <span>{match[1]}</span>
                  <CopyCodeButton code={finalCode} />
                </div>
                <pre className="p-4 overflow-x-auto"><code className={className} {...props}>{finalCode}{isStreaming && codeText.endsWith('▋') && <span className="blinking-cursor">▋</span>}</code></pre>
              </div>
            ) : (
              <code className="bg-gray-700 rounded-sm px-1 text-sm" {...props}>{children}</code>
            );
          },
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
          a: ({...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          ul: ({...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
          ol: ({...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
        }}
      >
        {`${displayContent}${isStreaming ? '▋' : ''}`}
      </ReactMarkdown>
    );
  };
  
  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''} ${!isUser ? 'animate-float-in' : ''}`}>
      {!isUser && <Avatar name="Geminova" />}
      {isUser && <Avatar name={user.name} picture={user.profilePicture} />}
      <div className={`flex flex-col max-w-[85%] sm:max-w-lg md:max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl transition-shadow ${isUser ? 'bg-blue-600 rounded-br-none shadow-glow-user' : 'bg-gray-700 rounded-bl-none shadow-glow-assistant'}`}>
          {renderContent()}
        </div>
        {!isUser && !message.isLoading && (
          <div className="mt-2 w-full">
             {typeof message.content === 'string' && message.content.length > 0 && (
                <div className="flex items-center gap-2">
                    <button
                    onClick={handlePlayAudio}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:shadow-glow-accent disabled:opacity-50"
                    disabled={isLoadingAudio}
                    >
                    {renderAudioButtonIcon()}
                    </button>
                    {(isPlaying || isPaused) && audioDuration > 0 && (
                    <input
                        type="range"
                        min="0"
                        max={audioDuration}
                        value={audioProgress}
                        onChange={(e) => seekAudio(parseFloat(e.target.value))}
                        className="w-32 h-1 ml-2"
                    />
                    )}
                </div>
            )}
            {message.suggestions && message.suggestions.length > 0 && (
                <FollowUpSuggestions 
                    suggestions={message.suggestions} 
                    onSuggestionClick={(suggestion) => sendMessage(suggestion, false)}
                />
            )}
          </div>
        )}
      </div>
    </div>
  );
};