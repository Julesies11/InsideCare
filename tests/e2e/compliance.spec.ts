import { expect, test } from '@playwright/test';

/**
 * COMPLIANCE MODULE E2E TESTS
 * Covers Monitoring, Settings, Profile Management, and Reporting.
 */
test.describe('Compliance Management', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // Increase timeouts for these complex pages
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
  });

  test('Admin can use the Compliance Monitoring Dashboard', async ({ page }) => {
    await page.goto('/admin/compliance-monitoring');
    await expect(page.locator('h1')).toContainText(/Compliance Monitoring|Compliance Audit Directory/i);

    // Verify table loads
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });

    // Test filtering by status
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Expiring Soon');
      await page.waitForLoadState('networkidle');
    }

    // Verify drill-down to staff profile
    const firstRowAction = page
      .locator('table tbody tr')
      .first()
      .locator('a[href*="/employees/staff-detail/"]');
    
    if (await firstRowAction.isVisible()) {
      await firstRowAction.click({ force: true });
      await expect(page).toHaveURL(/\/employees\/staff-detail\//);
    }
  });

  test('Admin can manage Compliance Settings (Master List)', async ({
    page,
  }) => {
    await page.goto('/admin/compliance-settings');
    await page.getByRole('button', { name: /Add Compliance Type/i }).click({ force: true });

    const typeName = `E2E-Requirement-${Date.now()}`;
    await page.locator('#type-name').fill(typeName);
    await page.locator('#type-desc').fill('Automated Test Requirement');

    // Toggle switches
    await page.locator('#expiry-app').click({ force: true });

    await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });

    // Verify success toast - using filter to avoid ambiguity
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /added|saved|updated/i }),
    ).toBeVisible();
    await expect(page.getByText(typeName)).toBeVisible();

    // 2. Edit existing type
    const editBtn = page
      .locator('tr', { hasText: typeName })
      .locator('button')
      .first();
    await editBtn.click({ force: true });
    await page.locator('#type-desc').fill('Updated Description');
    await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /updated|saved/i }),
    ).toBeVisible();

    // 3. Deactivate type
    const deactivateBtn = page
      .locator('tr', { hasText: typeName })
      .getByRole('button', { name: /Deactivate/i });
    await deactivateBtn.click({ force: true });
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /deactivated/i }),
    ).toBeVisible();
    await expect(
      page.locator('tr', { hasText: typeName }).getByText(/Inactive/i),
    ).toBeVisible();
  });

  test('Admin can manage ID Document Types', async ({ page }) => {
    await page.goto('/admin/compliance-settings');
    await page.getByRole('tab', { name: /100 Points of ID Config/i }).click({ force: true });

    // 1. Add New ID Doc Type
    await page.getByRole('button', { name: /Add ID Document Type/i }).click({ force: true });
    const docName = `E2E-ID-${Date.now()}`;
    await page.locator('#doc-name').fill(docName);
    await page.locator('#doc-points').fill('50');

    // Select category via Radix Select
    await page.locator('#doc-category').click({ force: true });
    await page.getByRole('option', { name: /Secondary/i }).click({ force: true });

    await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /added|saved|updated/i }),
    ).toBeVisible();
    await expect(page.getByText(docName)).toBeVisible();

    // 2. Deactivate ID Doc Type
    const deactivateBtn = page
      .locator('tr', { hasText: docName })
      .getByRole('button', { name: /Deactivate/i });
    await deactivateBtn.click({ force: true });
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /deactivated/i }),
    ).toBeVisible();
  });

  test('Staff Compliance Profile - Status Transitions', async ({ page }) => {
    // Navigate to a staff profile compliance tab
    await page.goto('/staff');
    await page.getByPlaceholder(/Search staff/i).fill('Julian');
    await page.waitForTimeout(1000);
    const julianLink = page
      .locator('a[href*="/employees/staff-detail/"]')
      .first();
    await julianLink.click({ force: true });

    try {
      await page.locator('[data-scrollspy-anchor="staff_compliance"]').click({ timeout: 5000, force: true });
    } catch (e) {
      const url = page.url();
      await page.goto(`${url}${url.includes('?') ? '&' : '?'}tab=compliance`);
    }

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
    await inProgressBtn.click({ force: true });

    // Check if form fields appear (Doc #, Comments)
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
    await naBtn.click({ force: true });
    await expect(targetRow.getByText(/marked as Not Applicable/i)).toBeVisible();
    await targetRow
      .getByPlaceholder(/Enter any additional notes/i)
      .fill('Test N/A reason');

    // 3. Mark back to Complete (if applicable)
    const completeBtn = targetRow.getByRole('button', { name: /Complete/i });
    if (await completeBtn.isVisible()) {
      await completeBtn.click({ force: true });
      // Use more robust check for success state
      await expect(
        targetRow.getByRole('button', { name: /Complete/i }),
      ).toHaveClass(/bg-white|text-success/);
    }

    // 4. Global Save
    await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /updated|saved/i }),
    ).toBeVisible();
  });

  test('Compliance Monitoring Report - Gold Standard Layout', async ({
    page,
  }) => {
    await page.goto('/admin/compliance-monitoring');

    // Toggle to 'Report' view if there's a toggle, or just verify the detailed view
    await expect(page.locator('table').first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Requirement/i }).first()).toBeVisible();

    // Filter to a specific house if possible
    const houseFilter = page.locator('select').nth(1); // Assuming 2nd select is house
    if (await houseFilter.isVisible()) {
      await houseFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    }

    // Verify row density and presence of status indicators
    const row = page.locator('table tbody tr').first();
    await expect(row).toBeVisible();
    await expect(row.locator('.badge, [data-slot="badge"]')).toBeVisible();
  });
});
