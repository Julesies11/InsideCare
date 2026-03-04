import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';

describe('Card', () => {
  it('renders correctly with all sub-components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>
          Test Content
        </CardContent>
        <CardFooter>
          Test Footer
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  it('applies custom classes', () => {
    render(<Card className="custom-card">Content</Card>);
    expect(screen.getByText('Content').closest('[data-slot="card"]')).toHaveClass('custom-card');
  });
});
