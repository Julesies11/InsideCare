import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';

describe('Collapsible', () => {
  it('renders correctly', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('toggles content visibility when clicked', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content">
          <div>Content</div>
        </CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByText('Toggle');

    // Radix might unmount or hide content
    const content = screen.getByTestId('collapsible-content');
    expect(content).toHaveAttribute('data-state', 'closed');

    fireEvent.click(trigger);
    expect(content).toHaveAttribute('data-state', 'open');
  });

  it('starts as open if defaultOpen is true', () => {
    render(
      <Collapsible defaultOpen={true}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content">
          <div>Open Content</div>
        </CollapsibleContent>
      </Collapsible>,
    );

    const content = screen.getByTestId('collapsible-content');
    expect(content).toHaveAttribute('data-state', 'open');
  });
});
