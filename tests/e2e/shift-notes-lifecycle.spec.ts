import { test, expect } from '@playwright/test';

test.describe('Shift Notes Lifecycle & Hardening', () => {
  const noteContent = `LifeCycle Test Note - ${Math.random().toString(36).substring(7)}`;
  const updatedContent = `${noteContent} (Updated)`;

  test('Smoke: New Shift Note Form renders correctly', async ({ browser, viewport }) => {
    const context = await browser.newContext({ 
      storageState: 'playwright/.auth/staff.json', 
      viewport 
    });
    const page = await context.newPage();

    await page.goto('/shift-notes/detail/new');
    
    // Verify Heading
    await expect(page.locator('h1').filter({ hasText: 'New Shift Note' })).toBeVisible({ timeout: 15000 });
    
    // Create button should be disabled initially (dirty tracking)
    const createBtn = page.getByRole('button', { name: /Create/i });
    await expect(createBtn).toBeDisabled();
    
    // Delete button should NOT be present on a new note
    await expect(page.getByRole('button', { name: /Delete/i })).not.toBeVisible();

    await context.close();
  });

  test('Support Worker: Full CRUD Lifecycle (Conditional on available shifts)', async ({ browser, viewport }) => {
    const context = await browser.newContext({ 
      storageState: 'playwright/.auth/staff.json', 
      viewport 
    });
    const page = await context.newPage();
    
    // Log browser console
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.goto('/participants/shift-notes');
    await expect(page.getByRole('heading', { name: 'Shift Notes', exact: true, level: 1 })).toBeVisible({ timeout: 15000 });

    const addBtn = page.getByRole('button', { name: /Add Shift Note/i });
    await addBtn.click({ force: true });
    await expect(page).toHaveURL(/\/shift-notes\/detail\/new/);

    // Try to select a shift
    const shiftSelectTrigger = page.locator('#shift_id');
    await expect(shiftSelectTrigger).toBeVisible({ timeout: 15000 });
    await shiftSelectTrigger.click();
    
    // Look for options
    const options = page.locator('[role="option"]');
    await page.waitForTimeout(2000); // Wait for options to load
    const optionCount = await options.count();
    console.log(`Available shifts: ${optionCount}`);
    
    if (optionCount <= 1) {
        console.log('Skipping full lifecycle test as no shifts were available in the dropdown.');
        await context.close();
        return;
    }

    // Select the first real shift
    await options.nth(1).click();
    console.log('Shift selected');

    // Select a participant if possible
    const participantSelect = page.locator('button#participant_id');
    if (await participantSelect.isVisible()) {
        await participantSelect.click();
        const pOptions = page.locator('[role="option"]');
        if (await pOptions.count() > 1) {
            await pOptions.nth(1).click();
            console.log('Participant selected');
        } else {
            await page.mouse.click(0, 0); // Close dropdown
        }
    }

    const presentationInput = page.locator('textarea#overall_presentation');
    await presentationInput.fill(noteContent);
    
    const summaryInput = page.locator('textarea#shift_summary');
    if (await summaryInput.isVisible()) {
        await summaryInput.fill('Shift summary content');
    }

    const createBtn = page.getByRole('button', { name: /Create/i });
    await expect(createBtn).toBeEnabled();
    console.log('Clicking Create button');
    await createBtn.click();

    // Verify Success and Redirect
    console.log('Waiting for success toast and redirect...');
    await expect(page.getByText(/Shift note created successfully/i)).toBeVisible({ timeout: 20000 });
    const noteIdMatch = page.url().match(/\/shift-notes\/detail\/([0-9a-f-]{36})/);
    expect(noteIdMatch).not.toBeNull();
    console.log(`Note created with ID: ${noteIdMatch![1]}`);

    // Update
    await presentationInput.fill(updatedContent);
    await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
    await expect(page.getByText(/Shift note updated successfully/i)).toBeVisible();
    console.log('Note updated successfully');

    // Archive (Delete)
    const deleteBtn = page.getByRole('button', { name: /Delete/i });
    await expect(deleteBtn).toBeVisible();
    
    page.once('dialog', dialog => dialog.accept());
    await deleteBtn.click({ force: true });

    await expect(page.getByText(/Shift note deleted successfully/i)).toBeVisible();
    await expect(page).toHaveURL(/\/participants\/shift-notes/);
    console.log('Note archived successfully');

    await context.close();
  });

  test('Admin: Can see Delete button on existing notes', async ({ browser, viewport }) => {
    const context = await browser.newContext({ 
      storageState: 'playwright/.auth/admin.json', 
      viewport 
    });
    const page = await context.newPage();

    await page.goto('/participants/shift-notes');
    await page.waitForLoadState('networkidle');

    // Click on the first visible note to see details
    const firstNoteViewBtn = page.locator('table tbody tr').first().getByRole('button', { name: /View/i });
    if (await firstNoteViewBtn.isVisible()) {
      await firstNoteViewBtn.click();
      await expect(page).toHaveURL(/\/shift-notes\/detail\/[0-9a-f-]{36}/);
      
      // Admin should definitely see the delete button
      await expect(page.getByRole('button', { name: /Delete/i })).toBeVisible();
    }

    await context.close();
  });
});
