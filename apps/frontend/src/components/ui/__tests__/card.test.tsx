import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card', () => {
  it('renders all card sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Card body</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('Card title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Card body')).toBeInTheDocument();
    expect(screen.getByText('Card footer')).toBeInTheDocument();
  });

  it('renders title as a heading', () => {
    render(
      <Card>
        <CardTitle>Headline</CardTitle>
      </Card>
    );
    expect(screen.getByRole('heading', { name: 'Headline' })).toBeInTheDocument();
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="custom-class" data-testid="card" />);
    const card = screen.getByTestId('card');
    expect(card.className).toMatch(/custom-class/);
    expect(container.firstChild).toBe(card);
  });
});
