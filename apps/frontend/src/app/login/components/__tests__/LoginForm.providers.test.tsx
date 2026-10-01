/**
 * The email/password form must be fully usable on its own.
 *
 * Google is optional (see authOptions.ts). These tests pin that the Google
 * button is rendered only when NextAuth actually exposes a `google` provider,
 * and that the credentials form is present and submittable either way.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getProviders, signIn } from 'next-auth/react';

import LoginForm from '../LoginForm';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getProviders: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));

const mockGetProviders = getProviders as jest.Mock;
const mockSignIn = signIn as jest.Mock;

const GOOGLE_BUTTON = /continue with google/i;
const EMAIL_FIELD = /email/i;
const SUBMIT = /sign in/i;

describe('LoginForm provider gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });
  });

  it('hides the Google button when no google provider is registered', async () => {
    mockGetProviders.mockResolvedValue({ credentials: {} });

    render(<LoginForm />);

    await waitFor(() => expect(mockGetProviders).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: GOOGLE_BUTTON })).not.toBeInTheDocument();
    });
  });

  it('still shows a working email/password form without Google', async () => {
    mockGetProviders.mockResolvedValue({ credentials: {} });

    render(<LoginForm />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: GOOGLE_BUTTON })).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText(EMAIL_FIELD)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SUBMIT })).toBeInTheDocument();
  });

  it('shows the Google button when the provider is registered', async () => {
    mockGetProviders.mockResolvedValue({ google: {}, credentials: {} });

    render(<LoginForm />);

    expect(await screen.findByRole('button', { name: GOOGLE_BUTTON })).toBeInTheDocument();
  });

  it('hides the Google button when the providers lookup fails', async () => {
    mockGetProviders.mockRejectedValue(new Error('network down'));

    render(<LoginForm />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: GOOGLE_BUTTON })).not.toBeInTheDocument();
    });
    // Credentials sign-in must not depend on this lookup succeeding.
    expect(screen.getByRole('button', { name: SUBMIT })).toBeInTheDocument();
  });

  it('submits credentials to NextAuth, not Google', async () => {
    mockGetProviders.mockResolvedValue({ credentials: {} });
    mockSignIn.mockResolvedValue({ ok: true, url: '/' });

    render(<LoginForm />);
    await waitFor(() => expect(mockGetProviders).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText(EMAIL_FIELD), 'person@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: SUBMIT }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({ email: 'person@example.com', password: 'Password1' })
      );
    });
  });
});
