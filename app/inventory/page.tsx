"use client";

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

async function fetchInventory() {
  const res = await fetch('/api/inventory');
  if (!res.ok) throw new Error('Failed to load inventory');
  return res.json();
}

export default function InventoryPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  const { data, error, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: fetchInventory });
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      {isLoading && <p>Loading inventory...</p>}
      {error && <p className="text-red-500">Error loading inventory</p>}
      <ul className="space-y-2">
        {Array.isArray(data) &&
          data.map((item: any) => (
            <li key={item.id} className="border p-2 rounded-md">
              <span className="font-medium">{item.name}</span> - {item.quantity} {item.unit} ({item.location})
            </li>
          ))}
      </ul>
    </main>
  );
}