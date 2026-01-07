import { Suspense } from 'react';
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">Welcome back</h1>
        <p className="text-muted-foreground text-center mb-6">
          Sign in to track your typing progress and unlock full game access.
        </p>
        <Suspense fallback={<p className="text-center">Loading login form...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
