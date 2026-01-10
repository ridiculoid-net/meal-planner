"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

async function fetchFeed(params: { q?: string; diet?: string; cuisine?: string; hideSkipped?: boolean }) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.diet) query.set('diet', params.diet);
  if (params.cuisine) query.set('cuisine', params.cuisine);
  if (params.hideSkipped) query.set('hideSkipped', 'true');
  const res = await fetch(`/api/feed?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch feed');
  return res.json();
}

async function reactRecipe({ recipeId, type }: { recipeId: string; type: 'heart' | 'skip' }) {
  const res = await fetch('/api/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeId, type }),
  });
  if (!res.ok) throw new Error('Failed to react to recipe');
  return res.json();
}

async function toggleBookmark({ recipeId }: { recipeId: string }) {
  const res = await fetch('/api/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeId }),
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  const isAuthed = !!session?.user;
  const queryClient = useQueryClient();
  // State for search and filters
  const [search, setSearch] = useState('');
  const [diet, setDiet] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [hideSkipped, setHideSkipped] = useState(false);
  const { data, error, isLoading } = useQuery({
    queryKey: ['feed', { search, diet, cuisine, hideSkipped }],
    queryFn: () => fetchFeed({ q: search || undefined, diet: diet || undefined, cuisine: cuisine || undefined, hideSkipped }),
  });
  const reactionMutation = useMutation({
    mutationFn: reactRecipe,
    onMutate: async () => {
      if (!isAuthed) {
        await signIn('google');
        throw new Error('Sign in required');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
  const mutationBookmark = useMutation({
    mutationFn: toggleBookmark,
    onMutate: async () => {
      if (!isAuthed) {
        await signIn('google');
        throw new Error('Sign in required');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
  return (
    <main className="p-4 pb-24">
      {!isAuthed && (
        <div className="mb-4 rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200">
          You are browsing in <span className="font-semibold">guest mode</span>. You can explore the app, but saving (likes, bookmarks, meal plans) requires sign-in.
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Recipe Feed</h1>
      {/* Search and filter controls */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full p-2 border rounded-md"
        />
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <select value={diet} onChange={(e) => setDiet(e.target.value)} className="border p-2 rounded-md flex-1 min-w-[110px]">
            <option value="">All Diets</option>
            <option value="vegan">Vegan</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="pescatarian">Pescatarian</option>
            <option value="keto">Keto</option>
            <option value="gluten-free">Gluten-Free</option>
            <option value="low-sodium">Low Sodium</option>
          </select>
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="border p-2 rounded-md flex-1 min-w-[110px]">
            <option value="">All Cuisines</option>
            <option value="mexican">Mexican</option>
            <option value="indian">Indian</option>
            <option value="thai">Thai</option>
            <option value="italian">Italian</option>
            <option value="american">American</option>
          </select>
          <label className="flex items-center space-x-1">
            <input type="checkbox" checked={hideSkipped} onChange={(e) => setHideSkipped(e.target.checked)} />
            <span>Hide Skipped</span>
          </label>
        </div>
      </div>
      {isLoading && <p>Loading feed...</p>}
      {error && <p className="text-red-500">Error loading feed</p>}
      <ul className="space-y-4">
        {Array.isArray(data) && data.map((recipe: any) => (
          <li key={recipe.id} className="border rounded-md p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold"><Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link></h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Servings: {recipe.servings}</p>
                <p className="text-xs italic">Source: {recipe.sourceType}</p>
                {recipe.avgRating > 0 && (
                  <p className="text-sm text-yellow-600">★ {recipe.avgRating.toFixed(1)} ({recipe.reviewCount})</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => reactionMutation.mutate({ recipeId: recipe.id, type: 'heart' })}
                  className="px-2 py-1 bg-pink-600 text-white rounded-md text-sm"
                >
                  ❤️
                </button>
                <button
                  onClick={() => reactionMutation.mutate({ recipeId: recipe.id, type: 'skip' })}
                  className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-md text-sm"
                >
                  ⛔
                </button>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <Link href={`/meal-plan?addRecipe=${recipe.id}`} className="text-blue-600 underline text-sm">Add to Meal Plan</Link>
              <button
                onClick={() => mutationBookmark.mutate({ recipeId: recipe.id })}
                className="text-sm text-yellow-600 flex items-center space-x-1"
              >
                <span>☆</span>
                <span>Save</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}