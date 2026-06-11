import { describe, expect, it } from 'vitest';
import { TABLES } from '../db-tables';
import { CHECKLIST_STATUS, STATUS } from '../enums';
import { QUERY_KEYS } from '../query-keys';
import { STORAGE_BUCKETS } from '../storage-buckets';

describe('Centralized Constants', () => {
  it('TABLES should follow the ic_ prefix standard', () => {
    Object.values(TABLES).forEach((table) => {
      expect(table).toMatch(/^ic_/);
    });
  });

  it('STORAGE_BUCKETS should follow the ic_ prefix standard', () => {
    Object.values(STORAGE_BUCKETS).forEach((bucket) => {
      expect(bucket).toMatch(/^ic_/);
    });
  });

  it('QUERY_KEYS should be consistent strings', () => {
    Object.values(QUERY_KEYS).forEach((key) => {
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });
  });

  it('STATUS should have matching casing for UI and DB', () => {
    expect(STATUS.ACTIVE).toBe('Active');
    expect(STATUS.active).toBe('active');
  });

  it('CHECKLIST_STATUS should have expected operational values', () => {
    expect(CHECKLIST_STATUS.COMPLETED).toBe('Completed');
    expect(CHECKLIST_STATUS.completed).toBe('completed');
    expect(CHECKLIST_STATUS.in_progress).toBe('in_progress');
  });
});
