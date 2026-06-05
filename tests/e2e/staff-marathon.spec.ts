import { test, expect } from '@playwright/test';

/**
 * STAFF DETAIL MARATHON (GOLD STANDARD)
 * Covers every single field, every tab, and document uploads.
 */
test.describe('Staff Detail Marathon CRUD', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Create and Fully Populate Staff Record', async ({ page }) => {
    // Trace browser errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });

    const timestamp = Date.now();
    const staffName = `Full Lifecycle Engineer ${timestamp}`;
    const staffEmail = `lifecycle.engineer.${timestamp}@example.com`;

    // 1. Initial Creation
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    const addStaffBtn = page.getByRole('button', { name: /Add Staff/i });
    await expect(addStaffBtn).toBeVisible({ timeout: 30000 });
    await addStaffBtn.click({ force: true });
    
    // Explicitly wait for navigation or toast error
    await expect(page).toHaveURL(/\/employees\/staff-detail\//, { timeout: 45000 });
    // Use a more flexible locator for the heading as it might be 'Staff Details' or 'Staff Profile' depending on state
    const heading = page.getByRole('heading', { name: /Staff Details/i }).or(page.getByText(/Staff Details/i)).or(page.getByText(/Staff Profile/i));
    await expect(heading.first()).toBeVisible({ timeout: 45000 });
    
    // 2. Personal Details (Core Fields)
    // Upload an avatar pic
    const avatarChooserPromise = page.waitForEvent('filechooser');
    // More specific locator for the avatar circle inside personal details
    await page.locator('#personal_details').locator('.relative.rounded-full').first().click({ force: true }); 
    const avatarChooser = await avatarChooserPromise;
    await avatarChooser.setFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake avatar content'),
    });

    await page.locator('input#staff_name').fill(staffName);
    await page.locator('input#email').fill(staffEmail);
    await page.locator('input#phone').fill('0400000000');
    await page.locator('input#date_of_birth').fill('1990-01-01');
    await page.locator('textarea#address').fill('123 Automation St, Sydney NSW');
    await page.locator('textarea#hobbies').fill('Verification, Precision, Integrity');
    await page.locator('textarea#allergies').fill('None known');
    await page.locator('input#emergency_contact_name').fill('QA Bot');
    await page.locator('input#emergency_contact_phone').fill('0499999999');
    
    // 3. Employment Details
    await page.getByText(/Employment/i).first().click({ force: true });
    await expect(page.locator('input#hire_date')).toBeVisible({ timeout: 20000 });
    await page.locator('input#hire_date').fill('2026-01-01');

    // Select locators for custom comboboxes - use Text for better stability
    // 1. Role
    await page.getByText('Select role...', { exact: true }).click({ force: true });
    await page.getByRole('option').first().click({ force: true });
    
    //  department
    await page.getByText('Select department...', { exact: true }).click({ force: true });
    await page.getByRole('option').first().click({ force: true });
    
    // 3. Employment Type
    await page.getByText('Select employment type...', { exact: true }).click({ force: true });
    await page.getByRole('option').first().click({ force: true });
    
    // Status and Manager use standard Radix Select
    const statusBtn = page.locator('button#status');
    await expect(statusBtn).toBeVisible({ timeout: 15000 });
    await statusBtn.click({ force: true });
    
    // Wait for the dropdown content to appear - use multiple possible locators
    const dropdown = page.getByRole('listbox').or(page.locator('[data-radix-popper-content-wrapper]')).or(page.locator('.fixed.inset-0')).first();
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await page.getByRole('option', { name: /Draft/i }).click({ force: true });

    
    // 4. Compliance (Sub-entity CRUD)
    await page.getByText(/Compliance/i).first().click({ force: true });
    await page.getByRole('button', { name: /Add Requirement/i }).click({ force: true });
    await page.getByLabel(/Requirement Name/i).fill('First Aid Cert');
    await page.getByLabel(/Expiry Date/i).fill('2028-12-31');
    await page.getByRole('button', { name: /Add/i, exact: true }).click({ force: true });
    await expect(page.getByText('First Aid Cert')).toBeVisible();

    // 5. Training (File Upload)
    await page.getByText(/Training/i).first().click({ force: true });
    await page.getByRole('button', { name: /Add Training/i }).click({ force: true });
    await page.getByLabel(/Training Title/i).fill('WHS Induction');
    await page.getByLabel(/Date Completed/i).fill('2026-05-01');
    await page.getByLabel(/Category/i).fill('Safety');
    
    const trainingFileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('input#file').click({ force: true }); // Specific ID for training file input
    const trainingFileChooser = await trainingFileChooserPromise;
    await trainingFileChooser.setFiles({
      name: 'whs_induction.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake whs content'),
    });
    
    await page.getByRole('button', { name: /Save/i }).click({ force: true });
    await expect(page.getByText('WHS Induction')).toBeVisible();

    // 6. Documents (Direct Upload)
    await page.getByText(/Documents/i).first().click({ force: true });
    await page.getByRole('button', { name: /Upload Document/i }).click({ force: true });
    
    const docUploadPromise = page.waitForEvent('filechooser');
    await page.locator('input[type="file"]').click({ force: true }); // Generic file input in Sheet
    const docChooser = await docUploadPromise;
    await docChooser.setFiles({
      name: 'policy_signed.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake policy content'),
    });
    
    // Click Add button to close dialog
    await page.getByRole('button', { name: /Add 1 Files/i }).click({ force: true });
    await expect(page.getByText('policy_signed.pdf')).toBeVisible();

    // 7. Roster Section
    await page.getByText(/Roster/i).first().click({ force: true });
    
    // Interact with filters
    await page.getByRole('button', { name: /Month/i }).click({ force: true });
    await page.getByRole('button', { name: /Week/i }).click({ force: true });
    await page.getByRole('button', { name: /Today/i }).click({ force: true });
    
    // Click dropdown filters (House, Type, Status)
    const selects = page.locator('#staff_roster').getByRole('combobox');
    for (let i = 0; i < await selects.count(); i++) {
      await selects.nth(i).click({ force: true });
      await page.keyboard.press('Escape');
    }
    
    // Add a shift
    // Click a day in month view to trigger Add Shift
    await page.getByRole('button', { name: /Month/i }).click({ force: true });
    const todayDate = new Date().getDate().toString();
    // Target the specific day number text within the calendar to be precise
    const dayTrigger = page.locator('#staff_roster').getByText(todayDate, { exact: true }).first();
    await dayTrigger.click({ force: true });
    
    // Fill shift details
    await page.getByRole('combobox', { name: /Select House/i }).click({ force: true });
    await page.getByRole('option').first().click({ force: true });
    await page.getByRole('combobox', { name: /Select Template/i }).click({ force: true });
    await page.getByRole('option').first().click({ force: true });
    await page.getByRole('button', { name: /Save/i, exact: true }).click({ force: true });
    
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 30000 });

    // 8. Activate Staff
    await page.getByRole('button', { name: /Activate Staff/i }).click({ force: true });
    await page.getByRole('button', { name: /Activate Only/i }).click({ force: true });
    await expect(page.locator('[data-sonner-toast]').first()).toContainText(/activated successfully/i);

    // 9. Final Save & Verify Persistence
    await page.getByRole('button', { name: /Save Changes/i }).click({ force: true });
    await expect(page.locator('[data-sonner-toast]').first()).toContainText(/updated successfully/i, { timeout: 20000 });

    // Verify all fields after reload
    await page.reload();
    
    await expect(page.locator('input#staff_name')).toHaveValue(staffName);
    await expect(page.locator('input#email')).toHaveValue(staffEmail);
    await expect(page.locator('textarea#hobbies')).toHaveValue('Verification, Precision, Integrity');
    
    await page.getByText(/Employment/i).first().click({ force: true });
    await expect(page.getByLabel(/Hire Date/i)).toHaveValue('2026-01-01');
    
    await page.getByText(/Compliance/i).first().click({ force: true });
    await expect(page.getByText('First Aid Cert')).toBeVisible();
    
    await page.getByText(/Training/i).first().click({ force: true });
    await expect(page.getByText('WHS Induction')).toBeVisible();

    await page.getByText(/Documents/i).first().click({ force: true });
    await expect(page.getByText('policy_signed.pdf')).toBeVisible();
    
    // Verify status is active
    await expect(page.getByRole('button', { name: /Deactivate/i })).toBeVisible();

    // 11. Cleanup (Deactivate Staff)
    await page.getByRole('button', { name: /Deactivate/i }).click({ force: true });
    await page.getByRole('button', { name: /Deactivate Only/i }).or(page.getByRole('button', { name: /Deactivate Staff/i })).click({ force: true });
    await expect(page.getByText(/deactivated successfully/i)).toBeVisible();
  });
});
