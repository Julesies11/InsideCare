import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incidentsApi } from '@/api/incidents.api';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/config/db-tables';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper to create a mock query chain
const createMockQuery = (data: any = [], error: any = null, count: number = 0) => {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  query.single.mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error });
  
  // Support promise chain directly (for supabase then/await)
  query.then = vi.fn().mockImplementation((callback) => {
    return Promise.resolve({ data, error, count }).then(callback);
  });

  return query;
};

describe('incidentsApi - RESTful Routing and Collision Resolution Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('queries by uuid when idOrRef matches UUID format', async () => {
      const uuid = 'f511c36d-caa7-43ad-9551-8d879be26b8e';
      const mockResult = { id: uuid, reference_id: 'INC-1' };
      const mockQuery = createMockQuery([mockResult]);
      
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await incidentsApi.getById(uuid);

      expect(supabase.from).toHaveBeenCalledWith(TABLES.INCIDENT_REPORTS);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', uuid);
      expect(mockQuery.eq).not.toHaveBeenCalledWith('reference_id', expect.any(String));
      expect(result).toEqual(mockResult);
    });

    it('queries by reference_id when idOrRef does not match UUID format', async () => {
      const refId = 'INC-20260608-2044-JG';
      const mockResult = { id: 'uuid-1', reference_id: refId };
      const mockQuery = createMockQuery([mockResult]);
      
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await incidentsApi.getById(refId);

      expect(supabase.from).toHaveBeenCalledWith(TABLES.INCIDENT_REPORTS);
      expect(mockQuery.eq).toHaveBeenCalledWith('reference_id', refId);
      expect(mockQuery.eq).not.toHaveBeenCalledWith('id', expect.any(String));
      expect(result).toEqual(mockResult);
    });
  });

  describe('create (Collision Resolution)', () => {
    it('inserts directly if reference_id is already unique', async () => {
      const report = {
        reference_id: 'INC-UNIQUE',
        summary: 'Unique incident',
      };
      const mockResult = { id: 'uuid-unique', ...report };

      // First call: select query for uniqueness check (count = 0)
      const mockCheckQuery = createMockQuery([], null, 0);
      
      // Second call: insert query
      const mockInsertQuery = createMockQuery([mockResult]);

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === TABLES.INCIDENT_REPORTS) {
          // Check if this is the select query or the insert query
          // A bit hacky but works for mock differentiation
          const query = createMockQuery();
          query.select = vi.fn().mockImplementation((projection, options) => {
            if (options && options.count === 'exact') {
              return mockCheckQuery;
            }
            return query;
          });
          query.insert = vi.fn().mockReturnValue(mockInsertQuery);
          return query;
        }
        return createMockQuery();
      });

      const result = await incidentsApi.create(report as any);

      expect(supabase.from).toHaveBeenCalledWith(TABLES.INCIDENT_REPORTS);
      expect(mockCheckQuery.eq).toHaveBeenCalledWith('reference_id', 'INC-UNIQUE');
      expect(result).toEqual(mockResult);
      expect(report.reference_id).toBe('INC-UNIQUE');
    });

    it('increments reference_id suffix until unique when collision occurs', async () => {
      const report = {
        reference_id: 'INC-COLLIDE',
        summary: 'Colliding incident',
      };
      const mockResult = { id: 'uuid-new', ...report, reference_id: 'INC-COLLIDE-3' };

      // We simulate:
      // 1. INC-COLLIDE exists (count = 1)
      // 2. INC-COLLIDE-2 exists (count = 1)
      // 3. INC-COLLIDE-3 is unique (count = 0)
      let checkCount = 0;
      const uniquenessCheckMock = vi.fn().mockImplementation((table) => {
        const query = createMockQuery();
        query.select = vi.fn().mockImplementation((projection, options) => {
          if (options && options.count === 'exact') {
            const checkQuery = createMockQuery();
            checkQuery.eq = vi.fn().mockImplementation((col, val) => {
              checkCount++;
              if (val === 'INC-COLLIDE' || val === 'INC-COLLIDE-2') {
                // Return a mock result where count is 1 (exist)
                checkQuery.then = vi.fn().mockImplementation((cb) => cb({ data: [{ id: '1' }], error: null, count: 1 }));
              } else if (val === 'INC-COLLIDE-3') {
                // Return count 0 (does not exist)
                checkQuery.then = vi.fn().mockImplementation((cb) => cb({ data: [], error: null, count: 0 }));
              }
              return checkQuery;
            });
            return checkQuery;
          }
          return query;
        });

        const mockInsertQuery = createMockQuery([mockResult]);
        query.insert = vi.fn().mockReturnValue(mockInsertQuery);
        return query;
      });

      vi.mocked(supabase.from).mockImplementation(uniquenessCheckMock);

      const result = await incidentsApi.create(report as any);

      expect(supabase.from).toHaveBeenCalledWith(TABLES.INCIDENT_REPORTS);
      expect(checkCount).toBe(3); // Checked INC-COLLIDE, INC-COLLIDE-2, and INC-COLLIDE-3
      expect(report.reference_id).toBe('INC-COLLIDE-3');
      expect(result.reference_id).toBe('INC-COLLIDE-3');
    });
  });
});
