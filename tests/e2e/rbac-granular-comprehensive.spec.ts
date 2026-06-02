import { test, expect } from '@playwright/test';

/**
 * Comprehensive tests for RBAC Enforcement and UI Visibility.
 */
test.describe('RBAC Comprehensive', () => {

  test('Admin has full access to management tools', async ({ browser, viewport }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/admin.json', viewport });
    const page = await context.newPage();

    await page.goto('/');
    
    // In mobile view, we might need to open the sidebar
    const mobileToggle = page.locator('header button').filter({ has: page.locator('svg.lucide-menu') }).first();
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click({ force: true });
    }
    
    // Sidebar Management links should be visible - use more flexible locators
    const accessControlLink = page.getByRole('link', { name: /Access Control/i }).or(page.getByText(/Access Control/i));
    await expect(accessControlLink.first()).toBeVisible({ timeout: 25000 });
    
    const activityLogLink = page.getByRole('link', { name: /Activity Log/i }).or(page.getByText(/Activity Log/i));
    await expect(activityLogLink.first()).toBeVisible({ timeout: 15000 });
    
    const housesLink = page.getByRole('link', { name: /Houses/i }).or(page.getByText(/Houses/i));
    await expect(housesLink.first()).toBeVisible({ timeout: 15000 });

    // Check for Archive buttons in Participant list
    await page.goto('/participants/profiles');
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });
    
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      // Admin should see an archive button
      const archiveBtn = firstRow.getByRole('button', { name: /Archive/i });
      await expect(archiveBtn.first()).toBeVisible();
    }

    await context.close();
  });

  test('Staff is restricted from management tools', async ({ browser, viewport }) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/staff.json', viewport });
    const page = await context.newPage();

    await page.goto('/');

    // Sidebar Management links should NOT be visible
    await expect(page.getByText(/Access Control/i)).not.toBeVisible();
    await expect(page.getByText(/Activity Log/i)).not.toBeVisible();

    // Attempt direct access to Activity Log should result in 403
    await page.goto('/activity-log');
    await expect(page).toHaveURL(/\/error\/403/);

    // Check for Archive buttons in Participant list - Staff should NOT see them
    await page.goto('/participants/profiles');
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      const archiveBtn = firstRow.getByRole('button', { name: /Archive/i });
      await expect(archiveBtn.first()).not.toBeVisible();
    }

    await context.close();
  });

  test('Public user is redirected to Sign In', async ({ browser, viewport }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport });
    const page = await context.newPage();

    await page.goto('/my-dashboard');
    await expect(page).toHaveURL(/\/auth\/signin/);

    await page.goto('/participants/profiles');
    await expect(page).toHaveURL(/\/auth\/signin/);

    await context.close();
  });

  test('Read-only access hides action buttons (Simulation via Admin on non-editable resource)', async ({ browser, viewport }) => {
    // This is a placeholder for testing actual 'read_only' level if we had a session for it.
    // For now, we verify that on a page where a user has permission but maybe not "Edit" rights, 
    // the UI adapts correctly.
    
    const context = await browser.newContext({ storageState: 'playwright/.auth/staff.json', viewport });
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
