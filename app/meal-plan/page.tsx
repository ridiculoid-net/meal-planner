"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

async function fetchMealPlan(date?: string) {
  const url = date ? `/api/meal-plan?date=${date}` : '/api/meal-plan';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch meal plan');
  return res.json();
}

async function fetchRecipes() {
  const res = await fetch('/api/recipes');
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

async function addMealItem(item: any) {
  const res = await fetch('/api/meal-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add meal');
  return res.json();
}

function formatDateISO(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function MealPlanPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  const queryClient = useQueryClient();
  const todayISO = formatDateISO(new Date());
  const { data: plan, error: planError, isLoading: planLoading } = useQuery({ queryKey: ['mealPlan', todayISO], queryFn: () => fetchMealPlan(todayISO) });
  const { data: recipes } = useQuery({ queryKey: ['recipes'], queryFn: fetchRecipes });
  const mutation = useMutation({
    mutationFn: addMealItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlan', todayISO] });
    },
  });
  // Form state for adding a meal
  const [formData, setFormData] = useState({ date: todayISO, slot: 'breakfast', recipeId: '', servings: 1 });
  const handleAddMeal = (e: any) => {
    e.preventDefault();
    mutation.mutate({
      date: formData.date,
      slot: formData.slot,
      recipeId: formData.recipeId,
      servings: Number(formData.servings),
    });
    // reset servings but keep date and slot
    setFormData({ ...formData, recipeId: '', servings: 1 });
  };
  // Build grid of days and slots
  const weekStart = plan?.startDate ? new Date(plan.startDate) : new Date();
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  const slots = ['breakfast', 'lunch', 'dinner'];
  // Build a lookup of items by date and slot
  const items: Record<string, any> = {};
  plan?.items?.forEach((item: any) => {
    const key = `${formatDateISO(new Date(item.date))}-${item.slot}`;
    items[key] = item;
  });
  return (
    <main className="p-4 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Meal Plan</h1>
      {planLoading && <p>Loading meal plan...</p>}
      {planError && <p className="text-red-500">Error loading meal plan</p>}
      {/* Render as vertical cards instead of grid to lighten UI */}
      <div className="space-y-4">
        {days.map((day) => {
          const dateKey = formatDateISO(day);
          return (
            <div key={dateKey} className="border rounded-md p-3">
              <h3 className="font-semibold mb-2">{day.toLocaleDateString(undefined, { weekday: 'long', month: 'numeric', day: 'numeric' })}</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {slots.map((slot) => {
                  const key = `${dateKey}-${slot}`;
                  const item = items[key];
                  return (
                    <div key={key} className="border rounded-md p-2 flex flex-col">
                      <span className="font-medium capitalize mb-1">{slot}</span>
                      {item ? (
                        <span>{item.recipe.title} (x{item.servings})</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/* Add meal form */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Add Meal</h2>
        <form onSubmit={handleAddMeal} className="grid gap-2 sm:grid-cols-4">
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="border p-2 rounded-md w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Slot</label>
            <select
              value={formData.slot}
              onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
              className="border p-2 rounded-md w-full"
            >
              {slots.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Recipe</label>
            <select
              value={formData.recipeId}
              onChange={(e) => setFormData({ ...formData, recipeId: e.target.value })}
              className="border p-2 rounded-md w-full"
            >
              <option value="">Select recipe</option>
              {Array.isArray(recipes) && recipes.map((r: any) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-sm mb-1">Servings</label>
            <input
              type="number"
              step="0.1"
              value={formData.servings}
              onChange={(e) => setFormData({ ...formData, servings: parseFloat(e.target.value) || 1 })}
              className="border p-2 rounded-md w-full"
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={!formData.recipeId}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
            >
              Add Meal
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}