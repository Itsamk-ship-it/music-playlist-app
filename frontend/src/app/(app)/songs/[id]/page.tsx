'use client';

import { use } from 'react';
import Link from 'next/link';
import { Heart, Bookmark, Clock, Calendar, Disc3, User } from 'lucide-react';
import { useSong, useToggleLike, useToggleFavorite } from '@/hooks/use-queries';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/states';
import { cn, formatCount, formatDuration } from '@/lib/utils';

export default function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data: song, isLoading, isError, refetch } = useSong(id);
  const toggleLike = useToggleLike();
  const toggleFav = useToggleFavorite();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <Skeleton className="h-56 w-56 rounded-xl" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }
  if (isError || !song) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={song.coverUrl || song.album?.coverUrl || `https://picsum.photos/seed/${song.id}/400`}
          alt={song.title}
          className="h-56 w-56 rounded-xl object-cover shadow-xl"
        />
        <div className="flex-1 space-y-3">
          {song.genre?.name && <Badge>{song.genre.name}</Badge>}
          <h1 className="text-4xl font-bold">{song.title}</h1>
          <p className="text-lg text-muted-foreground">{song.artist?.name}</p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatDuration(song.duration)}
            </span>
            {song.releaseYear && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {song.releaseYear}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> {formatCount(song._count?.likes ?? 0)} likes
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={song.likedByViewer ? 'default' : 'outline'}
              disabled={!user}
              onClick={() => toggleLike.mutate({ target: 'SONG', id: song.id })}
            >
              <Heart className={cn('h-4 w-4', song.likedByViewer && 'fill-current')} /> Like
            </Button>
            <Button
              variant={song.favoritedByViewer ? 'default' : 'outline'}
              disabled={!user}
              onClick={() => toggleFav.mutate({ target: 'SONG', id: song.id })}
            >
              <Bookmark className={cn('h-4 w-4', song.favoritedByViewer && 'fill-current')} /> Favorite
            </Button>
          </div>
        </div>
      </div>

      {song.description && (
        <section>
          <h2 className="mb-2 text-xl font-bold">About</h2>
          <p className="text-muted-foreground">{song.description}</p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard icon={User} label="Artist" value={song.artist?.name} />
        <InfoCard icon={Disc3} label="Album" value={song.album?.title} href={song.album ? `/` : undefined} />
        <InfoCard icon={Calendar} label="Released" value={song.releaseYear?.toString()} />
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? '—'}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
