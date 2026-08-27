import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AchievementProvider } from '@/context/AchievementContext';
import { Navbar } from '@/components/Navbar';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ThemeApplicator } from '@/components/ThemeApplicator';
import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';
import { Toaster } from '@/components/ui/toaster';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'TypeMaster — Master the Art of Typing',
    template: '%s · TypeMaster',
  },
  description:
    'Modern typing mastery platform with real-time WPM tracking, guided lessons, AI coaching, games, and progress analytics. Built for speed, designed for delight.',
  keywords: ['typing', 'typing speed', 'WPM', 'typing test', 'touch typing', 'keyboard', 'practice'],
  authors: [{ name: 'TypeMaster Team' }],
  openGraph: {
    title: 'TypeMaster — Master the Art of Typing',
    description: 'Real-time WPM, guided lessons, AI coaching, games & progress analytics.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}>
      <body className={`${GeistSans.className} min-h-screen antialiased`}>
        {/* Ambient layers */}
        <div aria-hidden className="app-gradient" />
        <div aria-hidden className="app-grid" />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-primary focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to content
        </a>

        <Providers>
          <AchievementProvider>
            <ThemeApplicator />
            <Suspense fallback={<div className="h-1 bg-primary/10" />}>
              <PageLoadingIndicator />
              <Navbar />
            </Suspense>
            <ThemeSelector />
            <main id="main-content" className="relative">
              {children}
            </main>
            <footer className="relative mt-16 border-t border-border/40 bg-card/20 backdrop-blur">
              <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} TypeMaster — Crafted for typists who care about the details.</p>
                <div className="flex items-center gap-4">
                  <a href="https://github.com" className="hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1">GitHub</a>
                  <a href="/learn" className="hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1">Learn</a>
                  <a href="/games" className="hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1">Games</a>
                </div>
              </div>
            </footer>
            <Toaster />
          </AchievementProvider>
        </Providers>
      </body>
    </html>
  );
}
