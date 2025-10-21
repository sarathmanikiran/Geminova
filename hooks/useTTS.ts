import { useState, useCallback, useRef, useEffect } from 'react';
import * as GeminiService from '../services/geminiService';
import { pcmToWav, base64ToArrayBuffer } from '../utils/audioUtils';
import { useToast } from '../components/chat/VoiceMode';

type TTSState = 'idle' | 'loading' | 'playing' | 'paused';

export const useTTS = () => {
    const [ttsState, setTtsState] = useState<TTSState>('idle');
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const { showToast } = useToast();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activeRequestRef = useRef<string | null>(null);

    const cleanup = useCallback(() => {
        activeRequestRef.current = null;
        if (audioRef.current) {
            audioRef.current.pause();
            if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
                URL.revokeObjectURL(audioRef.current.src);
            }
            audioRef.current.src = '';
            audioRef.current = null;
        }
        setTtsState('idle');
        setActiveMessageId(null);
    }, []);

    const stop = useCallback(() => {
        cleanup();
    }, [cleanup]);

    const start = useCallback(async (text: string, messageId: string) => {
        // --- Play/Pause Toggle Logic ---
        if (ttsState !== 'idle' && activeMessageId === messageId) {
            if (audioRef.current) {
                if (ttsState === 'playing') {
                    audioRef.current.pause();
                    setTtsState('paused');
                } else if (ttsState === 'paused') {
                    try {
                        await audioRef.current.play();
                        setTtsState('playing');
                    } catch (error) {
                        console.error('Failed to resume playback:', error);
                        showToast("Could not resume audio.", 'error');
                        cleanup();
                    }
                }
            }
            return;
        }

        // --- New TTS Request Logic ---
        // Clean up any existing audio before starting a new one.
        cleanup();
        
        activeRequestRef.current = messageId;
        setActiveMessageId(messageId);
        setTtsState('loading');

        try {
            const audioB64 = await GeminiService.textToSpeech(text);
            
            // If another request started while this one was fetching, abandon this one.
            if (activeRequestRef.current !== messageId) return;

            if (!audioB64) {
                console.error("TTS Error: The API returned no audio data.");
                showToast("Could not generate audio for this message.", 'error');
                cleanup();
                return;
            }

            const pcmData = base64ToArrayBuffer(audioB64);
            const wavBlob = pcmToWav(pcmData, 24000);
            const audioUrl = URL.createObjectURL(wavBlob);

            audioRef.current = new Audio(audioUrl);
            
            audioRef.current.onended = () => {
                if (activeRequestRef.current === messageId) {
                    cleanup();
                }
            };
            
            // Asynchronously play the audio and handle potential interruptions.
            try {
                await audioRef.current.play();
                // After play() resolves, check if this is still the active request.
                if (activeRequestRef.current === messageId) {
                    setTtsState('playing');
                } else {
                    // A new request was started while this one was trying to play.
                    // The cleanup for this instance is likely handled by the new request's `cleanup()` call.
                }
            } catch (error: any) {
                // This catches the "The play() request was interrupted..." error.
                if (error.name === 'AbortError') {
                    // This is expected if the user clicks another button quickly. No user-facing error needed.
                    console.log('TTS playback was interrupted by a new request.');
                } else {
                    console.error("TTS playback failed:", error);
                    if (activeRequestRef.current === messageId) {
                        showToast("An error occurred during audio playback.", 'error');
                        cleanup();
                    }
                }
            }

        } catch (error) {
            console.error("TTS service call failed:", error);
            if (activeRequestRef.current === messageId) {
                showToast("Failed to generate audio due to a service error.", 'error');
                cleanup();
            }
        }
    }, [ttsState, activeMessageId, cleanup, showToast]);
    

    useEffect(() => {
        // Ensure cleanup happens on component unmount.
        return () => {
            cleanup();
        };
    }, [cleanup]);
    
    return { ttsState, activeMessageId, start, stop };
};