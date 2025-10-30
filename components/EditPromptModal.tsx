
import React, { useState, useEffect } from 'react';
import type { ProcessedCategory } from '../types';

interface EditPromptModalProps {
  category: ProcessedCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (categoryId: number, newPrompt: string) => void;
}

export const EditPromptModal: React.FC<EditPromptModalProps> = ({ category, isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (category) {
      setPrompt(category.prompt);
    }
  }, [category]);

  if (!isOpen || !category) {
    return null;
  }

  const handleGenerate = () => {
    onGenerate(category.id, prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300" aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl transform transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-400">Edit Prompt for "{category.name}"</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="space-y-4">
            <label htmlFor="prompt-editor" className="block text-sm font-medium text-gray-300">
                Customize the generation prompt:
            </label>
            <textarea
                id="prompt-editor"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
          >
            Regenerate Image
          </button>
        </div>
      </div>
    </div>
  );
};
