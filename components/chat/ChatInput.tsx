import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icons } from '../Icons';
import { debounce } from '../../utils';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSendMessage: (message: string, useGoogleSearch?: boolean) => void;
  onSendImage: (prompt: string, image: { dataUrl: string; file: File }) => void;
  isLoading: boolean;
  currentChatId: string | null;
  createNewChat: () => void;
  onGenerateImageClick: () => void;
  onEditImageClick: () => void;
}

const MAX_CHARS = 2000;

type PromptMode = 'default' | 'research' | 'study';

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onSendImage, isLoading, currentChatId, createNewChat, onGenerateImageClick, onEditImageClick }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<{dataUrl: string; file: File} | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<PromptMode>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setText(prev => promptMode !== 'default' ? prev + transcript : transcript);
    }
  }, [transcript, promptMode]);

  const getDraftKey = (chatId: string) => `geminova_draft_${chatId}`;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveDraft = useCallback(
    debounce((chatId: string, content: string, mode: PromptMode) => {
      if (chatId && mode === 'default') { // Only save drafts for default mode
        if (content.trim()) {
          localStorage.setItem(getDraftKey(chatId), content);
        } else {
          localStorage.removeItem(getDraftKey(chatId));
        }
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (currentChatId && !isListening) {
      saveDraft(currentChatId, text, promptMode);
    }
  }, [text, currentChatId, saveDraft, isListening, promptMode]);
  
  // Close options menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentChatId) {
      setText('');
      setPromptMode('default');
      return;
    }
    const savedDraft = localStorage.getItem(getDraftKey(currentChatId));
    setText(savedDraft || '');
    setPromptMode('default');
    setIsPreviewing(false);
  }, [currentChatId]);

  const handleSend = () => {
    const trimmedText = text.trim();
    if ((!trimmedText && !imageFile) || text.length > MAX_CHARS) return;

    if (trimmedText.startsWith('/') && promptMode === 'default') {
      if (trimmedText === '/new_chat') {
        createNewChat();
        setText('');
        setIsPreviewing(false);
        if (currentChatId) localStorage.removeItem(getDraftKey(currentChatId));
        return;
      }
    }
    
    if (imageFile) {
        onSendImage(trimmedText || 'What is in this image?', imageFile);
    } else {
        const useSearch = promptMode === 'research';
        onSendMessage(trimmedText, useSearch);
    }
    
    if (currentChatId) {
        localStorage.removeItem(getDraftKey(currentChatId));
    }

    setText('');
    setImageFile(null);
    setIsPreviewing(false);
    setPromptMode('default');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageFile({ dataUrl: event.target?.result as string, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }, 0);
    }
  }, [text, currentChatId, isPreviewing]);

  const chars = text.length;
  const charColor = chars > MAX_CHARS ? 'text-red-500 font-bold' : chars > MAX_CHARS * 0.9 ? 'text-yellow-400' : 'text-gray-400';
  
  const handleTaskClick = (mode: PromptMode, initialText: string) => {
    setPromptMode(mode);
    setText(initialText);
    textareaRef.current?.focus();
    setIsOptionsOpen(false);
  };
  
  const cancelPromptMode = () => {
    setPromptMode('default');
    setText('');
  }

  const menuActions = [
    { label: 'Generate Image', icon: Icons.Sparkles, handler: () => { onGenerateImageClick(); setIsOptionsOpen(false); } },
    { label: 'Edit Image', icon: Icons.Wand, handler: () => { onEditImageClick(); setIsOptionsOpen(false); } },
    { label: 'Upload Image', icon: Icons.Image, handler: () => { fileInputRef.current?.click(); setIsOptionsOpen(false); } },
    { label: 'Deep Research', icon: Icons.Search, handler: () => handleTaskClick('research', 'Deep research on: ') },
    { label: 'Student Study', icon: Icons.Book, handler: () => handleTaskClick('study', 'Help me study: ') },
  ];

  return (
    <div className="p-4 bg-gray-900/80 backdrop-blur-sm border-t border-glass-border flex-shrink-0">
      <div className="bg-gray-800 rounded-xl focus-within:shadow-glow-primary transition-shadow duration-300 flex flex-col">
        {promptMode !== 'default' && (
          <div className="flex items-center gap-2 px-4 pt-2 text-sm text-purple-300 animate-fade-in-sm">
            {promptMode === 'research' && <Icons.Search className="w-4 h-4" />}
            {promptMode === 'study' && <Icons.Book className="w-4 h-4" />}
            <span className="font-semibold capitalize">{promptMode} Mode</span>
            <button onClick={cancelPromptMode} className="ml-auto text-xs text-gray-400 hover:text-white hover:underline">(cancel)</button>
          </div>
        )}
        <div className="p-2 flex items-end">
          <div className="flex items-center gap-1 self-end">
             <div className="relative" ref={optionsMenuRef}>
                <button onClick={() => setIsOptionsOpen(p => !p)} className="p-2 rounded-full hover:bg-white/10 transition-shadow hover:shadow-glow-accent" title="More options">
                    <Icons.Plus className={`w-5 h-5 transition-transform duration-200 ${isOptionsOpen ? 'rotate-45' : ''}`} />
                </button>
                {isOptionsOpen && (
                    <div className="absolute bottom-full mb-2 w-48 bg-gray-900/80 backdrop-blur-lg border border-glass-border p-2 rounded-lg animate-fade-in-sm">
                        <ul className="flex flex-col gap-1">
                          {menuActions.map((action) => {
                            const IconComponent = action.icon;
                            return (
                              <li key={action.label}>
                                <button
                                  onClick={action.handler}
                                  className="w-full flex items-center gap-3 p-2 rounded-md text-sm hover:bg-white/10 transition-colors text-left"
                                >
                                  <IconComponent className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                  <span>{action.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                    </div>
                )}
            </div>
          </div>
          {imageFile && (
            <div className="relative ml-2 mb-2 self-start flex-shrink-0">
              <img src={imageFile.dataUrl} alt="Preview" className="w-16 h-16 object-cover rounded-md"/>
              <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 bg-gray-900 rounded-full p-0.5 text-white hover:bg-red-500">
                <Icons.Close className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="w-full">
            {isPreviewing ? (
              <div className="p-2 max-h-40 min-h-[44px] overflow-y-auto w-full text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                    code: ({inline, ...props}) => <code className={`bg-gray-700 rounded-sm px-1 text-sm font-mono ${!inline ? "block p-2 whitespace-pre-wrap" : ""}`} {...props} />,
                    blockquote: ({...props}) => <blockquote className="border-l-4 border-gray-500 pl-4 italic my-2" {...props} />,
                  }}
                >
                  {text || '*Nothing to preview...*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : (imageFile ? "Describe the image or ask a question..." : "Type your message or /new_chat...")}
                className="w-full bg-transparent resize-none outline-none p-2 max-h-40"
                rows={1}
                disabled={isLoading}
                maxLength={MAX_CHARS + 50}
              />
            )}
          </div>
          <div className="flex items-center gap-1 self-end">
            {hasRecognitionSupport && (
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-600 shadow-glow-error animate-pulse' : 'hover:bg-white/10 hover:shadow-glow-accent'}`}
                title={isListening ? 'Stop recording' : 'Use voice input'}
              >
                <Icons.Microphone className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleSend} disabled={isLoading || (!text.trim() && !imageFile) || text.length > MAX_CHARS} className={`p-2 bg-purple-600 rounded-full disabled:bg-gray-600 hover:bg-purple-700 transition-all ${!isLoading && (text.trim() || imageFile) && text.length <= MAX_CHARS ? 'animate-pulse-glow shadow-glow-primary' : ''}`}>
              {isLoading ? <Icons.Spinner className="w-5 h-5" /> : <Icons.Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end items-center px-4 pb-2 -mt-1 gap-4">
          <button 
            onClick={() => setIsPreviewing(!isPreviewing)}
            className={`p-1 rounded-md text-gray-400 hover:text-white transition-colors ${isPreviewing ? 'bg-purple-600/50 text-white' : 'hover:bg-white/10'}`}
            title={isPreviewing ? "Edit message" : "Preview Markdown"}
          >
            <Icons.Eye className="w-5 h-5" />
          </button>
          <span className={`text-xs font-mono transition-colors ${charColor}`}>
            {chars}/{MAX_CHARS}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;