import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../Navbar';
import { TooltipProvider } from '../ui/tooltip';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signOut: jest.fn(),
}));

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  authAPI: { logout: jest.fn() },
}));

const renderNavbar = () =>
  render(
    <TooltipProvider>
      <Navbar />
    </TooltipProvider>
  );

describe('Navbar', () => {
  it('renders brand and desktop nav links', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'TypeMaster home' })).toBeInTheDocument();
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
  });

  it('shows sign-in actions when unauthenticated', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('opens the mobile menu on toggle', () => {
    renderNavbar();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument();
  });
});
