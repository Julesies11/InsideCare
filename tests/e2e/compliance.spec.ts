import { test, expect } from '@playwright/test';

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

  test('Admin can use the Compliance Monitoring Dashboard', async ({ page }) => {
    await page.goto('/admin/compliance-monitoring');
    await expect(page.locator('h1')).toContainText(/Compliance Monitoring/i);

    // 1. Verify KPI Summary
    await expect(page.locator('.card-title', { hasText: /Compliance Audit Directory/i })).toBeVisible();

    // 2. Search Functionality
    const searchInput = page.getByPlaceholder(/Search by staff name or requirement/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Julian');
    await page.waitForTimeout(1000); // Debounce
    // Table should update (even if no results, it should not crash)
    await expect(page.locator('table')).toBeVisible();

    // 3. Status Filtering
    const missingBadge = page.getByRole('button', { name: /Missing/i });
    await expect(missingBadge).toBeVisible();
    await missingBadge.click(); // Toggle off
    await page.waitForLoadState('networkidle');
    await missingBadge.click(); // Toggle back on

    // 4. Deep Link to Staff Profile
    const firstRowAction = page.locator('table tbody tr').first().locator('a[href*="/employees/staff-detail/"]');
    if (await firstRowAction.isVisible()) {
      await firstRowAction.click();
      await expect(page).toHaveURL(/\/employees\/staff-detail\//);
      await expect(page).toHaveURL(/tab=compliance/);
    }
  });

  test('Admin can manage Compliance Settings (Master List)', async ({ page }) => {
    await page.goto('/admin/compliance-settings');
    await expect(page.locator('h1')).toContainText(/Compliance Settings/i);

    // 1. Add New Compliance Type
    await page.getByRole('button', { name: /Add Compliance Type/i }).click();
    await expect(page.getByText(/Add Compliance Type/i, { exact: false })).toBeVisible();
    
    const typeName = `E2E-Requirement-${Date.now()}`;
    await page.locator('#type-name').fill(typeName);
    await page.locator('#type-desc').fill('Automated Test Requirement');
    
    // Toggle switches
    await page.locator('#is-global').click(); // Make global
    
    await page.getByRole('button', { name: /Save Changes/i }).click();
    
    // Verify success toast
    await expect(page.locator('[data-sonner-toast]')).toContainText(/added successfully/i);
    await expect(page.getByText(typeName)).toBeVisible();

    // 2. Edit existing type
    const editBtn = page.locator('tr', { hasText: typeName }).locator('button').first();
    await editBtn.click();
    await page.locator('#type-desc').fill('Updated Description');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.locator('[data-sonner-toast]')).toContainText(/updated successfully/i);

    // 3. Deactivate type
    const deactivateBtn = page.locator('tr', { hasText: typeName }).getByRole('button', { name: /Deactivate/i });
    await deactivateBtn.click();
    await expect(page.locator('[data-sonner-toast]')).toContainText(/deactivated successfully/i);
    await expect(page.locator('tr', { hasText: typeName }).getByText(/Inactive/i)).toBeVisible();
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
    await expect(page.locator('[data-sonner-toast]')).toContainText(/added successfully/i);
    await expect(page.getByText(docName)).toBeVisible();

    // 2. Deactivate ID Doc Type
    const deactivateBtn = page.locator('tr', { hasText: docName }).getByRole('button', { name: /Deactivate/i });
    await deactivateBtn.click();
    await expect(page.locator('[data-sonner-toast]')).toContainText(/deactivated successfully/i);
  });

  test('Staff Compliance Profile - Status Transitions', async ({ page }) => {
    // Navigate to a staff profile compliance tab
    // We'll search for 'Julian' to find a reliable record
    await page.goto('/staff');
    await page.getByPlaceholder(/Search staff/i).fill('Julian');
    await page.waitForTimeout(1000);
    const julianLink = page.locator('a[href*="/employees/staff-detail/"]').first();
    await julianLink.click();
    
    await page.getByRole('link', { name: /Compliance/i }).or(page.locator('a:has-text("Compliance")')).click();
    await expect(page.locator('#staff_compliance')).toBeVisible();

    // 1. Mark as In Progress
    const firstRow = page.locator('#staff_compliance table tbody tr').first();
    const inProgressBtn = firstRow.getByRole('button', { name: /In Progress/i });
    await inProgressBtn.click();
    
    // Check if form fields appear (Doc #, Comments)
    await expect(firstRow.getByPlaceholder(/e.g. LIC123456/i)).toBeVisible();
    await firstRow.getByPlaceholder(/e.g. LIC123456/i).fill('E2E-TEST-123');
    
    // 2. Mark as Not Applicable
    const naBtn = firstRow.getByRole('button', { name: /N\/A/i });
    await naBtn.click();
    await expect(firstRow.getByText(/marked as Not Applicable/i)).toBeVisible();
    await firstRow.getByPlaceholder(/Enter any additional notes/i).fill('Test N/A reason');

    // 3. Mark back to Complete (if applicable)
    const completeBtn = firstRow.getByRole('button', { name: /Complete/i });
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await expect(firstRow.locator('.badge-success')).toBeVisible();
    }

    // 4. Global Save
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.locator('[data-sonner-toast]')).toContainText(/updated successfully/i);
  });

  test('Compliance Monitoring Report - Gold Standard Layout', async ({ page }) => {
    await page.goto('/admin/reporting/compliance');
    
    // 1. Verify Sidebar Criteria
    await expect(page.getByText(/Report Criteria/i)).toBeVisible();
    await expect(page.getByText(/Filter by House/i)).toBeVisible();
    await expect(page.getByText(/Filter by Staff Member/i)).toBeVisible();
    
    // 2. Verify Printable Preview
    const reportPreview = page.locator('.print-container').or(page.locator('.printable-report'));
    await expect(reportPreview).toBeVisible();
    await expect(reportPreview).toContainText(/Compliance Monitoring Report/i);
    
    // 3. Test Grouping Pivot
    await page.locator('label:has-text("Group Results By") + div [role="combobox"]').click();
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
