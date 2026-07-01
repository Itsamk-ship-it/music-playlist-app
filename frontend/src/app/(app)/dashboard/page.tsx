'use client';

import Link from 'next/link';
import { ListMusic, Heart, Globe, ThumbsUp, PlusCircle, Music2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaylistCard, SongCard } from '@/components/cards';
import { CardGridSkeleton, EmptyState, ListSkeleton } from '@/components/states';
import { useDashboard } from '@/hooks/use-queries';
import { useAuth } from '@/hooks/use-auth';
import { formatCount } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening in your library.</p>
        </div>
        <Button asChild>
          <Link href="/playlists/create">
            <PlusCircle className="h-4 w-4" /> New Playlist
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        <StatCard icon={ListMusic} label="Playlists" value={data?.stats.totalPlaylists} loading={isLoading} />
        <StatCard icon={Globe} label="Public" value={data?.stats.publicPlaylists} loading={isLoading} />
        <StatCard icon={Heart} label="Fav. Songs" value={data?.stats.favoriteSongs} loading={isLoading} />
        <StatCard icon={Music2} label="Fav. Playlists" value={data?.stats.favoritePlaylists} loading={isLoading} />
        <StatCard icon={ThumbsUp} label="Total Likes" value={data?.stats.totalLikes} loading={isLoading} />
      </div>

      {/* Recently created */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Recently created</h2>
        {isLoading ? (
          <CardGridSkeleton count={5} />
        ) : data?.recentlyCreated.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {data.recentlyCreated.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No playlists yet"
            description="Create your first playlist to get started."
            action={
              <Button asChild>
                <Link href="/playlists/create">Create playlist</Link>
              </Button>
            }
          />
        )}
      </section>

      {/* Recently played */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Recently played</h2>
        {isLoading ? (
          <ListSkeleton />
        ) : data?.recentlyPlayed.length ? (
          <Card>
            <CardContent className="p-2">
              {data.recentlyPlayed.map((s, i) => (
                <SongCard key={s.id} song={s} index={i} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="Nothing played yet" description="Songs you open will show up here." />
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{loading ? '—' : formatCount(value ?? 0)}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
