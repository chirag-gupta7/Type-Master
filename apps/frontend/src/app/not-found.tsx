import { Suspense } from 'react';
import { SearchParamComponent } from './SearchParamComponent';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <p>Could not find requested resource</p>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamComponent />
      </Suspense>
    </div>
  );
}
