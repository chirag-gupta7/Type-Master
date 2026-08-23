/**
 * Regression test for the unmounted Toaster.
 *
 * ResultsScreen enqueues save/error notifications via use-toast, but nothing
 * rendered <Toaster />, so users never saw any feedback. This pins the
 * contract that a dispatched toast becomes visible once the Toaster is
 * mounted (the root layout mounts it).
 */

import { act, render, screen } from '@testing-library/react';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/components/ui/use-toast';

describe('Toaster', () => {
  it('renders a toast dispatched through the toast() helper', () => {
    render(<Toaster />);

    act(() => {
      toast({
        title: 'Progress Saved!',
        description: 'Your score for this lesson has been recorded.',
      });
    });

    const rendered = screen.getByText('Progress Saved!');
    expect(rendered).toBeDefined();
    expect(rendered.textContent).toBe('Progress Saved!');
  });
});
