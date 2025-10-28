'use client';

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = params.get('callbackUrl') ?? '/';

  const handleGoogleSignIn = () => {
    void signIn('google', { callbackUrl });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await authAPI.login({ email, password });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
      setIsSubmitting(false);
      return;
    }

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (!result) {
      authAPI.logout();
      setError('Unexpected error. Please try again.');
      setIsSubmitting(false);
      return;
    }

    if (result.error) {
      authAPI.logout();
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    window.location.href = result.url ?? callbackUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome back</h1>
        <p className="text-muted-foreground text-center mb-8">
          Sign in to track your typing progress and unlock full game access.
        </p>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-white"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
              <span className="text-sm font-bold text-[#4285F4]">G</span>
            </span>
            Continue with Google
          </button>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="flex-1 border-t border-border" aria-hidden="true" />
            <span>or use your email</span>
            <span className="flex-1 border-t border-border" aria-hidden="true" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 font-semibold transition-colors hover:bg-muted"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[var(--theme-primary)] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
