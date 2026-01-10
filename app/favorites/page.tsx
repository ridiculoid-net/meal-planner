"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function fetchBookmarks() {
  const res = await fetch('/api/bookmarks');
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
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

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ['bookmarks'], queryFn: fetchBookmarks });
  const mutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
  return (
    <main className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Favorites</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error loading bookmarks</p>}
      <ul className="space-y-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((recipe: any) => (
            <li key={recipe.id} className="border rounded-md p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                  </h2>
                  {recipe.avgRating > 0 && (
                    <p className="text-sm text-yellow-600">★ {recipe.avgRating.toFixed(1)} ({recipe.reviewCount})</p>
                  )}
                </div>
                <button
                  onClick={() => mutation.mutate({ recipeId: recipe.id })}
                  className="px-2 py-1 bg-blue-600 text-white rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </li>
          ))
        ) : (
          <p>No favorites yet. Browse the feed and bookmark recipes.</p>
        )}
      </ul>
    </main>
  );
}