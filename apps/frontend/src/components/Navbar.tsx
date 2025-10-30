'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { authAPI } from '@/lib/api';
import { useUiStore } from '../store/ui';

const navLinks = [
  { href: '/', label: 'Home', shortcut: '1' },
  { href: '/learn', label: 'Learn', shortcut: '2' },
  { href: '/dashboard', label: 'Test', shortcut: '3' },
  { href: '/games', label: 'Games', shortcut: '4' },
  { href: '/leaderboard', label: 'Leaderboard', shortcut: '5' },
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

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Number shortcuts
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < navLinks.length) {
          window.location.href = navLinks[index].href;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    authAPI.logout();
    await signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2"
            onClick={() => {
              if (pathname !== '/') {
                setLoading(true);
              }
            }}
          >
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-transparent">
              TypeMaster
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    if (pathname !== link.href) {
                      setLoading(true);
                    }
                  }}
                  className={cn(
                    'relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-full" />
                  )}
                </Link>
              );
            })}

            <div className="ml-4 flex items-center gap-3">
              {status === 'loading' && (
                <span className="text-sm text-muted-foreground">Checking session...</span>
              )}
              {status !== 'loading' &&
                (isAuthenticated ? (
                  <>
                    <span className="text-sm text-muted-foreground">Hi, {displayName}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                      Sign in
                    </Button>
                    <Button size="sm" onClick={() => router.push('/register')}>
                      Sign up
                    </Button>
                  </>
                ))}
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="ml-2"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t animate-in slide-in-from-top-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    if (pathname !== link.href) {
                      setLoading(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'block px-4 py-3 rounded-md text-base font-medium transition-colors touch-manipulation',
                    isActive
                      ? 'bg-[var(--theme-primary)]/10 text-foreground border-l-4 border-[var(--theme-primary)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center justify-between">
                    {link.label}
                    <span className="text-xs text-muted-foreground">Ctrl+{link.shortcut}</span>
                  </div>
                </Link>
              );
            })}

            <div className="mt-4 flex flex-col gap-2 px-4">
              {status === 'loading' && (
                <span className="text-sm text-muted-foreground">Checking session...</span>
              )}
              {status !== 'loading' &&
                (isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push('/login');
                      }}
                    >
                      Sign in
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push('/register');
                      }}
                    >
                      Create account
                    </Button>
                  </>
                ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
