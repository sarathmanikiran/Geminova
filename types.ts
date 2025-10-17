
export type AIPersonality = 'professional' | 'humorous' | 'friendly';

export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

export type MessageType = 'text' | 'recipe' | 'story' | 'image' | 'edited-image' | 'error';

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
}

export interface Story {
  storySegment: string;
  choices: string[];
}

export interface ImageContent {
  imageUrl: string;
  prompt: string;
}

export interface EditedImageContent {
  editedImageUrl: string;
  description: string;
}

export type MessageContent = string | Recipe | Story | ImageContent | EditedImageContent;

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: MessageContent;
  timestamp: number;
  isStreaming?: boolean;
  suggestions?: string[];
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  personality: AIPersonality;
  useGoogleSearch: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
}

export interface StoredUser extends User {
  obfuscatedPass: string;
}

export interface Action {
  label: string;
  handler: (text: string) => void;
  suggestions?: string[];
}

export type ActionKey = string;
