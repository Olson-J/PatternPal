"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/app", label: "Home" },
  { href: "/projects", label: "Project History" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-4 top-4 z-50">
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/70 bg-white/90 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const commonClassName =
            "rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-500/30";

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${commonClassName} ${
                active
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
