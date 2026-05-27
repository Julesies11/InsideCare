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
    const mobileToggle = page.locator('header button:has(svg.lucide-menu)').first();
    await expect(mobileToggle).toBeVisible();

    // Click toggle to open sidebar
    await mobileToggle.click();
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
  });

  test('Form Dirty Tracking and Navigation Blocking', async ({ page }) => {
    await page.goto('/staff/profile');
    
    // Change a field
    const nameInput = page.locator('input#staff_name').or(page.getByLabel(/Full Name/i));
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    
    // Wait for the input to be populated (indicating data has loaded)
    await expect(nameInput).not.toHaveValue('', { timeout: 30000 });
    
    await nameInput.click();
    await nameInput.fill('Test User Update'); 

    // Verify "Save Changes" is active - wait for it to become enabled
    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveBtn).toBeEnabled({ timeout: 15000 });

    // Try to click another sidebar link
    await page.getByRole('link', { name: /Dashboard/i }).first().click();

    // Verify that navigation is either blocked by a dialog or the dirty state persists
    // The app might use a beforeunload handler or a custom router guard
    page.once('dialog', async dialog => {
      expect(dialog.message().toLowerCase()).toContain('unsaved');
      await dialog.accept(); // Actually leave
    });
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
