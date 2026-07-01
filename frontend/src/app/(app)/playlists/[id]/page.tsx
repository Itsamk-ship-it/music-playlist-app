'use client';

import { use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Heart,
  Bookmark,
  Share2,
  Copy,
  Pencil,
  Trash2,
  Lock,
  Globe,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { usePlaylist, useToggleLike, useToggleFavorite } from '@/hooks/use-queries';
import {
  useDeletePlaylist,
  useDuplicatePlaylist,
  usePlaylistSongs,
} from '@/hooks/use-playlist-mutations';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/states';
import { SortableSongList } from '@/components/playlist/sortable-song-list';
import { AddSongsDialog } from '@/components/playlist/add-songs-dialog';
import { Comments } from '@/components/playlist/comments';
import { cn, formatCount } from '@/lib/utils';

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data: playlist, isLoading, isError, refetch } = usePlaylist(id);
  const toggleLike = useToggleLike();
  const toggleFav = useToggleFavorite();
  const del = useDeletePlaylist();
  const duplicate = useDuplicatePlaylist();
  const { addSong, removeSong, reorder } = usePlaylistSongs(id);

  if (isLoading) return <PlaylistSkeleton />;
  if (isError || !playlist) return <ErrorState onRetry={() => refetch()} />;

  const isOwner = user?.id === playlist.ownerId;
  const songs = playlist.songs ?? [];
  const existingSongIds = new Set(songs.map((s) => s.song.id));

  const share = () => {
    const url = `${window.location.origin}/playlists/${playlist.id}`;
    navigator.clipboard?.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playlist.coverUrl || `https://picsum.photos/seed/${playlist.id}/400`}
          alt={playlist.name}
          className="h-48 w-48 rounded-xl object-cover shadow-xl"
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={playlist.isPublic ? 'default' : 'secondary'}>
              {playlist.isPublic ? <Globe className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
              {playlist.isPublic ? 'Public' : 'Private'}
            </Badge>
            {playlist.isFeatured && <Badge>Featured</Badge>}
          </div>
          <h1 className="text-4xl font-bold">{playlist.name}</h1>
          {playlist.description && <p className="text-muted-foreground">{playlist.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {playlist.owner && (
              <Link href={`/profile/${playlist.owner.username}`} className="font-medium hover:text-foreground">
                by {playlist.owner.name}
              </Link>
            )}
            <span>{playlist._count?.songs ?? songs.length} songs</span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> {formatCount(playlist._count?.likes ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {formatCount(playlist.views)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              variant={playlist.likedByViewer ? 'default' : 'outline'}
              disabled={!user}
              onClick={() => toggleLike.mutate({ target: 'PLAYLIST', id: playlist.id })}
            >
              <Heart className={cn('h-4 w-4', playlist.likedByViewer && 'fill-current')} />
              Like
            </Button>
            <Button
              variant={playlist.favoritedByViewer ? 'default' : 'outline'}
              disabled={!user}
              onClick={() => toggleFav.mutate({ target: 'PLAYLIST', id: playlist.id })}
            >
              <Bookmark className={cn('h-4 w-4', playlist.favoritedByViewer && 'fill-current')} />
              Save
            </Button>
            <Button variant="outline" onClick={share}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
            {user && (
              <Button variant="outline" onClick={() => duplicate.mutate(playlist.id)}>
                <Copy className="h-4 w-4" /> Duplicate
              </Button>
            )}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/playlists/${playlist.id}/edit`}>
                      <Pencil /> Edit details
                    </Link>
                  </DropdownMenuItem>
                  <ConfirmDialog
                    title="Delete playlist?"
                    description="This permanently deletes the playlist and its song list."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => del.mutate(playlist.id)}
                    trigger={
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Songs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Songs</h2>
          {isOwner && (
            <AddSongsDialog existingSongIds={existingSongIds} onAdd={(songId) => addSong.mutate(songId)} />
          )}
        </div>
        {songs.length === 0 ? (
          <EmptyState
            title="No songs yet"
            description={isOwner ? 'Add some songs to get started.' : 'This playlist is empty.'}
          />
        ) : (
          <div className="rounded-xl border bg-card p-2">
            <SortableSongList
              items={songs}
              editable={isOwner}
              onReorder={(songIds) => reorder.mutate(songIds)}
              onRemove={(songId) => removeSong.mutate(songId)}
            />
          </div>
        )}
      </section>

      {/* Comments (public playlists) */}
      {playlist.isPublic && <Comments playlistId={playlist.id} />}
    </div>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <Skeleton className="h-48 w-48 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
