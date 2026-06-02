import { test, expect } from '@playwright/test';
import { 
  PARTICIPANT_VIEWS, 
  STAFF_VIEWS, 
  HOUSE_VIEWS, 
  ROSTER_VIEWS,
  CHECKLIST_VIEWS,
  SHIFT_NOTE_VIEWS,
  INCIDENT_VIEWS
} from '../../src/config/query-views';
import { TABLES } from '../../src/config/db-tables';

/**
 * DATA INTEGRITY INTEGRATION TEST
 * 
 * This test suite validates that our Data Access Layer (DAL) query strings
 * are 100% compatible with the actual Supabase schema.
 */

test.describe('DAL View Integrity Check', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  const VIEWS_TO_CHECK = [
    { table: TABLES.PARTICIPANTS, view: PARTICIPANT_VIEWS.DETAIL, name: 'Participant Detail' },
    { table: TABLES.PARTICIPANT_MEDICATIONS, view: PARTICIPANT_VIEWS.MEDICATIONS, name: 'Participant Medications' },
    { table: TABLES.PARTICIPANT_DOCUMENTS, view: PARTICIPANT_VIEWS.DOCUMENTS, name: 'Participant Documents' },
    { table: TABLES.STAFF, view: STAFF_VIEWS.DETAIL, name: 'Staff Detail' },
    { table: TABLES.STAFF_DOCUMENTS, view: STAFF_VIEWS.DOCUMENTS, name: 'Staff Documents' },
    { table: TABLES.HOUSES, view: HOUSE_VIEWS.STANDARD, name: 'House Standard' },
    { table: TABLES.HOUSE_RESOURCES, view: HOUSE_VIEWS.RESOURCES, name: 'House Resources' },
    { table: TABLES.HOUSE_COMMS, view: HOUSE_VIEWS.COMMS, name: 'House Comms' },
    { table: TABLES.STAFF_SHIFTS, view: ROSTER_VIEWS.SHIFT_DETAIL, name: 'Roster Shift Detail' },
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for supabase to be available on window
    await page.waitForFunction(() => (window as any).supabase !== undefined);
  });

  for (const item of VIEWS_TO_CHECK) {
    test(`Validate View: ${item.name}`, async ({ page }) => {
      const result = await page.evaluate(async ({ table, view }) => {
        const { supabase } = (window as any);
        const { data, error } = await supabase.from(table).select(view).limit(1);
        
        if (error) {
          return { 
            success: false, 
            code: error.code, 
            message: error.message,
            details: error.details,
            hint: error.hint
          };
        }
        return { success: true, count: data?.length || 0 };
      }, { table: item.table, view: item.view });

      if (!result.success) {
        console.error(`❌ FAILED VIEW [${item.name}]:`, result);
      }

      expect(result.success, `View "${item.name}" failed: [${result.code}] ${result.message}\nHint: ${result.hint}`).toBe(true);
    });
  }
});
