"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function JoinHouseholdPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = useState<{ loading: boolean; message?: string; error?: string }>({ loading: true });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      // Redirect to login if not signed in
      router.push('/login');
      return;
    }
    async function join() {
      try {
        const res = await fetch('/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!res.ok) {
          setState({ loading: false, error: data.error || 'Failed to join household' });
        } else {
          const message = data.alreadyMember
            ? 'You are already a member of this household.'
            : 'Successfully joined the household!';
          setState({ loading: false, message });
          // Redirect to feed after short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        setState({ loading: false, error: 'Server error' });
      }
    }
    join();
  }, [status, session, slug, router]);

  if (state.loading) {
    return (
      <main className="p-4">
        <h1 className="text-2xl font-bold">Joining household...</h1>
      </main>
    );
  }
  if (state.error) {
    return (
      <main className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>{state.error}</p>
      </main>
    );
  }
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Join Household</h1>
      <p>{state.message}</p>
    </main>
  );
}