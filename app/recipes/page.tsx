"use client";

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

async function fetchRecipes(params: { q?: string; diet?: string; cuisine?: string }) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.diet) query.set('diet', params.diet);
  if (params.cuisine) query.set('cuisine', params.cuisine);
  const res = await fetch(`/api/recipes?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

export default function RecipesPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  const isAuthed = !!session;
  const [search, setSearch] = useState('');
  const [diet, setDiet] = useState('');
  const [cuisine, setCuisine] = useState('');
  const { data, error, isLoading } = useQuery({
    queryKey: ['recipes', { search, diet, cuisine }],
    queryFn: () => fetchRecipes({ q: search || undefined, diet: diet || undefined, cuisine: cuisine || undefined }),
  });
  return (
    <main className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Recipes</h1>
      <div className="mb-4 flex flex-col space-y-2">
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
        </div>
      </div>
      <div className="mb-4">
        {isAuthed ? (
          <Link href="/recipes/new" className="px-3 py-2 bg-green-600 text-white rounded-md">Create Custom Recipe</Link>
        ) : (
          <button
            onClick={() => signIn('google')}
            className="px-3 py-2 bg-zinc-800 text-white rounded-md"
          >
            Sign in to create
          </button>
        )}
      </div>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error loading recipes</p>}
      <ul className="space-y-4">
        {Array.isArray(data) && data.map((recipe: any) => (
          <li key={recipe.id} className="border rounded-md p-4">
            <h2 className="font-semibold text-xl">
              <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Servings: {recipe.servings}</p>
            <p className="text-sm italic">Source: {recipe.sourceType}</p>
            {recipe.avgRating > 0 && (
              <p className="text-sm text-yellow-600">★ {recipe.avgRating.toFixed(1)} ({recipe.reviewCount})</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}