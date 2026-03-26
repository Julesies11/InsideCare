import { renderHook, waitFor } from '@testing-library/react';
import { useOrgShiftTemplates } from './use-org-shift-templates';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockTemplates, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockTemplates[0], error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockTemplates[0], error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

const mockTemplates = [
  {
    id: '1',
    name: 'Morning',
    short_name: 'M',
    start_time_default: '07:00',
    end_time_default: '15:00',
    icon_name: 'sun',
    color_theme: 'morning',
    sort_order: 10,
    is_active: true,
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useOrgShiftTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('fetches templates successfully', async () => {
    const { result } = renderHook(() => useOrgShiftTemplates(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].name).toBe('Morning');
  });

  it('creates a template', async () => {
    const { result } = renderHook(() => useOrgShiftTemplates(), { wrapper });

    await result.current.createTemplate.mutateAsync({ name: 'New Template' });

    expect(supabase.from).toHaveBeenCalledWith('org_shift_templates');
  });

  it('updates a template', async () => {
    const { result } = renderHook(() => useOrgShiftTemplates(), { wrapper });

    await result.current.updateTemplate.mutateAsync({ 
      id: '1', 
      updates: { name: 'Updated Name' } 
    });

    expect(supabase.from).toHaveBeenCalledWith('org_shift_templates');
  });

  it('deletes a template', async () => {
    const { result } = renderHook(() => useOrgShiftTemplates(), { wrapper });

    await result.current.deleteTemplate.mutateAsync('1');

    expect(supabase.from).toHaveBeenCalledWith('org_shift_templates');
  });
});
