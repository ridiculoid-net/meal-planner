'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthWidget() {
  const { data: session, status } = useSession();

  const isAuthed = !!session?.user;

  return (
    <div className="flex items-center gap-2">
      {status === 'loading' ? (
        <div className="h-9 w-28 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
      ) : isAuthed ? (
        <>
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-white/80 px-3 py-1.5 text-sm text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="max-w-[220px] truncate">{session.user?.name ?? session.user?.email ?? 'Signed in'}</span>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="rounded-xl border border-zinc-200/60 bg-white/80 px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => signIn('google')}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Sign in
        </button>
      )}
    </div>
  );
}
