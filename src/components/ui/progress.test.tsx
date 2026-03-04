import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress, ProgressCircle, ProgressRadial } from './progress';

describe('Progress', () => {
  it('renders correctly with a value', () => {
    render(<Progress value={50} data-testid="progress" />);
    
    const progress = screen.getByTestId('progress');
    expect(progress).toBeInTheDocument();
    // After my fix, it should have the value
    expect(progress).toHaveAttribute('data-value', '50');
    
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toBeInTheDocument();
    // transform: translateX(-50%) for value=50
    expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
  });

  it('handles 0 value correctly', () => {
    render(<Progress value={0} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('handles 100 value correctly', () => {
    render(<Progress value={100} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });
});

describe('ProgressCircle', () => {
  it('renders correctly', () => {
    render(<ProgressCircle value={75} data-testid="progress-circle">75%</ProgressCircle>);
    
    expect(screen.getByTestId('progress-circle')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    
    const indicator = document.querySelector('[data-slot="progress-circle-indicator"]');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('stroke-dashoffset');
  });
});

describe('ProgressRadial', () => {
  it('renders correctly', () => {
    render(<ProgressRadial value={40} showLabel />);
    
    expect(screen.getByText('40%')).toBeInTheDocument();
    // Check for two paths (track and indicator)
    const paths = document.querySelectorAll('path');
    expect(paths.length).toBe(2);
  });
});
