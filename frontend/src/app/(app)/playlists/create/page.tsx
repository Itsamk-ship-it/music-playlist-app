'use client';

import { AuthGuard } from '@/components/auth-guard';
import { PlaylistForm } from '@/components/playlist/playlist-form';
import { useCreatePlaylist } from '@/hooks/use-playlist-mutations';

export default function CreatePlaylistPage() {
  const create = useCreatePlaylist();
  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create playlist</h1>
          <p className="text-muted-foreground">Give it a name and make it yours.</p>
        </div>
        <PlaylistForm
          submitLabel="Create playlist"
          pending={create.isPending}
          onSubmit={(v) => create.mutate(v)}
        />
      </div>
    </AuthGuard>
  );
}
