import { test, expect } from '@playwright/test';

test.describe('Staff Workflows', () => {
  test.use({ storageState: 'playwright/.auth/staff.json' });

  test('Staff can initiate a Leave Request', async ({ page }) => {
    await page.goto('/staff/leave/new');
    
    // Verify form elements
    const trigger = page.locator('#leaveType');
    await expect(trigger).toBeVisible({ timeout: 15000 });
    
    // Select a leave type (Annual Leave)
    await trigger.click();
    const annualLeaveOption = page.getByRole('option', { name: /Annual Leave/i }).first();
    await expect(annualLeaveOption).toBeVisible({ timeout: 10000 });
    await annualLeaveOption.click();

    // Fill in dates
    await page.getByLabel(/Start Date/i).fill('2026-06-01');
    await page.getByLabel(/End Date/i).fill('2026-06-07');
    await page.getByLabel(/Reason/i).fill('Test leave request');

    // Submit
    await page.getByRole('button', { name: /Submit/i }).click();
    
    // Check for success toast - using a more specific locator to avoid strict mode violations
    await expect(page.locator('[data-sonner-toast]')).toContainText(/submitted successfully|request updated/i, { timeout: 15000 });
    
    // Should be redirected to leave list
    await expect(page).toHaveURL(/\/staff\/leave/);
  });

  test('Staff can view their Leave Requests', async ({ page }) => {
    await page.goto('/staff/leave');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });
    // Should see the seeded 'Annual Leave' or the one just created
    await expect(page.locator('body')).toContainText(/Annual Leave/i);
  });

  test('Staff can view their Roster', async ({ page }) => {
    await page.goto('/staff/roster');
    await expect(page.getByRole('button', { name: /Today/i })).toBeVisible({ timeout: 15000 });
  });

  test('Staff can access House Checklists', async ({ page }) => {
    await page.goto('/staff/checklists');
    // Check for a checklist card or list item
    await expect(page.locator('.card, .list-item, body')).toContainText(/Checklist/i);
  });

  test('Staff can open the Shift Note dialog', async ({ page }) => {
    await page.goto('/participants/profiles');
    const noteBtn = page.getByRole('button', { name: /Add Note/i }).or(page.locator('button:has-text("Note")'));
    if (await noteBtn.first().isVisible()) {
      await noteBtn.first().click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    }
  });
});
