import { describe, it, expect } from 'vitest';
import { getContextDescription } from './role-permissions-matrix';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';

describe('RolePermissionsMatrix Utils', () => {
  describe('getContextDescription', () => {
    it('returns the correct description for NONE level', () => {
      expect(getContextDescription(RBAC_MODULES.PARTICIPANTS, ACCESS_LEVEL.NONE))
        .toBe('Module is hidden and access is blocked.');
    });

    it('returns the correct description for FULL level', () => {
      expect(getContextDescription(RBAC_MODULES.PARTICIPANTS, ACCESS_LEVEL.FULL))
        .toBe('Global access to all records across the organization.');
    });

    it('returns module-specific descriptions for CONTEXT_READ_WRITE', () => {
      // Personal
      expect(getContextDescription(RBAC_MODULES.MY_ROSTER, ACCESS_LEVEL.CONTEXT_READ_WRITE))
        .toContain('personal records');
      
      // Management
      expect(getContextDescription(RBAC_MODULES.EMPLOYEES, ACCESS_LEVEL.CONTEXT_READ_WRITE))
        .toContain('direct reports');
      
      // Clinical
      expect(getContextDescription(RBAC_MODULES.PARTICIPANTS, ACCESS_LEVEL.CONTEXT_READ_WRITE))
        .toContain('assigned houses');
      
      // Operational
      expect(getContextDescription(RBAC_MODULES.HOUSES, ACCESS_LEVEL.CONTEXT_READ_WRITE))
        .toContain('Full management');
      
      // Reporting
      expect(getContextDescription(RBAC_MODULES.REPORTING_CLINICAL, ACCESS_LEVEL.CONTEXT_READ_WRITE))
        .toContain('Create and manage reports');
    });

    it('returns module-specific descriptions for CONTEXT_READ_ONLY', () => {
      expect(getContextDescription(RBAC_MODULES.PARTICIPANTS, ACCESS_LEVEL.CONTEXT_READ_ONLY))
        .toContain('View-only for participants');
      
      // Reporting
      expect(getContextDescription(RBAC_MODULES.REPORTING_CLINICAL, ACCESS_LEVEL.CONTEXT_READ_ONLY))
        .toContain('View reports');
    });

    it('returns global READ_ONLY description', () => {
      expect(getContextDescription(RBAC_MODULES.ACTIVITY_LOG, ACCESS_LEVEL.READ_ONLY))
        .toContain('Global view-only access');
    });
  });
});
