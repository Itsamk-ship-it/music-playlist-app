'use client';

import { use } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { Music2, Heart, Users, UserPlus, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useProfile, useUserPlaylists } from '@/hooks/use-queries';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaylistCard } from '@/components/cards';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/states';
import { formatCount, initials } from '@/lib/utils';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user } = useAuth();
  const { data: profile, isLoading, isError, refetch } = useProfile(username);
  const { data: playlists, isLoading: loadingPlaylists } = useUserPlaylists(username);

  const follow = useMutation({
    mutationFn: () => api.post(`/users/${username}/follow`),
    onSuccess: () => {
      refetch();
      toast.success('Updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <CardGridSkeleton count={5} />
      </div>
    );
  }
  if (isError || !profile) return <ErrorState message="This profile is private or doesn't exist." onRetry={() => refetch()} />;

  const isSelf = user?.username === profile.username;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar className="h-28 w-28">
          <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.name} />
          <AvatarFallback className="text-2xl">{initials(profile.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            {profile.favoriteGenre && <Badge variant="secondary">{profile.favoriteGenre}</Badge>}
          </div>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="max-w-xl text-sm">{profile.bio}</p>}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music2 className="h-4 w-4" /> {profile._count?.playlists ?? 0} playlists
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {formatCount(profile._count?.followers ?? 0)} followers
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> {formatCount(profile.likeCount ?? 0)} likes
            </span>
          </div>
        </div>
        {!isSelf && user && (
          <Button variant={profile.isFollowing ? 'outline' : 'default'} onClick={() => follow.mutate()}>
            {profile.isFollowing ? (
              <>
                <UserCheck className="h-4 w-4" /> Following
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Follow
              </>
            )}
          </Button>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">Playlists</h2>
        {loadingPlaylists ? (
          <CardGridSkeleton count={5} />
        ) : playlists?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No public playlists" description={`${profile.name} hasn't shared any playlists yet.`} />
        )}
      </section>
    </div>
  );
}
