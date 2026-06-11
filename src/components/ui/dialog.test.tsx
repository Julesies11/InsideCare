import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

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
      </Dialog>,
    );

    expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open dialog/i }));

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Dialog Body')).toBeInTheDocument();
  });
});
