import { test, expect } from '@playwright/test';

/**
 * HOUSE DETAIL MARATHON (GOLD STANDARD)
 * Covers every single field, every operational tab, and resource uploads.
 */
test.describe('House Detail Marathon CRUD', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Create and Fully Configure House Record', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });

    const timestamp = Date.now();
    const houseName = `Full Lifecycle House ${timestamp}`;

    // 1. Initial Creation
    await page.goto('/houses');
    await page.getByRole('button', { name: /Add House/i }).click();
    
    await expect(page).toHaveURL(/\/houses\/detail\//, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /House Details/i }).first()).toBeVisible({ timeout: 30000 });
    
    // 2. Basic Details
    await page.locator('input#house_name').fill(houseName);
    await page.locator('textarea#address').fill('456 Roster Way, Osborne Park WA');
    await page.locator('input#phone').fill('08 9222 3333');
    
    // 3. House Management (Section-by-section entry)
    await page.getByText(/Management/i).first().click();
    await page.getByPlaceholder(/Enter general house routines/i).fill('Always check perimeter gates at 9 PM.');
    await page.getByPlaceholder(/Enter breakdown of individuals/i).fill('3 adults with high support needs.');
    await page.getByPlaceholder(/social dynamics/i).fill('Participants enjoy shared mealtimes.');
    await page.getByPlaceholder(/risk management/i).fill('Wet floors in laundry during morning shifts.');
    await page.getByPlaceholder(/recent observations/i).fill('Increased engagement during communal activities.');

    // 4. NOTE: Shift Setup is a separate admin route (/shift-setup/:houseId),
    // NOT a tab inside the House Detail page. Shift template CRUD is covered
    // in operations-comprehensive.spec.ts.


    // 5. Checklist Setup
    await page.getByText(/Checklist Setup/i).first().click();
    const addChecklistBtn = page.getByRole('button', { name: /Add Checklist/i });
    await addChecklistBtn.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -150));
    await addChecklistBtn.click();
    await page.getByPlaceholder(/e.g. Morning Routine/i).fill('Kitchen Deep Clean');
    
    // Add a Task to the checklist
    await page.getByRole('button', { name: /Add Task/i }).click();
    await page.getByPlaceholder(/e.g. Check kitchen cleanliness/i).fill('Wipe all countertops');
    await page.getByRole('button', { name: /Apply Task/i }).click();
    await expect(page.getByText('Wipe all countertops')).toBeVisible();

    await page.getByRole('button', { name: /Save Checklist/i }).click();
    await expect(page.getByText('Kitchen Deep Clean')).toBeVisible();

    // 6. Resources (File Upload)
    await page.getByText(/Resources/i).first().click();
    const addResourceBtn = page.getByRole('button', { name: /Add Resource/i });
    await addResourceBtn.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -150));
    await addResourceBtn.click();
    await page.getByPlaceholder(/Resource title/i).fill('Emergency Contacts List');
    
    await page.locator('input[type="file"]').setInputFiles({
      name: 'emergency_list.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake emergency content'),
    });
    
    await page.getByRole('button', { name: /Save/i }).click();
    await expect(page.getByText('Emergency Contacts List')).toBeVisible();

    // 7. Daily Comms (Note CRUD)
    await page.getByText(/Comms/i).first().click();
    const addEntryBtn = page.getByRole('button', { name: /Add Entry/i });
    await addEntryBtn.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -150));
    await addEntryBtn.click();
    await page.locator('textarea#comm_content').fill('Initial setup log entry for house audit.');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Initial setup log entry')).toBeVisible();

    // 8. Staff Assignment
    await page.getByText(/Staff/i).first().click();
    const addStaffBtn = page.getByRole('button', { name: /Add Staff/i });
    await addStaffBtn.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -150));
    await addStaffBtn.click();
    await page.getByRole('combobox').click();
    await page.getByRole('option').first().click();
    await page.locator('input#start_date').fill('2026-06-01');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 9. Calendar Events (CRUD & File Upload)
    await page.getByText(/Calendar/i).first().click();
    await page.getByRole('button', { name: /Month/i }).click();
    const todayDate = new Date().getDate().toString();
    const dayCell = page.locator('#calendar_events').getByText(todayDate, { exact: true }).first();
    await dayCell.click();
    
    await page.locator('input#title').fill('House Inspection');
    await page.locator('input#event_date').fill('2026-06-15');
    
    await page.locator('input[type="file"]').setInputFiles({
      name: 'inspection_notice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake inspection content'),
    });
    
    await page.getByRole('button', { name: /Save/i, exact: true }).click();
    await expect(page.locator('[data-sonner-toast]')).toContainText(/saved/i);

    // 10. Final Save & Verify Persistence
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.getByText(/All changes saved successfully/i)).toBeVisible({ timeout: 20000 });

    await page.reload();
    
    // Verify Fields
    await expect(page.locator('input#house_name')).toHaveValue(houseName);
    await expect(page.locator('textarea#address')).toHaveValue('456 Roster Way, Osborne Park WA');
    
    await page.getByText(/Management/i).first().click();
    await expect(page.getByPlaceholder(/Enter general house routines/i)).toHaveValue('Always check perimeter gates at 9 PM.');
    await expect(page.getByPlaceholder(/recent observations/i)).toHaveValue('Increased engagement during communal activities.');
    
    await page.getByText(/Checklist Setup/i).first().click();
    await expect(page.getByText('Kitchen Deep Clean')).toBeVisible();
    // Verify task inside checklist
    await page.getByText('Kitchen Deep Clean').click();
    await expect(page.getByText('Wipe all countertops')).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();

    await page.getByText(/Resources/i).first().click();
    await expect(page.getByText('Emergency Contacts List')).toBeVisible();

    await page.getByText(/Staff/i).first().click();
    await expect(page.locator('table')).toContainText('Ongoing'); // Assuming start_date was filled

    await page.getByText(/Calendar/i).first().click();
    await expect(page.getByText('House Inspection')).toBeVisible();

    await page.getByText(/Comms/i).first().click();
    await expect(page.getByText('Initial setup log entry')).toBeVisible();

    // 11. Build Roster Tool
    await page.goto('/roster-board');
    await expect(page.locator('h1:has-text("Roster Board")')).toBeVisible({ timeout: 30000 });
    
    // Find the house row and click BUILD ROSTER
    const houseRow = page.locator('.group\\/row', { hasText: houseName });
    await expect(houseRow).toBeVisible();
    await houseRow.getByRole('button', { name: /BUILD ROSTER/i }).click();

    // Configure the Build Roster Modal
    const modal = page.locator('[role="dialog"]:has-text("Build Roster")');
    await expect(modal).toBeVisible();
    
    // Select "Sleepover" (SO) template for Mon & Tue in Week 1
    // The modal uses short names for templates in the grid
    const monCell = modal.locator('.bg-white.border.border-gray-100').filter({ hasText: 'Mon' });
    await monCell.getByText('SO', { exact: true }).click();
    
    const tueCell = modal.locator('.bg-white.border.border-gray-100').filter({ hasText: 'Tue' });
    await tueCell.getByText('SO', { exact: true }).click();
    
    // Confirm & Build
    await modal.getByRole('button', { name: /Confirm & Build/i }).click();
    
    // Wait for success toast
    await expect(page.getByText(/Roster populated successfully/i)).toBeVisible({ timeout: 20000 });
    
    // Verify shifts appear on the Roster Board for the house
    // Shifts in the calendar are usually rendered with the template short name or title
    await expect(houseRow.getByText('SO').first()).toBeVisible({ timeout: 10000 });

    // 12. Manual Shift Creation (Click to Add)
    // Click on Wednesday (3rd day cell, index 2) to add a manual shift
    const wedCell = houseRow.locator('.group\\/cell').nth(2);
    await wedCell.click();

    const shiftDialog = page.locator('[role="dialog"]:has-text("Shift")');
    await expect(shiftDialog).toBeVisible();

    // Select "Sleepover" template again manually
    await shiftDialog.getByLabel(/Shift Template/i).click();
    await page.getByRole('option', { name: /Sleepover/i }).click();

    // Fill in custom notes
    await shiftDialog.getByPlaceholder(/Additional notes/i).fill('Manual roster entry for verification.');

    // Save
    await shiftDialog.getByRole('button', { name: /Save/i, exact: true }).click();

    // Verify manual shift appears
    await expect(page.getByText(/Shift saved/i)).toBeVisible();
    await expect(houseRow.getByText('Manual roster entry for verification.')).toBeVisible();

    // 13. Cleanup (Archive House)
    await page.goto('/houses');
    const houseRowProfile = page.locator('tr').filter({ hasText: houseName });
    await houseRowProfile.getByRole('button', { name: /Archive/i }).click();
    await expect(page.getByText(/House archived successfully/i)).toBeVisible();
  });
});
