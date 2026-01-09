"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function ImportRecipePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (status === 'loading') return null;
  if (!session) {
    redirect('/login');
  }
  const handleImport = async (e: any) => {
    e.preventDefault();
    setError(null);
    let jsonLd;
    try {
      jsonLd = JSON.parse(json);
    } catch (err) {
      setError('Invalid JSON');
      return;
    }
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, jsonLd }),
    });
    if (res.ok) {
      const recipe = await res.json();
      router.push(`/recipes/${recipe.id}`);
    } else {
      const { error } = await res.json();
      setError(error || 'Failed to import');
    }
  };
  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Import Recipe</h1>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Due to limited network access, please paste the recipe’s JSON‑LD structured data below along with the original URL. The system will create an editable recipe draft from this information.
      </p>
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Recipe URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/recipe"
            className="border p-2 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">JSON-LD</label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder="Paste JSON-LD object here"
            rows={10}
            className="border p-2 rounded-md w-full font-mono text-xs"
            required
          ></textarea>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Import Recipe</button>
      </form>
    </main>
  );
}