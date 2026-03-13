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

const PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/check-email',
  '/error/404',
];

const STAFF_PAGES = [
  '/',
  '/staff/dashboard',
  '/staff/roster',
  '/staff/timesheets',
  '/staff/leave',
  '/staff/leave/new',
  '/staff/profile',
  '/participants/profiles',
  '/participants/shift-notes',
];

const ADMIN_PAGES = [
  '/employees/staff-profiles',
  '/employees/timesheets',
  '/employees/leave-requests',
  '/admin/checklist-templates',
  '/houses/profiles',
  '/roster-board',
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
  // The Demo1Layout usually has a .layout-container or sidebar
  const layout = page.locator('.layout-container, .sidebar, .header');
  await expect(layout.first()).toBeVisible({ timeout: 10000 });
}

// Public Pages Smoke Test
for (const path of PUBLIC_PAGES) {
  publicTest(`Public Page ${path} loads without WSoD`, async ({ page }) => {
    await page.goto(path);
    const authCard = page.locator('.card, form, h1');
    await expect(authCard.first()).toBeVisible();
    await expect(page.getByText(/Something went wrong/i)).not.toBeVisible();
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

// Detail Pages Smoke Test (Admin context)
adminTest('Participant Detail page loads', async ({ page }) => {
  await page.goto('/participants/detail/participant-1');
  await checkNoWSoD(page);
  await expect(page.getByText(/John Doe/i)).toBeVisible();
});

adminTest('Staff Detail page loads', async ({ page }) => {
  await page.goto('/employees/staff-detail/staff-1');
  await checkNoWSoD(page);
  await expect(page.getByText(/Admin User/i)).toBeVisible();
});

adminTest('House Detail page loads', async ({ page }) => {
  await page.goto('/houses/detail/house-1');
  await checkNoWSoD(page);
  await expect(page.getByText(/Test House 1/i)).toBeVisible();
});
