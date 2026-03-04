import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from './avatar';

describe('Avatar', () => {
  it('renders correctly with an image', async () => {
    // Mock image loading
    const originalImage = window.Image;
    // @ts-ignore
    window.Image = class {
      onload: () => void = () => {};
      src: string = '';
      addEventListener = vi.fn((event, cb) => {
        if (event === 'load') {
          setTimeout(() => cb(), 50);
        }
      });
      removeEventListener = vi.fn();
    };

    render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User Name" data-testid="avatar-image" />
      </Avatar>
    );
    
    // Wait for the image to render
    await waitFor(() => {
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(image).toHaveAttribute('alt', 'User Name');
    }, { timeout: 1000 });

    // Restore original Image
    window.Image = originalImage;
  });

  it('renders fallback when no image is provided', () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="avatar-fallback">UN</AvatarFallback>
      </Avatar>
    );
    
    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    expect(screen.getByText('UN')).toBeInTheDocument();
  });

  it('renders with status indicator', () => {
    render(
      <Avatar>
        <AvatarFallback>U</AvatarFallback>
        <AvatarStatus variant="online" data-testid="avatar-status" />
      </Avatar>
    );
    
    const status = screen.getByTestId('avatar-status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveClass('bg-green-600');
  });

  it('applies correct status classes for different variants', () => {
    const { rerender } = render(
      <Avatar>
        <AvatarStatus variant="busy" data-testid="avatar-status" />
      </Avatar>
    );
    
    let status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-yellow-600');

    rerender(
      <Avatar>
        <AvatarStatus variant="away" data-testid="avatar-status" />
      </Avatar>
    );
    status = screen.getByTestId('avatar-status');
    expect(status).toHaveClass('bg-blue-600');
  });
});
