import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatSession, User } from '../types';
import * as GeminiService from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

const useChatManager = (user: User | null) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Message | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const getChatKey = (userId: string) => `geminova_chats_${userId}`;
  const getMessagesKey = (chatId: string) => `geminova_messages_${chatId}`;

  // Load chats from localStorage on user login
  useEffect(() => {
    if (user) {
      try {
        const storedChats = localStorage.getItem(getChatKey(user.id));
        if (storedChats) {
          const parsedChats: ChatSession[] = JSON.parse(storedChats);
          setChats(parsedChats);
          if (parsedChats.length > 0 && !currentChatId) {
            setCurrentChatId(parsedChats[0].id);
          } else if (parsedChats.length === 0) {
            createNewChat();
          }
        } else {
          // If no chats, create a new one to start
          createNewChat();
        }
      } catch (e) {
        console.error("Failed to load chats from localStorage", e);
      }
    } else {
      // Clear state on logout
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save chats to localStorage when they change
  useEffect(() => {
    if (user && chats.length > 0) {
      localStorage.setItem(getChatKey(user.id), JSON.stringify(chats));
    }
  }, [chats, user]);
  
  // Load messages when current chat changes
  useEffect(() => {
    if (currentChatId) {
      try {
        const storedMessages = localStorage.getItem(getMessagesKey(currentChatId));
        setMessages(storedMessages ? JSON.parse(storedMessages) : []);
      } catch (e) {
        console.error("Failed to load messages from localStorage", e);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      localStorage.setItem(getMessagesKey(currentChatId), JSON.stringify(messages));
    }
  }, [messages, currentChatId]);

  const currentChat = chats.find(c => c.id === currentChatId) || null;
  
  const selectChat = useCallback((chatId: string | null) => {
    if (isLoading) {
      abortControllerRef.current?.abort();
      setIsLoading(false);
    }
    setCurrentChatId(chatId);
  }, [isLoading]);

  const createNewChat = useCallback(() => {
    if (!user) return;
    const newChat: ChatSession = {
      id: uuidv4(),
      userId: user.id,
      title: 'New Chat',
      createdAt: Date.now(),
      personality: 'friendly',
    };
    setChats(prev => [newChat, ...prev]);
    selectChat(newChat.id);
    setMessages([]); // Start with a clean slate
    return newChat.id;
  }, [user, selectChat]);

  const deleteChat = useCallback((chatId: string) => {
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return;

    const newChats = chats.filter(c => c.id !== chatId);
    setChats(newChats);
    localStorage.removeItem(getMessagesKey(chatId));

    if (currentChatId === chatId) {
        if (newChats.length > 0) {
            selectChat(newChats[0].id);
        } else {
            createNewChat();
        }
    }
  }, [chats, currentChatId, selectChat, createNewChat]);
  
  const clearAllChats = useCallback(() => {
      if (!user) return;
      // Remove message history for each chat
      chats.forEach(chat => localStorage.removeItem(getMessagesKey(chat.id)));
      // Remove the main chat list
      localStorage.removeItem(getChatKey(user.id));
      
      // Reset state and start fresh
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
      createNewChat();
  }, [user, chats, createNewChat]);


  const addMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
  };

  const handleStreamedResponse = async (
    userMessage: Message, 
    stream: AsyncGenerator<GenerateContentResponse>, 
    assistantMessageId: string,
    isFirstMessage: boolean
  ) => {
    let fullResponse = "";
    let finalResponse: GenerateContentResponse | undefined;
    let isFirstChunk = true;

    try {
        for await (const chunk of stream) {
            finalResponse = chunk;
            const text = chunk.text;
            if (text) {
                fullResponse += text;
                setMessages(prev =>
                    prev.map(m => {
                        if (m.id === assistantMessageId) {
                            const updatedMessage = { ...m, content: fullResponse + '▋' };
                            if (isFirstChunk) {
                                updatedMessage.isLoading = false;
                            }
                            return updatedMessage;
                        }
                        return m;
                    })
                );
                isFirstChunk = false;
            }
        }
        
        const suggestionRegex = /\[SUGGESTION\](.*?)\[\/SUGGESTION\]/g;
        const suggestions = [...fullResponse.matchAll(suggestionRegex)].map(match => match[1]);
        const cleanedResponse = fullResponse.replace(suggestionRegex, '').trim();

        setMessages(prev =>
            prev.map(m =>
                m.id === assistantMessageId ? { ...m, content: cleanedResponse, suggestions: suggestions.length > 0 ? suggestions : undefined } : m
            )
        );

        const sources = finalResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((c: any) => c.web)
            .filter(Boolean);

        if (sources && sources.length > 0) {
            addMessage({
                id: uuidv4(),
                chatId: userMessage.chatId,
                role: 'system',
                type: 'sources',
                content: "Information was gathered from the following sources:",
                sources,
                timestamp: Date.now(),
            });
        }
        
        if (isFirstMessage && currentChat) {
             const title = await GeminiService.generateTitleForChat(userMessage.content as string, cleanedResponse);
             setChats(prev => prev.map(c => c.id === currentChat.id ? {...c, title} : c));
        }

    } catch (e: any) {
        console.error("Streaming error:", e);
        const errorMessage: Message = {
            id: assistantMessageId,
            chatId: currentChatId!,
            role: 'assistant',
            content: `An error occurred: ${e.message || 'Please try again.'}`,
            timestamp: Date.now(),
            type: 'error',
            isLoading: false,
        };
        setMessages(prev => prev.map(m => m.id === assistantMessageId ? errorMessage : m));
    } finally {
        setIsLoading(false);
    }
  };

  const sendMessage = useCallback(async (content: string, useGoogleSearch: boolean = false) => {
    let chatId = currentChatId;
    let isFirstUserMessage = messages.length === 0;

    if (!chatId || !currentChat || !user) {
        const newChatId = createNewChat();
        if (!newChatId) {
            console.error("Failed to create a new chat.");
            return;
        }
        chatId = newChatId;
        isFirstUserMessage = true; 
    }

    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: uuidv4(),
      chatId: chatId,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    const assistantMessage: Message = {
        id: uuidv4(),
        chatId: chatId,
        role: 'assistant',
        content: '',
        isLoading: true,
        timestamp: Date.now() + 1,
    };
    
    // Use a tiny timeout to ensure the user message renders before the assistant placeholder
    setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
    }, 10);

    const messagesForApi = [...messages, userMessage];

    try {
        const stream = await GeminiService.streamChat(
            messagesForApi, 
            currentChat!.personality, 
            useGoogleSearch
        );
        await handleStreamedResponse(userMessage, stream, assistantMessage.id, isFirstUserMessage);
    } catch (e: any) {
        console.error("API call error:", e);
        const errorContent = e.message.includes("API key not valid")
            ? "<strong>Invalid API Key</strong><br/>Please check your API key in the environment variables."
            : `An error occurred: ${e.message || 'Please try again.'}`;

        const errorMessage: Message = {
            id: assistantMessage.id, // Replace the placeholder
            chatId: chatId,
            role: 'assistant',
            content: errorContent,
            timestamp: Date.now(),
            type: 'error',
            isLoading: false,
            errorType: e.message.includes("API key not valid") ? 'INVALID_API_KEY' : 'GENERIC',
        };
        setMessages(prev => prev.map(m => m.id === assistantMessage.id ? errorMessage : m));
        setIsLoading(false);
    }
  }, [currentChatId, currentChat, user, messages, createNewChat]);

  const sendImage = useCallback(async (prompt: string, image: { dataUrl: string, file: File }) => {
    if (!currentChatId || !currentChat) return;

    setError(null);
    setIsLoading(true);
    
    const userMessage: Message = {
        id: uuidv4(),
        chatId: currentChatId,
        role: 'user',
        content: prompt,
        image: image.dataUrl,
        timestamp: Date.now(),
        type: 'image',
    };
    addMessage(userMessage);
    
    const assistantMessage: Message = {
        id: uuidv4(),
        chatId: currentChatId,
        role: 'assistant',
        content: 'Editing your image...',
        isLoading: true,
        timestamp: Date.now() + 1
    };
    addMessage(assistantMessage);

    try {
        const { editedImage, description } = await GeminiService.editImage(prompt, image.dataUrl, image.file.type);
        const successMessage: Message = {
            id: assistantMessage.id,
            chatId: currentChatId,
            role: 'assistant',
            content: description,
            image: editedImage,
            isLoading: false,
            timestamp: Date.now(),
            type: 'image_edit',
        };
        setMessages(prev => prev.map(m => m.id === assistantMessage.id ? successMessage : m));
    } catch (e: any) {
        const errorMessage: Message = {
            id: assistantMessage.id,
            chatId: currentChatId,
            role: 'assistant',
            content: `Failed to edit image: ${e.message}`,
            isLoading: false,
            timestamp: Date.now(),
            type: 'error',
        };
        setMessages(prev => prev.map(m => m.id === assistantMessage.id ? errorMessage : m));
    } finally {
        setIsLoading(false);
    }
  }, [currentChat, currentChatId]);

  const addImageToChat = useCallback((imageDataUrl: string, prompt: string) => {
    let chatId = currentChatId;
    
    // If there's no active chat, create one.
    if (!chatId) {
      chatId = createNewChat();
      if (!chatId) { // Exit if chat creation failed
        console.error("Could not create a new chat to add the image.");
        return;
      }
    }

    const imageMessage: Message = {
        id: uuidv4(),
        chatId: chatId,
        role: 'assistant',
        content: `Generated image for the prompt: "${prompt}"`,
        timestamp: Date.now(),
        type: 'image',
        image: imageDataUrl,
    };
    addMessage(imageMessage);
  }, [currentChatId, createNewChat]);
  
  const addImageEditResultToChat = useCallback((editedImage: string, description: string) => {
    let chatId = currentChatId;
    
    if (!chatId) {
      chatId = createNewChat();
      if (!chatId) {
        console.error("Could not create a new chat to add the edited image.");
        return;
      }
    }

    const editResult: Message = {
        id: uuidv4(),
        chatId: chatId,
        role: 'assistant',
        content: description,
        timestamp: Date.now(),
        type: 'image_edit',
        image: editedImage,
    };
    addMessage(editResult);
  }, [currentChatId, createNewChat]);

  return {
    chats,
    setChats,
    currentChat,
    selectChat,
    createNewChat,
    deleteChat,
    clearAllChats,
    messages,
    sendMessage,
    sendImage,
    addImageToChat,
    addImageEditResultToChat,
    isLoading,
    error
  };
};

export default useChatManager;