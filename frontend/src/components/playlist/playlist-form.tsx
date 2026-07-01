'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { playlistSchema, type PlaylistInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export function PlaylistForm({
  defaultValues,
  submitLabel,
  pending,
  onSubmit,
}: {
  defaultValues?: Partial<PlaylistInput>;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: PlaylistInput) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlaylistInput>({
    resolver: zodResolver(playlistSchema),
    defaultValues: { isPublic: false, ...defaultValues },
  });

  const isPublic = watch('isPublic');
  const coverUrl = watch('coverUrl');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-[200px_1fr]">
      <div className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl || 'https://picsum.photos/seed/new-playlist/400'}
          alt="Cover preview"
          className="aspect-square w-full rounded-xl object-cover"
        />
        <p className="text-xs text-muted-foreground">Paste an image URL below to set the cover.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="My awesome playlist" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="What's this playlist about?" {...register('description')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverUrl">Cover image URL</Label>
          <Input id="coverUrl" placeholder="https://…" {...register('coverUrl')} />
          {errors.coverUrl && <p className="text-sm text-destructive">{errors.coverUrl.message}</p>}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Public playlist</p>
            <p className="text-sm text-muted-foreground">Anyone can view and comment on it.</p>
          </div>
          <Switch checked={isPublic} onCheckedChange={(v) => setValue('isPublic', v)} />
        </div>

        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
