"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { clearGuestMode, enableGuestMode } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignUpPage() {
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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function upsertOwnProfile(userId: string, userEmail: string, name: string): Promise<void> {
    if (!supabase) {
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    await fetch(`${supabaseUrl}/rest/v1/users?on_conflict=id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        id: userId,
        email: userEmail,
        display_name: name.trim() || null,
      }),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setStatus(null);

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
      const emailRedirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/projects`
        : undefined;

      const result = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim() || undefined,
          },
          emailRedirectTo,
        },
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      const userId = result.data.user?.id;
      const userEmail = result.data.user?.email;

      if (userId && userEmail) {
        await upsertOwnProfile(userId, userEmail, displayName);
      }

      if (!result.data.session) {
        setStatus("Account created. Check your email to verify, then sign in.");
      } else {
        setStatus("Account created and signed in. You can now save projects.");
      }

      clearGuestMode();
      window.location.assign("/");

      setPassword("");
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Unable to create account.");
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
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Create your account</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Sign up to save projects and keep your generated instructions under your own account.
          </p>
        </header>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {supabaseResult.error ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {supabaseResult.error}
            </p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Display name (optional)</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              type="text"
              autoComplete="name"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="Your name"
            />
          </label>

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
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="At least 8 characters"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          {status ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
              {status}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !supabase}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={continueAsGuest}
          className="mt-4 inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Continue as guest
        </button>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Continue as guest is available, but you will not be able to save projects or export PDFs.
        </p>

        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          Already have an account?{" "}
          <Link href="/" className="font-semibold text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
            Sign in here
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
