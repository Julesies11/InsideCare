import { describe, it, expect } from 'vitest';
import { getPeriodTheme, SHIFT_ICONS } from './utils';

describe('getPeriodTheme', () => {
  it('should return correct theme based on color string', () => {
    const theme = getPeriodTheme('Custom', 'morning');
    expect(theme.color).toBe('amber');
    expect(theme.bg).toBe('bg-amber-50');
  });

  it('should support dynamic icons from SHIFT_ICONS', () => {
    const theme = getPeriodTheme('Custom', 'other', 'Heart');
    expect(theme.icon).toBe(SHIFT_ICONS['Heart']);
  });

  it('should fallback to name matching if no theme provided', () => {
    const theme = getPeriodTheme('Night Watch');
    expect(theme.color).toBe('indigo');
  });

  it('should provide default values for unknown inputs', () => {
    const theme = getPeriodTheme('Something Random');
    expect(theme.color).toBe('gray');
    expect(theme.name).toBe('Something Random');
  });

  it('should handleCommunity theme specifically', () => {
    const theme = getPeriodTheme('Outing', 'community');
    expect(theme.color).toBe('emerald');
    expect(theme.name).toBe('Outing');
  });
});
