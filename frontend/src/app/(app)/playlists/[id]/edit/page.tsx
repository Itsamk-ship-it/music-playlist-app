'use client';

import { use } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { PlaylistForm } from '@/components/playlist/playlist-form';
import { usePlaylist } from '@/hooks/use-queries';
import { useUpdatePlaylist } from '@/hooks/use-playlist-mutations';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <EditForm id={id} />
    </AuthGuard>
  );
}

function EditForm({ id }: { id: string }) {
  const { data: playlist, isLoading } = usePlaylist(id);
  const update = useUpdatePlaylist(id);

  if (isLoading || !playlist) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit playlist</h1>
        <p className="text-muted-foreground">Update the details of “{playlist.name}”.</p>
      </div>
      <PlaylistForm
        submitLabel="Save changes"
        pending={update.isPending}
        defaultValues={{
          name: playlist.name,
          description: playlist.description ?? '',
          coverUrl: playlist.coverUrl ?? '',
          isPublic: playlist.isPublic,
        }}
        onSubmit={(v) => update.mutate(v)}
      />
    </div>
  );
}
