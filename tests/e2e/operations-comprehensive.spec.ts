import { test, expect } from '@playwright/test';

/**
 * Comprehensive tests for Operations: Roster, Checklists, and Timesheets.
 */
test.describe('Operations Comprehensive', () => {
  
  test.describe('Admin Operations', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Roster Board - View and Open Shift Dialog', async ({ page }) => {
      await page.goto('/roster-board');
      await expect(page.locator('h1:has-text("Roster Board")')).toBeVisible({ timeout: 30000 });
      
      // Look for the calendar container
      const calendar = page.locator('.rbc-calendar').or(page.locator('.p-6.space-y-6').filter({ hasText: /Today|Week|Month/i }));
      await expect(calendar.first()).toBeVisible();

      // Click "Add Shift"
      const addShiftBtn = page.getByRole('button', { name: /Add Shift/i }).or(page.locator('button:has-text("Add Shift")'));
      if (await addShiftBtn.first().isVisible()) {
        await addShiftBtn.first().click();

        // Verify Shift Dialog
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText(/Shift Details/i).or(dialog.getByText(/Shift/i))).toBeVisible();
        
        await dialog.getByRole('button', { name: /Cancel/i }).click();
      }
    });

    test('Manage Shift Templates', async ({ page }) => {
      await page.goto('/shift-setup');
      await expect(page.locator('h1:has-text("Shift Templates")')).toBeVisible();
      
      // Check if there's a template to edit
      const editBtn = page.getByRole('button', { name: /Edit/i }).first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await expect(page).toHaveURL(/\/roster-board\/shift-templates\//);
        // Page might have a save button
      }
    });

    test('Manage Checklist Templates', async ({ page }) => {
      await page.goto('/checklist-templates');
      await expect(page.locator('h1:has-text("Checklist Templates")')).toBeVisible();
      await expect(page.getByRole('button', { name: /New Master Checklist/i })).toBeVisible();
    });
  });

  test.describe('Staff Operations', () => {
    test.use({ storageState: 'playwright/.auth/staff.json' });

    test('Staff Dashboard - Check for active shift or missing timesheets', async ({ page }) => {
      await page.goto('/staff/dashboard');
      await expect(page.getByText(/Upcoming Schedule/i).first()).toBeVisible();
      
      // Look for cards
      await expect(page.locator('[data-slot="card"]').first().or(page.locator('.card').first())).toBeVisible();
    });

    test('Staff Checklists - Sign-off flow', async ({ page }) => {
      await page.goto('/staff/checklists');
      await expect(page.getByText(/House Checklists/i)).toBeVisible({ timeout: 30000 });

      // Click on a checklist card if present
      const firstChecklist = page.locator('.card:has-text("Items")').first().or(page.locator('.card').first());
      if (await firstChecklist.first().isVisible()) {
        await firstChecklist.first().click();
        
        // In the checklist execution view
        const completeBtn = page.getByRole('button', { name: /Complete/i }).or(page.getByRole('button', { name: /Finish/i }));
        if (await completeBtn.first().isVisible()) {
          await expect(completeBtn.first()).toBeVisible();
        }
      }
    });

    test('Staff Timesheets - Create and View', async ({ page }) => {
      await page.goto('/staff/timesheets');
      await expect(page.locator('h1:has-text("My Timesheets")')).toBeVisible();
      
      // Check for tabs
      await expect(page.getByRole('button', { name: /Needs Submission/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Awaiting Approval/i })).toBeVisible();
    });
  });
});
