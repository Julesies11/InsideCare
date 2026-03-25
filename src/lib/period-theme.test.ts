import { describe, it, expect } from 'vitest';
import { getPeriodTheme } from './utils';
import { Sun, CloudSun, Moon } from 'lucide-react';

describe('getPeriodTheme', () => {
  it('should return correct theme for Morning', () => {
    const theme = getPeriodTheme('Morning');
    expect(theme.color).toBe('amber');
    expect(theme.icon).toBe(Sun);
    expect(theme.name).toBe('Morning');
  });

  it('should return correct theme for Day', () => {
    const theme = getPeriodTheme('day');
    expect(theme.color).toBe('sky');
    expect(theme.icon).toBe(CloudSun);
  });

  it('should return correct theme for Night', () => {
    const theme = getPeriodTheme('NIGHT');
    expect(theme.color).toBe('indigo');
    expect(theme.icon).toBe(Moon);
  });

  it('should return fallback for unknown periods', () => {
    const theme = getPeriodTheme('custom');
    expect(theme.color).toBe('gray');
    expect(theme.name).toBe('custom');
  });
});
