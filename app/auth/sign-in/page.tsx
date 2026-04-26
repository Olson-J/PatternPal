"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { clearGuestMode, enableGuestMode } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  const supabaseResult = useMemo(() => {
    try {
      return { client: getSupabaseBrowserClient(), error: null as string | null };
    } catch (clientError) {
      return {
        client: null,
        error: clientError instanceof Error ? clientError.message : "Supabase auth is not configured.",
      };
    }
  }, []);

  const supabase = supabaseResult.client;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      setError(supabaseResult.error ?? "Supabase auth is not configured.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      clearGuestMode();
      window.location.assign("/");
    } catch (signinError) {
      setError(signinError instanceof Error ? signinError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function continueAsGuest(): void {
    enableGuestMode();
    window.location.assign("/");
  }

  return (
    <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:px-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/70">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Authentication</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Sign in to PatternPal</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Log in to save projects and export PDFs tied to your account.
          </p>
        </header>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {supabaseResult.error ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {supabaseResult.error}
            </p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Your password"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !supabase}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Continue as guest is available, but you will not be able to save projects or export PDFs.
        </div>

        <button
          type="button"
          onClick={continueAsGuest}
          className="mt-4 inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Continue as guest
        </button>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          Need an account?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
            Create one here
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
