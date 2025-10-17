

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Message, User } from '../types';
import { Icons } from './Icons';
import { getInitials, formatTime } from '../utils';
import { formatTimestamp } from '../utils';
import { CopyCodeButton } from './CopyCodeButton';
import { StructuredResponse } from './StructuredResponse';
import { FollowUpSuggestions } from './chat/FollowUpSuggestions';
import { useTTS } from '../hooks/useTTS';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessageProps {
  message: Message;
  user: User;
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, user, onSuggestionClick }) => {
  const isUser = message.role === 'user';
  const { ttsState, activeMessageId, start, stop, isAudioPaused, audioProgress, audioDuration, seekAudio } = useTTS();

  const handleTTSClick = () => {
    if (typeof message.content === 'string') {
        if (activeMessageId === message.id) {
            // This allows play/pause functionality
            start(message.content, message.id);
        } else {
            // This stops any other audio and starts this one
            stop();
            start(message.content, message.id);
        }
    }
  };
  
  const isTtsActive = activeMessageId === message.id;

  const UserAvatar = () => (
    user.profilePicture ? (
      <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full" />
    ) : (
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-500">
        {getInitials(user.name)}
      </div>
    )
  );

  const AssistantAvatar = () => (
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-600">
      <Icons.Logo className="w-6 h-6 p-0.5" />
    </div>
  );
  
  const renderContent = () => {
    if (typeof message.content === 'string') {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              return !inline && match ? (
                <div className="relative my-2 rounded-md bg-[#1e1e1e] overflow-x-auto">
                  <div className="flex items-center justify-between px-4 py-1 bg-gray-700/50 rounded-t-md">
                      <span className="text-xs text-gray-400">{match[1]}</span>
                      <CopyCodeButton code={codeString} />
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>{children}</code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      );
    }
    
    switch (message.type) {
        case 'image': {
            const { imageUrl, prompt } = message.content as { imageUrl: string; prompt: string };
            return (
                <div>
                    <p className="italic text-gray-400 mb-2">Image generated for prompt: "{prompt}"</p>
                    <img src={imageUrl} alt={prompt} className="rounded-lg max-w-sm" />
                </div>
            );
        }
        case 'edited-image': {
             const { editedImageUrl, description } = message.content as { editedImageUrl: string; description: string };
             return (
                <div>
                    <p className="italic text-gray-400 mb-2">{description}</p>
                    <img src={editedImageUrl} alt={description} className="rounded-lg max-w-sm" />
                </div>
             );
        }
        case 'recipe':
        case 'story':
            return <StructuredResponse message={message} />;
        default:
            return <p>Unsupported message content</p>;
    }
  };
  
  const AudioPlayer = () => (
    <div className="mt-2 p-2 bg-gray-800/50 rounded-lg animate-fade-in-sm">
        <div className="flex items-center gap-2">
            <button onClick={handleTTSClick} className="flex-shrink-0 w-10 h-10 flex items-center justify-center p-2 rounded-full bg-primary hover:bg-primary-hover text-white transition-all transform hover:scale-105 active:scale-95">
                {ttsState === 'loading' && <Icons.Spinner className="w-5 h-5"/>}
                {ttsState === 'playing' && <Icons.Pause className="w-5 h-5"/>}
                {ttsState === 'paused' && <Icons.Play className="w-5 h-5"/>}
            </button>
            <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">{formatTime(audioProgress)}</span>
                <input 
                    type="range"
                    min="0"
                    max={audioDuration || 1}
                    value={audioProgress}
                    onChange={(e) => seekAudio(parseFloat(e.target.value))}
                    className="tts-progress w-full"
                />
                <span className="text-xs font-mono text-gray-400">{formatTime(audioDuration)}</span>
            </div>
            <button onClick={stop} className="flex-shrink-0 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all transform hover:scale-110 active:scale-95" title="Close player">
                <Icons.Close className="w-4 h-4"/>
            </button>
        </div>
    </div>
  );

  return (
    <div className={`flex gap-4 p-3 md:p-4 ${isUser ? 'justify-end' : 'animate-float-in'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <AssistantAvatar />
        </div>
      )}
      <div className={`flex flex-col max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-lg px-4 py-2 ${isUser ? 'bg-blue-600/50 rounded-br-none' : 'bg-gray-700/60 rounded-bl-none shadow-glow-assistant'}`}>
          <div className="prose prose-sm md:prose-base prose-invert max-w-none prose-p:my-2 prose-headings:my-2 prose-ol:my-2 prose-ul:my-2 break-words overflow-x-auto">
            {message.isStreaming && typeof message.content === 'string' && message.content.length === 0 ? (
              <TypingIndicator />
            ) : (
              renderContent()
            )}
            {message.isStreaming && typeof message.content === 'string' && message.content.length > 0 && (
              <span className="blinking-cursor">|</span>
            )}
          </div>
        </div>
        
        {isTtsActive && <AudioPlayer />}

        <div className="text-xs text-gray-500 mt-1 px-1 flex items-center gap-4">
          <span>{formatTimestamp(message.timestamp)}</span>
          {!isUser && typeof message.content === 'string' && message.content.length > 20 && !isTtsActive && (
             <button onClick={handleTTSClick} className="flex items-center gap-1 hover:text-white transition-all transform hover:scale-110 active:scale-95" title='Text-to-Speech'>
                <Icons.Play className="w-4 h-4"/>
             </button>
          )}
        </div>
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <FollowUpSuggestions suggestions={message.suggestions} onSuggestionClick={onSuggestionClick} />
        )}
         {message.groundingChunks && message.groundingChunks.length > 0 && (
          <div className="mt-2 text-xs">
            <h4 className="font-semibold text-gray-400 mb-1">Sources:</h4>
            <div className="flex flex-wrap gap-2">
              {message.groundingChunks.map((chunk, index) => (
                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" key={index} className="px-2 py-1 bg-gray-800 rounded-md hover:bg-gray-700 transition-all transform hover:scale-105 active:scale-100 truncate max-w-xs">
                  {chunk.web.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0">
          <UserAvatar />
        </div>
      )}
    </div>
  );
};