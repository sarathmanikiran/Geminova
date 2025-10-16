import { useState, useCallback, useRef, useEffect } from 'react';
import * as GeminiService from '../services/geminiService';
import { pcmToWav, base64ToArrayBuffer } from '../utils/audioUtils';

type TTSState = 'idle' | 'loading' | 'playing' | 'paused';

export const useTTS = () => {
    const [ttsState, setTtsState] = useState<TTSState>('idle');
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressIntervalRef = useRef<number | null>(null);

    const cleanup = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
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
        setActiveMessageId(messageId);
        setTtsState('loading');

        try {
            const audioB64 = await GeminiService.textToSpeech(text);
            if (!audioB64) throw new Error("No audio data returned.");

            const pcmData = base64ToArrayBuffer(audioB64);
            const wavBlob = pcmToWav(pcmData, 24000);
            const audioUrl = URL.createObjectURL(wavBlob);

            audioRef.current = new Audio(audioUrl);
            audioRef.current.play();
            setTtsState('playing');

            audioRef.current.onloadedmetadata = () => {
                if (audioRef.current) setAudioDuration(audioRef.current.duration);
            };

            audioRef.current.onended = () => {
                cleanup();
            };

            progressIntervalRef.current = window.setInterval(() => {
                if (audioRef.current) {
                    setAudioProgress(audioRef.current.currentTime);
                }
            }, 100);

        } catch (error) {
            console.error("TTS failed:", error);
            cleanup();
        }
    }, [ttsState, activeMessageId, cleanup]);
    
    const seekAudio = useCallback((newTime: number) => {
        if (audioRef.current && isFinite(newTime)) {
            audioRef.current.currentTime = newTime;
            setAudioProgress(newTime);
        }
    }, []);

    useEffect(() => {
        return () => {
            cleanup(); // Ensure cleanup on component unmount
        };
    }, [cleanup]);
    
    const isAudioPaused = ttsState === 'paused';

    return { ttsState, activeMessageId, start, stop, isAudioPaused, audioProgress, audioDuration, seekAudio };
};