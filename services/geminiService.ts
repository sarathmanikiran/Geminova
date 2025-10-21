
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { Message, AIPersonality, ChatSession, GroundingChunk } from '../types';
import { parseApiError } from "../utils/errorUtils";

// FIX: Corrected the type of the `ai` variable to `GoogleGenAI | undefined` to resolve the TypeScript error
// where a value was being used as a type. The hardcoded API key was also removed to comply with guidelines.
let ai: GoogleGenAI | undefined;

// Lazy-initialization of the Gemini client.
// This avoids a hard crash on startup if the API key is not yet available
// and allows for graceful error handling within the UI.
const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }
    // FIX: The API key must be obtained from `process.env.API_KEY` as per the guidelines.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // This error will be caught by the chat manager and displayed in the chat window.
        throw new Error("API key not configured. Cannot connect to Gemini service.");
    }

    try {
        ai = new GoogleGenAI({ apiKey });
        return ai;
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI:", error);
        // Provide a more user-friendly error if initialization fails (e.g., invalid key format)
        throw new Error(parseApiError(error));
    }
};


const getSystemInstruction = (personality: AIPersonality): string => {
  const basePrompt = `You are Geminova, a futuristic, multimodal AI companion. You are integrated into a sleek, dark-themed web application with glassmorphism effects. Your responses should be intelligent, concise, and reflect a next-gen AI. When you provide code snippets, you MUST wrap them in markdown code blocks with the correct language identifier (e.g., \`\`\`javascript). For complex snippets, provide a brief explanation of how the code works either before or after the code block. After your main response, suggest 2-3 brief, relevant follow-up questions or actions the user might take. Format them like this: [SUGGESTION]A short suggestion here.[/SUGGESTION]. Do not add suggestions if the user's prompt is very simple, like 'hello'.`;
  
  switch (personality) {
    case 'professional':
      return `${basePrompt} IMPORTANT: You MUST adopt a Professional personality. Maintain a formal, precise, and highly knowledgeable tone. Prioritize accuracy and clarity. Do not use emojis.`;
    case 'humorous':
      return `${basePrompt} IMPORTANT: You MUST adopt a Humorous personality. Be witty, clever, and use tasteful humor. Tell jokes and make funny observations. Use emojis sparingly.`;
    case 'friendly':
    default:
      return `${basePrompt} IMPORTANT: You MUST adopt a Friendly personality. Be warm, approachable, and empathetic. Use emojis to convey emotion naturally. Behave like a helpful friend.`;
  }
};

const buildHistory = (messages: Message[]) => {
    return messages
        .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content as string }]
        }));
};


export const streamChat = async (
  messages: Message[],
  personality: AIPersonality,
  useGoogleSearch: boolean,
  attachment?: { name: string; type: string; content: string; }
) => {
  const aiClient = getAiClient();
  
  const history = buildHistory(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  let userParts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [{ text: latestMessage.content as string }];

  if (attachment) {
    // Logic simplified to only handle image attachments, as the UI now restricts uploads to images.
    if (attachment.type.startsWith('image/')) {
      userParts = [
        {
          inlineData: {
            mimeType: attachment.type,
            data: attachment.content.split(',')[1] // Remove data URL prefix
          }
        },
        { text: latestMessage.content as string }
      ];
    }
  }
  try {
    const stream = await aiClient.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: userParts }],
        config: {
            systemInstruction: getSystemInstruction(personality),
            tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
        }
    });
    return stream;
  } catch(error) {
    throw new Error(parseApiError(error));
  }
};

export const generateTitleForChat = async (firstUserMessage: string, firstAssistantMessage?: string): Promise<string> => {
  // Replaced API call with local title generation to prevent rate-limiting errors.
  // This creates a concise title from the user's first message without consuming API quota.
  return new Promise((resolve) => {
    try {
      if (!firstUserMessage || typeof firstUserMessage !== 'string') {
        resolve("New Chat");
        return;
      }
      const words = firstUserMessage.split(' ');
      // Take the first 5 words, or less if the message is shorter.
      const title = words.length > 5 
        ? words.slice(0, 5).join(' ') + '...' 
        : firstUserMessage;
      
      // Fallback for empty messages.
      resolve(title.trim() || "New Chat");
    } catch (error) {
      console.error("Local title generation failed:", error);
      resolve("New Chat"); // Resolve with a fallback title on error.
    }
  });
};

// Fix: Updated generateImage to support aspectRatio by using the 'imagen-4.0-generate-001' model.
// This resolves the error in ImageGenerationView where a second argument was passed.
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' = '1:1') => {
    const aiClient = getAiClient();
    try {
        const response = await aiClient.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio,
            },
        });

        const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;

        if (!base64ImageBytes) {
        throw new Error("Image generation failed to return an image.");
        }

        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const aiClient = getAiClient();
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: `Edit instruction: ${prompt}. Also, provide a one-sentence description of the changes made.` },
                ],
            },
            config: {
            // The responseModalities array for image editing must contain exactly one modality, which is Modality.IMAGE.
            responseModalities: [Modality.IMAGE],
            },
        });

        let newImageBase64: string | null = null;
        let description = "Image edited successfully.";

        // Fix: Safely access the content parts from the API response.
        // The previous implementation would crash if `response.candidates` was empty
        // or did not have the expected structure, causing the reported error.
        const contentParts = response.candidates?.[0]?.content?.parts;

        if (!contentParts || contentParts.length === 0) {
            console.error("Image editing response did not contain expected content parts:", response);
            throw new Error("Image editing failed: The response from the AI was invalid or empty.");
        }

        for (const part of contentParts) {
            if (part.inlineData) {
                newImageBase64 = part.inlineData.data;
            } else if (part.text) {
                description = part.text;
            }
        }

        if (!newImageBase64) {
        // This can happen if the response contains text but no image data.
        throw new Error("Image editing failed to return an image.");
        }
        
        return {
            editedImage: `data:${mimeType};base64,${newImageBase64}`,
            description,
        };
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

export const textToSpeech = async (text: string): Promise<string | null> => {
    const aiClient = getAiClient();
    try {
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
    } catch (error) {
        throw new Error(parseApiError(error));
    }
};

// Fix: Add missing fetchSuggestionsForAction function to generate dynamic suggestions for UI actions.
export const fetchSuggestionsForAction = async (actionLabel: string): Promise<string[]> => {
    const aiClient = getAiClient();
    try {
        const result = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate 3 concise, creative suggestions for the action: "${actionLabel}". Return as a JSON array of strings. For example: ["suggestion 1", "suggestion 2", "suggestion 3"]. Do not include any other text or markdown.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });
        const jsonString = result.text.trim();
        const suggestions = JSON.parse(jsonString);
        return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
    } catch (error) {
        console.error("Suggestion generation failed:", error);
        return [];
    }
};
