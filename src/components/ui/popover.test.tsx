import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

describe('Popover', () => {
  it('renders the trigger correctly', () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>
    );
    
    expect(screen.getByText('Open Popover')).toBeInTheDocument();
  });

  it('opens the popover when the trigger is clicked', async () => {
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>
    );
    
    const trigger = screen.getByText('Open Popover');
    fireEvent.click(trigger);
    
    // Popover content should be visible
    expect(await screen.findByText('Popover Content')).toBeInTheDocument();
  });

  it('applies custom classes to popover content', async () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="custom-class" data-testid="popover-content">
          Popover Content
        </PopoverContent>
      </Popover>
    );
    
    const content = await screen.findByTestId('popover-content');
    expect(content).toHaveClass('custom-class');
    expect(content).toHaveClass('bg-popover');
  });
});
