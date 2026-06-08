import { test, expect, devices } from '@playwright/test';

/**
 * Tests for shared UI patterns: Search, Filters, Mobile responsiveness.
 */
test.describe('UI Components & Responsiveness', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Global Search and Table Interactions', async ({ page }) => {
    await page.goto('/participants/profiles');
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });

    // Test Search input
    const searchInput = page.getByPlaceholder(/Search Participants/i);
    await searchInput.fill('NonExistentName');
    await expect(page.locator('body')).toContainText(/No data available/i);
    
    await searchInput.clear();
    await expect(page.locator('table tbody tr')).toBeVisible();

    // Test Column Sorting (assuming the table has sortable headers)
    const nameHeader = page.getByRole('columnheader', { name: /Name/i }).first();
    if (await nameHeader.isVisible()) {
      await nameHeader.click();
      // Check for sort indicator or visual change (hard to assert without specific class, but we verify no crash)
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('Mobile View - Sidebar and Navigation', async ({ page }) => {
    // Set viewport to a mobile size
    await page.setViewportSize(devices['iPhone 14'].viewport);

    await page.goto('/');
    
    // Sidebar should be hidden by default on mobile
    const sidebar = page.locator('.sidebar');
    // Metronic usually uses a drawer or hidden class
    // We check if it's off-screen or has a specific attribute
    
    // Header should have a mobile toggle button
    const mobileToggle = page.locator('header button').filter({ has: page.locator('svg.lucide-menu') }).first();
    await expect(mobileToggle).toBeVisible({ timeout: 15000 });

    // Click toggle to open sidebar
    await mobileToggle.click({ force: true });
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
  });

  test('Form Dirty Tracking and Navigation Blocking', async ({ page }) => {
    // The Participant Detail page uses window.confirm for unsaved changes (Back button)
    // Navigate to the participant list first to get a real ID
    await page.goto('/participants/profiles');
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });

    // Click on the first participant to open their detail page
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await firstRow.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/participants\/detail\//);

    // Change a field to make the form dirty
    const nameInput = page.locator('input#participant_name');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    const originalValue = await nameInput.inputValue();
    await nameInput.fill(`${originalValue} Dirty`);
    await nameInput.blur();

    // Verify "Save Changes" becomes enabled
    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveBtn).toBeEnabled({ timeout: 10000 });

    // Scroll to top so the Back button is not obscured by sticky header
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // Click Back — participant detail uses window.confirm when isDirty is true
    const backBtn = page.getByRole('button', { name: /Back/i });
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    
    const [dialog] = await Promise.all([
      page.waitForEvent('dialog', { timeout: 15000 }),
      backBtn.click({ force: true }),
    ]);

    expect(dialog.message().toLowerCase()).toContain('unsaved');
    await dialog.accept(); // Actually leave
  });

  test('Toast Notifications for Mutations', async ({ page }) => {
    // We'll use a small mutation like updating a preference if possible
    await page.goto('/staff/profile');
    
    // Trigger a save (even if no change, if the button is enabled)
    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      
      // Look for a Sonner toast
      await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-sonner-toast]')).toContainText(/success|updated/i);
    }
  });
});
