import { expect, test } from '@playwright/test';

test.describe('Authentication & Access Control', () => {
  test('Login failure shows descriptive error', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByLabel(/Email/i).fill('invalid@insidecare.com');
    await page.getByLabel(/Password/i).fill('wrongpassword');
    await page.keyboard.press('Enter');

    // Validate error message appearance using the Alert component
    const alert = page
      .locator('[role="alert"]')
      .filter({ hasText: /invalid|credentials|error/i });
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/invalid|credentials|error/i);
  });

  test('Public user is redirected from dashboard to signin', async ({
    page,
  }) => {
    await page.goto('/my-dashboard');
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('RBAC: Staff cannot access Admin Role management', async ({
    browser,
  }) => {
    // Create a new context using the staff session
    const context = await browser.newContext({
      storageState: 'playwright/.auth/staff.json',
    });
    const staffPage = await context.newPage();

    await staffPage.goto('/access-control');
    // Should be redirected to 403 error page
    await expect(staffPage).toHaveURL(/\/error\/403/);

    await context.close();
  });
});
