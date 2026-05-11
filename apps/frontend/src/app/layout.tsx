import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AchievementProvider } from '@/context/AchievementContext';
import { Navbar } from '@/components/Navbar';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ThemeApplicator } from '@/components/ThemeApplicator';
import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TypeMaster - Improve Your Typing Speed',
  description:
    'Modern typing speed improvement application with real-time WPM tracking, analytics, and progress monitoring.',
  keywords: ['typing', 'typing speed', 'WPM', 'typing test', 'typing practice'],
  authors: [{ name: 'TypeMaster Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:ring-2 focus:ring-primary"
        >
          Skip to content
        </a>
        <Providers>
          <AchievementProvider>
            <ThemeApplicator />
            {/* 2. Wrap components that use router hooks in Suspense */}
            <Suspense fallback={<div className="h-1 bg-primary/20" />}>
              <PageLoadingIndicator />
              <Navbar />
            </Suspense>
            <ThemeSelector />
            <main id="main-content">{children}</main>
          </AchievementProvider>
        </Providers>
      </body>
    </html>
  );
}
