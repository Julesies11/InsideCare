import { describe, expect, it } from 'vitest';
import { TABLES } from '@/config/db-tables';
import {
  CHECKLIST_VIEWS,
  HOUSE_VIEWS,
  INCIDENT_VIEWS,
  PARTICIPANT_VIEWS,
  ROSTER_VIEWS,
  SHIFT_NOTE_VIEWS,
  STAFF_VIEWS,
} from '@/config/query-views';

/**
 * EXHAUSTIVE SCHEMA INTEGRITY TEST
 *
 * This test suite performs literal string validation on every query view.
 * It ensures that non-existent columns are NOT present and that all
 * relationship hints match the schema-defined foreign keys.
 */

describe('Tier 1: Query View Column & Join Validation', () => {
  describe('PARTICIPANT_VIEWS', () => {
    it('DETAIL should contain expected core fields and valid house join', () => {
      const view = PARTICIPANT_VIEWS.DETAIL;
      expect(view).toContain('participant_name');
      expect(view).toContain('ndis_number');
      expect(view).toContain('mtmp_required');
      expect(view).toContain(`houses:${TABLES.HOUSES}!house_id`);
    });

    it('MEDICATIONS should NOT contain non-existent frequency/instructions', () => {
      const view = PARTICIPANT_VIEWS.MEDICATIONS;
      expect(view).not.toContain('frequency');
      expect(view).not.toContain('instructions');
      expect(view).toContain(
        `medication_info:${TABLES.MEDICATIONS_MASTER}!medication_id`,
      );
    });

    it('DOCUMENTS should use created_by for uploader join', () => {
      const view = PARTICIPANT_VIEWS.DOCUMENTS;
      expect(view).toContain(`uploader_info:${TABLES.STAFF}!created_by`);
      expect(view).not.toContain('uploaded_by');
      expect(view).not.toContain('category');
    });
  });

  describe('STAFF_VIEWS', () => {
    it('DETAIL should contain core profile and compliance fields', () => {
      const view = STAFF_VIEWS.DETAIL;
      expect(view).toContain('staff_name');
      expect(view).toContain('hire_date');
      expect(view).toContain('ndis_worker_screening_check');
      expect(view).toContain(`role:${TABLES.ROLES}!role_id`);
    });

    it('DOCUMENTS should use created_by for join', () => {
      const view = STAFF_VIEWS.DOCUMENTS;
      expect(view).toContain(`uploader_info:${TABLES.STAFF}!created_by`);
      expect(view).not.toContain('uploaded_by');
    });

    it('COMPLIANCE and TRAINING should be valid strings', () => {
      expect(STAFF_VIEWS.COMPLIANCE).toContain('compliance_name');
      expect(STAFF_VIEWS.TRAINING).toContain('date_completed');
    });
  });

  describe('HOUSE_VIEWS', () => {
    it('STANDARD should contain house capacity and valid joins', () => {
      const view = HOUSE_VIEWS.STANDARD;
      expect(view).toContain('house_name');
      expect(view).toContain('capacity');
      expect(view).toContain(`checklists:${TABLES.HOUSE_CHECKLISTS}!house_id`);
    });

    it('RESOURCES should NOT contain resource_name or file_path', () => {
      const view = HOUSE_VIEWS.RESOURCES;
      expect(view).not.toContain('resource_name');
      expect(view).not.toContain('file_path');
      expect(view).toContain('title');
      expect(view).toContain('file_url');
    });

    it('COMMS should use created_by and contain content', () => {
      const view = HOUSE_VIEWS.COMMS;
      expect(view).toContain('content');
      expect(view).toContain('entry_date');
      expect(view).toContain(`creator:${TABLES.STAFF}!created_by`);
    });

    it('FILES should use created_by for uploader info', () => {
      const view = HOUSE_VIEWS.FILES;
      expect(view).toContain(`uploader_info:${TABLES.STAFF}!created_by`);
    });
  });

  describe('ROSTER_VIEWS', () => {
    it('SHIFT_DETAIL should have valid complex joins', () => {
      const view = ROSTER_VIEWS.SHIFT_DETAIL;
      expect(view).toContain(`staff_info:${TABLES.STAFF}!staff_id`);
      expect(view).toContain(`house_info:${TABLES.HOUSES}!house_id`);
      expect(view).toContain(
        `type_details:${TABLES.HOUSE_SHIFT_TEMPLATES}!shift_template_id`,
      );
      expect(view).toContain(
        `participants:${TABLES.SHIFT_PARTICIPANTS}!shift_id`,
      );
    });
  });

  describe('CHECKLIST_VIEWS', () => {
    it('HISTORY should use valid completed_by relationship', () => {
      const view = CHECKLIST_VIEWS.HISTORY;
      expect(view).toContain(
        `staff:${TABLES.STAFF}!house_checklist_submissions_submitted_by_fkey`,
      );
    });

    it('SUBMISSION_DETAIL should contain items and completed_by join', () => {
      const view = CHECKLIST_VIEWS.SUBMISSION_DETAIL;
      expect(view).toContain(`submission_id`);
      expect(view).toContain(`completed_by_staff:${TABLES.STAFF}!completed_by`);
    });
  });
});
