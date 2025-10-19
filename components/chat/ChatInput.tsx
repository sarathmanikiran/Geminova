import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Icons } from '../Icons';
import { useToast } from './VoiceMode';

type Attachment = { name: string; type: string; content: string; };

interface ChatInputProps {
  onSendMessage: (message: string, options?: { attachment?: Attachment, useSearch?: boolean }) => void;
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
  const [attachedFile, setAttachedFile] = useState<Attachment | null>(null);
  const { showToast } = useToast();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [input, attachedFile]);

  const handleSend = () => {
    if ((input.trim() || attachedFile) && !isLoading) {
      if (!currentChatId) {
        createNewChat();
      }
      onSendMessage(input, { attachment: attachedFile, useSearch: useSearchForNextMessage });
      setInput('');
      setAttachedFile(null);
      setUseSearchForNextMessage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
    showToast("Image generation is coming soon!", 'info');
    setIsAttachmentMenuOpen(false);
  };
  
  const handleEditImage = () => {
    showToast("Image editing is coming soon!", 'info');
    setIsAttachmentMenuOpen(false);
  };
  
  const handleUploadClick = () => {
    setIsAttachmentMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      showToast('File size should not exceed 4MB.', 'error');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file (e.g., JPEG, PNG, GIF).', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setAttachedFile({ name: file.name, type: file.type, content });
      }
    };
    reader.onerror = () => {
      showToast('Failed to read file.', 'error');
    };
    
    reader.readAsDataURL(file);
  };

  const setInputAction = (prompt: string, useSearch = false) => {
    setInput(prompt);
    setUseSearchForNextMessage(useSearch);
    setIsAttachmentMenuOpen(false);
    textareaRef.current?.focus();
  }

  const handleDeepResearch = () => setInputAction("Research the topic: ", true);
  const handleThinkFast = () => setInputAction("Let's have a brainstorming session. My topic is ");
  const handleStudyHelper = () => setInputAction("Help me study the topic of ");
  
  return (
    <div className="px-2 pt-2 sm:px-4 bg-gray-900 border-t border-glass-border">
      <div className={`relative p-1 sm:p-1.5 bg-gray-800/50 rounded-lg border transition-colors ${isLoading ? 'border-purple-500 animate-pulse' : 'border-glass-border focus-within:border-purple-500'}`}>
        {useSearchForNextMessage && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-blue-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full animate-float-in flex items-center gap-1.5 shadow-glow-user">
            <Icons.Search className="w-3 h-3" />
            <span>Google Search Enabled</span>
          </div>
        )}

        {attachedFile && (
          <div className="p-2 mb-2 bg-gray-700/50 rounded-md flex items-center gap-2 animate-fade-in-sm">
            <Icons.Image className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-sm truncate flex-1">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} className="p-1 rounded-full hover:bg-white/10" title="Remove file">
              <Icons.Close className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-1 sm:gap-2">
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
                  <span>Edit Image</span>
                </button>
                <button 
                  onClick={handleUploadClick} 
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-sm text-left transition-all active:scale-[0.98]"
                >
                  <Icons.Image className="w-5 h-5 text-cyan-400" />
                  <span>Upload Image</span>
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
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Geminova anything... (Ctrl+Enter to send)"
            className="w-full bg-transparent resize-none border-none focus:ring-0 text-white placeholder-gray-500 max-h-48 py-1.5"
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
              disabled={isLoading || (!input.trim() && !attachedFile)}
              className="p-1.5 rounded-full bg-primary hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95"
              title="Send Message"
            >
              {isLoading ? <Icons.Spinner className="w-5 h-5" /> : <Icons.Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 pt-1.5 pb-2">
        Geminova can make mistakes. Check important info.
      </p>
    </div>
  );
};

export default ChatInput;
