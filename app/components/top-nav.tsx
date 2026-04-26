"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearGuestMode, isGuestModeEnabled } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/app", label: "Home" },
  { href: "/projects", label: "Project History" },
];

type NavUser = {
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hideOnAuthPages = pathname.startsWith("/auth/");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const syncAuth = async () => {
      const guestMode = isGuestModeEnabled();
      setIsGuest(guestMode);

      if (guestMode) {
        setUser(null);
        return;
      }

      try {
        const client = getSupabaseBrowserClient();
        const { data } = await client.auth.getSession();
        setUser(data.session?.user ?? null);
      } catch {
        setUser(null);
      }
    };

    void syncAuth();
  }, [pathname]);

  async function handleSignOut(): Promise<void> {
    try {
      const client = getSupabaseBrowserClient();
      await client.auth.signOut();
    } catch {
      // Ignore sign-out failures and still clear local guest state.
    }

    clearGuestMode();
    window.location.replace("/auth/sign-in");
  }

  const displayName =
    user?.user_metadata?.display_name ||
    (user?.email ? user.email.split("@")[0] : "User");

  if (hideOnAuthPages) {
    return null;
  }

  return (
    <nav className="fixed left-4 right-4 top-4 z-[70]">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/90 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = isMounted && isActivePath(pathname, item.href);
            const commonClassName =
              "rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/30";

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${commonClassName} ${
                  active
                    ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/70">
          {isGuest ? (
            <>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Welcome, guest</p>
              <Link
                  href="/auth/sign-in"
                  className="rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-900 transition hover:bg-blue-100 dark:border-blue-500/50 dark:text-blue-100 dark:hover:bg-blue-500/20"
              >
                Sign in
              </Link>
            </>
          ) : user ? (
            <>
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Welcome, {displayName}</p>
                {user.email ? (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{user.email}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
