import React, { useState } from 'react';
import { Icons } from '../Icons';
import * as GeminiService from '../../services/geminiService';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageDataUrl: string, prompt: string) => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16';

export const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ isOpen, onClose, onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joke, setJoke] = useState<string>('');

  if (!isOpen) return null;

  const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "I told my computer I needed a break, and now it won’t stop sending me Kit-Kat ads.",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "What do you call a fake noodle? An impasta.",
    "Why was the AI so good at painting? It had a lot of brushes with greatness.",
    "Our AI is working hard... it's currently arguing with a Roomba about who has the better pathfinding algorithm.",
    "What's an AI's favorite music? Al-gore-ithms.",
    "Hang tight, our digital artist is just finishing its coffee.",
    "I asked the AI to draw a 'syntax error'. It just gave me a picture of my own face."
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    setJoke(randomJoke);
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

  const handleAddToChat = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage, prompt);
      // Reset for next time
      setPrompt('');
      setGeneratedImage(null);
    }
  };

  const aspectRatios: { label: string; value: AspectRatio }[] = [
    { label: 'Square', value: '1:1' },
    { label: 'Landscape', value: '16:9' },
    { label: 'Portrait', value: '9:16' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl border border-glass-border flex flex-col max-h-[90vh] animate-modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-glass-border flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">Generate Image</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95">
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Panel: Controls */}
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="modal-prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
              <textarea
                id="modal-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic cityscape with flying cars..."
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 resize-none transition-colors"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
              <div className="flex gap-2">
                {aspectRatios.map(({ label, value }) => (
                  <button key={value} onClick={() => setAspectRatio(value)} disabled={isLoading}
                          className={`px-4 py-2 rounded-md text-sm transition-all transform hover:scale-105 active:scale-95 ${aspectRatio === value ? 'bg-primary text-white shadow-glow-primary' : 'bg-gray-700 hover:bg-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 mt-auto px-4 py-2 bg-primary hover:bg-primary-hover rounded-md font-semibold transition-all disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
            >
              {isLoading ? <Icons.Spinner className="w-5 h-5" /> : <Icons.Sparkles className="w-5 h-5" />}
              <span>{isLoading ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>

          {/* Right Panel: Display */}
          <div className="bg-gray-900/50 rounded-lg flex items-center justify-center p-4 min-h-[250px]">
            {isLoading && (
              <div className="text-center max-w-sm">
                <Icons.Spinner className="w-12 h-12 text-primary mx-auto" />
                <p className="mt-4 text-gray-300 font-semibold">Creating your vision...</p>
                <p className="mt-2 text-sm text-gray-400 italic">"{joke}"</p>
              </div>
            )}
            {error && (
              <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-lg">
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
                <img src={generatedImage} alt={prompt} className="max-w-full max-h-full rounded-lg shadow-lg object-contain" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-700 rounded-md hover:bg-gray-600 transition-all transform hover:scale-[1.02] active:scale-95">Cancel</button>
          <button onClick={handleAddToChat} disabled={!generatedImage} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-all shadow-glow-primary disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95">
            Add to Chat
          </button>
        </div>
      </div>
    </div>
  );
};