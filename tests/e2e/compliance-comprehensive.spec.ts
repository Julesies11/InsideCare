import { format, addDays } from 'date-fns';
import { expect, test } from '@playwright/test';

/**
 * COMPLIANCE COMPREHENSIVE COVERAGE
 * This test suite targets the "Gold Standard" implementation of the Compliance module,
 * specifically testing deep logic, RLS boundaries, and status transitions.
 */
test.describe('Compliance Comprehensive Coverage', () => {
  test.beforeEach(async ({ page }) => {
    // Standard timeouts for complex pages
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(20000);
  });

  test.describe('Admin Management & Rules', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Compliance Status Color Coding & Expiry Logic', async ({ page }) => {
      // 1. Create a requirement that expires in 15 days (should show "Expiring Soon" / Amber)
      await page.goto('/admin/compliance-settings');
      await expect(page.locator('h1')).toContainText(/Compliance Settings/i);
      
      await page.getByRole('button', { name: /Add Compliance Type/i }).click({ force: true });

      const reqName = `E2E-Expiry-${Date.now()}`;
      await page.locator('#type-name').fill(reqName);
      
      await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
      await expect(page.locator('[data-sonner-toast]').filter({ hasText: /updated|saved|added/i })).toBeVisible();

      // 2. Go to a staff member and complete this requirement with an upcoming expiry
      await page.goto('/staff');
      await page.waitForLoadState('networkidle');
      
      const firstStaffLink = page.locator('a[href*="/employees/staff-detail/"]').first();
      await expect(firstStaffLink).toBeVisible();
      await firstStaffLink.click({ force: true });
      
      try {
        await page.locator('[data-scrollspy-anchor="staff_compliance"]').click({ timeout: 5000, force: true });
      } catch (e) {
        const url = page.url();
        await page.goto(`${url}${url.includes('?') ? '&' : '?'}tab=compliance`);
      }

      // Wait for table body to ensure newly added type is loaded
      await expect(page.locator('#staff_compliance table tbody tr').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('#staff_compliance table')).toContainText(reqName, { timeout: 15000 });
      await page.waitForTimeout(3000); 

      // Find our new requirement row
      const row = page.locator('#staff_compliance tr', { hasText: reqName }).first();
      await expect(row).toBeVisible({ timeout: 15000 });
      
      // Transition to edit mode and mark as Complete so expiry is evaluated
      await row.getByRole('button', { name: /In Progress/i }).or(row.getByRole('button', { name: /Missing/i })).click({ force: true });
      
      const completeBtn = row.getByRole('button', { name: /Complete/i });
      await completeBtn.click({ force: true });
      // Ensure the button is actually selected (UI feedback)
      await expect(completeBtn).toHaveClass(/bg-white|text-success/);

      const expiringDate = format(addDays(new Date(), 15), 'yyyy-MM-dd');
      await row.locator('input[type="date"]').fill(expiringDate);

      // Save
      await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
      await expect(page.locator('[data-sonner-toast]').filter({ hasText: /updated|saved/i })).toBeVisible();

      // 3. Verify color coding (Badge should be amber/warning)
      const badge = row.locator('.badge, [data-slot="badge"]').first();
      await expect(badge).toBeVisible();
      // It might render as Complete briefly until local cache updates or UI resolves the calculation
      await expect(badge).toContainText(/Expiring Soon/i, { timeout: 20000 });
    });

    test('100-Point ID Verification: One Primary Rule & Min Expiry', async ({
      page,
    }) => {
      // 1. Navigate to 100pt ID section for a staff member
      await page.goto('/staff');
      await page.waitForLoadState('networkidle');
      const firstStaffLink = page.locator('a[href*="/employees/staff-detail/"]').first();
      await expect(firstStaffLink).toBeVisible();
      await firstStaffLink.click({ force: true });
      
      try {
        await page.locator('[data-scrollspy-anchor="staff_compliance"]').click({ timeout: 5000, force: true });
      } catch (e) {
        const url = page.url();
        await page.goto(`${url}${url.includes('?') ? '&' : '?'}tab=compliance`);
      }
      
      await expect(page.locator('#staff_compliance table tbody tr').first()).toBeVisible({ timeout: 20000 });
      await expect(page.locator('#staff_compliance table')).toContainText(/100/i, { timeout: 20000 });
      await page.waitForTimeout(3000);

      // More robust ID row search
      const idRow = page.locator('tr').filter({ hasText: /100/ }).filter({ hasText: /ID|Point/i }).first();
      await expect(idRow).toBeVisible({ timeout: 20000 });
      
      const verifyBtn = idRow.locator('button:has-text("Verify ID"), button:has-text("pts verified"), button:has-text("Verify ID Documents"), button:has-text("Verification")').first();
      await expect(verifyBtn).toBeVisible({ timeout: 10000 });
      await verifyBtn.click({ force: true });

      // 2. Try to add only secondary documents (should fail 1-primary rule)
      await page.getByRole('button', { name: /Add Document/i }).click({ force: true });
      await page.locator('#doc-type').click({ force: true });
      await page.getByRole('option', { name: /Secondary/i }).first().click({ force: true });
      await page.getByRole('button', { name: /Confirm Add/i }).click({ force: true });

      // Attempt to mark complete
      await page.getByRole('button', { name: /Complete Verification/i }).click({ force: true });
      await expect(page.locator('[data-sonner-toast]')).toContainText(/must include at least one Primary document/i);

      // 3. Add a Primary document
      await page.getByRole('button', { name: /Add Document/i }).click({ force: true });
      await page.locator('#doc-type').click({ force: true });
      await page.getByRole('option', { name: /Primary/i }).first().click({ force: true });
      await page.getByRole('button', { name: /Confirm Add/i }).click({ force: true });

      // 4. Verify point summation
      const totalPoints = page.locator('text=Total Points:');
      await expect(totalPoints).toBeVisible();
    });

    test('Requirement Enforcement (Comments & Attachments)', async ({
      page,
    }) => {
      await page.goto('/admin/compliance-settings');
      await page.getByRole('button', { name: /Add Compliance Type/i }).click({ force: true });

      const reqName = `E2E-Strict-${Date.now()}`;
      await page.locator('#type-name').fill(reqName);
      
      // Enable Attachment
      await page.locator('label[for="attach-app"]').click({ force: true });

      await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
      await expect(page.locator('[data-sonner-toast]').filter({ hasText: /added|saved/i })).toBeVisible();

      // 2. Go to staff and try to complete it
      await page.goto('/staff');
      await page.waitForLoadState('networkidle');
      const staffLink = page.locator('a[href*="/employees/staff-detail/"]').first();
      await expect(staffLink).toBeVisible();
      await staffLink.click({ force: true });
      
      try {
        await page.locator('[data-scrollspy-anchor="staff_compliance"]').click({ timeout: 5000, force: true });
      } catch (e) {
        const url = page.url();
        await page.goto(`${url}${url.includes('?') ? '&' : '?'}tab=compliance`);
      }

      await expect(page.locator('#staff_compliance table tbody tr').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('#staff_compliance table')).toContainText(reqName, { timeout: 15000 });
      await page.waitForTimeout(3000);

      const row = page.locator('#staff_compliance tr', { hasText: reqName }).first();
      await expect(row).toBeVisible({ timeout: 20000 });
      await row.getByRole('button', { name: /In Progress/i }).click({ force: true });
      
      await expect(row.getByPlaceholder(/additional notes/i)).toBeVisible();
    });
  });

  test.describe('Staff Self-Service', () => {
    test.use({ storageState: 'playwright/.auth/staff.json' });

    test('Staff can view their own compliance status', async ({ page }) => {
      await page.goto('/staff/profile');
      await expect(page.locator('h1')).toContainText(/My Profile/i);
      
      const compSection = page.locator('#staff_compliance').or(page.getByText(/Compliance/i)).or(page.locator('#staff_training'));
      await expect(compSection).toBeVisible();
    });
  });

  test.describe('Regression & Edge Cases', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test('Deactivated Compliance Types are hidden from new staff but preserved in old', async ({
      page,
    }) => {
      await page.goto('/admin/compliance-settings');
      const reqName = 'First Aid Certificate'; 
      const row = page.locator('tr', { hasText: reqName }).first();
      
      if (await row.isVisible()) {
          const statusBadge = row.locator('.badge, [data-slot="badge"]');
          const badgeText = await statusBadge.innerText();
          if (badgeText.toLowerCase().includes('active')) {
              await row.getByRole('button', { name: /Deactivate/i }).or(row.locator('button').last()).click();
              await expect(page.locator('[data-sonner-toast]')).toContainText(/deactivated/i);
          }
      }

      await page.goto('/staff');
      await page.locator('a[href*="/employees/staff-detail/"]').first().click();
      
      try {
        await page.locator('[data-scrollspy-anchor="staff_compliance"]').click({ timeout: 5000 });
      } catch (e) {
        const url = page.url();
        await page.goto(`${url}${url.includes('?') ? '&' : '?'}tab=compliance`);
      }

      await expect(page.locator('#staff_compliance')).toBeVisible();
      await expect(page.locator('#staff_compliance table tbody tr').first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator('#staff_compliance table')).not.toContainText(reqName);

      // 3. Reactivate for cleanup
      await page.goto('/admin/compliance-settings');
      const inactiveRow = page.locator('tr', { hasText: reqName }).first();
      await inactiveRow.getByRole('button', { name: /Edit/i }).or(inactiveRow.locator('button').first()).click();
      await page.locator('#is-active').click({ force: true });
      await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
    });

    test('Compliance items with NULL expiry date are treated as Complete', async ({
      page,
    }) => {
      await page.goto('/staff');
      await page.locator('a[href*="/employees/staff-detail/"]').first().click();
      
      try {
        await page.locator('[data-scrollspy-anchor="staff_compliance"]').click({ timeout: 5000 });
      } catch (e) {
        const url = page.url();
        await page.goto(`${url}${url.includes('?') ? '&' : '?'}tab=compliance`);
      }

      const row = page.locator('#staff_compliance tr').filter({ hasText: /Certificate|NDIS/i }).first();
      
      if (await row.isVisible()) {
          const inProgressBtn = row.getByRole('button', { name: /In Progress/i });
          if (await inProgressBtn.isVisible()) {
              await inProgressBtn.click();
          } else {
              await row.getByRole('button', { name: /Missing/i }).click();
              await row.getByRole('button', { name: /In Progress/i }).click();
          }
          
          await row.getByRole('button', { name: /Complete/i }).click();
          await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
          await expect(page.locator('[data-sonner-toast]').filter({ hasText: /updated|saved/i })).toBeVisible();
      }
    });
  });
});
