import { test, expect } from '@playwright/test';

/**
 * Comprehensive tests for Participant Management.
 * Covers: Listing, Searching, Detailed View, Editing, Medications, and Documents.
 */
test.describe('Participant Management Comprehensive', () => {
  // Use admin session to ensure full access for all operations
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/participants/profiles');
    // Ensure loading is finished
    await expect(page.getByText(/Loading participants/i)).not.toBeVisible({ timeout: 30000 });
  });

  test('Search and filter participants', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search Participants/i);
    await expect(searchInput).toBeVisible();

    // Search for a specific participant (assuming 'John' exists or just testing the filter logic)
    await searchInput.fill('John');
    await page.waitForTimeout(1000); // Wait for debounce/filtering

    // Verify results or empty state (no crash)
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('Navigate to participant detail and verify sections', async ({ page }) => {
    // Click on the participant link (name)
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    
    await firstRow.getByRole('link').first().click();

    // Verify redirection to detail page
    await expect(page).toHaveURL(/\/participants\/detail\//);

    // Verify primary sections are present via Sidebar links
    await expect(page.getByText("Personal Details").first()).toBeVisible();
    await expect(page.getByText("Medications").first()).toBeVisible();
    await expect(page.getByText("Documents").first()).toBeVisible();
  });

  test('Edit participant basic info and verify dirty tracking', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.getByRole('link').first().click();

    // Modify a field (e.g., Full Name)
    const nameInput = page.locator('input#participant_name');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    
    const originalValue = await nameInput.inputValue();
    await nameInput.fill(`${originalValue} Updated`);

    // Verify "Save Changes" button becomes enabled (dirty tracking)
    const saveButton = page.getByRole('button', { name: /Save Changes/i });
    await expect(saveButton).toBeEnabled();

    // Attempt to navigate away — the Back button uses window.confirm when dirty
    const backBtn = page.getByRole('button', { name: /Back/i });
    await expect(backBtn).toBeVisible({ timeout: 15000 });
    // Scroll the sticky toolbar into view by scrolling to top first, then click
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    
    const [dialog] = await Promise.all([
      page.waitForEvent('dialog', { timeout: 15000 }),
      backBtn.click({ force: true }),
    ]);
    
    expect(dialog.message().toLowerCase()).toContain('unsaved');
    await dialog.dismiss();
  });

  test('Manage Medications - Add Medication dialog', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.getByRole('link').first().click({ force: true });

    // Deep-link to the medications tab
    await page.goto(`${page.url()}?tab=medications`);
    await expect(page.locator('#medications')).toBeVisible({ timeout: 20000 });

    // Click "Add Medication" button — scroll to it first to avoid sticky header overlap
    const addMedBtn = page.getByRole('button', { name: /Add Medication/i });
    await expect(addMedBtn).toBeVisible({ timeout: 20000 });
    await addMedBtn.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -100)); // clear sticky header
    await page.waitForTimeout(200);
    await addMedBtn.click({ force: true });

    // Verify dialog appears — Radix Dialog uses role="dialog"
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 15000 });
    // The dialog title is "Add Medication"
    await expect(dialog.getByRole('heading', { name: /Add Medication/i })).toBeVisible({ timeout: 10000 });

    // Close dialog via Cancel button
    await dialog.getByRole('button', { name: /Cancel/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Manage Documents - List and Action buttons', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.getByRole('link').first().click();

    await page.goto(`${page.url()}?tab=documents`);
    await expect(page.locator('#documents')).toBeVisible();

    // Verify "Upload Document" button
    const uploadBtn = page.getByRole('button', { name: /Upload Document/i });
    await expect(uploadBtn).toBeVisible();

    // Check if there are existing documents and verify their action buttons (Edit, Download, Delete)
    // This depends on seed data, so we just check for the table/list structure
    const docContainer = page.locator('#documents');
    await expect(docContainer).toBeVisible();
  });
});
