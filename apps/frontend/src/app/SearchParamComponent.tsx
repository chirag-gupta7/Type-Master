'use client';

import { useSearchParams } from 'next/navigation';

export function SearchParamComponent() {
  const searchParams = useSearchParams();
  const errorId = searchParams.get('errorId');

  return <div>{errorId && <p>Error ID: {errorId}</p>}</div>;
}
