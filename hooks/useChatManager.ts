



import { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Fix: Import GroundingChunk to use the correct type definition for sanitizing API responses.
import { Message, ChatSession, User, MessageContent, MessageType, GroundingChunk } from '../types';
import * as GeminiService from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

type Attachment = { name: string; type: string; content: string; };

const useChatManager = (user: User | null) => {
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Message | null>(null);

    const storageKey = useMemo(() => user ? `geminova_chats_${user.id}` : null, [user]);

    useEffect(() => {
        if (storageKey) {
            try {
                const storedChats = localStorage.getItem(storageKey);
                if (storedChats) {
                    const parsedChats: ChatSession[] = JSON.parse(storedChats);
                    setChats(parsedChats);
                    if (parsedChats.length > 0 && !currentChatId) {
                        setCurrentChatId(parsedChats[0].id);
                    }
                } else {
                    createNewChat();
                }
            } catch (e) {
                console.error("Failed to load chats from localStorage", e);
                createNewChat();
            }
        }
    }, [storageKey]);

    useEffect(() => {
        if (storageKey && chats.length > 0) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(chats));
            } catch (e) {
                console.error("Failed to save chats to localStorage", e);
            }
        }
    }, [chats, storageKey]);

    const currentChat = useMemo(() => chats.find(c => c.id === currentChatId), [chats, currentChatId]);
    const messages = useMemo(() => currentChat?.messages || [], [currentChat]);

    const updateMessages = useCallback((chatId: string, newMessages: Message[] | ((prev: Message[]) => Message[])) => {
        setChats(prevChats =>
            prevChats.map(chat =>
                chat.id === chatId
                    ? { ...chat, messages: typeof newMessages === 'function' ? newMessages(chat.messages) : newMessages }
                    : chat
            )
        );
    }, []);

    const createNewChat = useCallback(() => {
        const newChat: ChatSession = {
            id: uuidv4(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            personality: 'friendly',
            useGoogleSearch: false,
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        return newChat;
    }, []);

    const selectChat = useCallback((chatId: string) => {
        setCurrentChatId(chatId);
    }, []);
    
    const deleteChat = useCallback((chatId: string) => {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
            const remainingChats = chats.filter(c => c.id !== chatId);
            if (remainingChats.length > 0) {
                setCurrentChatId(remainingChats[0].id);
            } else {
                createNewChat();
            }
        }
    }, [chats, currentChatId, createNewChat]);

    const clearAllChats = useCallback(() => {
        setChats([]);
        if(storageKey) localStorage.removeItem(storageKey);
        createNewChat();
    }, [storageKey, createNewChat]);

    const parseResponse = (text: string) => {
        const suggestions = [...text.matchAll(/\[SUGGESTION\](.*?)\[\/SUGGESTION\]/g)].map(match => match[1]);
        const cleanedText = text.replace(/\[SUGGESTION\].*?\[\/SUGGESTION\]/g, '').trim();
        return { cleanedText, suggestions };
    };

    const sendMessage = useCallback(async (content: string, options?: { attachment?: Attachment, useSearch?: boolean }) => {
        let activeChat = currentChat;
        if (!activeChat) {
            activeChat = createNewChat();
        }

        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            type: 'text',
            content,
            timestamp: Date.now(),
            attachment: options?.attachment ? { name: options.attachment.name, type: options.attachment.type } : undefined,
        };

        const assistantMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            type: 'text',
            content: '',
            timestamp: Date.now(),
            isStreaming: true,
        };

        updateMessages(activeChat.id, prev => [...prev, userMessage, assistantMessage]);

        setIsLoading(true);
        setError(null);
        
        const chatHistory = [...activeChat.messages, userMessage];

        try {
            const stream = await GeminiService.streamChat(
                chatHistory,
                activeChat.personality,
                options?.useSearch ?? activeChat.useGoogleSearch,
                options?.attachment
            );
            let fullResponseText = '';
            let finalResponse: GenerateContentResponse | undefined;

            for await (const chunk of stream) {
                fullResponseText += chunk.text;
                finalResponse = chunk;
                updateMessages(activeChat.id, prev =>
                    prev.map(m =>
                        m.id === assistantMessage.id ? { ...m, content: fullResponseText } : m
                    )
                );
            }
            
            const { cleanedText, suggestions } = parseResponse(fullResponseText);
            
            // Fix: The GroundingChunk type from the Gemini API has optional properties, while the app's internal type
            // expects required properties. This maps the API response to the app's type, ensuring type compatibility
            // and filtering out any chunks that are missing a URI.
            const apiGroundingChunks = finalResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const groundingChunks: GroundingChunk[] | undefined = apiGroundingChunks
                ?.map(chunk => ({
                    web: {
                        uri: chunk.web?.uri || '',
                        title: chunk.web?.title || 'Untitled Source',
                    }
                }))
                .filter(chunk => chunk.web.uri);

            updateMessages(activeChat.id, prev =>
                prev.map(m =>
                    m.id === assistantMessage.id
                        ? { ...m, content: cleanedText, isStreaming: false, suggestions, groundingChunks }
                        : m
                )
            );

            // Generate title for new chats
            if (activeChat.messages.length === 0) { // before we added messages
                const title = await GeminiService.generateTitleForChat(content, cleanedText);
                setChats(prev => prev.map(c => c.id === activeChat?.id ? { ...c, title } : c));
            }

        } catch (e: any) {
            const errorMessage: Message = {
                id: uuidv4(),
                role: 'error',
                type: 'error',
                content: e.message || "An unknown error occurred.",
                timestamp: Date.now(),
            };
             // Replace the streaming placeholder with the error message
            updateMessages(activeChat.id, prev => [
                ...prev.filter(m => m.id !== assistantMessage.id),
                errorMessage
            ]);
            setError(null); // No longer needed for bottom-of-screen display
        } finally {
            setIsLoading(false);
        }
    }, [currentChat, updateMessages, createNewChat]);
    
    const addMessageToChat = useCallback((type: MessageType, content: MessageContent) => {
        let activeChat = currentChat;
        if (!activeChat) {
            activeChat = createNewChat();
        }

        const message: Message = {
            id: uuidv4(),
            role: 'user',
            type: type,
            content: content,
            timestamp: Date.now()
        };
        updateMessages(activeChat.id, prev => [...prev, message]);
    }, [currentChat, createNewChat, updateMessages]);

    const addImageToChat = useCallback((imageUrl: string, prompt: string) => {
        addMessageToChat('image', { imageUrl, prompt });
    }, [addMessageToChat]);

    const addImageEditResultToChat = useCallback((editedImageUrl: string, description: string) => {
        addMessageToChat('edited-image', { editedImageUrl, description });
    }, [addMessageToChat]);

    return {
        chats,
        setChats,
        currentChat,
        currentChatId,
        messages,
        isLoading,
        error,
        sendMessage,
        createNewChat,
        selectChat,
        deleteChat,
        clearAllChats,
        addImageToChat,
        addImageEditResultToChat,
    };
};

export default useChatManager;