'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callback = encodeURIComponent(pathname);
      router.replace(redirectTo ?? `/login?callbackUrl=${callback}`);
    }
  }, [status, pathname, redirectTo, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
}
