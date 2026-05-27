import { test, expect } from '@playwright/test';

test.describe('Leave Types Management', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin can access Leave Types page and manage list', async ({ page, browserName }) => {
    if (browserName === 'firefox') test.slow();
    await page.goto('/admin/leave-types');
    
    // Verify page heading
    await expect(page.getByRole('heading', { name: /Leave Types Configuration/i })).toBeVisible();
    
    // Open manage dialog
    await page.getByRole('button', { name: /Manage Master List/i }).click();
    await expect(page.getByText(/Manage Leave Type List/i)).toBeVisible();
    
    // Try adding a new leave type
    await page.getByRole('button', { name: /Add Leave Type/i }).click();
    
    const randomName = `Test Leave ${Math.floor(Math.random() * 10000)}`;
    await page.getByPlaceholder(/e.g., Annual Leave/i).fill(randomName);
    await page.getByRole('button', { name: /Add to List/i }).click();
    
    // Verify success toast
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-sonner-toast]')).toContainText(/added successfully/i);
    
    // Verify it appears in the table inside the dialog - give it more time for state update
    await expect(page.getByRole('dialog').getByRole('table')).toContainText(randomName, { timeout: 15000 });
    
    // Close dialog - use first() to avoid conflict with the 'X' close button if it exists
    await page.getByRole('button', { name: /Close/i }).first().click();
    
    // Verify it appears on the main page table
    await expect(page.locator('body')).toContainText(randomName, { timeout: 15000 });
  });
});
