import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  if (!recipe || !recipe.recipeName) {
    return <p>Could not load recipe.</p>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-md shadow-glow-assistant">
      <h3 className="text-xl font-bold mb-2 text-purple-300">{recipe.recipeName}</h3>
      <p className="text-gray-300 mb-4 text-sm">{recipe.description}</p>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-purple-400">Ingredients</h4>
        <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
          {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-purple-400">Instructions</h4>
        <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
          {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </div>
    </div>
  );
};