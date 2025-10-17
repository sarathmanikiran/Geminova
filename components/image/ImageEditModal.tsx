import React, { useState, ChangeEvent } from 'react';
import { Icons } from '../Icons';
import * as GeminiService from '../../services/geminiService';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageEdited: (imageDataUrl: string, description: string) => void;
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, onClose, onImageEdited }) => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ dataUrl: string; file: File } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setPrompt('');
    setOriginalImage(null);
    setEditedImage(null);
    setDescription(null);
    setIsLoading(false);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setEditedImage(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage({ dataUrl: event.target?.result as string, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim()) {
      setError('Please enter an editing instruction.');
      return;
    }
    if (!originalImage) {
      setError('Please upload an image to edit.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    setDescription(null);
    try {
      const result = await GeminiService.editImage(prompt, originalImage.dataUrl, originalImage.file.type);
      setEditedImage(result.editedImage);
      setDescription(result.description);
    } catch (e: any) {
      console.error("Image editing failed:", e);
      setError(e.message || "An unknown error occurred during image editing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToChat = () => {
    if (editedImage && description) {
      onImageEdited(editedImage, description);
      handleClose();
    }
  };

  const ImagePlaceholder = ({ onFileChange }: { onFileChange: (e: ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-center p-4 transition-colors group-hover:border-purple-500">
      <Icons.Image className="w-16 h-16 text-gray-500 mb-4" />
      <p className="text-gray-400 mb-2">Drag & drop or click to upload</p>
      <input type="file" onChange={onFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in p-4" onClick={handleClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl border border-glass-border flex flex-col max-h-[90vh] animate-modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-glass-border flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">Image Edit Studio</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/10 transition-all transform hover:scale-110 active:scale-95">
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Panel: Original Image & Prompt */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full h-48 md:h-64 bg-gray-900/50 rounded-lg flex items-center justify-center group">
              {originalImage ? (
                <img src={originalImage.dataUrl} alt="Original" className="max-w-full max-h-full rounded-lg object-contain" />
              ) : (
                <ImagePlaceholder onFileChange={handleFileChange} />
              )}
            </div>
            <div>
              <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">Edit Instruction</label>
              <textarea
                id="edit-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Add a superhero cape to the main subject..."
                className="w-full h-24 bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500 resize-none transition-colors"
                disabled={isLoading}
              />
            </div>
             <button
                onClick={handleEdit}
                disabled={isLoading || !prompt.trim() || !originalImage}
                className="w-full flex items-center justify-center gap-2 mt-auto px-4 py-2 bg-primary hover:bg-primary-hover rounded-md font-semibold transition-all disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95"
              >
                {isLoading ? <Icons.Spinner className="w-5 h-5" /> : <Icons.Wand className="w-5 h-5" />}
                <span>{isLoading ? 'Editing...' : 'Edit Image'}</span>
              </button>
          </div>

          {/* Right Panel: Edited Image */}
          <div className="flex flex-col gap-4">
            <div className="w-full h-48 md:h-64 bg-gray-900/50 rounded-lg flex items-center justify-center p-4">
               {isLoading && (
                <div className="text-center">
                  <Icons.Spinner className="w-12 h-12 text-primary mx-auto" />
                  <p className="mt-4 text-gray-400">Applying edits...</p>
                </div>
              )}
              {error && (
                <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-lg">
                  <Icons.Error className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">Editing Failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {!isLoading && !editedImage && !error && (
                <div className="text-center text-gray-500">
                  <Icons.Sparkles className="w-16 h-16 mx-auto mb-4" />
                  <p>Your edited image will appear here.</p>
                </div>
              )}
              {editedImage && (
                <img src={editedImage} alt="Edited" className="max-w-full max-h-full rounded-lg object-contain animate-fade-in" />
              )}
            </div>
             <div className="flex-1 bg-gray-900/50 rounded-lg p-3 text-sm text-gray-300 overflow-y-auto min-h-[96px]">
                <p className="font-semibold text-gray-200 mb-1">Description of Changes:</p>
                <p className="italic">{description || "No changes described yet."}</p>
             </div>
          </div>
        </div>

        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium bg-gray-700 rounded-md hover:bg-gray-600 transition-all transform hover:scale-[1.02] active:scale-95">Cancel</button>
          <button onClick={handleAddToChat} disabled={!editedImage} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-all shadow-glow-primary disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95">
            Add to Chat
          </button>
        </div>
      </div>
    </div>
  );
};