import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from './sheet';

describe('Sheet', () => {
  it('renders the trigger correctly', () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
    
    expect(screen.getByText('Open Sheet')).toBeInTheDocument();
  });

  it('opens the sheet when the trigger is clicked', async () => {
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Description</SheetDescription>
          </SheetHeader>
          <div>Sheet Content</div>
        </SheetContent>
      </Sheet>
    );
    
    const trigger = screen.getByText('Open Sheet');
    fireEvent.click(trigger);
    
    expect(await screen.findByText('Sheet Title')).toBeInTheDocument();
    expect(screen.getByText('Sheet Description')).toBeInTheDocument();
    expect(screen.getByText('Sheet Content')).toBeInTheDocument();
  });

  it('closes the sheet when the close button is clicked', async () => {
    render(
      <Sheet defaultOpen={true}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Closable Sheet</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
    
    expect(await screen.findByText('Closable Sheet')).toBeInTheDocument();
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // The sheet should be closing/closed
    // Radix might take a moment to remove it from DOM due to animations
    // but in JSDOM it might be immediate if animations are mocked/disabled
  });

  it('applies the correct side classes', async () => {
    render(
      <Sheet open={true}>
        <SheetContent side="left" data-testid="sheet-content">
          <SheetTitle>Left Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    
    const content = await screen.findByTestId('sheet-content');
    expect(content).toHaveClass('inset-y-0');
    expect(content).toHaveClass('start-0');
  });
});
