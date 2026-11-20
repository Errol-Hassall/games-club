import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Icon, type IconName } from "#/components/icons";
import { initials } from "#/lib/dates";
import type { PublicUser } from "#/lib/types";
import { logout } from "#/server/auth";

type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: "home", exact: true },
  { to: "/backlog", label: "Backlog", icon: "shelf" },
  { to: "/pick", label: "Pick a game", icon: "dice" },
  { to: "/played", label: "Played", icon: "book" },
  { to: "/suggest", label: "Suggest", icon: "plus" },
  { to: "/admin", label: "Admin", icon: "shield", adminOnly: true },
];

export function Avatar({
  name,
  size = "h-9 w-9",
}: {
  name: string;
  size?: string;
}) {
  let hue = 0;
  for (const char of name) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return (
    <span
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-cream`}
      style={{ background: `hsl(${hue} 35% 32%)` }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-3">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-clay text-cream shadow-sm transition-transform group-hover:-rotate-6">
        <span className="display text-lg leading-none">GC</span>
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-paper bg-gold" />
      </span>
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span className="display text-xl text-ink">Games Club</span>
          <span className="mt-1 text-[9px] font-bold tracking-[0.24em] text-muted uppercase">
            Play · Talk · Repeat
          </span>
        </span>
      )}
    </Link>
  );
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5"
      activeProps={{ className: "!bg-forest !text-cream hover:!bg-forest" }}
    >
      <Icon name={item.icon} className="h-[18px] w-[18px]" />
      {item.label}
    </Link>
  );
}

export function AppShell({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactNode;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const items = NAV.filter((item) => !item.adminOnly || user.isAdmin);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
      window.location.href = "/login";
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-cream/70 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-9 flex flex-1 flex-col gap-1" aria-label="Main">
          {items.map((item) => (
            <NavLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="mt-6 border-t border-line pt-4">
          <Link
            to="/account"
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink/5"
          >
            <Avatar name={user.name} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">
                {user.name}
              </span>
              <span className="block truncate text-[11px] text-muted">
                @{user.username}
              </span>
            </span>
          </Link>
          <div className="mt-2 flex items-center justify-between px-2">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
              {user.isAdmin ? "Club admin" : "Member"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-muted hover:text-clay disabled:opacity-50"
            >
              <Icon name="logout" className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <Link to="/account" aria-label="Your account">
            <Avatar name={user.name} size="h-9 w-9" />
          </Link>
        </header>
        <nav
          className="flex gap-1 overflow-x-auto border-b border-line bg-paper/90 px-3 py-2 lg:hidden"
          aria-label="Main"
        >
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap text-ink-soft"
              activeProps={{ className: "!bg-forest !text-cream" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
