import { test, expect } from '@playwright/test';

test.describe('Shift Notes E2E', () => {
  // Use admin session
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/participants/shift-notes');
    // Ensure loading is finished or basic elements are visible
    await expect(page.getByRole('heading', { name: 'Shift Notes', exact: true, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('Navigate to detailed shift note form and verify sections', async ({ page }) => {
    // Click on "Add Shift Note"
    const addBtn = page.getByRole('button', { name: /Add Shift Note/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify redirection to the detail page for a new note
    await expect(page).toHaveURL(/\/shift-notes\/detail\/new/);

    // Verify primary sections are present via Sidebar links
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Supports' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Health & Medication' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trackers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible();

    // Verify content sections
    await expect(page.locator('#shift_note_overview')).toBeVisible();
    await expect(page.locator('#shift_note_supports')).toBeVisible();
  });

  test('Toggle clinical trackers and verify visibility', async ({ page }) => {
    await page.goto('/shift-notes/detail/new');
    await expect(page.locator('#shift_note_trackers')).toBeVisible();

    // Initially, Bowel Tracking card should NOT be visible
    await expect(page.locator('#tracker_bowel')).not.toBeVisible();

    // Find and click the toggle for Bowel Tracking
    const bowelToggle = page.locator('div').filter({ hasText: /^Bowel Tracking$/ }).locator('button[role="checkbox"]');
    await expect(bowelToggle).toBeVisible();
    await bowelToggle.click();

    // Verify the Bowel Tracking card appears
    await expect(page.locator('#tracker_bowel')).toBeVisible();
    
    // Verify Bristol Scale is visible inside the card
    await expect(page.getByText('Bristol Scale Type *')).toBeVisible();
  });

  test('Edit fields and verify dirty tracking', async ({ page }) => {
    await page.goto('/shift-notes/detail/new');
    
    // Modify a field (e.g., Overall Presentation)
    const presentationInput = page.locator('textarea#overall_presentation');
    await expect(presentationInput).toBeVisible({ timeout: 15000 });
    
    await presentationInput.fill('Participant was engaged and happy.');

    // Verify "Save Changes" or "Create" button becomes enabled
    const saveButton = page.getByRole('button', { name: /Create/i });
    await expect(saveButton).toBeEnabled();
  });
});
