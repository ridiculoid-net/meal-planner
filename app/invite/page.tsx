"use client";

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

async function fetchInvite() {
  const res = await fetch('/api/invite');
  if (!res.ok) throw new Error('Failed to fetch invite');
  return res.json();
}

export default function InvitePage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  if (!session) {
    redirect('/login');
  }
  const { data, error, isLoading } = useQuery({ queryKey: ['invite'], queryFn: fetchInvite });
  return (
    <main className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Invite to Household</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error loading invite link</p>}
      {data && (
        <div className="space-y-4">
          <p className="text-sm">Share this link with someone to invite them to your household:</p>
          <div className="p-2 border rounded-md bg-gray-100 break-words dark:bg-zinc-800 dark:text-white">
            {data.inviteLink}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(data.inviteLink);
              alert('Invite link copied!');
            }}
            className="px-3 py-2 bg-blue-600 text-white rounded-md"
          >
            Copy Link
          </button>
        </div>
      )}
    </main>
  );
}