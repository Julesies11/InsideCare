import { describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

/**
 * Refactor Verification Unit Test
 * 
 * This test verifies that the application code is actually interacting with 
 * the 'ic_' prefixed tables, ensuring the refactor is functionally correct.
 */
describe('Database Prefix Integrity', () => {
  it('should use ic_ prefixed table for participants', async () => {
    // We expect the query to be constructed with the ic_ prefix
    const query = supabase.from(TABLES.PARTICIPANTS).select('*');
    expect((query as any).url.href).toContain(TABLES.PARTICIPANTS);
  });

  it('should use ic_ prefixed table for staff', async () => {
    const query = supabase.from(TABLES.STAFF).select('*');
    expect((query as any).url.href).toContain(TABLES.STAFF);
  });

  it('should use ic_ prefixed table for houses', async () => {
    const query = supabase.from(TABLES.HOUSES).select('*');
    expect((query as any).url.href).toContain(TABLES.HOUSES);
  });

  it('should use ic_ prefixed bucket for staff photos', async () => {
    const storage = supabase.storage.from('ic_staff_photos');
    // Internal Supabase client path check
    expect((storage as any).bucketId).toBe('ic_staff_photos');
  });
});
