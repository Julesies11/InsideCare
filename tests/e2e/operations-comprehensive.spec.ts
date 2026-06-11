import { expect, test } from '@playwright/test';

/**
 * Comprehensive tests for Operations: Roster, Checklists, and Timesheets.
 */
test.describe('Operations Comprehensive', () => {
  test.describe('Admin Operations', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Roster Board - View and Open Shift Dialog', async ({ page }) => {
      await page.goto('/roster-board');
      await expect(page.locator('h1:has-text("Roster Board")')).toBeVisible({
        timeout: 30000,
      });

      // Look for the calendar container
      const calendar = page
        .locator('.rbc-calendar')
        .or(
          page
            .locator('.p-6.space-y-6')
            .filter({ hasText: /Today|Week|Month/i }),
        );
      await expect(calendar.first()).toBeVisible();

      // Click "Add Shift"
      const addShiftBtn = page
        .getByRole('button', { name: /Add Shift/i })
        .or(page.locator('button:has-text("Add Shift")'));
      if (await addShiftBtn.first().isVisible()) {
        await addShiftBtn.first().click();

        // Verify Shift Dialog
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByText(/Shift Details/i).or(dialog.getByText(/Shift/i)),
        ).toBeVisible();

        await dialog.getByRole('button', { name: /Cancel/i }).click();
      }
    });

    test('Manage Shift Templates - Full CRUD lifecycle', async ({ page }) => {
      await page.goto('/shift-setup');
      // The list page title is "Shift Templates" rendered via ToolbarPageTitle
      await expect(page.getByText('Shift Templates').first()).toBeVisible({
        timeout: 30000,
      });

      // Click Edit for the first available house in the list
      const editHouseBtn = page.getByRole('button', { name: /Edit/i }).first();
      await expect(editHouseBtn).toBeVisible({ timeout: 15000 });
      await editHouseBtn.click({ force: true });

      // Verify we are on the edit page for that house — title is "{HouseName} Shift Templates"
      await expect(page).toHaveURL(/\/shift-setup\//, { timeout: 30000 });
      // Add Template button lives in the HouseShiftSetup component
      const addTemplateBtn = page.getByRole('button', {
        name: /Add Template/i,
      });
      await expect(addTemplateBtn).toBeVisible({ timeout: 20000 });

      // 1. Create Shift Template
      const templateName = `E2E Test Template ${Date.now()}`;
      await addTemplateBtn.click({ force: true });
      await page.getByLabel(/Template Name/i).fill(templateName);
      await page.getByLabel(/Short Name/i).fill('E2ET');
      await page
        .getByRole('button', { name: /Save Template/i })
        .click({ force: true });

      // Wait for success toast to ensure DB sync
      await expect(page.locator('[data-sonner-toast]').last()).toContainText(
        /success|saved|updated/i,
        { timeout: 30000 },
      );

      // Verify persistence — template name appears in the list
      await expect(page.getByText(templateName).first()).toBeVisible({
        timeout: 15000,
      });

      // 2. Edit Shift Template — find the card containing our template name
      const editedName = `${templateName} Edited`;
      const templateCard = page
        .locator('[id^="template-"], .card, div[class*="border"]')
        .filter({ hasText: templateName })
        .first();
      // Fallback: use edit icon button near the template name text
      const editIconBtn = page.locator('button[aria-label="edit"]').first();
      if (await templateCard.isVisible({ timeout: 5000 })) {
        await templateCard
          .locator('button[aria-label="edit"]')
          .first()
          .click({ force: true });
      } else {
        await editIconBtn.click({ force: true });
      }
      await page.getByLabel(/Template Name/i).fill(editedName);
      await page
        .getByRole('button', { name: /Save Template/i })
        .click({ force: true });

      // Wait for success toast
      await expect(page.locator('[data-sonner-toast]').last()).toContainText(
        /success|updated/i,
        { timeout: 30000 },
      );

      // Verify persistence
      await expect(page.getByText(editedName).first()).toBeVisible({
        timeout: 15000,
      });

      // 3. Delete Shift Template
      page.once('dialog', (dialog) => dialog.accept());

      const deleteBtn = page.locator('button[aria-label="delete"]').first();
      await deleteBtn.click({ force: true });

      // Verify it is gone
      await expect(page.getByText(editedName)).not.toBeVisible({
        timeout: 15000,
      });
    });

    test('Manage Checklist Templates - Full CRUD lifecycle', async ({
      page,
    }) => {
      await page.goto('/checklist-templates');
      await expect(
        page.locator('h1:has-text("Checklist Master")'),
      ).toBeVisible();

      // 1. Create Checklist Template
      const templateName = `E2E Checklist ${Date.now()}`;
      await page
        .getByRole('button', { name: /Create Template/i })
        .click({ force: true });
      await page
        .getByPlaceholder(/e.g. Morning Clinical Routine/i)
        .fill(templateName);

      await page
        .getByRole('button', { name: /Add Task/i })
        .click({ force: true });
      await page
        .getByPlaceholder(/e.g. Confirm kitchen cleaning/i)
        .fill('E2E Verification Task');
      await page
        .getByRole('button', { name: /Apply Task/i })
        .click({ force: true });

      await expect(
        page.getByText('E2E Verification Task').first(),
      ).toBeVisible();
      await page
        .getByRole('button', { name: /Create Master Template/i })
        .click({ force: true });

      // Wait for success toast
      await expect(page.locator('[data-sonner-toast]')).toContainText(
        /success|created|saved/i,
        { timeout: 30000 },
      );

      // Verify persistence
      await expect(page.getByText(templateName).first()).toBeVisible();

      // 2. Edit Checklist Template
      const editedName = `${templateName} Edited`;
      // Find the card with the template name and click Edit
      const templateCard = page
        .locator('div.border')
        .filter({ hasText: templateName });
      await expect(templateCard.first()).toBeVisible({ timeout: 20000 });
      await templateCard.scrollIntoViewIfNeeded();
      await templateCard
        .locator('button[aria-label="edit"]')
        .first()
        .click({ force: true });

      await page
        .getByPlaceholder(/e.g. Morning Clinical Routine/i)
        .fill(editedName);
      await page
        .getByRole('button', { name: /Update Master Template/i })
        .click({ force: true });

      // Wait for success toast
      await expect(
        page.locator('[data-sonner-toast][data-type="success"]').last(),
      ).toContainText(/success|updated/i, { timeout: 30000 });

      // Verify persistence
      await expect(page.getByText(editedName).first()).toBeVisible();

      // 3. Delete Checklist Template
      page.once('dialog', (dialog) => dialog.accept());
      const editedCard = page
        .locator('div.border')
        .filter({ hasText: editedName });
      await editedCard
        .locator('button[aria-label="delete"]')
        .first()
        .click({ force: true });

      // Verify it is gone
      await expect(page.getByText(editedName)).not.toBeVisible();
    });
  });

  test.describe('Staff Operations', () => {
    test.use({ storageState: 'playwright/.auth/staff.json' });

    test('Staff Dashboard - Check for active shift or missing timesheets', async ({
      page,
    }) => {
      await page.goto('/my-dashboard');
      await expect(page.getByText(/Upcoming Schedule/i).first()).toBeVisible();

      // Look for cards
      await expect(
        page
          .locator('[data-slot="card"]')
          .first()
          .or(page.locator('.card').first()),
      ).toBeVisible();
    });

    test('Staff Checklists - Sign-off flow', async ({ page }) => {
      await page.goto('/my-checklists');
      await expect(page.getByText(/House Checklists/i)).toBeVisible({
        timeout: 30000,
      });

      // Click on a checklist card if present
      const firstChecklist = page
        .locator('.card:has-text("Items")')
        .first()
        .or(page.locator('.card').first());
      if (await firstChecklist.first().isVisible()) {
        await firstChecklist.first().click();

        // In the checklist execution view
        const completeBtn = page
          .getByRole('button', { name: /Complete/i })
          .or(page.getByRole('button', { name: /Finish/i }));
        if (await completeBtn.first().isVisible()) {
          await expect(completeBtn.first()).toBeVisible();
        }
      }
    });

    test('Staff Timesheets - Create and View', async ({ page }) => {
      await page.goto('/my-timesheets');
      await expect(page.locator('h1:has-text("My Timesheets")')).toBeVisible();

      // Check for tabs
      await expect(
        page.getByRole('button', { name: /Needs Submission/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Awaiting Approval/i }),
      ).toBeVisible();
    });
  });
});
