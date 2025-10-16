export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: string; // base64
  language?: string;
}

export type AIPersonality = 'friendly' | 'professional' | 'humorous';

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  personality: AIPersonality;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Recipe | Story;
  timestamp: number;
  // Fix: Added 'recipe' and 'story' to the possible message types.
  type?: 'text' | 'image' | 'image_edit' | 'error' | 'sources' | 'recipe' | 'story';
  // FIX: Renamed imageUrl to image for consistency and added errorType.
  image?: string; // For generated images or user uploads
  imageEditDescription?: string; // Description of changes for image editing
  sources?: { uri: string; title: string }[]; // For grounded search
  errorDetails?: string;
  errorType?: 'RATE_LIMIT' | 'INVALID_API_KEY' | 'GENERIC' | 'QUOTA_EXCEEDED';
  isLoading?: boolean;
  suggestions?: string[];
}

// Fix: Add missing Recipe type definition.
export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
}

// Fix: Add missing Story type definition.
export interface Story {
  storySegment: string;
  choices: string[];
}

// Fix: Add missing ActionKey type definition.
export type ActionKey = string;

// Fix: Add missing Action type definition.
export interface Action {
  label: string;
  suggestions?: string[];
  handler: (text: string) => void;
}


export interface StoredUser extends User {
  // NOTE: This is a simple, non-secure obfuscation for demo purposes.
  // DO NOT use this in a production environment.
  obfuscatedPass: string;
}