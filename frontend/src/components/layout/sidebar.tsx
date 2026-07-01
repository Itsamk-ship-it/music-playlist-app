'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Heart, PlusCircle, Music4, Settings, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
  { href: '/explore', label: 'Explore', icon: Compass, auth: false },
  { href: '/favorites', label: 'Favorites', icon: Heart, auth: true },
  { href: '/settings', label: 'Settings', icon: Settings, auth: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card/40 p-4 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Music4 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold">Playlistr</span>
      </Link>

      <nav className="flex flex-col gap-1">
        <NavLink href="/" label="Home" icon={Home} active={pathname === '/'} />
        {nav.map((item) => {
          if (item.auth && !user) return null;
          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          );
        })}
      </nav>

      {user && (
        <div className="mt-6">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Library
          </p>
          <Link
            href="/playlists/create"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PlusCircle className="h-5 w-5" />
            Create Playlist
          </Link>
        </div>
      )}

      <div className="mt-auto rounded-lg border bg-gradient-to-br from-primary/10 to-transparent p-4">
        <p className="text-sm font-semibold">Free & self-hosted</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Metadata-only playlists. No streaming, no paid APIs.
        </p>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
