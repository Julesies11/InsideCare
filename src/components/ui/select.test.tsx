import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

describe('Select', () => {
  it('renders correctly and opens options', async () => {
    const user = userEvent.setup();
    render(
      <Select defaultValue="option-1">
        <SelectTrigger aria-label="Select option">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Option 1');

    await user.click(trigger);

    expect(
      screen.getByRole('option', { name: 'Option 1' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Option 2' }),
    ).toBeInTheDocument();
  });

  it('calls onValueChange when an option is selected', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Select onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Select option">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option-1">Option 1</SelectItem>
          <SelectItem value="option-2">Option 2</SelectItem>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Option 2' }));

    expect(handleValueChange).toHaveBeenCalledWith('option-2');
  });
});
