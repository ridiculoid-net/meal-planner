"use client";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

async function fetchNutrition() {
  const res = await fetch('/api/nutrition');
  if (!res.ok) throw new Error('Failed to fetch nutrition');
  return res.json();
}

export default function NutritionPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  if (!session) {
    redirect('/login');
  }
  const { data, error, isLoading } = useQuery({ queryKey: ['nutrition'], queryFn: fetchNutrition });
  return (
    <main className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Nutrition Summary</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error loading nutrition summary</p>}
      {data && (
        <div className="space-y-4">
          <section className="border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Weekly Totals</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <li><strong>Calories:</strong> {Math.round(data.weeklyTotals.calories)}</li>
              <li><strong>Protein:</strong> {Math.round(data.weeklyTotals.protein)} g</li>
              <li><strong>Carbs:</strong> {Math.round(data.weeklyTotals.carbs)} g</li>
              <li><strong>Fat:</strong> {Math.round(data.weeklyTotals.fat)} g</li>
              <li><strong>Sodium:</strong> {Math.round(data.weeklyTotals.sodium)} mg</li>
              <li><strong>Sugar:</strong> {Math.round(data.weeklyTotals.sugar)} g</li>
              <li><strong>Fiber:</strong> {Math.round(data.weeklyTotals.fiber)} g</li>
            </ul>
          </section>
          <section className="border p-4 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Daily Breakdown</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-1">Date</th>
                  <th className="text-left p-1">Calories</th>
                  <th className="text-left p-1">Protein</th>
                  <th className="text-left p-1">Carbs</th>
                  <th className="text-left p-1">Fat</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.totalsByDate).map(([date, totals]) => (
                  <tr key={date} className="border-t">
                    <td className="p-1">{date}</td>
                    <td className="p-1">{Math.round(totals.calories)}</td>
                    <td className="p-1">{Math.round(totals.protein)}</td>
                    <td className="p-1">{Math.round(totals.carbs)}</td>
                    <td className="p-1">{Math.round(totals.fat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </main>
  );
}