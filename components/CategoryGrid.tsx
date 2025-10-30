
import React from 'react';
import type { ProcessedCategory } from '../types';
import { CategoryCard } from './CategoryCard';

interface CategoryGridProps {
  categories: ProcessedCategory[];
  onEditPrompt: (category: ProcessedCategory) => void;
  isProcessingQueue: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onEditPrompt, isProcessingQueue }) => {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-10">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Processing Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {categories.map((category) => (
          <CategoryCard 
            key={category.id} 
            category={category} 
            onEditPrompt={onEditPrompt}
            isProcessingQueue={isProcessingQueue}
          />
        ))}
      </div>
    </div>
  );
};
