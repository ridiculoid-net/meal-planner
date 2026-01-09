"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import Link from 'next/link';

async function fetchRecipe(id: string) {
  const res = await fetch(`/api/recipes?id=${id}`);
  if (!res.ok) throw new Error('Failed to fetch recipe');
  return res.json();
}

async function fetchReviews(recipeId: string) {
  const res = await fetch(`/api/reviews?recipeId=${recipeId}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

async function postReview({ recipeId, rating, comment }: { recipeId: string; rating: number; comment: string }) {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeId, rating, comment }),
  });
  if (!res.ok) throw new Error('Failed to post review');
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

async function fetchBookmarks() {
  const res = await fetch('/api/bookmarks');
  if (!res.ok) throw new Error('Failed to fetch bookmarks');
  return res.json();
}

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  if (!session) {
    redirect('/login');
  }
  const { data, error, isLoading } = useQuery({ queryKey: ['recipe', id], queryFn: () => fetchRecipe(id) });
  const queryClient = useQueryClient();
  const { data: reviewsData } = useQuery({ queryKey: ['reviews', id], queryFn: () => fetchReviews(id), enabled: !!id });
  const { data: bookmarksData } = useQuery({ queryKey: ['bookmarks'], queryFn: fetchBookmarks });
  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
  const reviewMutation = useMutation({
    mutationFn: postReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
  });
  const [scale, setScale] = useState(1);
  if (isLoading) {
    return <main className="p-4"><p>Loading recipe...</p></main>;
  }
  if (error || !data) {
    return <main className="p-4"><p>Error loading recipe</p></main>;
  }
  const recipe = Array.isArray(data) ? data[0] : data; // handle case where API returns array
  const scaled = (quantity: number) => {
    return parseFloat((quantity * scale).toFixed(2));
  };
  const slots = [0.5, 1, 2, 3, 4];

  const isBookmarked = Array.isArray(bookmarksData)
    ? bookmarksData.some((b: any) => b.id === recipe.id || b.recipeId === recipe.id)
    : false;

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: recipe.title, url: window.location.href });
    } else {
      alert('Share is not supported in this browser.');
    }
  };

  const handlePrint = () => {
    window.print();
  };
  return (
    <main className="p-4 pb-24">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-2xl font-bold flex-1">{recipe.title}</h1>
        <div className="flex space-x-2">
          <button onClick={handleShare} title="Share" className="p-2 rounded-md border">🔗</button>
          <button onClick={handlePrint} title="Print" className="p-2 rounded-md border">🖨️</button>
          <button
            onClick={() => bookmarkMutation.mutate({ recipeId: recipe.id })}
            title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
            className="p-2 rounded-md border"
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        </div>
      </div>
      {recipe.image && <img src={recipe.image} alt={recipe.title} className="mb-4 w-full max-w-md rounded-md" />}
      {/* Rating summary */}
      {recipe.avgRating > 0 && (
        <p className="text-sm text-yellow-600 mb-2">★ {recipe.avgRating.toFixed(1)} ({recipe.reviewCount})</p>
      )}
      {/* Serving scale */}
      <div className="mb-4 space-x-2">
        {slots.map((s) => (
          <button
            key={s}
            className={`px-3 py-1 rounded-md border ${scale === s ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            onClick={() => setScale(s)}
          >
            {s}×
          </button>
        ))}
      </div>
      <h2 className="font-semibold mb-2">Ingredients</h2>
      <ul className="space-y-1 mb-4">
        {recipe.ingredients.map((ing: any) => (
          <li key={ing.id} className="flex items-center space-x-2">
            <input type="checkbox" />
            <span>{scaled(ing.quantity)} {ing.unit} {ing.name}</span>
          </li>
        ))}
      </ul>
      <h2 className="font-semibold mb-2">Steps</h2>
      <ol className="list-decimal list-inside space-y-2">
        {recipe.steps.sort((a: any, b: any) => a.order - b.order).map((step: any) => (
          <li key={step.id}>{step.text}</li>
        ))}
      </ol>
      {/* Nutrition panel */}
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Nutrition (per serving)</h2>
        {recipe.nutrition ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <li><strong>Calories:</strong> {Math.round(recipe.nutrition.calories / (recipe.servings || 1))}</li>
            <li><strong>Protein:</strong> {Math.round(recipe.nutrition.protein / (recipe.servings || 1))} g</li>
            <li><strong>Carbs:</strong> {Math.round(recipe.nutrition.carbs / (recipe.servings || 1))} g</li>
            <li><strong>Fat:</strong> {Math.round(recipe.nutrition.fat / (recipe.servings || 1))} g</li>
            <li><strong>Sodium:</strong> {Math.round(recipe.nutrition.sodium / (recipe.servings || 1))} mg</li>
            <li><strong>Sugar:</strong> {Math.round(recipe.nutrition.sugar / (recipe.servings || 1))} g</li>
            <li><strong>Fiber:</strong> {Math.round(recipe.nutrition.fiber / (recipe.servings || 1))} g</li>
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Nutrition data coming soon.</p>
        )}
      </div>
      {/* Add to meal plan */}
      <div className="mt-6">
        <a href={`/meal-plan?addRecipe=${recipe.id}`} className="px-4 py-2 bg-green-600 text-white rounded-md">Add to Meal Plan</a>
      </div>
      {/* Reviews section */}
      <div className="mt-8 border-t pt-4">
        <h2 className="font-semibold mb-2">Reviews</h2>
        {reviewsData && Array.isArray(reviewsData) && reviewsData.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {reviewsData.map((rev: any) => (
              <li key={rev.id} className="border rounded-md p-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-yellow-600">{'★'.repeat(Math.round(rev.rating))}</p>
                    {rev.comment && <p className="text-sm">{rev.comment}</p>}
                  </div>
                  <span className="text-xs text-zinc-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 mb-4">No reviews yet.</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reviewMutation.mutate({ recipeId: recipe.id, rating: reviewRating, comment: reviewComment });
            setReviewComment('');
          }}
          className="space-y-2"
        >
          <label className="block text-sm">Your Rating:</label>
          <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="border p-2 rounded-md">
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} ★</option>
            ))}
          </select>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            className="w-full p-2 border rounded-md"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Submit Review</button>
        </form>
      </div>
    </main>
  );
}