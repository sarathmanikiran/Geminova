import React from 'react';
import { Message } from '../types';
import { RecipeCard } from './RecipeCard';
import { StoryCard } from './StoryCard';

interface StructuredResponseProps {
  message: Message;
}

export const StructuredResponse: React.FC<StructuredResponseProps> = ({ message }) => {
  switch (message.type) {
    case 'recipe':
      return <RecipeCard recipe={message.content as any} />;
    case 'story':
      // The handler for story choices would need to be passed down or handled via context.
      // For now, it's just for display and calls a dummy handler.
      return <StoryCard story={message.content as any} onChoice={() => {}} />;
    default:
      return null;
  }
};
