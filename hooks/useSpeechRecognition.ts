import { useState, useEffect, useRef, useCallback } from 'react';

// Define the interface for the SpeechRecognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void; // Using generic Event for broader compatibility
  onend: () => void;
  onstart: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  // Ref to prevent race conditions when starting/stopping recognition
  const isTransitioningRef = useRef<boolean>(false);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;
    
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = 'en-US';

    // Let browser events drive the listening state to prevent race conditions.
    recognition.onstart = () => {
      isTransitioningRef.current = false;
      setIsListening(true);
    };

    recognition.onend = () => {
      isTransitioningRef.current = false;
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }
        setTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: Event) => {
      isTransitioningRef.current = false;
      const speechErrorEvent = event as any; 
      console.error('Speech recognition error:', speechErrorEvent.error);
      setError(`Speech recognition error: ${speechErrorEvent.error}`);
      // The 'onend' event will automatically fire after an error, which handles setting isListening to false.
    };

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        // Prevent onend from firing after component unmounts
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setTranscript(''); // Clear previous transcript before starting
      finalTranscriptRef.current = ''; // Reset the ref on start
      try {
        recognitionRef.current.start();
        // isListening state is now set by the onstart event handler
      } catch (err) {
        isTransitioningRef.current = false;
        console.error("Error starting speech recognition:", err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      recognitionRef.current.stop();
      // isListening state is now set by the onend event handler
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    hasRecognitionSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
};
