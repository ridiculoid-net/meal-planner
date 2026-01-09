"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

async function fetchGroceryList() {
  const res = await fetch('/api/grocery');
  if (!res.ok) throw new Error('Failed to fetch grocery list');
  return res.json();
}

async function addItem(item: any) {
  const res = await fetch('/api/grocery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add item');
  return res.json();
}

export default function GroceryPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  if (!session) {
    redirect('/login');
  }
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery({ queryKey: ['grocery'], queryFn: fetchGroceryList });
  const mutation = useMutation({
    mutationFn: addItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grocery'] });
    },
  });
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Grocery List</h1>
      {isLoading && <p>Loading list...</p>}
      {error && <p className="text-red-500">Error loading list</p>}
      <ul className="space-y-2">
        {data?.items?.map((item: any) => (
          <li key={item.id} className="flex items-center justify-between border p-2 rounded-md">
            <span>
              {item.name} - {item.quantity} {item.unit} ({item.section})
            </span>
          </li>
        ))}
      </ul>
      {/* simple form to add item */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const name = formData.get('name') as string;
          const quantity = parseFloat(formData.get('quantity') as string);
          const unit = formData.get('unit') as string;
          const section = formData.get('section') as string;
          mutation.mutate({ name, quantity, unit, section });
          form.reset();
        }}
        className="mt-4 space-y-2"
      >
        <input name="name" placeholder="Item name" className="border p-2 rounded-md w-full" required />
        <input
          name="quantity"
          type="number"
          step="0.01"
          placeholder="Quantity"
          className="border p-2 rounded-md w-full"
          required
        />
        <input name="unit" placeholder="Unit" className="border p-2 rounded-md w-full" required />
        <input name="section" placeholder="Section" className="border p-2 rounded-md w-full" required />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md shadow">
          Add Item
        </button>
      </form>
    </main>
  );
}