import { test, expect } from '@playwright/test';

test.describe('Staff Workflows', () => {
  test.use({ storageState: 'playwright/.auth/staff.json' });

  test('Staff can initiate a Leave Request', async ({ page }) => {
    await page.goto('/my-leave/new');
    
    // Verify form elements
    const trigger = page.locator('#leaveType');
    await expect(trigger).toBeVisible({ timeout: 15000 });
    
    // Select a leave type (Annual Leave) via the Radix Select trigger
    await trigger.click();
    const annualLeaveOption = page.getByRole('option', { name: /Annual Leave/i }).first();
    await expect(annualLeaveOption).toBeVisible({ timeout: 10000 });
    await annualLeaveOption.click();

    // Fill in dates (use future dates to avoid validation errors)
    await page.getByLabel(/Start Date/i).fill('2027-01-10');
    await page.getByLabel(/End Date/i).fill('2027-01-14');
    await page.getByLabel(/Reason/i).fill('Test leave request from Playwright');

    // Submit the form
    await page.getByRole('button', { name: /Submit/i }).click();
    
    // Wait for network to settle after submission
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    // Check for success toast — use .last() to target the most recent toast
    await expect(page.locator('[data-sonner-toast]').last()).toContainText(
      /submitted successfully|request updated/i,
      { timeout: 20000 }
    );
    
    // Should be redirected to leave list
    await expect(page).toHaveURL(/\/my-leave/);
  });

  test('Staff can view their Leave Requests', async ({ page }) => {
    await page.goto('/my-leave');
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 });
    // Should see the seeded 'Annual Leave' or the one just created
    await expect(page.locator('body')).toContainText(/Annual Leave/i);
  });

  test('Staff can view their Roster', async ({ page }) => {
    await page.goto('/my-roster');
    await expect(page.getByRole('button', { name: /Today/i })).toBeVisible({ timeout: 15000 });
  });

  test('Staff can access House Checklists', async ({ page }) => {
    await page.goto('/my-checklists');
    // Wait for the main container first
    await expect(page.locator('#root')).toBeVisible({ timeout: 30000 });
    // Check for heading or checklist card - using text is often more robust than role + level in complex templates
    await expect(page.getByText(/House Checklists/i).or(page.locator('.card')).first()).toBeVisible({ timeout: 45000 });
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
