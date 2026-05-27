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

// Pages accessible by both Staff and Admins
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

// Pages accessible only by Admins
const ADMIN_PAGES = [
  '/employees/staff-profiles',
  '/employees/timesheets',
  '/employees/leave-requests',
  '/admin/checklist-templates',
  '/admin/roles',
  '/houses/profiles',
  '/participants/medication-register',
  '/roster-board',
  '/roster-board/shift-templates',
  '/activity-log',
];

// Helper to check for White Screen of Death or major rendering errors
async function checkNoWSoD(page) {
  // 1. Ensure page is not completely empty
  const bodyContent = await page.content();
  expect(bodyContent.length).toBeGreaterThan(100);

  // 2. Ensure no standard error boundary text is visible
  const errorText = page.getByText(/Something went wrong/i);
  await expect(errorText).not.toBeVisible();

  // 3. Ensure no React error overlay (in dev mode)
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
// Note: In local/Prod environments, these IDs may need adjustment.
const MOCK_PARTICIPANT_ID = 'participant-1';
const MOCK_STAFF_ID = 'staff-1';
const MOCK_HOUSE_ID = 'house-1';
const MOCK_SHIFT_ID = 'shift-1';

staffTest(`Participant Detail page loads`, async ({ page }) => {
  await page.goto(`/participants/detail/${MOCK_PARTICIPANT_ID}`);
  await checkNoWSoD(page);
});

staffTest(`Participant Edit page loads`, async ({ page }) => {
  await page.goto(`/participants/detail/${MOCK_PARTICIPANT_ID}/edit`);
  await checkNoWSoD(page);
});

staffTest(`Staff Timesheet Form page loads`, async ({ page }) => {
  await page.goto(`/staff/roster/${MOCK_SHIFT_ID}/timesheet`);
  await checkNoWSoD(page);
});

// Deep Link & Tab Smoke Tests
staffTest(`Participant Detail Medications tab loads`, async ({ page }) => {
  await page.goto(`/participants/detail/${MOCK_PARTICIPANT_ID}?tab=medications`);
  await checkNoWSoD(page);
});

staffTest(`Participant Detail Documents tab loads`, async ({ page }) => {
  await page.goto(`/participants/detail/${MOCK_PARTICIPANT_ID}?tab=documents`);
  await checkNoWSoD(page);
});

// RBAC & Security Verification Tests
publicTest(`Public user is redirected from protected page to signin`, async ({ page }) => {
  await page.goto('/staff/dashboard');
  await expect(page).toHaveURL(/\/auth\/signin/);
});

staffTest(`Staff member is blocked from Admin Roster Board`, async ({ page }) => {
  await page.goto('/roster-board');
  // RequirePermission redirects to 403
  await expect(page).toHaveURL(/\/error\/403/);
});

staffTest(`Staff member is blocked from Admin Activity Log`, async ({ page }) => {
  await page.goto('/activity-log');
  await expect(page).toHaveURL(/\/error\/403/);
});

adminTest(`Staff Detail page loads`, async ({ page }) => {
  await page.goto(`/employees/staff-detail/${MOCK_STAFF_ID}`);
  await checkNoWSoD(page);
});

adminTest(`House Detail page loads`, async ({ page }) => {
  await page.goto(`/houses/detail/${MOCK_HOUSE_ID}`);
  await checkNoWSoD(page);
});

staffTest(`Staff Leave Edit page loads`, async ({ page }) => {
  // Using a mock ID, this might fail if the record doesn't exist,
  // but for a smoke test, we check if the layout at least loads.
  await page.goto(`/staff/leave/mock-id/edit`);
  // If we get a 404 or redirect, that's also technically not a WSoD,
  // but here we just check for basic layout integrity.
  await checkNoWSoD(page);
});
