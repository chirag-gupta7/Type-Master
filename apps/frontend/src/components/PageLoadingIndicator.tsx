'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUiStore } from '../store/ui';

export function PageLoadingIndicator() {
  const isLoading = useUiStore((state) => state.isLoading);
  const setLoading = useUiStore((state) => state.setLoading);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString();

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParamsString, setLoading]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
