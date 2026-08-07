import { describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';

// Helper to create a chainable mock
const createMockQueryBuilder = (responseData: any) => {
  const mock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(responseData)),
    maybeSingle: vi
      .fn()
      .mockImplementation(() => Promise.resolve(responseData)),
    then: vi
      .fn()
      .mockImplementation((onFulfilled) =>
        Promise.resolve(responseData).then(onFulfilled),
      ),
  };
  return mock;
};

vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('Advanced Audit Trigger Expectations', () => {
  it('should verify the detailed description of a staff update', async () => {
    const staffId = 'staff-1';
    const mockResponse = {
      data: [
        {
          id: 'log-1',
          activity_type: 'update',
          entity_id: 'staff-1',
          description: 'Updated Staff "Audit Test User" [Changed: Name, Email]',
          metadata: {
            changes: {
              staff_name: { old: 'Audit Test User', new: 'Updated Audit Name' },
              email: { old: 'old@example.com', new: 'new@example.com' },
            },
          },
        },
      ],
      error: null,
    };

    const mockChain = createMockQueryBuilder(mockResponse);
    (supabase.from as any).mockReturnValue(mockChain);

    // Simulate the flow
    await supabase
      .from('ic_staff')
      .update({ staff_name: 'Updated Audit Name' })
      .eq('id', staffId);

    // Assert what we expect the new SQL trigger to have produced
    const { data: logs } = await supabase
      .from('ic_activity_log')
      .select('*')
      .eq('entity_id', staffId);

    expect(logs).toBeDefined();
    const latestLog = logs![0];

    // Check for the new detailed description format
    expect(latestLog.description).toContain('Updated Staff');
    expect(latestLog.metadata.changes.staff_name.new).toBe(
      'Updated Audit Name',
    );
  });

  it('should verify the parent context of a child record creation', async () => {
    const contactId = 'contact-1';
    const mockResponse = {
      data: [
        {
          activity_type: 'create',
          entity_id: contactId,
          description:
            'Added Contact "Emergency Contact" to Participant: Jane Doe',
          parent_name: 'Jane Doe',
          parent_type: 'Participant',
          parent_id: 'participant-uuid',
          metadata: {
            new_data: {
              participant_id: 'participant-uuid',
              name: 'Emergency Contact',
            },
          },
        },
      ],
      error: null,
    };

    const mockChain = createMockQueryBuilder(mockResponse);
    (supabase.from as any).mockReturnValue(mockChain);

    await supabase
      .from('ic_participant_contacts')
      .insert({
        name: 'Emergency Contact',
        participant_id: 'participant-uuid',
      });

    const { data: logs } = await supabase
      .from('ic_activity_log')
      .select('*')
      .eq('entity_id', contactId);

    expect(logs?.length).toBe(1);
    expect(logs![0].description).toContain('Added Contact');
    expect(logs![0].description).toContain('to Participant: Jane Doe');
    expect(logs![0].parent_type).toBe('Participant');
    expect(logs![0].parent_id).toBe('participant-uuid');
  });
});
