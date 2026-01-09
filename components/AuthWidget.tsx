"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthWidget() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-zinc-300" />
      )}
      <button
        onClick={() => signOut()}
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        Sign out
      </button>
    </div>
  );
}
