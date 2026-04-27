"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { clearGuestMode, isGuestModeEnabled } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type User = {
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
};

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const guestMode = isGuestModeEnabled();
      setIsGuest(guestMode);

      if (!guestMode) {
        try {
          const client = getSupabaseBrowserClient();
          const { data } = await client.auth.getSession();
          if (data.session?.user) {
            setUser(data.session.user);
          }
        } catch {
          // Supabase not configured
        }
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, []);

  async function handleSignOut() {
    try {
      const client = getSupabaseBrowserClient();
      await client.auth.signOut();
    } catch {
      // Ignore
    }

    clearGuestMode();
    window.location.replace("/");
  }

  if (isLoading) {
    return null;
  }

  if (isGuest) {
    return (
      <div className="fixed left-auto right-6 top-4 z-[60] max-w-xs rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.14)] dark:border-amber-500/30 dark:bg-amber-500/10">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Welcome, guest</p>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
          You can generate guidance but cannot save projects or export PDFs.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100 dark:border-amber-500/50 dark:text-amber-100 dark:hover:bg-amber-500/20"
        >
          Sign in to unlock full features
        </Link>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    user.user_metadata?.display_name ||
    (user.email ? user.email.split("@")[0] : "User");

  return (
    <div className="fixed left-auto right-6 top-4 z-[60] max-w-xs rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.14)] dark:border-zinc-800 dark:bg-zinc-950/70">
      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Welcome, {displayName}
      </p>
      {user.email ? (
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{user.email}</p>
      ) : null}
      <button
        onClick={handleSignOut}
        className="mt-3 inline-block rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Sign out
      </button>
    </div>
  );
}
