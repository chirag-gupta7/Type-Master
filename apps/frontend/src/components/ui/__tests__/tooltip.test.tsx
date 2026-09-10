import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../tooltip';

describe('Tooltip', () => {
  it('renders trigger and shows content when open', async () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    // Radix renders the label twice (visible content + visually-hidden a11y node).
    const tips = await screen.findAllByText('Tip text');
    expect(tips.length).toBeGreaterThan(0);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tip text');
  });

  it('keeps content hidden by default', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Hidden tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
    expect(screen.queryByText('Hidden tip')).toBeNull();
  });
});
