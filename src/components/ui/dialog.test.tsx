import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import userEvent from '@testing-library/user-event';

describe('Dialog', () => {
  it('renders correctly and opens content', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
          Dialog Body
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open dialog/i }));

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Dialog Body')).toBeInTheDocument();
  });
});
