'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Heart, ListMusic, Share2, Sparkles, Music4 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaylistCard } from '@/components/cards';
import { CardGridSkeleton } from '@/components/states';
import { useExplore } from '@/hooks/use-queries';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { user } = useAuth();
  const { data, isLoading } = useExplore('trending');
  const trending = data?.pages.flatMap((p) => p.data).slice(0, 10) ?? [];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-14">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1 rounded-full border bg-background/50 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3 w-3 text-primary" /> Free & self-hosted
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Your music, <span className="text-primary">perfectly organized.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Create, curate and share playlists. Discover what the community is listening to — no
            streaming, no subscriptions, just great organization.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Go to dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/register">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline">
              <Link href="/explore">
                <Compass className="h-4 w-4" /> Explore playlists
              </Link>
            </Button>
          </div>
        </div>
        <Music4 className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 text-primary/10" />
      </section>

      {/* Feature strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Feature icon={ListMusic} title="Organize" text="Build unlimited playlists and reorder tracks with drag & drop." />
        <Feature icon={Heart} title="Curate" text="Favorite songs and playlists. Like and comment on the community's best." />
        <Feature icon={Share2} title="Share" text="Make playlists public and share them with a single link." />
      </section>

      {/* Trending */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trending now</h2>
          <Link href="/explore" className="text-sm font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
        {isLoading ? (
          <CardGridSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {trending.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
