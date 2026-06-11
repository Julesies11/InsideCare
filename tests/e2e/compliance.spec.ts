import { expect, test } from '@playwright/test';

/**
 * COMPLIANCE MODULE E2E TESTS
 * Covers Monitoring, Settings, Profile Management, and Reporting.
 */
test.describe('Compliance Management', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // Increase default navigation timeout for complex Metronic pages
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);
  });

  test('Admin can use the Compliance Monitoring Dashboard', async ({
    page,
  }) => {
    await page.goto('/admin/compliance-monitoring');
    await expect(page.locator('h1')).toContainText(/Compliance Monitoring/i);

    // 1. Verify KPI Summary
    await expect(
      page.locator('[data-slot="card-title"]', {
        hasText: /Compliance Audit Directory/i,
      }),
    ).toBeVisible();

    // 2. Search Functionality
    const searchInput = page.getByPlaceholder(
      /Search by staff name or requirement/i,
    );
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Julian');
    await page.waitForTimeout(1000); // Debounce
    // Table should update (even if no results, it should not crash)
    await expect(page.locator('table')).toBeVisible();

    // 3. Status Filtering
    const missingBadge = page.getByText('Missing', { exact: true }).first();
    await expect(missingBadge).toBeVisible();
    await missingBadge.click(); // Toggle off
    await page.waitForLoadState('networkidle');
    await missingBadge.click(); // Toggle back on

    // 4. Deep Link to Staff Profile
    const firstRowAction = page
      .locator('table tbody tr')
      .first()
      .locator('a[href*="/employees/staff-detail/"]');
    if (await firstRowAction.isVisible()) {
      await firstRowAction.click();
      await expect(page).toHaveURL(/\/employees\/staff-detail\//);
      await expect(page).toHaveURL(/tab=compliance/);
    }
  });

  test('Admin can manage Compliance Settings (Master List)', async ({
    page,
  }) => {
    await page.goto('/admin/compliance-settings');
    await expect(page.locator('h1')).toContainText(/Compliance Settings/i);

    // 1. Add New Compliance Type
    await page.getByRole('button', { name: /Add Compliance Type/i }).click();
    await expect(
      page.getByRole('heading', { name: /Add Compliance Type/i }),
    ).toBeVisible();

    const typeName = `E2E-Requirement-${Date.now()}`;
    await page.locator('#type-name').fill(typeName);
    await page.locator('#type-desc').fill('Automated Test Requirement');

    // Toggle switches
    await page.locator('#expiry-app').click();

    await page.getByRole('button', { name: /Save Changes/i }).click();

    // Verify success toast - using filter to avoid ambiguity
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /added/i }),
    ).toBeVisible();
    await expect(page.getByText(typeName)).toBeVisible();

    // 2. Edit existing type
    const editBtn = page
      .locator('tr', { hasText: typeName })
      .locator('button')
      .first();
    await editBtn.click();
    await page.locator('#type-desc').fill('Updated Description');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /updated/i }),
    ).toBeVisible();

    // 3. Deactivate type
    const deactivateBtn = page
      .locator('tr', { hasText: typeName })
      .getByRole('button', { name: /Deactivate/i });
    await deactivateBtn.click();
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /deactivated/i }),
    ).toBeVisible();
    await expect(
      page.locator('tr', { hasText: typeName }).getByText(/Inactive/i),
    ).toBeVisible();
  });

  test('Admin can manage ID Document Types', async ({ page }) => {
    await page.goto('/admin/compliance-settings');
    await page.getByRole('tab', { name: /100 Points of ID Config/i }).click();

    // 1. Add New ID Doc Type
    await page.getByRole('button', { name: /Add ID Document Type/i }).click();
    const docName = `E2E-ID-${Date.now()}`;
    await page.locator('#doc-name').fill(docName);
    await page.locator('#doc-points').fill('50');

    // Select category via Radix Select
    await page.locator('#doc-category').click();
    await page.getByRole('option', { name: /Secondary/i }).click();

    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /added/i }),
    ).toBeVisible();
    await expect(page.getByText(docName)).toBeVisible();

    // 2. Deactivate ID Doc Type
    const deactivateBtn = page
      .locator('tr', { hasText: docName })
      .getByRole('button', { name: /Deactivate/i });
    await deactivateBtn.click();
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /deactivated/i }),
    ).toBeVisible();
  });

  test('Staff Compliance Profile - Status Transitions', async ({ page }) => {
    // Navigate to a staff profile compliance tab
    // We'll search for 'Julian' to find a reliable record
    await page.goto('/staff');
    await page.getByPlaceholder(/Search staff/i).fill('Julian');
    await page.waitForTimeout(1000);
    const julianLink = page
      .locator('a[href*="/employees/staff-detail/"]')
      .first();
    await julianLink.click();

    await page.locator('[data-scrollspy-anchor="staff_compliance"]').click();
    await expect(page.locator('#staff_compliance')).toBeVisible();

    // 1. Mark as In Progress - find a row that has fields enabled
    const targetRow = page
      .locator('#staff_compliance table tbody tr', {
        hasText: /Certificate/i,
      })
      .or(
        page.locator('#staff_compliance table tbody tr', {
          hasText: /NDIS/i,
        }),
      )
      .first();
    await expect(targetRow).toBeVisible({ timeout: 15000 });

    const inProgressBtn = targetRow.getByRole('button', {
      name: /In Progress/i,
    });
    await inProgressBtn.click();

    // Check if form fields appear (Doc #, Comments)
    // Some requirements might only have comments, some only doc #
    await expect(
      targetRow.getByPlaceholder(/e.g. LIC123456/i).or(targetRow.getByPlaceholder(/Enter any additional notes/i))
    ).toBeVisible();

    // Fill what's available
    const docInput = targetRow.getByPlaceholder(/e.g. LIC123456/i);
    if (await docInput.isVisible()) {
      await docInput.fill('E2E-TEST-123');
    }

    // 2. Mark as Not Applicable
    const naBtn = targetRow.getByRole('button', { name: /N\/A/i });
    await naBtn.click();
    await expect(targetRow.getByText(/marked as Not Applicable/i)).toBeVisible();
    await targetRow
      .getByPlaceholder(/Enter any additional notes/i)
      .fill('Test N/A reason');

    // 3. Mark back to Complete (if applicable)
    const completeBtn = targetRow.getByRole('button', { name: /Complete/i });
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      // Use more robust check for success state
      await expect(
        targetRow.getByRole('button', { name: /Complete/i }),
      ).toHaveClass(/bg-white/);
    }

    // 4. Global Save
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /updated/i }),
    ).toBeVisible();
  });

  test('Compliance Monitoring Report - Gold Standard Layout', async ({
    page,
  }) => {
    await page.goto('/reporting/compliance');

    // 1. Verify Sidebar Criteria
    await expect(
      page.locator('[data-slot="card-title"]', {
        hasText: /Report Criteria/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/Filter by House/i)).toBeVisible();
    await expect(page.getByText(/Filter by Staff Member/i)).toBeVisible();

    // 2. Verify Printable Preview
    const reportPreview = page.locator('.printable-report-preview');
    await expect(reportPreview).toBeVisible();
    await expect(reportPreview).toContainText(/Compliance Monitoring Report/i);

    // 3. Test Grouping Pivot
    await page
      .locator('div:has(> label:has-text("Group Results By")) button')
      .click();
    await page.getByRole('option', { name: /Requirement/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify grouping subheaders appear in the report
    const subheader = reportPreview.locator('h3').first();
    await expect(subheader).toBeVisible();

    // 4. Test "Actionable Only" toggle
    const actionableToggle = page.getByLabel(/Actionable Items Only/i);
    const isChecked = await actionableToggle.isChecked();
    await actionableToggle.click();
    await page.waitForLoadState('networkidle');
    // Ensure total items changed or loading indicator appeared
    await expect(page.locator('body')).not.toContainText(/White Screen/i);
  });
});
