'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Heart, Pencil, Trash2, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { commentSchema, type CommentInput } from '@/lib/schemas';
import { useComments, useToggleLike } from '@/hooks/use-queries';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ListSkeleton } from '@/components/states';
import { cn, formatCount, formatDate, initials } from '@/lib/utils';

export function Comments({ playlistId }: { playlistId: string }) {
  const { user } = useAuth();
  const { data, isLoading } = useComments(playlistId);
  const qc = useQueryClient();
  const toggleLike = useToggleLike();
  const [editingId, setEditingId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['comments', playlistId] });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentInput>({ resolver: zodResolver(commentSchema) });

  const addComment = useMutation({
    mutationFn: (body: string) => api.post('/comments', { playlistId, body }),
    onSuccess: () => {
      reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editComment = useMutation({
    mutationFn: (v: { id: string; body: string }) => api.patch(`/comments/${v.id}`, { body: v.body }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => api.delete(`/comments/${id}`),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Comments ({data?.meta.total ?? 0})</h2>

      {user ? (
        <form
          onSubmit={handleSubmit((v) => addComment.mutate(v.body))}
          className="flex items-start gap-3"
        >
          <Avatar>
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea placeholder="Add a comment…" {...register('body')} />
            {errors.body && <p className="mt-1 text-sm text-destructive">{errors.body.message}</p>}
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={addComment.isPending}>
                <Send className="h-4 w-4" /> Post
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to join the conversation.</p>
      )}

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <div className="space-y-4">
          {data?.data.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar>
                <AvatarImage src={c.author.avatarUrl ?? undefined} />
                <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{c.author.name}</span>
                  <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>

                {editingId === c.id ? (
                  <EditForm
                    initial={c.body}
                    onCancel={() => setEditingId(null)}
                    onSave={(body) => editComment.mutate({ id: c.id, body })}
                  />
                ) : (
                  <p className="mt-1 text-sm">{c.body}</p>
                )}

                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-foreground disabled:opacity-50"
                    disabled={!user}
                    onClick={() => toggleLike.mutate({ target: 'COMMENT', id: c.id })}
                  >
                    <Heart className={cn('h-3.5 w-3.5', c.likedByViewer && 'fill-primary text-primary')} />
                    {formatCount(c._count?.likes ?? 0)}
                  </button>
                  {user?.id === c.author.id && (
                    <>
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setEditingId(c.id)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <ConfirmDialog
                        title="Delete comment?"
                        description="This can't be undone."
                        confirmLabel="Delete"
                        destructive
                        onConfirm={() => deleteComment.mutate(c.id)}
                        trigger={
                          <button className="flex items-center gap-1 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
          )}
        </div>
      )}
    </section>
  );
}

function EditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (body: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);
  return (
    <div className="mt-1">
      <Textarea value={val} onChange={(e) => setVal(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => onSave(val)}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
