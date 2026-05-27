import { test as base, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/admin.json');
const STAFF_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/staff.json');

// Extend base test to create specialized test types
const publicTest = base.extend({
  storageState: async ({}, use) => {
    await use({ cookies: [], origins: [] });
  },
});

const staffTest = base.extend({
  storageState: async ({}, use) => {
    await use(STAFF_STORAGE_STATE);
  },
});

const adminTest = base.extend({
  storageState: async ({}, use) => {
    await use(ADMIN_STORAGE_STATE);
  },
});

// Pages that don't require authentication
const PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/check-email',
  '/auth/change-password',
  '/auth/2fa',
  '/auth/reset-password/check-email',
  '/auth/reset-password/changed',
  '/auth/branded/signin',
  '/auth/branded/signup',
  '/auth/branded/change-password',
  '/auth/branded/reset-password',
  '/auth/branded/2fa',
  '/auth/branded/check-email',
  '/auth/branded/reset-password/check-email',
  '/auth/branded/reset-password/changed',
  '/auth/callback',
  '/error/404',
  '/error/403',
  '/error/500',
];

// Pages accessible by both Staff and Admins (Staff Portal & Shared Care)
const STAFF_PAGES = [
  '/',
  '/staff/dashboard',
  '/staff/checklists',
  '/staff/roster',
  '/staff/timesheets',
  '/staff/leave',
  '/staff/leave/new',
  '/staff/profile',
  '/participants/profiles',
  '/participants/shift-notes',
  '/auth/welcome-message',
  '/auth/account-deactivated',
  '/account/notifications',
];

// Pages accessible only by Admins (Management & Operations)
const ADMIN_PAGES = [
  '/staff',
  '/timesheet-approvals',
  '/leave-approvals',
  '/checklist-templates',
  '/access-control',
  '/houses',
  '/participants/medication-register',
  '/roster-board',
  '/shift-setup',
  '/activity-log',
  '/admin/leave-types',
];

// Helper to check for White Screen of Death or major rendering errors
async function checkNoWSoD(page) {
  // 1. Ensure page is not completely empty
  const bodyContent = await page.content();
  expect(bodyContent.length).toBeGreaterThan(100);

  // 2. Ensure no standard error boundary text is visible
  const errorText = page.getByText(/Something went wrong/i);
  await expect(errorText).not.toBeVisible();

  // 3. Ensure no Vite crash overlay (in dev mode)
  const viteError = page.locator('vite-error-overlay');
  await expect(viteError).not.toBeAttached();

  // 4. Ensure at least some main layout element is present after a short wait
  const layout = page.locator('.layout-container, .sidebar, .header, #root');
  await expect(layout.first()).toBeVisible({ timeout: 15000 });
}

// Public Pages Smoke Test
for (const path of PUBLIC_PAGES) {
  publicTest(`Public Page ${path} loads without WSoD`, async ({ page }) => {
    await page.goto(path);
    await checkNoWSoD(page);
  });
}

// Staff Pages Smoke Test
for (const path of STAFF_PAGES) {
  staffTest(`Staff Page ${path} loads without WSoD`, async ({ page }) => {
    await page.goto(path);
    await checkNoWSoD(page);
  });
}

// Admin Pages Smoke Test
for (const path of ADMIN_PAGES) {
  adminTest(`Admin Page ${path} loads without WSoD`, async ({ page }) => {
    await page.goto(path);
    await checkNoWSoD(page);
  });
}

// Detail & Edit Pages (Using placeholder IDs for smoke testing)
const MOCK_PARTICIPANT_ID = 'participant-1';
const MOCK_STAFF_ID = 'staff-1';
const MOCK_HOUSE_ID = 'house-1';
const MOCK_SHIFT_ID = 'shift-1';
const MOCK_MEDICATION_ID = 'med-1';
const MOCK_LEAVE_ID = 'leave-1';
const MOCK_SHIFT_TEMPLATE_ID = 'template-1';

// Participant Tabs
const PARTICIPANT_TABS = [
  'personal_details',
  'goals',
  'behaviour',
  'support-needs',
  'mealtime',
  'medical-routine',
  'medications',
  'emergency-management',
  'contacts',
  'documents',
  'shift_notes',
  'activity_log'
];

for (const tab of PARTICIPANT_TABS) {
  staffTest(`Participant Detail tab ${tab} loads`, async ({ page }) => {
    await page.goto(`/participants/detail/${MOCK_PARTICIPANT_ID}?tab=${tab}`);
    await checkNoWSoD(page);
    // Verify specific section anchor is present
    await expect(page.locator(`#${tab}`)).toBeAttached();
  });
}

// House Tabs
const HOUSE_TABS = [
  'house_details',
  'house_management',
  'house_participants',
  'house_general_details',
  'house_individuals_breakdown',
  'house_participant_dynamics',
  'house_risk_management',
  'house_observations',
  'daily_operations',
  'calendar_events',
  'house_comms',
  'checklists',
  'checklist_history',
  'resources',
  'staff',
  'activity_log'
];

for (const tab of HOUSE_TABS) {
  adminTest(`House Detail tab ${tab} loads`, async ({ page }) => {
    await page.goto(`/houses/detail/${MOCK_HOUSE_ID}?tab=${tab}`);
    await checkNoWSoD(page);
    await expect(page.locator(`#${tab}`)).toBeAttached();
  });
}

// Staff Detail Tabs
const STAFF_TABS = [
  'personal_details',
  'employment_details',
  'staff_availability',
  'emergency_contact',
  'staff_compliance',
  'staff_training',
  'staff_documents',
  'staff_roster',
  'staff_leave',
  'staff_warnings',
  'staff_activity_log'
];

for (const tab of STAFF_TABS) {
  adminTest(`Staff Detail tab ${tab} loads`, async ({ page }) => {
    await page.goto(`/employees/staff-detail/${MOCK_STAFF_ID}?tab=${tab}`);
    await checkNoWSoD(page);
    await expect(page.locator(`#${tab}`)).toBeAttached();
  });
}

// Specialized Routes
adminTest(`Medication Detail page loads`, async ({ page }) => {
  await page.goto(`/participants/medication-register/${MOCK_MEDICATION_ID}`);
  await checkNoWSoD(page);
});

staffTest(`Staff Timesheet Form page loads`, async ({ page }) => {
  await page.goto(`/staff/roster/${MOCK_SHIFT_ID}/timesheet`);
  await checkNoWSoD(page);
});

staffTest(`Staff Leave Edit page loads`, async ({ page }) => {
  await page.goto(`/staff/leave/${MOCK_LEAVE_ID}/edit`);
  await checkNoWSoD(page);
});

adminTest(`Shift Template Edit page loads`, async ({ page }) => {
  await page.goto(`/shift-setup/${MOCK_SHIFT_TEMPLATE_ID}`);
  await checkNoWSoD(page);
});

// RBAC & Security Verification Tests
publicTest(`Public user is redirected from protected page to signin`, async ({ page }) => {
  await page.goto('/staff/dashboard');
  await expect(page).toHaveURL(/\/auth\/signin/);
});

staffTest(`Staff member is blocked from Admin Roster Board`, async ({ page }) => {
  await page.goto('/roster-board');
  await expect(page).toHaveURL(/\/error\/403/);
});

staffTest(`Staff member is blocked from Admin Activity Log`, async ({ page }) => {
  await page.goto('/activity-log');
  await expect(page).toHaveURL(/\/error\/403/);
});
