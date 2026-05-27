import { test, expect } from '@playwright/test';

/**
 * Comprehensive tests for RBAC Enforcement and UI Visibility.
 */
test.describe('RBAC Comprehensive', () => {

  test('Admin has full access to management tools', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
    const page = await context.newPage();

    await page.goto('/');
    
    // Sidebar Management links should be visible
    await expect(page.getByRole('link', { name: /Access Control/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Activity Log/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Houses/i })).toBeVisible();

    // Check for Delete buttons in Participant list
    await page.goto('/participants/profiles');
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });
    
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      // Admin should see a delete button (might be an icon or text)
      const deleteBtn = firstRow.getByRole('button', { name: /Delete/i }).or(firstRow.locator('button .ki-trash'));
      await expect(deleteBtn.first()).toBeVisible();
    }

    await context.close();
  });

  test('Staff is restricted from management tools', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/staff.json' });
    const page = await context.newPage();

    await page.goto('/');

    // Sidebar Management links should NOT be visible
    await expect(page.getByRole('link', { name: /Access Control/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /Activity Log/i })).not.toBeVisible();

    // Attempt direct access to Activity Log should result in 403
    await page.goto('/activity-log');
    await expect(page).toHaveURL(/\/error\/403/);

    // Check for Delete buttons in Participant list - Staff should NOT see them
    await page.goto('/participants/profiles');
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      const deleteBtn = firstRow.getByRole('button', { name: /Delete/i }).or(firstRow.locator('button .ki-trash'));
      await expect(deleteBtn.first()).not.toBeVisible();
    }

    await context.close();
  });

  test('Public user is redirected to Sign In', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\/auth\/signin/);

    await page.goto('/participants/profiles');
    await expect(page).toHaveURL(/\/auth\/signin/);

    await context.close();
  });

  test('Read-only access hides action buttons (Simulation via Admin on non-editable resource)', async ({ browser }) => {
    // This is a placeholder for testing actual 'read_only' level if we had a session for it.
    // For now, we verify that on a page where a user has permission but maybe not "Edit" rights, 
    // the UI adapts correctly.
    
    const context = await browser.newContext({ storageState: 'playwright/.auth/staff.json' });
    const page = await context.newPage();

    await page.goto('/participants/profiles');
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });

    // Staff might have 'context_read_write' or 'context_read_only'.
    // If they have read-only, they shouldn't see "Add Participant" button.
    const addParticipantBtn = page.getByRole('button', { name: /Add Participant/i });
    // In our app, Staff usually don't have permission to add participants at the global level.
    await expect(addParticipantBtn).not.toBeVisible();

    await context.close();
  });
});
