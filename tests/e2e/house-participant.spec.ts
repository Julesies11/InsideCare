import { test, expect } from '@playwright/test';

test.describe('House & Participant Management', () => {
  // Use admin session to ensure data is visible for filtering tests
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Search participants filters profiles', async ({ page }) => {
    await page.goto('/participants/profiles');
    const search = page.getByPlaceholder(/Search Participants/i);
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill('NonExistentParticipant');
    // 'No data available' is the default empty state text in DataGrid
    await expect(page.locator('body')).toContainText(/No data available/i, { timeout: 10000 });
  });

  test('Deep linking to Participant Medications tab', async ({ page }) => {
    await page.goto('/participants/profiles');
    
    // Wait for data to load or empty state, avoiding the "Loading" state
    const editButton = page.getByRole('button', { name: /Edit/i }).first();
    const noData = page.getByText(/No data available/i);
    const loading = page.getByText(/Loading participants/i);
    
    // First, ensure loading is gone (it might appear and then disappear)
    await expect(loading).not.toBeVisible({ timeout: 20000 });
    
    await expect(editButton.or(noData)).toBeVisible({ timeout: 15000 });
    
    if (await noData.isVisible()) {
      console.log('Skipping deep link test: No participants found in database');
      return;
    }
    
    // Click edit to go to detail page (which is the same as detail in this app)
    await editButton.click();
    
    // Wait for navigation and then append tab
    await expect(page).toHaveURL(/\/participants\/detail\//);
    const currentUrl = page.url();
    await page.goto(`${currentUrl}?tab=medications`);
    
    // Check that the Medications section is active or visible
    // Wait for the "Loading" state to disappear first
    await expect(page.getByText(/Loading participant details/i)).not.toBeVisible({ timeout: 60000 });
    await expect(page.locator('body')).toContainText(/Medication/i, { timeout: 15000 });
  });

  test('Navigate to House Profiles and search', async ({ page }) => {
    await page.goto('/houses/profiles');
    const search = page.getByPlaceholder(/Search Houses/i);
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill('Demo House');
    // Use specific locator for the table to avoid strict mode violation
    await expect(page.getByRole('table')).toBeVisible();
  });
});
