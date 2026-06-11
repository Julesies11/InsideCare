import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

describe('Tooltip', () => {
  it('renders correctly and shows content on hover', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip info</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.queryByText('Tooltip info')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: /hover me/i }));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Tooltip info');
    });
  });
});
