
import React from 'react';
import type { ProcessedCategory } from '../types';
import Spinner from './Spinner';
import { CheckCircleIcon, XCircleIcon, PencilIcon } from './icons';

interface CategoryCardProps {
  category: ProcessedCategory;
  onEditPrompt: (category: ProcessedCategory) => void;
  isProcessingQueue: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEditPrompt, isProcessingQueue }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg flex flex-col justify-between transform transition-transform duration-300 hover:scale-105 hover:shadow-blue-500/20">
      <div>
        <div className="relative h-56 w-full bg-gray-700 flex items-center justify-center text-center p-2">
          {category.status === 'loading' && <Spinner />}
          {category.status === 'success' && category.url && (
            <img src={category.url} alt={category.name} className="w-full h-full object-cover" />
          )}
          {category.status === 'error' && (
             <div className="flex flex-col items-center justify-center text-red-400 px-2">
                 <XCircleIcon />
                 <span className="mt-2 text-sm font-semibold capitalize">{category.error || 'An error occurred'}</span>
                 <span className="mt-1 text-xs text-gray-500">
                  {category.error === 'Invalid API Key' ? 'Please select a valid key.' : 'Please wait and retry.'}
                 </span>
             </div>
          )}
           {category.status === 'idle' && (
             <div className="text-gray-500">Waiting...</div>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold truncate text-gray-200" title={category.name}>{category.name}</h3>
            {category.status === 'success' && <CheckCircleIcon />}
            {category.status === 'loading' && <div className="w-8 h-8"></div>}
            {category.status === 'error' && <div className="w-8 h-8"></div>}
            {category.status === 'idle' && <div className="w-8 h-8"></div>}
          </div>
          <p className="text-xs text-gray-400 mt-2 p-2 bg-gray-900 rounded-md break-words max-h-20 overflow-y-auto">
              <strong>Prompt:</strong> {category.prompt}
          </p>
        </div>
      </div>
      <div className="p-4 pt-0">
          <button
            onClick={() => onEditPrompt(category)}
            disabled={category.status === 'loading' || (isProcessingQueue)}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
          >
            <PencilIcon />
            <span className="ml-2">Edit & Regenerate</span>
          </button>
      </div>
    </div>
  );
};
