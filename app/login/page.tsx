"use client";

import { signIn, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  if (session) {
    redirect('/');
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Continue with Google to access your recipe planner.</p>
        <button
          onClick={() => signIn('google')}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}