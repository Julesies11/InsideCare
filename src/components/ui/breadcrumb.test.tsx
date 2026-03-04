import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb';

describe('Breadcrumb', () => {
  it('renders correctly with multiple items', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/houses">Houses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current House</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Houses')).toBeInTheDocument();
    expect(screen.getByText('Current House')).toBeInTheDocument();
  });

  it('marks the current page correctly', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Active Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const activePage = screen.getByText('Active Page');
    expect(activePage).toHaveAttribute('aria-current', 'page');
  });

  it('renders with ellipsis', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbEllipsis data-testid="breadcrumb-ellipsis" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    expect(screen.getByTestId('breadcrumb-ellipsis')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument(); // sr-only text
  });

  it('renders custom separator', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>Item 1</BreadcrumbItem>
          <BreadcrumbSeparator data-testid="custom-separator">
            <span>/</span>
          </BreadcrumbSeparator>
          <BreadcrumbItem>Item 2</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    expect(screen.getByTestId('custom-separator')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });
});
