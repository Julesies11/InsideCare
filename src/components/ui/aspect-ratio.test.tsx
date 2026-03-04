import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AspectRatio } from './aspect-ratio';

describe('AspectRatio', () => {
  it('renders correctly with ratio', () => {
    render(
      <div style={{ width: '100px' }}>
        <AspectRatio ratio={16 / 9} data-testid="aspect-ratio">
          <div>Content</div>
        </AspectRatio>
      </div>
    );
    
    expect(screen.getByTestId('aspect-ratio')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
