'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSongs } from '@/hooks/use-queries';
import { formatDuration } from '@/lib/utils';

/** Search the catalog and add songs to a playlist. */
export function AddSongsDialog({
  existingSongIds,
  onAdd,
}: {
  existingSongIds: Set<string>;
  onAdd: (songId: string) => void;
}) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useSongs({ q });
  const songs = data?.pages.flatMap((p) => p.data).slice(0, 30) ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" /> Add songs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add songs</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search songs or artists..."
            className="pl-9"
          />
        </div>
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>}
          {songs.map((s) => {
            const added = existingSongIds.has(s.id);
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-accent">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.coverUrl || s.album?.coverUrl || `https://picsum.photos/seed/${s.id}/80`}
                  alt={s.title}
                  className="h-10 w-10 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.artist?.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDuration(s.duration)}</span>
                <Button
                  size="sm"
                  variant={added ? 'secondary' : 'default'}
                  disabled={added}
                  onClick={() => onAdd(s.id)}
                >
                  {added ? 'Added' : 'Add'}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
