

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Icons } from '../Icons';

interface ChatInputProps {
  onSendMessage: (message: string, useSearch?: boolean) => void;
  onSendImage?: (imageBase64: string, mimeType: string) => void;
  isLoading: boolean;
  currentChatId: string | null;
  createNewChat: () => void;
  onGenerateImageClick: () => void;
  onEditImageClick: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  currentChatId,
  createNewChat,
  onGenerateImageClick,
  onEditImageClick
}) => {
  const [input, setInput] = useState('');
  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [useSearchForNextMessage, setUseSearchForNextMessage] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      if (!currentChatId) {
        createNewChat();
      }
      onSendMessage(input, useSearchForNextMessage);
      setInput('');
      setUseSearchForNextMessage(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const handleGenerateImage = () => {
    onGenerateImageClick();
    setIsAttachmentMenuOpen(false);
  };
  
  const handleEditImage = () => {
    onEditImageClick();
    setIsAttachmentMenuOpen(false);
  };
  
  const setInputAction = (prompt: string, useSearch = false) => {
    setInput(prompt);
    setUseSearchForNextMessage(useSearch);
    setIsAttachmentMenuOpen(false);
    textareaRef.current?.focus();
  }

  const handleDeepResearch = () => {
    setInputAction("Research the topic: ", true);
  };

  const handleThinkFast = () => {
    setInputAction("Let's have a brainstorming session. My topic is ");
  };

  const handleStudyHelper = () => {
    setInputAction("Help me study the topic of ");
  };
  
  return (
    <div className="px-2 pb-3 sm:px-4 sm:pb-4 bg-gray-900 border-t border-glass-border">
      <div className={`relative flex items-end gap-1 sm:gap-2 p-1.5 sm:p-2 bg-gray-800/50 rounded-lg border transition-colors ${isLoading ? 'border-purple-500 animate-pulse' : 'border-glass-border focus-within:border-purple-500'}`}>
        
        {useSearchForNextMessage && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-blue-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full animate-float-in flex items-center gap-1.5 shadow-glow-user">
            <Icons.Search className="w-3 h-3" />
            <span>Google Search Enabled</span>
          </div>
        )}

        <div className="relative flex-shrink-0 self-end mb-1">
          {isAttachmentMenuOpen && (
            <div ref={menuRef} className="absolute bottom-full mb-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-glass-border z-10 animate-menu-in p-2 space-y-1">
              <button 
                onClick={handleGenerateImage} 
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-sm text-left transition-all active:scale-[0.98]"
              >
                <Icons.Sparkles className="w-5 h-5 text-purple-400" />
                <span>Generate Image</span>
              </button>
              <button 
                onClick={handleEditImage} 
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-sm text-left transition-all active:scale-[0.98]"
              >
                <Icons.Wand className="w-5 h-5 text-indigo-400" />
                <span>Edit / Upload Image</span>
              </button>
              <div className="border-t border-glass-border my-1"></div>
               <button onClick={handleDeepResearch} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-sm text-left transition-all active:scale-[0.98]">
                  <Icons.Search className="w-5 h-5 text-blue-400" />
                  <span>Deep Research</span>
              </button>
              <button onClick={handleThinkFast} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-sm text-left transition-all active:scale-[0.98]">
                  <Icons.Brain className="w-5 h-5 text-pink-400" />
                  <span>Think Fast</span>
              </button>
              <button onClick={handleStudyHelper} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-sm text-left transition-all active:scale-[0.98]">
                  <Icons.Book className="w-5 h-5 text-green-400" />
                  <span>Student Study Helper</span>
              </button>
            </div>
          )}
          <button 
            ref={buttonRef}
            onClick={() => setIsAttachmentMenuOpen(prev => !prev)} 
            className="p-1.5 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 hover:shadow-glow-accent active:scale-95" 
            title="Attach or generate"
          >
            <Icons.Plus className="w-5 h-5" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Geminova anything..."
          className="w-full bg-transparent resize-none border-none focus:ring-0 text-white placeholder-gray-500 max-h-48 py-2"
          rows={1}
          disabled={isLoading}
        />
        <div className="flex-shrink-0 flex items-center gap-1 self-end mb-1">
          {hasRecognitionSupport && (
            <button onClick={handleMicClick} className={`p-1.5 rounded-full transition-all transform hover:scale-110 ${isListening ? 'bg-red-500/50 text-red-300 animate-pulse' : 'hover:bg-white/10'} active:scale-95`} title="Use Microphone">
              <Icons.Microphone className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-full bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95"
            title="Send Message"
          >
            {isLoading ? <Icons.Spinner className="w-5 h-5" /> : <Icons.Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;