import { test, expect } from '@playwright/test';

test.describe('House & Participant Management', () => {
  // Use admin session to ensure data is visible for filtering tests
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Search participants filters profiles', async ({ page }) => {
    await page.goto('/participants/profiles');
    const search = page.getByPlaceholder(/Search Participants/i);
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill('NonExistentParticipant');
    
    // Ensure loading is gone before checking for 'No data available'
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });
    
    // 'No data available' is the default empty state text in DataGrid
    await expect(page.locator('body')).toContainText(/No data available/i, { timeout: 15000 });
  });

  test('Deep linking to Participant Medications tab', async ({ page, browserName }) => {
    // Firefox is specifically slow with deep linking and large component trees
    if (browserName === 'firefox') test.slow();
    
    await page.goto('/participants/profiles');
    
    // Wait for data to load or empty state, avoiding the "Loading" state
    const participantLink = page.getByRole('row').nth(1).getByRole('link').first();
    const noData = page.getByText(/No data available/i);
    const loading = page.getByText(/Loading participants/i);
    
    // First, ensure loading is gone (it might appear and then disappear)
    await expect(loading).not.toBeVisible({ timeout: 30000 });
    
    await expect(participantLink.or(noData)).toBeVisible({ timeout: 15000 });
    
    if (await noData.isVisible()) {
      console.log('Skipping deep link test: No participants found in database');
      return;
    }
    
    // Click the participant name link to go to detail page (InsideCare Pattern)
    await participantLink.click();
    
    // Wait for navigation and then append tab
    await expect(page).toHaveURL(/\/participants\/detail\//);
    const currentUrl = page.url();
    await page.goto(`${currentUrl}?tab=medications`);
    
    // Check that the Medications section is active or visible
    // Wait directly for the target section instead of just waiting for loading to disappear
    await expect(page.locator('#medications')).toBeVisible({ timeout: 60000 });
  });

  test('Navigate to House Profiles and search', async ({ page }) => {
    await page.goto('/houses');
    
    // Wait for page to load by checking title
    await expect(page.getByText(/House Management/i)).toBeVisible({ timeout: 30000 });
    
    const search = page.getByPlaceholder(/Search Houses/i);
    await expect(search).toBeVisible({ timeout: 30000 });
    await search.fill('Demo House');
    // Use specific locator for the table to avoid strict mode violation
    await expect(page.locator('#houses_table')).toBeVisible({ timeout: 30000 });
  });
});
