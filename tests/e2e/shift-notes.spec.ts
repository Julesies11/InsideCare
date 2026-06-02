import { test, expect } from '@playwright/test';

test.describe('Shift Notes E2E', () => {
  // Use admin session
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/participants/shift-notes');
    // Ensure loading is finished or basic elements are visible
    await expect(page.getByRole('heading', { name: 'Shift Notes', exact: true, level: 1 })).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to detailed shift note form and verify sections', async ({ page }) => {
    // Click on "Add Shift Note"
    const addBtn = page.getByRole('button', { name: /Add Shift Note/i });
    await expect(addBtn).toBeVisible({ timeout: 30000 });
    await addBtn.click({ force: true });

    // Verify redirection to the detail page for a new note
    await expect(page).toHaveURL(/\/shift-notes\/detail\/new/, { timeout: 30000 });

    // Verify primary sections are present via Sidebar links
    await expect(page.getByText('Overview', { exact: true }).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Supports', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Health & Medication', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Trackers', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Summary', { exact: true }).first()).toBeVisible();

    // Verify content sections
    await expect(page.locator('#shift_note_overview')).toBeVisible();
    await expect(page.locator('#shift_note_supports')).toBeVisible();
  });

  test('Toggle clinical trackers and verify visibility', async ({ page }) => {
    await page.goto('/shift-notes/detail/new');
    await expect(page.locator('#shift_note_trackers')).toBeVisible({ timeout: 30000 });

    // Initially, Bowel Tracking card should NOT be visible
    await expect(page.locator('#tracker_bowel')).not.toBeVisible();

    // Click the Bowel Tracking toggle (click the card/div wrapper)
    await expect(page.locator('div').filter({ hasText: /^Bowel Tracking$/ }).first()).toBeVisible();
    
    // Sometimes clicking the div is tricky, try clicking the label or the checkbox if needed, 
    // but here we'll try to click it more precisely or use the checkbox id
    await page.locator('label[for="bowel_toggle"]').or(page.locator('div').filter({ hasText: /^Bowel Tracking$/ }).first()).first().click({ force: true });

    // Verify the Bowel Tracking card appears
    await expect(page.locator('#tracker_bowel')).toBeVisible({ timeout: 15000 });
    
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
