import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders children and handles clicks', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant and size classes', () => {
    render(<Button variant="destructive" size="sm">Delete</Button>);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn.className).toMatch(/bg-destructive/);
    expect(btn.className).toMatch(/h-8/);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Nope</Button>);
    const btn = screen.getByRole('button', { name: 'Nope' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
