import { describe, expect, it } from 'vitest';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ACCESS_LEVEL } from '@/hooks/useRBAC';
import { getContextDescription } from './role-permissions-matrix';

describe('RolePermissionsMatrix Utils', () => {
  describe('getContextDescription', () => {
    it('returns the correct description for NONE level', () => {
      const result = getContextDescription(
        RBAC_MODULES.PARTICIPANTS,
        ACCESS_LEVEL.NONE,
        'Participants',
      );
      expect(result.prefix).toBe('No Access');
      expect(result.body).toContain('Participants');
      expect(result.body).toContain('hidden and access is blocked');
    });

    it('returns the correct description for FULL level', () => {
      const result = getContextDescription(
        RBAC_MODULES.PARTICIPANTS,
        ACCESS_LEVEL.FULL,
        'Participants',
      );
      expect(result.prefix).toBe('Full Access');
      expect(result.body).toContain('Participants');
      expect(result.body).toContain('organization-wide');
    });

    it('returns module-specific descriptions for CONTEXT_READ_WRITE', () => {
      // Personal
      expect(
        getContextDescription(
          RBAC_MODULES.MY_ROSTER,
          ACCESS_LEVEL.CONTEXT_READ_WRITE,
          'My Roster',
        ).body,
      ).toContain('personal My Roster records');

      // Management
      expect(
        getContextDescription(
          RBAC_MODULES.EMPLOYEES,
          ACCESS_LEVEL.CONTEXT_READ_WRITE,
          'Staff Profiles',
        ).body,
      ).toContain('direct reports');

      // Clinical
      expect(
        getContextDescription(
          RBAC_MODULES.PARTICIPANTS,
          ACCESS_LEVEL.CONTEXT_READ_WRITE,
          'Participant Profiles',
        ).body,
      ).toContain('assigned houses');

      // Operational
      expect(
        getContextDescription(
          RBAC_MODULES.HOUSES,
          ACCESS_LEVEL.CONTEXT_READ_WRITE,
          'House Profiles',
        ).body,
      ).toContain('management');

      // Reporting
      expect(
        getContextDescription(
          RBAC_MODULES.REPORTING_CLINICAL,
          ACCESS_LEVEL.CONTEXT_READ_WRITE,
          'Clinical Reports',
        ).body,
      ).toContain('reports for assigned houses');
    });

    it('returns module-specific descriptions for CONTEXT_READ_ONLY', () => {
      const result = getContextDescription(
        RBAC_MODULES.PARTICIPANTS,
        ACCESS_LEVEL.CONTEXT_READ_ONLY,
        'Participants',
      );
      expect(result.prefix).toBe('View-only');
      expect(result.body).toContain('assigned houses');

      // Reporting
      const reportResult = getContextDescription(
        RBAC_MODULES.REPORTING_CLINICAL,
        ACCESS_LEVEL.CONTEXT_READ_ONLY,
        'Clinical Reports',
      );
      expect(reportResult.prefix).toBe('View-only');
      expect(reportResult.body).toContain('reports for assigned houses');
    });

    it('returns global READ_ONLY description', () => {
      const result = getContextDescription(
        RBAC_MODULES.ACTIVITY_LOG,
        ACCESS_LEVEL.READ_ONLY,
        'Activity Log',
      );
      expect(result.prefix).toBe('Read-only');
      expect(result.body).toContain('No edits allowed');
    });
  });
});
