import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { Message, AIPersonality, ChatSession } from '../types';

let ai: GoogleGenAI | undefined;

try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI. API key might be missing.", error);
  ai = undefined;
}

export const isApiKeyConfigured = (): boolean => {
  return !!ai;
};

const getSystemInstruction = (personality: AIPersonality): string => {
  const basePrompt = `You are Geminova, a futuristic, multimodal AI companion. You are integrated into a sleek, dark-themed web application with glassmorphism effects. Your responses should be intelligent, concise, and reflect a next-gen AI. After your main response, suggest 2-3 brief, relevant follow-up questions or actions the user might take. Format them like this: [SUGGESTION]A short suggestion here.[/SUGGESTION]. Do not add suggestions if the user's prompt is very simple, like 'hello'.`;
  
  switch (personality) {
    case 'professional':
      return `${basePrompt} Your current personality is Professional. Maintain a formal, precise, and highly knowledgeable tone. Prioritize accuracy and clarity in all communications.`;
    case 'humorous':
      return `${basePrompt} Your current personality is Humorous. Be witty, clever, and use tasteful humor. Engage the user with lighthearted jokes and funny observations. Use emojis sparingly.`;
    case 'friendly':
    default:
      return `${basePrompt} Your current personality is Friendly. Be warm, approachable, and empathetic. Use emojis to convey emotion naturally. Make the user feel like they're talking to a helpful friend.`;
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
  useGoogleSearch: boolean
) => {
  if (!ai) throw new Error("API key not configured. Cannot connect to Gemini.");
  
  const history = buildHistory(messages.slice(0, -1));
  const latestMessage = messages[messages.length - 1];

  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: [...history, { role: 'user', parts: [{ text: latestMessage.content as string }] }],
    config: {
        systemInstruction: getSystemInstruction(personality),
        tools: useGoogleSearch ? [{ googleSearch: {} }] : undefined,
    }
  });
  return stream;
};

export const generateTitleForChat = async (firstUserMessage: string, firstAssistantMessage: string): Promise<string> => {
  if (!ai) return "New Chat";
  try {
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a concise, 3-5 word title for a conversation that starts like this. Do not use quotes or any introductory text.
        User: "${firstUserMessage}"
        AI: "${firstAssistantMessage}"`,
    });
    return result.text.trim();
  } catch (error) {
    console.error("Title generation failed:", error);
    return "New Chat";
  }
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16') => {
    if (!ai) throw new Error("API key not configured.");
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio,
        },
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    if (!ai) throw new Error("API key not configured.");
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: `Edit instruction: ${prompt}. Also, provide a one-sentence description of the changes made.` },
            ],
        },
        config: {
// Fix: The responseModalities array must contain exactly one modality.
          responseModalities: [Modality.IMAGE],
        },
    });

    let newImageBase64: string | null = null;
    let description = "Image edited successfully.";

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            newImageBase64 = part.inlineData.data;
        } else if (part.text) {
            description = part.text;
        }
    }

    if (!newImageBase64) throw new Error("Image editing failed to return an image.");
    
    return {
        editedImage: `data:${mimeType};base64,${newImageBase64}`,
        description,
    };
};

export const textToSpeech = async (text: string): Promise<string | null> => {
    if (!ai) throw new Error("API key not configured.");
    const response = await ai.models.generateContent({
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
};
// Fix: Add missing fetchSuggestionsForAction function.
export const fetchSuggestionsForAction = async (actionLabel: string): Promise<string[]> => {
    if (!ai) return [];
    try {
        const result = await ai.models.generateContent({
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