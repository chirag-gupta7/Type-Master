'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactNode, useMemo } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo }: AuthGuardProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const callbackDestination = useMemo(() => redirectTo ?? pathname ?? '/', [redirectTo, pathname]);

  const loginHref = useMemo(() => {
    const search = new URLSearchParams({ callbackUrl: callbackDestination }).toString();
    return `/login?${search}`;
  }, [callbackDestination]);

  if (status === 'loading') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
        <span className="flex items-center gap-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking your session...
        </span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6">
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <Lock className="h-5 w-5" />
            Access Restricted
          </div>
          <p className="text-sm text-muted-foreground">
            You need to be signed in to view this page. Create a free account to sync your stats and
            unlock full access to the typing dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => router.push(loginHref)}>Sign In</Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/register?callbackUrl=${encodeURIComponent(callbackDestination)}`)
            }
          >
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
