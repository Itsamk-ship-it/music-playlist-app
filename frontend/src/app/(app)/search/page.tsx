'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PlaylistCard, SongCard, UserCard } from '@/components/cards';
import { EmptyState, ListSkeleton, NoResults } from '@/components/states';
import { useSearch } from '@/hooks/use-search';

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'songs', label: 'Songs' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'artists', label: 'Artists' },
  { key: 'albums', label: 'Albums' },
  { key: 'users', label: 'Users' },
];

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get('q') ?? '';
  const [q, setQ] = useState(initial);
  const [type, setType] = useState('all');
  const { data, isFetching } = useSearch(q, type);

  const onChange = (value: string) => {
    setQ(value);
    const usp = new URLSearchParams();
    if (value) usp.set('q', value);
    router.replace(`/search?${usp.toString()}`);
  };

  const empty =
    data &&
    !data.songs?.length &&
    !data.playlists?.length &&
    !data.artists?.length &&
    !data.albums?.length &&
    !data.users?.length;

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search songs, playlists, artists, users…"
          className="pl-9 text-lg"
        />
      </div>

      <Tabs value={type} onValueChange={setType}>
        <TabsList className="flex-wrap">
          {TYPES.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {q.trim().length < 2 ? (
        <EmptyState icon={Search} title="Search Playlistr" description="Type at least 2 characters to begin." />
      ) : isFetching && !data ? (
        <ListSkeleton />
      ) : empty ? (
        <NoResults query={q} />
      ) : (
        <div className="space-y-8">
          {!!data?.songs?.length && (
            <Section title="Songs">
              <Card>
                <CardContent className="p-2">
                  {data.songs.map((s, i) => (
                    <SongCard key={s.id} song={s} index={i} />
                  ))}
                </CardContent>
              </Card>
            </Section>
          )}
          {!!data?.playlists?.length && (
            <Section title="Playlists">
              <Grid>
                {data.playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </Grid>
            </Section>
          )}
          {!!data?.users?.length && (
            <Section title="Users">
              <Grid>
                {data.users.map((u) => (
                  <UserCard key={u.id} user={u} />
                ))}
              </Grid>
            </Section>
          )}
          {!!data?.artists?.length && (
            <Section title="Artists">
              <div className="flex flex-wrap gap-2">
                {data.artists.map((a) => (
                  <span key={a.id} className="rounded-full border bg-card px-4 py-2 text-sm">
                    {a.name}
                  </span>
                ))}
              </div>
            </Section>
          )}
          {!!data?.albums?.length && (
            <Section title="Albums">
              <div className="flex flex-wrap gap-2">
                {data.albums.map((al) => (
                  <span key={al.id} className="rounded-full border bg-card px-4 py-2 text-sm">
                    {al.title} <span className="text-muted-foreground">· {al.artist?.name}</span>
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{children}</div>;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <SearchInner />
    </Suspense>
  );
}
