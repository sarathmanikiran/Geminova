import React from 'react';
import { Story } from '../types';

interface StoryCardProps {
  story: Story;
  onChoice: (choice: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onChoice }) => {
    if (!story || !story.storySegment) {
        return <p>Could not load story segment.</p>;
    }
    
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-md shadow-glow-assistant">
      <p className="text-gray-300 mb-4 italic">{story.storySegment}</p>
      
      <div className="mt-4">
        <h4 className="font-semibold mb-2 text-purple-400">What happens next?</h4>
        <div className="flex flex-col gap-2">
          {story.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => onChoice(choice)}
              className="w-full text-left p-2 bg-gray-700 hover:bg-purple-700 rounded-md transition-all text-sm hover:shadow-glow-primary transform hover:scale-[1.02] active:scale-95"
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};