'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X, LogOut, Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { authAPI } from '@/lib/api';
import { useUiStore } from '../store/ui';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

const navLinks = [
  { href: '/', label: 'Home', shortcut: '1' },
  { href: '/learn', label: 'Learn', shortcut: '2' },
  { href: '/dashboard', label: 'Test', shortcut: '3' },
  { href: '/games', label: 'Games', shortcut: '4' },
  { href: '/leaderboard', label: 'Board', shortcut: '5' },
  { href: '/achievements', label: 'Achievements', shortcut: '6' },
  { href: '/progress', label: 'Progress', shortcut: '7' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const setLoading = useUiStore((state) => state.setLoading);

  const isAuthenticated = status === 'authenticated';
  const displayName = useMemo(
    () => session?.user?.username ?? session?.user?.name ?? session?.user?.email ?? 'Typer',
    [session]
  );

  useEffect(() => setMounted(true), []);
  useEffect(() => setLoading(false), [pathname, setLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '7') {
        const link = navLinks.find((l) => l.shortcut === e.key);
        if (link) {
          e.preventDefault();
          router.push(link.href);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleSignOut = async () => {
    try {
      authAPI.logout();
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-[64px] items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            onClick={() => pathname !== '/' && setLoading(true)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 -ml-2 focus-ring"
            aria-label="TypeMaster home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--theme-primary)_40%,transparent)]">
              <Keyboard className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              Type<span className="text-gradient">Master</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--theme-primary)]/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[var(--theme-primary)]">
              <Sparkles className="h-3 w-3" /> PRO
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                  return (
                    <NavigationMenuItem key={link.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={link.href} legacyBehavior passHref>
                            <NavigationMenuLink
                              className={cn(
                                navigationMenuTriggerStyle(),
                                'h-8 rounded-full px-3.5 text-[13px] font-medium transition-all',
                                isActive
                                  ? 'bg-foreground text-background shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                              )}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              {link.label}
                            </NavigationMenuLink>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{link.label} (Ctrl+{link.shortcut})</p>
                        </TooltipContent>
                      </Tooltip>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <div className="hidden md:flex items-center gap-2 mr-1">
              {status === 'loading' ? (
                <span className="text-xs text-muted-foreground px-2">Checking session…</span>
              ) : isAuthenticated ? (
                <>
                  <span className="hidden xl:inline text-sm text-muted-foreground">Hi, <span className="text-foreground font-medium">{displayName}</span></span>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-full gap-1.5 h-8">
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/login')} className="rounded-full h-8">
                    Sign in
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => router.push('/register')} className="rounded-full h-8 shadow-md">
                    Sign up
                  </Button>
                </>
              )}
            </div>

            {mounted && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    className="rounded-full"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Toggle theme</p></TooltipContent>
              </Tooltip>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <nav className="grid gap-1" aria-label="Mobile">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      if (pathname !== link.href) setLoading(true);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                    <span className="text-xs opacity-60">⌃{link.shortcut}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 grid gap-2 px-1">
              {status !== 'loading' && (
                isAuthenticated ? (
                  <Button variant="outline" onClick={() => { setMobileMenuOpen(false); handleSignOut(); }} className="w-full rounded-xl">
                    Sign out
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => { setMobileMenuOpen(false); router.push('/login'); }} className="rounded-xl">Sign in</Button>
                    <Button variant="primary" onClick={() => { setMobileMenuOpen(false); router.push('/register'); }} className="rounded-xl">Create account</Button>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
