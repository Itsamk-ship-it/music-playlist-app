'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/use-search';

/** Debounced global search with a live results dropdown. */
export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, isFetching } = useSearch(q);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  };

  const hasResults =
    data && (data.songs?.length || data.playlists?.length || data.artists?.length || data.users?.length);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <form onSubmit={submit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search songs, artists, playlists..."
            className="pl-9"
          />
        </div>
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute z-50 mt-2 max-h-[70vh] w-full overflow-y-auto rounded-lg border bg-card p-2 shadow-xl">
          {!hasResults && !isFetching && (
            <p className="p-4 text-center text-sm text-muted-foreground">No results</p>
          )}

          {data?.songs && data.songs.length > 0 && (
            <Section title="Songs">
              {data.songs.map((s) => (
                <ResultRow key={s.id} href={`/songs/${s.id}`} title={s.title} subtitle={s.artist?.name} onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
          {data?.playlists && data.playlists.length > 0 && (
            <Section title="Playlists">
              {data.playlists.map((p) => (
                <ResultRow key={p.id} href={`/playlists/${p.id}`} title={p.name} subtitle={p.owner?.name} onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
          {data?.artists && data.artists.length > 0 && (
            <Section title="Artists">
              {data.artists.map((a) => (
                <ResultRow key={a.id} href={`/search?q=${encodeURIComponent(a.name)}`} title={a.name} subtitle="Artist" onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
          {data?.users && data.users.length > 0 && (
            <Section title="Users">
              {data.users.map((u) => (
                <ResultRow key={u.id} href={`/profile/${u.username}`} title={u.name} subtitle={`@${u.username}`} onClick={() => setOpen(false)} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function ResultRow({
  href,
  title,
  subtitle,
  onClick,
}: {
  href: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent"
    >
      <span className="truncate font-medium">{title}</span>
      {subtitle && <span className="ml-2 shrink-0 text-xs text-muted-foreground">{subtitle}</span>}
    </Link>
  );
}
