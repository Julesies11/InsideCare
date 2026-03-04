import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from './accordion';

describe('Accordion', () => {
  it('renders all items correctly', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('opens an item when clicked', async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Toggle Item 1</AccordionTrigger>
          <AccordionContent>Visible Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const trigger = screen.getByText('Toggle Item 1');
    fireEvent.click(trigger);
    
    expect(await screen.findByText('Visible Content 1')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(
      <Accordion type="single" variant="outline">
        <AccordionItem value="item-1" data-testid="accordion-item">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    let item = screen.getByTestId('accordion-item');
    expect(item).toHaveClass('border');
    expect(item).toHaveClass('rounded-lg');

    rerender(
      <Accordion type="single" variant="solid">
        <AccordionItem value="item-1" data-testid="accordion-item">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    item = screen.getByTestId('accordion-item');
    expect(item).toHaveClass('bg-accent/70');
  });

  it('renders the correct indicator icon', () => {
    const { rerender } = render(
      <Accordion type="single" indicator="arrow">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    // Check for ChevronDown icon (default for arrow)
    expect(document.querySelector('.lucide-chevron-down')).toBeInTheDocument();

    rerender(
      <Accordion type="single" indicator="plus">
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    // Check for Plus icon
    expect(document.querySelector('.lucide-plus')).toBeInTheDocument();
  });
});
