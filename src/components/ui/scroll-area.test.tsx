import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea, ScrollBar } from './scroll-area';

describe('ScrollArea', () => {
  it('renders correctly with children', () => {
    render(
      <ScrollArea className="h-40" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    );
    
    expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies custom viewport classes', () => {
    render(
      <ScrollArea viewportClassName="custom-viewport" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    );
    
    const viewport = document.querySelector('.custom-viewport');
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveClass('h-full');
    expect(viewport).toHaveClass('w-full');
  });

});
