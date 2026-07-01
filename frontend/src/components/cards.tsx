'use client';

import Link from 'next/link';
import { Heart, Music2, Play, Lock, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatCount, formatDuration, initials } from '@/lib/utils';
import type { Playlist, Song, User } from '@/lib/types';

function CoverImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || `https://picsum.photos/seed/${encodeURIComponent(alt)}/400/400`}
      alt={alt}
      loading="lazy"
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <CoverImage src={playlist.coverUrl} alt={playlist.name} className="transition-transform group-hover:scale-105" />
        <div className="absolute right-2 top-2 flex gap-1">
          {playlist.isFeatured && <Badge className="text-[10px]">Featured</Badge>}
          {!playlist.isPublic && (
            <span className="rounded-full bg-black/60 p-1">
              <Lock className="h-3 w-3 text-white" />
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-primary opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <Play className="h-5 w-5 fill-primary-foreground text-primary-foreground" />
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{playlist.name}</h3>
        <p className="truncate text-sm text-muted-foreground">
          {playlist.owner?.name ? `by ${playlist.owner.name}` : 'Playlist'}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Music2 className="h-3 w-3" /> {playlist._count?.songs ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" /> {formatCount(playlist._count?.likes ?? 0)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SongCard({
  song,
  index,
  onFavorite,
  right,
}: {
  song: Song;
  index?: number;
  onFavorite?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
      {typeof index === 'number' && (
        <span className="w-5 text-right text-sm text-muted-foreground">{index + 1}</span>
      )}
      <Link href={`/songs/${song.id}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        <CoverImage src={song.coverUrl || song.album?.coverUrl} alt={song.title} />
      </Link>
      <Link href={`/songs/${song.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium">{song.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {song.artist?.name}
          {song.album?.title ? ` • ${song.album.title}` : ''}
        </p>
      </Link>
      {song.genre?.name && (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {song.genre.name}
        </Badge>
      )}
      {onFavorite && (
        <button
          onClick={onFavorite}
          className="rounded-full p-2 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
          aria-label="Favorite"
        >
          <Heart className={cn('h-4 w-4', song.favoritedByViewer && 'fill-primary text-primary')} />
        </button>
      )}
      <span className="w-12 text-right text-sm text-muted-foreground">{formatDuration(song.duration)}</span>
      {right}
    </div>
  );
}

export function UserCard({ user }: { user: User }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <Avatar className="h-20 w-20">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="h-3 w-3" /> {user._count?.playlists ?? 0} playlists
      </div>
    </Link>
  );
}
