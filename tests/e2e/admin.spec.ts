import { test, expect } from '@playwright/test';

test.describe('Admin Workflows', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin can access Roster Board and see management tools', async ({ page }) => {
    await page.goto('/roster-board');
    await expect(page.getByRole('button', { name: /Today/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Build Roster/i }).or(page.getByRole('button', { name: /Add Shift/i }))).toBeVisible({ timeout: 15000 });
  });

  test('Admin can view Activity Log', async ({ page }) => {
    await page.goto('/activity-log');
    await expect(page.getByRole('heading', { name: /Activity Log/i, level: 1 })).toBeVisible();
    // Verify table results (even if empty, should not crash)
    await expect(page.locator('#activity_log')).toBeVisible();
  });

  test('Admin can access Role Management', async ({ page }) => {
    await page.goto('/access-control');
    await expect(page.getByRole('heading', { name: /Roles/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Role/i })).toBeVisible();
  });

  test('Admin can view Staff Profiles table', async ({ page }) => {
    await page.goto('/staff');
    await expect(page.getByPlaceholder(/Search staff/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('table')).toBeVisible();
  });
});
