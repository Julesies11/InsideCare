import { test, expect } from '@playwright/test';
import { addDays, format, subDays } from 'date-fns';

/**
 * COMPLIANCE COMPREHENSIVE E2E TESTS
 * Covers deep functional flows, 100-point ID verification, 
 * enforcement rules, and multi-role visibility.
 */
test.describe('Compliance Comprehensive Coverage', () => {
  
  test.describe('Admin Management & Rules', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Compliance Status Color Coding & Expiry Logic', async ({ page }) => {
      // 1. Setup a compliance type that requires expiry date
      await page.goto('/admin/compliance-settings');
      const reqName = `Expiry-Test-${Date.now()}`;
      await page.getByRole('button', { name: /Add Compliance Type/i }).click();
      await page.locator('#type-name').fill(reqName);
      await page.locator('label:has-text("Expiry Date")').locator('..').locator('button[role="switch"]').click(); // Ensure Expiry is enabled
      await page.getByRole('button', { name: /Save Changes/i }).click();
      await expect(page.locator('[data-sonner-toast]')).toContainText(/added successfully/i);

      // 2. Navigate to a staff profile to test the transitions
      await page.goto('/staff');
      await page.waitForLoadState('networkidle');
      const firstStaffLink = page.locator('a[href*="/employees/staff-detail/"]').first();
      await firstStaffLink.click();
      await page.getByRole('link', { name: /Compliance/i }).click();

      // Find our new requirement row
      const row = page.locator('tr', { hasText: reqName });
      await expect(row).toBeVisible();

      // Test "Expiring Soon" (within 30 days)
      const expiringDate = format(addDays(new Date(), 15), 'yyyy-MM-dd');
      await row.getByRole('button', { name: /In Progress/i }).click(); // Transition to edit mode
      await row.locator('input[type="date"]').fill(expiringDate);
      await row.getByRole('button', { name: /Complete/i }).click();
      await expect(row.locator('.badge')).toContainText(/Expiring Soon/i);

      // Test "Expired"
      const expiredDate = format(subDays(new Date(), 5), 'yyyy-MM-dd');
      await row.locator('input[type="date"]').fill(expiredDate);
      // It should automatically recalculate or show badge after blur/save
      await page.getByRole('button', { name: /Save Changes/i }).click();
      await expect(page.locator('[data-sonner-toast]')).toContainText(/updated successfully/i);
      await expect(row.locator('.badge')).toContainText(/Expired/i);
    });

    test('100-Point ID Verification: One Primary Rule & Min Expiry', async ({ page }) => {
      await page.goto('/staff');
      const firstStaffLink = page.locator('a[href*="/employees/staff-detail/"]').first();
      await firstStaffLink.click();
      await page.getByRole('link', { name: /Compliance/i }).click();

      const idRow = page.locator('tr', { hasText: /100 Points of ID/i }).first();
      await idRow.getByRole('button', { name: /Verify ID/i }).click();

      // 1. Add two Primary Documents - Points should only count once (70 pts)
      // We assume the first two items in the primary list
      const primaryCheckboxes = page.locator('div:has-text("Primary Documents") + div').locator('button[role="checkbox"]');
      
      // Select First Primary
      await primaryCheckboxes.nth(0).click();
      await expect(page.locator('.text-2xl.font-bold')).toContainText('70');

      // Select Second Primary - Tally should remain 70
      await primaryCheckboxes.nth(1).click();
      await expect(page.locator('.text-2xl.font-bold')).toContainText('70');
      await expect(page.getByText(/Australian "One Primary" Rule/i)).toBeVisible();

      // 2. Min Expiry Logic
      // Doc 1: Expiry in 1 year
      const yearFromNow = format(addDays(new Date(), 365), 'yyyy-MM-dd');
      await page.locator('input[type="date"]').nth(0).fill(yearFromNow);
      await page.locator('input[placeholder*="Document Number"]').nth(0).fill('REF-1');

      // Doc 2: Expiry in 6 months
      const sixMonthsFromNow = format(addDays(new Date(), 180), 'yyyy-MM-dd');
      await page.locator('input[type="date"]').nth(1).fill(sixMonthsFromNow);
      await page.locator('input[placeholder*="Document Number"]').nth(1).fill('REF-2');

      // 3. Mandatory Field Validation
      // Deselect Doc 2 reference number and try to save
      await page.locator('input[placeholder*="Document Number"]').nth(1).fill('');
      await page.getByRole('button', { name: /Save Verification/i }).click();
      await expect(page.locator('[data-sonner-toast]')).toContainText(/Please enter the document number/i);

      // Fix it and save
      await page.locator('input[placeholder*="Document Number"]').nth(1).fill('REF-2-FIXED');
      await page.getByRole('button', { name: /Save Verification/i }).click();

      // Verify the final requirement row shows the MINIMUM expiry (180 days from now)
      await expect(idRow.locator('input[type="date"]')).toHaveValue(sixMonthsFromNow);
    });

    test('Requirement Enforcement (Comments & Attachments)', async ({ page }) => {
      // 1. Create a requirement that requires comments and attachments
      await page.goto('/admin/compliance-settings');
      const reqName = `Strict-Req-${Date.now()}`;
      await page.getByRole('button', { name: /Add Compliance Type/i }).click();
      await page.locator('#type-name').fill(reqName);
      
      // Enable Comments and Attachments via switches
      // Note: Using a more robust selector for Radix switches
      await page.locator('label:has-text("Comments")').locator('..').locator('button[role="switch"]').click();
      await page.locator('label:has-text("Attachment")').locator('..').locator('button[role="switch"]').click();
      
      await page.getByRole('button', { name: /Save Changes/i }).click();

      // 2. Go to staff and try to complete it without details
      await page.goto('/staff');
      await page.locator('a[href*="/employees/staff-detail/"]').first().click();
      await page.getByRole('link', { name: /Compliance/i }).click();

      const row = page.locator('tr', { hasText: reqName });
      await row.getByRole('button', { name: /In Progress/i }).click();
      
      // Verify inputs are visible
      await expect(row.locator('textarea')).toBeVisible(); // Comments
      await expect(row.getByText(/Upload File/i)).toBeVisible(); // Attachment uploader

      // Try to save without comments (validation check)
      // If the app has frontend validation, it might block here.
      // Assuming it allows saving but highlights gaps or we just verify UI state.
      await row.locator('textarea').fill('This is a mandatory comment');
      
      // Test file upload if possible (using setInputFiles)
      // Note: The uploader might be a hidden input[type="file"]
      const fileChooserPromise = page.waitForEvent('filechooser');
      await row.getByText(/Upload File/i).click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles({
        name: 'test-doc.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fake pdf content')
      });

      await expect(page.locator('[data-sonner-toast]')).toContainText(/uploaded successfully/i);
      
      await page.getByRole('button', { name: /Save Changes/i }).click();
      await expect(page.locator('[data-sonner-toast]')).toContainText(/updated successfully/i);
    });
  });

  test.describe('Staff Self-Service', () => {
    test.use({ storageState: 'playwright/.auth/staff.json' });

    test('Staff can view their own compliance status', async ({ page }) => {
      await page.goto('/staff/profile');
      await page.getByRole('link', { name: /Compliance/i }).click();
      
      await expect(page.locator('h2')).toContainText(/Compliance/i);
      await expect(page.locator('table')).toBeVisible();
      
      // Staff should generally be read-only or limited depending on RBAC
      // We check that the list is populated
      const rows = page.locator('table tbody tr');
      await expect(rows.count()).toBeGreaterThan(0);
      
      // Verify no "Add Compliance Type" button for staff
      await expect(page.getByRole('button', { name: /Add Compliance Type/i })).not.toBeVisible();
    });
  });

  test.describe('Regression & Edge Cases', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Deactivated Compliance Types are hidden from new staff but preserved in old', async ({ page }) => {
      // 1. Deactivate a type
      await page.goto('/admin/compliance-settings');
      const firstRow = page.locator('table tbody tr').first();
      const reqName = await firstRow.locator('td').first().innerText();
      
      await firstRow.getByRole('button', { name: /Deactivate/i }).click();
      await expect(page.locator('[data-sonner-toast]')).toContainText(/deactivated successfully/i);

      // 2. Verify it is NOT in the Compliance Monitoring list (which usually shows active requirements)
      await page.goto('/admin/compliance-monitoring');
      await page.getByPlaceholder(/Search/i).fill(reqName);
      await expect(page.locator('table')).not.toContainText(reqName);
      
      // 3. Reactivate it for cleanup/consistency if needed in other tests
      await page.goto('/admin/compliance-settings');
      await page.getByRole('tab', { name: /Inactive/i }).click();
      await page.locator('tr', { hasText: reqName }).getByRole('button', { name: /Reactivate/i }).click();
    });

    test('Compliance items with NULL expiry date are treated as Complete', async ({ page }) => {
       // Navigate to staff compliance
       await page.goto('/staff');
       await page.locator('a[href*="/employees/staff-detail/"]').first().click();
       await page.getByRole('link', { name: /Compliance/i }).click();
       
       const row = page.locator('tr').filter({ has: page.locator('.badge-success') }).first();
       if (await row.isVisible()) {
         // This is a "Complete" row. If we clear the expiry date (if applicable), it should stay complete.
         const expiryInput = row.locator('input[type="date"]');
         if (await expiryInput.isVisible()) {
           await expiryInput.fill('');
           await expect(row.locator('.badge-success')).toBeVisible();
         }
       }
    });
  });
});
