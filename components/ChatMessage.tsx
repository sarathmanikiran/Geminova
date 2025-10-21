


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
import { CodeExecution } from './CodeExecution';

interface ChatMessageProps {
  message: Message;
  user: User;
  onSuggestionClick: (suggestion: string) => void;
  tts: ReturnType<typeof useTTS>;
}

// A new, styled TTS button component for improved UX
const TtsPlayerButton: React.FC<{
  ttsState: 'idle' | 'loading' | 'playing' | 'paused';
  onClick: () => void;
}> = ({ ttsState, onClick }) => {
  const isLoading = ttsState === 'loading';

  const iconMap = {
    loading: <Icons.Volume className="w-5 h-5 text-primary" />,
    playing: <Icons.Pause className="w-5 h-5 text-white" />,
    paused: <Icons.Play className="w-5 h-5 text-white" />,
    idle: <Icons.Volume className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />,
  };

  const titleMap = {
    loading: 'Loading audio...',
    playing: 'Pause audio',
    paused: 'Resume audio',
    idle: 'Play audio',
  };

  const buttonClasses = `group relative w-9 h-9 flex items-center justify-center rounded-full transition-all transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark
    ${ttsState === 'playing' ? 'bg-primary/40' : ''}
    ${ttsState === 'paused' ? 'bg-white/10' : ''}
    ${ttsState === 'idle' ? 'hover:bg-white/10' : ''}
  `;

  return (
    <button
      onClick={onClick}
      className={buttonClasses}
      title={titleMap[ttsState]}
      disabled={isLoading}
      aria-label={titleMap[ttsState]}
    >
      {/* Background track */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="17" fill="none" className="stroke-current opacity-20" strokeWidth="1.5"></circle>
      </svg>
      
      {/* Loading animation */}
      {isLoading && (
        <svg className="absolute top-0 left-0 w-full h-full animate-spin-slow" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="tts-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <circle 
            cx="18" cy="18" r="17" fill="none" 
            stroke="url(#tts-gradient)" strokeWidth="2"
            strokeDasharray="80 120"
            strokeLinecap="round"
          ></circle>
        </svg>
      )}

      {/* Icon */}
      <div className="z-10 transition-transform duration-200 group-hover:scale-110">
        {iconMap[ttsState]}
      </div>
    </button>
  );
};


export const ChatMessage: React.FC<ChatMessageProps> = ({ message, user, onSuggestionClick, tts }) => {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const { ttsState, activeMessageId, start, stop } = tts;

  const handleTTSClick = () => {
    if (typeof message.content === 'string') {
        start(message.content, message.id);
    }
  };
  
  const isTtsEligible = !isUser && !isError && typeof message.content === 'string' && message.content.length > 20;

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
  
  const ErrorAvatar = () => (
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/50">
        <Icons.Error className="w-5 h-5 text-red-400" />
    </div>
  );
  
  const renderContent = () => {
    if (typeof message.content === 'string') {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // FIX: Resolved type errors by removing the invalid spread of `...props` onto SyntaxHighlighter
            // and casting the `style` prop to `any` to work around a library type mismatch.
            // FIX: The `inline` property is passed by react-markdown but not included in its inferred type for component props,
            // causing a TypeScript error. Changed the signature to accept a generic `props` object and access `inline` dynamically.
            code(props) {
              const { node, className, children } = props;
              const inline = (props as any).inline;
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              return !inline && match ? (
                <div className="relative my-4 rounded-lg bg-[#1e1e1e] border border-gray-700/50 shadow-lg overflow-hidden font-mono text-sm group">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800/60 border-b border-gray-700/50">
                    <span className="font-sans text-gray-300 uppercase tracking-wider text-xs">{match[1]}</span>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <CodeExecution language={match[1]} code={codeString} />
                      <CopyCodeButton code={codeString} />
                    </div>
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    showLineNumbers={true}
                    lineNumberStyle={{
                      minWidth: '2.5em',
                      paddingRight: '1.5em',
                      textAlign: 'right',
                      userSelect: 'none',
                      color: '#6b7280'
                    }}
                    customStyle={{
                      margin: 0,
                      padding: '1rem 0',
                      backgroundColor: 'transparent',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: "'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
                        lineHeight: '1.6',
                        fontSize: '13px',
                        paddingRight: '1rem'
                      }
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="px-1.5 py-1 bg-gray-700/70 rounded-md font-mono text-[0.9em]">
                    {children}
                </code>
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
  
  const TtsControls = () => {
    if (!isTtsEligible) return null;
    const effectiveTtsState = activeMessageId === message.id ? ttsState : 'idle';
    return (
      <TtsPlayerButton
        ttsState={effectiveTtsState}
        onClick={handleTTSClick}
      />
    );
  };

  return (
    <div className={`flex gap-4 p-3 md:p-4 ${isUser ? 'justify-end' : 'animate-float-in'}`}>
      {!isUser && !isError && (
        <div className="flex-shrink-0">
          <AssistantAvatar />
        </div>
      )}
      {isError && (
         <div className="flex-shrink-0">
          <ErrorAvatar />
        </div>
      )}
      <div className={`flex flex-col max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-lg px-4 py-2 ${
          isUser 
          ? 'bg-blue-600/50 rounded-br-none' 
          : isError
            ? 'bg-red-900/40 border border-red-500/30 rounded-bl-none shadow-glow-error'
            : 'bg-gray-700/60 rounded-bl-none shadow-glow-assistant'
        }`}>
           {isUser && message.attachment && (
            <div className="mb-2 p-2 bg-blue-900/40 rounded-md text-sm flex items-center gap-2 border border-blue-500/30">
              <Icons.Image className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{message.attachment.name}</span>
            </div>
           )}
           {isError ? (
            <div className="text-red-300">
                <p className="font-semibold">Service Error</p>
                <p className="text-sm break-words">{message.content as string}</p>
            </div>
          ) : (
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
          )}
        </div>

        <div className="text-xs text-gray-500 mt-1 px-1 flex items-center gap-2">
          <span>{formatTimestamp(message.timestamp)}</span>
          <TtsControls />
        </div>
        {!isUser && !isError && message.suggestions && message.suggestions.length > 0 && (
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