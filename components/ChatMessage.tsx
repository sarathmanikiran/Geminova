
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

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}
const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size = 40, strokeWidth = 3 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 absolute inset-0">
      <circle className="text-white/20" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
      <circle className="text-white" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
    </svg>
  );
};


interface ChatMessageProps {
  message: Message;
  user: User;
  onSuggestionClick: (suggestion: string) => void;
  tts: ReturnType<typeof useTTS>;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, user, onSuggestionClick, tts }) => {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const { ttsState, activeMessageId, start, stop, audioProgress, audioDuration, seekAudio } = tts;

  const handleTTSClick = () => {
    if (typeof message.content === 'string') {
        // Simplified logic: the useTTS hook now handles play/pause/stop internally.
        start(message.content, message.id);
    }
  };
  
  const isTtsActive = activeMessageId === message.id;
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
  
  const TtsControls = () => {
    if (!isTtsEligible) return null;
  
    return isTtsActive ? (
      <div className="flex items-center gap-3 w-full max-w-xs animate-fade-in-sm">
        <button
          onClick={handleTTSClick}
          className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:bg-primary-hover text-white transition-transform transform hover:scale-105 active:scale-95"
        >
          {ttsState === 'loading' && <Icons.Spinner className="w-4 h-4" />}
          {(ttsState === 'playing' || ttsState === 'paused') && (
            <>
              <CircularProgress progress={audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0} size={32} strokeWidth={2.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                {ttsState === 'playing' && <Icons.Pause className="w-4 h-4" />}
                {ttsState === 'paused' && <Icons.Play className="w-4 h-4" />}
              </div>
            </>
          )}
        </button>
        <div className="flex-grow">
          <input
            type="range"
            className="tts-progress"
            min="0"
            max={audioDuration || 1}
            value={audioProgress}
            onChange={(e) => seekAudio(parseFloat(e.target.value))}
            disabled={ttsState === 'loading'}
            aria-label="Audio progress"
          />
          <div className="flex justify-between text-gray-400 text-xs font-mono tabular-nums mt-1">
            <span>{formatTime(audioProgress)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>
        <button
          onClick={stop}
          className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all transform hover:scale-110 active:scale-95"
          title="Stop player"
        >
          <Icons.Close className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <button
        onClick={handleTTSClick}
        className="flex items-center rounded-full p-2 -m-2 text-gray-400 hover:text-white hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95"
        title="Play audio"
      >
        <Icons.Play className="w-4 h-4" />
      </button>
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

        <div className="text-xs text-gray-500 mt-1 px-1 flex items-center gap-4">
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