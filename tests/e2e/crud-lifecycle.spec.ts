import { expect, test } from '@playwright/test';

/**
 * COMPREHENSIVE CRUD INTEGRATION TESTS
 *
 * These tests verify the full lifecycle of data entities (Create -> Read -> Update -> Delete).
 * They follow the app's "Create (Draft) -> Navigate to Detail -> Edit" flow.
 */

test.describe('Staff Lifecycle CRUD', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Complete Staff Record Lifecycle', async ({ page }) => {
    test.slow();
    const timestamp = Date.now();
    const staffName = `Test Engineer ${timestamp}`;

    // 1. Create Staff
    await page.goto('/staff');
    await page
      .getByRole('button', { name: /Add Staff/i })
      .click({ force: true });

    await expect(page).toHaveURL(/\/employees\/staff-detail\//, {
      timeout: 45000,
    });
    await expect(page.getByText(/Loading staff member/i)).not.toBeVisible({
      timeout: 30000,
    });
    await expect(
      page
        .getByRole('heading', { name: /Staff Details/i })
        .or(page.getByText(/Staff Profile/i))
        .first(),
    ).toBeVisible({ timeout: 30000 });

    // 2. Update Basic Info
    await page.locator('input#staff_name').fill(staffName, { timeout: 30000 });
    const staffEmail = `test.staff.${timestamp}@insidecare.com.au`;
    await page.locator('input#email').fill(staffEmail);
    await page.locator('textarea#hobbies').fill('Automated Testing');

    // 3. Set Compliance
    await page
      .getByText(/Compliance/i)
      .first()
      .click({ force: true });
    const complianceRows = page.locator('#staff_compliance table tbody tr');
    const rowCount = await complianceRows.count();
    if (rowCount > 0) {
      const firstCheckbox = complianceRows
        .first()
        .locator('input[type="checkbox"]');
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click({ force: true });
      }
    }

    // 4. Add Training
    await page
      .getByText(/Training/i)
      .first()
      .click({ force: true });
    const addTrainingBtn = page.getByRole('button', { name: /Add Training/i });
    await expect(addTrainingBtn).toBeVisible({ timeout: 20000 });
    await addTrainingBtn.click({ force: true });

    await page.locator('input#title').fill('Fire Safety');
    await page.locator('input#category').fill('Safety');
    await page.getByRole('button', { name: /Save/i }).click({ force: true });

    // 5. Final Save
    const saveButton = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveButton).toBeEnabled({ timeout: 20000 });
    await saveButton.click({ force: true });
    await expect(
      page
        .locator('[data-sonner-toast]')
        .filter({ hasText: /success|updated/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });

    // 6. Activation (Business Logic)
    await page
      .getByRole('button', { name: /Activate Staff/i })
      .click({ force: true });

    // Use dialog-specific locator to avoid ambiguity with toolbar buttons
    const activationDialog = page.getByRole('dialog');
    await expect(activationDialog).toBeVisible({ timeout: 10000 });
    await activationDialog
      .getByRole('button', { name: /Activate Only/i })
      .or(activationDialog.getByRole('button', { name: /Activate Staff/i }))
      .click({ force: true });

    await expect(
      page
        .locator('[data-sonner-toast]')
        .filter({ hasText: /activated/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });
    await expect(activationDialog).not.toBeVisible();

    // 7. Cleanup (Deactivate)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Loading/i').first()).not.toBeVisible({
      timeout: 30000,
    });

    const deactivateBtn = page.getByRole('button', { name: /Deactivate/i });
    await expect(deactivateBtn).toBeVisible({ timeout: 30000 });
    await deactivateBtn.scrollIntoViewIfNeeded();
    await deactivateBtn.click({ force: true });
    await page
      .getByRole('button', { name: /Deactivate Only/i })
      .or(page.getByRole('button', { name: /Deactivate Staff/i }))
      .click({ force: true });
    await expect(
      page
        .locator('[data-sonner-toast]')
        .filter({ hasText: /deactivated/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Participant Lifecycle CRUD', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Complete Participant Record Lifecycle', async ({ page }) => {
    test.slow();
    const participantName = `Test Participant ${Date.now()}`;

    // 1. Create Participant
    await page.goto('/participants/profiles');
    await page
      .getByRole('button', { name: /Add Participant/i })
      .click({ force: true });

    await expect(page).toHaveURL(/\/participants\/detail\//, {
      timeout: 45000,
    });
    await expect(
      page
        .getByRole('heading', { name: /Participant Details/i })
        .or(page.getByText(/Participant Details/i))
        .first(),
    ).toBeVisible({ timeout: 30000 });

    // 2. Update Details
    const nameInput = page.locator('input#participant_name');
    await expect(nameInput).toBeVisible({ timeout: 30000 });
    await nameInput.fill(participantName);
    await page.locator('input#ndis_number').fill('123456789');

    // 3. Add Goal
    await page.getByText(/Goals/i).first().click({ force: true });
    await expect(page.getByRole('button', { name: /Add Goal/i })).toBeEnabled({
      timeout: 20000,
    });
    await page
      .getByRole('button', { name: /Add Goal/i })
      .click({ force: true });

    // Wait for Dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await page.locator('textarea#description').fill('Learn Automated Testing');
    await page
      .getByRole('button', { name: /Save/i, exact: true })
      .click({ force: true });
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 4. Final Save
    const saveButton = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveButton).toBeEnabled({ timeout: 20000 });
    await saveButton.click({ force: true });
    await expect(
      page
        .locator('[data-sonner-toast]')
        .filter({ hasText: /success|saved/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });

    // 5. Cleanup (Inactive)
    await page
      .getByLabel(/Status/i)
      .first()
      .click({ force: true });
    await page
      .getByRole('option', { name: /Inactive/i })
      .click({ force: true });
    await page
      .getByRole('button', { name: /Save Changes/i })
      .click({ force: true });
    await expect(
      page
        .locator('[data-sonner-toast]')
        .filter({ hasText: /success|saved/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });
  });
});

test.describe('House Lifecycle CRUD', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Create and Configure House', async ({ page }) => {
    test.slow();
    const houseName = `Automation House ${Date.now()}`;

    // 1. Create House
    await page.goto('/houses');
    await page
      .getByRole('button', { name: /Add House/i })
      .click({ force: true });
    await expect(page).toHaveURL(/\/houses\/detail\//, { timeout: 45000 });
    await expect(
      page.getByRole('heading', { name: /House Details/i }).first(),
    ).toBeVisible({ timeout: 30000 });

    // 2. Edit Basic Details
    const nameInput = page.locator('input#house_name');
    await expect(nameInput).toBeVisible({ timeout: 30000 });
    await nameInput.fill(houseName);
    await page.locator('textarea#address').fill('123 Testing Lane');

    // 3. Add Checklist (Section CRUD)
    await page
      .getByText(/Checklist Setup/i)
      .first()
      .click({ force: true });
    const addChecklistBtn = page.getByRole('button', {
      name: /Add Checklist/i,
    });
    await expect(addChecklistBtn).toBeVisible({ timeout: 20000 });
    await addChecklistBtn.click({ force: true });
    const checklistInput = page
      .getByPlaceholder(/Morning Routine/i)
      .or(page.getByPlaceholder(/e.g. Morning Routine/i))
      .first();
    await expect(checklistInput).toBeVisible({ timeout: 15000 });
    await checklistInput.fill('Kitchen Clean');
    await page
      .getByRole('button', { name: /Save Checklist/i })
      .click({ force: true });

    // 4. Save & Finalize
    const saveButton = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveButton).toBeEnabled({ timeout: 20000 });
    await saveButton.click({ force: true });
    await expect(
      page
        .locator('[data-sonner-toast]')
        .filter({ hasText: /success|saved/i })
        .first(),
    ).toBeVisible({ timeout: 30000 });

    // 5. Verification (Skip status update as it is missing from UI)
    await page.reload();
    await expect(page.locator('input#house_name')).toHaveValue(houseName);
  });
});
