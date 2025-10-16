import React, { useState } from 'react';
import { Icons } from '../Icons';
import * as GeminiService from '../../services/geminiService';
import useChatManager from '../../hooks/useChatManager';

interface ImageGenerationViewProps {
  chatManager: ReturnType<typeof useChatManager>;
  setActiveView: (view: 'chat' | 'image') => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16';

export const ImageGenerationView: React.FC<ImageGenerationViewProps> = ({ chatManager, setActiveView }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addImageToChat } = chatManager;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const image = await GeminiService.generateImage(prompt, aspectRatio);
      setGeneratedImage(image);
    } catch (e: any) {
      console.error("Image generation failed:", e);
      setError(e.message || "An unknown error occurred during image generation.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUseInChat = () => {
    if (generatedImage) {
      addImageToChat(generatedImage, prompt);
      setActiveView('chat');
    }
  };

  const aspectRatios: { label: string; value: AspectRatio }[] = [
    { label: 'Square', value: '1:1' },
    { label: 'Landscape', value: '16:9' },
    { label: 'Portrait', value: '9:16' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 animate-fade-in">
      <div className="flex items-center p-4 border-b border-glass-border bg-black/30 backdrop-blur-sm flex-shrink-0">
        <h2 className="text-lg font-semibold">Image Studio</h2>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-y-auto">
        {/* Left Panel: Controls */}
        <div className="p-6 flex flex-col gap-6 border-r-0 lg:border-r border-glass-border">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cityscape with flying cars at sunset, detailed, photorealistic..."
              className="w-full h-32 bg-gray-800 border border-gray-700 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 resize-none transition-colors"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
            <div className="flex gap-2">
              {aspectRatios.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setAspectRatio(value)}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    aspectRatio === value
                      ? 'bg-purple-600 text-white shadow-glow-primary'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 p-3 bg-primary hover:bg-primary-hover rounded-lg font-semibold transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? <Icons.Spinner className="w-5 h-5" /> : <Icons.Sparkles className="w-5 h-5" />}
            <span>{isLoading ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>

        {/* Right Panel: Display */}
        <div className="p-6 flex items-center justify-center">
          {isLoading && (
            <div className="text-center">
              <Icons.Spinner className="w-12 h-12 text-primary mx-auto" />
              <p className="mt-4 text-gray-400">Creating your vision...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-lg max-w-sm">
              <Icons.Error className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Generation Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !generatedImage && !error && (
            <div className="text-center text-gray-500">
              <Icons.Image className="w-24 h-24 mx-auto mb-4" />
              <p>Your generated image will appear here.</p>
            </div>
          )}
          {generatedImage && (
            <div className="animate-fade-in space-y-4 flex flex-col items-center">
              <img src={generatedImage} alt={prompt} className="max-w-full max-h-[60vh] rounded-lg shadow-lg" />
              <div className="flex gap-4">
                 <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleUseInChat}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover rounded-lg font-semibold transition-colors"
                >
                  Use in Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
