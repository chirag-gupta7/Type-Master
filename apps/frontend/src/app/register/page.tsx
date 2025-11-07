'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function RegisterPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const callbackUrl = params.get('callbackUrl') ?? '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Register the user through the backend
      await authAPI.register({ email, username, password });
      setSuccessMessage('Account created successfully! Signing you in...');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
      setIsSubmitting(false);
      return;
    }

    // Sign in with NextAuth - it will automatically get the backend JWT token
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (!result || result.error) {
      setError(
        result?.error ?? 'Account created, but auto sign-in failed. Please log in manually.'
      );
      setIsSubmitting(false);
      return;
    }

    window.location.href = result.url ?? callbackUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Create your account</h1>
        <p className="text-muted-foreground text-center mb-8">
          Register to save your progress, unlock achievements, and compete on the leaderboard.
        </p>

        {error && (
          <div className="mb-6 rounded-md border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-md border border-green-500/60 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
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
            <span>or create with email</span>
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
            <label htmlFor="username" className="block text-sm font-medium text-muted-foreground">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
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
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-muted-foreground"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-[var(--theme-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
