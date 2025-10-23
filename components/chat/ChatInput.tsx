import React, { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Icons } from '../Icons';
import { useToast } from './VoiceMode';
import { LoadingSpinner } from '../LoadingSpinner';

type Attachment = { name: string; type: string; content: string; };

interface ChatInputProps {
  onSendMessage: (message: string, options?: { attachment?: Attachment, useSearch?: boolean }) => void;
  isLoading: boolean;
  currentChatId: string | null;
  createNewChat: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  currentChatId,
  createNewChat,
}) => {
  const [input, setInput] = useState('');
  const { isListening, transcript, error: speechError, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [useSearchForNextMessage, setUseSearchForNextMessage] = useState(false);
  const [attachedFile, setAttachedFile] = useState<Attachment | null>(null);
  const { showToast } = useToast();
  
  const [cameraError, setCameraError] = useState<'permission-denied' | 'not-found' | 'other' | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

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

  // Effect to handle speech recognition errors and provide user feedback.
  useEffect(() => {
    if (speechError) {
      // The speech recognition API automatically stops on error, so we just need to inform the user.
      if (speechError.includes('no-speech')) {
        showToast("I didn't catch that. Please try again.", 'info');
      } else if (speechError.includes('not-allowed')) {
        showToast("Microphone access is required for voice input.", 'error');
      } else {
        console.error(`Unhandled speech recognition error: ${speechError}`);
        showToast("An issue occurred with speech recognition.", 'error');
      }
    }
  }, [speechError, showToast]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, attachedFile]);
  
  // Effect to reset camera state when modal closes
  useEffect(() => {
    if (!isCameraModalOpen) {
      setCameraError(null);
    }
  }, [isCameraModalOpen]);

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
  
  const handleCameraClick = () => {
    setIsAttachmentMenuOpen(false);
    setIsCameraModalOpen(true);
  };

  const captureAndClose = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setAttachedFile({
        name: `webcam-capture-${Date.now()}.jpg`,
        type: 'image/jpeg',
        content: imageSrc,
      });
      setIsCameraModalOpen(false);
    }
  }, [webcamRef]);

  const handleCaptureClick = useCallback(() => {
    captureAndClose();
  }, [captureAndClose]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // FIX: Made the camera error handler more robust. It now checks if the error object is null
  // or undefined before trying to access its properties. This prevents a potential crash if the
  // webcam library calls `onUserMediaError` with an empty value, which would trigger the
  // application's main error boundary.
  const handleCameraError = useCallback((error: string | Error | null | undefined) => {
    if (!error) {
      console.error("Camera Error: An unknown or null error was received.");
      setCameraError("other");
      return;
    }

    const errorName = typeof error === 'string' ? error : error.name;
    console.error("Camera Error:", errorName, typeof error !== 'string' ? error.message : '');

    if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
      setCameraError("permission-denied");
    } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
      setCameraError("not-found");
    } else {
      setCameraError("other");
    }
  }, []);
  
  return (
    <>
      <div className="px-2 pt-2 sm:px-4 bg-black border-t border-glass-border">
        <div className={`relative p-1.5 bg-background-dark rounded-xl border border-primary/70 shadow-glow-primary`}>
          {useSearchForNextMessage && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-blue-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full animate-float-in flex items-center gap-1.5 shadow-glow-user">
              <Icons.Search className="w-3 h-3" />
              <span>Google Search Enabled</span>
            </div>
          )}

          {attachedFile && (
            <div className="p-2 m-1 mb-2 bg-gray-700/50 rounded-md flex items-center gap-2 animate-fade-in-sm">
              <Icons.Image className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm truncate flex-1">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="p-1 rounded-full hover:bg-white/10" title="Remove file">
                <Icons.Close className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 sm:gap-2">
            <div className="relative flex-shrink-0 self-end">
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
                    onClick={handleCameraClick}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 text-sm text-left transition-all active:scale-[0.98]"
                  >
                    <Icons.Camera className="w-5 h-5 text-red-400" />
                    <span>Use Camera</span>
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
                className="p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 hover:shadow-glow-accent active:scale-95" 
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
              className="w-full bg-transparent border border-white/20 rounded-lg resize-none focus:ring-0 focus:border-primary text-white placeholder-gray-500 max-h-48 py-2.5 px-4 transition-colors"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex-shrink-0 flex items-center gap-1 self-end">
              {hasRecognitionSupport && (
                <button onClick={handleMicClick} className={`p-2 rounded-full transition-all transform hover:scale-110 ${isListening ? 'bg-red-500/50 text-red-300 animate-pulse' : 'hover:bg-white/10'} active:scale-95`} title="Use Microphone">
                  <Icons.Microphone className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !attachedFile)}
                className="p-2 w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 hover:bg-primary-hover disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95"
                title="Send Message"
              >
                {isLoading ? <LoadingSpinner /> : <Icons.Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 pt-1.5 pb-2">
          Geminova can make mistakes. Check important info.
        </p>
      </div>

      {isCameraModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in p-4" onClick={() => setIsCameraModalOpen(false)}>
          <div className="bg-gray-900 rounded-lg border border-glass-border w-full max-w-3xl shadow-glow-primary flex flex-col overflow-hidden animate-modal-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-glass-border bg-black/30">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Icons.Camera className="w-5 h-5 text-red-400"/> Camera Capture</h3>
              <button onClick={() => setIsCameraModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95" aria-label="Close camera">
                <Icons.Close className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="relative p-2 bg-black">
              {cameraError ? (
                <div className="w-full aspect-video flex flex-col items-center justify-center text-center bg-red-900/20 p-4 rounded-md">
                  <Icons.Error className="w-12 h-12 text-red-400 mb-4" />
                  {cameraError === 'permission-denied' ? (
                    <>
                      <h4 className="font-semibold text-lg text-white mb-2">Camera Access Denied</h4>
                      <p className="text-red-300 max-w-md mb-4">You have blocked camera access for Geminova. To use this feature, please grant permission in your browser's site settings.</p>
                      <p className="text-xs text-gray-500 max-w-md">You can usually find this by clicking the lock icon (🔒) in the address bar. After allowing access, you may need to close this dialog and try again.</p>
                    </>
                  ) : cameraError === 'not-found' ? (
                    <>
                      <h4 className="font-semibold text-lg text-white mb-2">No Camera Found</h4>
                      <p className="text-red-300 max-w-sm">Please make sure a camera is connected and enabled.</p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-lg text-white mb-2">Camera Error</h4>
                      <p className="text-red-300 max-w-sm">Could not access the camera. An unexpected error occurred.</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 1280, height: 720, facingMode }}
                    className="rounded-md w-full h-auto aspect-video"
                    onUserMediaError={handleCameraError}
                  />
                  <div className="absolute bottom-4 w-full px-4 flex items-center justify-between">
                    <button 
                      onClick={() => setIsCameraModalOpen(false)}
                      className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-transform transform hover:scale-105 active:scale-95" 
                      aria-label="Close Camera" 
                      title="Close Camera"
                    >
                      <Icons.Close className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={handleCaptureClick} 
                      className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-glow-primary transition-transform transform hover:scale-105 active:scale-95" 
                      aria-label="Capture photo"
                    >
                       <div className="w-14 h-14 rounded-full bg-white border-2 border-black transition-all" />
                    </button>
                    <button 
                      onClick={toggleCamera} 
                      className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white transition-transform transform hover:scale-105 active:scale-95" 
                      aria-label="Switch camera" 
                      title="Switch Camera"
                    >
                      <Icons.FlipCamera className="w-6 h-6" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInput;