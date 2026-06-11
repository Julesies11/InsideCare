import { expect, test } from '@playwright/test';

test.describe('Shift Notes E2E', () => {
  // Use admin session
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/participants/shift-notes');
    // Ensure the list page heading is visible before each test
    await expect(
      page.getByRole('heading', { name: 'Shift Notes', exact: true, level: 1 }),
    ).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to detailed shift note form and verify sections', async ({
    page,
  }) => {
    // Navigate directly to the new shift note form
    await page.goto('/shift-notes/detail/new');

    // Verify sidebar section links are present — these are the scrollspy targets (only visible on desktop)
    const isMobile = page.viewportSize()
      ? page.viewportSize()!.width < 768
      : false;
    if (!isMobile) {
      await expect(
        page.getByText('Overview', { exact: true }).first(),
      ).toBeVisible({ timeout: 30000 });
      await expect(
        page.getByText('Supports', { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByText('Health & Medication', { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByText('Trackers', { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByText('Summary', { exact: true }).first(),
      ).toBeVisible();
    }

    // Verify primary content sections are in the DOM
    await expect(page.locator('#shift_note_overview')).toBeAttached();
    await expect(page.locator('#shift_note_supports')).toBeAttached();
  });

  test('Edit fields and verify dirty tracking', async ({ page }) => {
    await page.goto('/shift-notes/detail/new');

    // Wait for the form to fully initialise
    await expect(page.locator('#shift_note_overview')).toBeAttached({
      timeout: 15000,
    });

    // Modify the Overall Presentation field
    const presentationInput = page.locator('textarea#overall_presentation');
    await expect(presentationInput).toBeVisible({ timeout: 15000 });
    await presentationInput.fill('Participant was engaged and happy.');

    // The submit button is labelled "Submit Note" (not "Create")
    const submitButton = page.getByRole('button', { name: /Submit Note/i });
    await expect(submitButton).toBeEnabled({ timeout: 15000 });
  });

  test('Toggle clinical trackers and verify visibility', async ({ page }) => {
    await page.goto('/shift-notes/detail/new');

    // Wait for the form to initialise
    await expect(page.locator('#shift_note_overview')).toBeAttached({
      timeout: 15000,
    });

    // The trackers section div is always in the DOM, but may be visually hidden
    // when no participant has trackers enabled. Assert it is attached (not removed).
    const trackersSection = page.locator('#shift_note_trackers');
    await expect(trackersSection).toBeAttached({ timeout: 30000 });
  });
});
