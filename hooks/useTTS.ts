import { useState, useCallback, useRef, useEffect } from 'react';
import * as GeminiService from '../services/geminiService';
import { pcmToWav, base64ToArrayBuffer } from '../utils/audioUtils';
import { useToast } from '../components/chat/VoiceMode';

type TTSState = 'idle' | 'loading' | 'playing' | 'paused';

export const useTTS = () => {
    const [ttsState, setTtsState] = useState<TTSState>('idle');
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const { showToast } = useToast();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
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
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setTtsState('idle');
        setActiveMessageId(null);
        setAudioProgress(0);
        setAudioDuration(0);
    }, []);

    const stop = useCallback(() => {
        cleanup();
    }, [cleanup]);

    const start = useCallback(async (text: string, messageId: string) => {
        if (ttsState !== 'idle' && activeMessageId === messageId) {
            if (audioRef.current) {
                if (ttsState === 'playing') {
                    audioRef.current.pause();
                    setTtsState('paused');
                } else if (ttsState === 'paused') {
                    audioRef.current.play();
                    setTtsState('playing');
                }
            }
            return;
        }

        cleanup();
        
        activeRequestRef.current = messageId;
        setActiveMessageId(messageId);
        setTtsState('loading');

        try {
            const audioB64 = await GeminiService.textToSpeech(text);
            
            // If another request started while this one was in-flight, abandon this one.
            if (activeRequestRef.current !== messageId) return;

            // Handle the case where the API call succeeds but returns no audio data.
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
            
            audioRef.current.onerror = () => {
                if (activeRequestRef.current === messageId) {
                    showToast("An error occurred during audio playback.", 'error');
                    cleanup();
                }
            };
            
            audioRef.current.play();
            setTtsState('playing');

            audioRef.current.onloadedmetadata = () => {
                if (audioRef.current && activeRequestRef.current === messageId) {
                     setAudioDuration(audioRef.current.duration);
                }
            };

            audioRef.current.onended = () => {
                if (activeRequestRef.current === messageId) {
                    cleanup();
                }
            };

            progressIntervalRef.current = window.setInterval(() => {
                if (audioRef.current && activeRequestRef.current === messageId) {
                    setAudioProgress(audioRef.current.currentTime);
                }
            }, 100);

        } catch (error) {
            console.error("TTS service call failed:", error);
            if (activeRequestRef.current === messageId) {
                // This catches failures in the GeminiService.textToSpeech call itself (e.g., network error).
                showToast("Failed to generate audio due to a service error.", 'error');
                cleanup();
            }
        }
    }, [ttsState, activeMessageId, cleanup, showToast]);
    
    const seekAudio = useCallback((newTime: number) => {
        if (audioRef.current && isFinite(newTime)) {
            audioRef.current.currentTime = newTime;
            setAudioProgress(newTime);
        }
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);
    
    const isAudioPaused = ttsState === 'paused';

    return { ttsState, activeMessageId, start, stop, isAudioPaused, audioProgress, audioDuration, seekAudio };
};