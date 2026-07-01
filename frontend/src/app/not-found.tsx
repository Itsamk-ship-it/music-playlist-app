import Link from 'next/link';
import { Music4, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Music4 className="h-10 w-10 text-primary" />
      </div>
      <div>
        <p className="text-6xl font-bold">404</p>
        <h1 className="mt-2 text-2xl font-semibold">This track skipped</h1>
        <p className="mt-1 max-w-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" /> Go home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">Explore playlists</Link>
        </Button>
      </div>
    </div>
  );
}
