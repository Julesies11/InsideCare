import { test, expect } from '@playwright/test';

/**
 * PARTICIPANT DETAIL MARATHON (GOLD STANDARD)
 * Covers every single field, every tab, and document uploads.
 */
test.describe('Participant Detail Marathon CRUD', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Create and Fully Populate Participant Record', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    });

    const timestamp = Date.now();
    const participantName = `Full Lifecycle Participant ${timestamp}`;

    // 1. Initial Creation
    await page.goto('/participants/profiles');
    await page.getByRole('button', { name: /Add Participant/i }).click({ force: true });
    
    await expect(page).toHaveURL(/\/participants\/detail\//, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /Participant Details/i }).first()).toBeVisible({ timeout: 30000 });
    
    // 2. Profile Details (Core Fields)
    // Upload an avatar pic
    const avatarChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#personal_details').locator('.relative.rounded-full').first().click(); 
    const avatarChooser = await avatarChooserPromise;
    await avatarChooser.setFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake avatar content'),
    });

    await page.locator('input#participant_name').fill(participantName);
    await page.locator('input#ndis_number').fill('987654321');
    await page.locator('input#date_of_birth').fill('2000-01-01');
    await page.locator('input#personal_mobile').fill('0411111111');
    await page.locator('textarea#address').fill('789 Participant Rd, Perth WA');
    
    const supportLevel = page.locator('button:has-text("Select support level")');
    if (await supportLevel.isVisible()) {
      await supportLevel.click();
      await page.getByRole('option', { name: /High/i }).click();
    }
    
    await page.getByLabel(/Support Coordinator/i).fill('John Coordinator');

    // 3. Goals (Sub-entity CRUD)
    await page.getByText(/Goals/i).first().click({ force: true });
    await page.getByRole('button', { name: /Add Goal/i }).click({ force: true });
    await page.locator('textarea#description').or(page.getByLabel(/Goal Description/i)).fill('Independent living skills and social inclusion');
    await page.getByRole('button', { name: /Save/i, exact: true }).click({ force: true });
    await expect(page.getByText('social inclusion').first()).toBeVisible();

    // 4. Behaviour Support
    await page.getByText(/Behaviour/i).first().click({ force: true });
    await page.locator('textarea#behaviour_of_concern').or(page.getByLabel(/Behaviour of Concern/i)).fill('Occasional social anxiety in large groups.');
    await page.locator('input#specialist_name').or(page.getByLabel(/Specialist Name/i)).fill('Dr. Behaviour');

    // 5. Support Needs (Communication)
    await page.getByText(/Support Needs/i).first().click({ force: true });
    await page.locator('textarea#routine').or(page.getByLabel(/Routine/i)).fill('Morning walks, afternoon reading.');
    const commType = page.locator('button:has-text("Select communication type")');
    if (await commType.isVisible()) {
      await commType.click({ force: true });
      await page.getByRole('option', { name: 'Verbal', exact: true }).first().click({ force: true });
    }
    await page.getByLabel(/Communication Type Notes/i).fill('Prefers clear, direct instructions.');
    await page.locator('textarea#finance_support').fill('Needs assistance with budget management.');

    // 6. Contacts (Sub-entity CRUD)
    await page.getByText(/Contacts/i).first().click();
    await page.getByRole('button', { name: /Add Contact/i }).click();
    await page.locator('input#contact_name').fill('Jane Doe');
    await page.getByRole('combobox').click();
    await page.getByRole('option').first().click();
    await page.locator('input#phone').fill('0422222222');
    await page.getByRole('button', { name: /Add to Queue/i }).click();
    await expect(page.getByText('Jane Doe')).toBeVisible();

    // 7. Medical Routine
    await page.getByText(/Medical/i).first().click();
    await page.locator('input#pharmacy_name').or(page.getByLabel(/Pharmacy Name/i)).fill('Central Pharmacy');
    await page.locator('input#gp_name').or(page.getByLabel(/GP Name/i)).fill('Dr. Smith');
    await page.locator('input#psychiatrist_name').or(page.getByLabel(/Psychiatrist Name/i)).fill('Dr. Freud');

    // 8. Medications (Combobox + sub-entity CRUD)
    await page.getByText(/Medications/i).first().click();
    await page.getByRole('button', { name: /Add Medication/i }).click();
    await page.getByRole('combobox').click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/Dosage/i).fill('10mg daily');
    await page.getByRole('button', { name: /Add to Queue/i }).click();
    await expect(page.getByText('10mg daily')).toBeVisible();

    // 9. Documents (File Upload)
    await page.getByText(/Documents/i).first().click();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Upload/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'behavior_plan.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake plan content'),
    });
    await expect(page.getByText('behavior_plan.pdf')).toBeVisible();

    // 10. Hygiene & Routines
    await page.getByText(/Hygiene/i).first().click();
    await page.locator('textarea#morning_routine').fill('Wake up at 7am, brush teeth.');

    // 11. Restrictive Practices
    await page.getByText(/Practices/i).first().click();
    await page.locator('textarea#restrictive_practices').fill('None currently authorized.');

    // 12. Notes
    await page.getByText(/Notes/i).first().click();
    await page.locator('textarea#general_notes').fill('Participant is adjusting well to the new environment.');

    // 13. Final Save & Verify Persistence
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.getByText(/Changes saved successfully/i)).toBeVisible({ timeout: 20000 });

    await page.reload();
    
    // Verify Persistence
    await expect(page.locator('input#participant_name')).toHaveValue(participantName);
    await expect(page.locator('input#ndis_number')).toHaveValue('987654321');
    
    await page.getByText(/Goals/i).first().click();
    await expect(page.getByText('social inclusion').first()).toBeVisible();
    
    await page.getByText(/Behaviour/i).first().click();
    await expect(page.locator('input#specialist_name')).toHaveValue('Dr. Behaviour');

    await page.getByText(/Support Needs/i).first().click();
    await expect(page.locator('textarea#finance_support')).toHaveValue('Needs assistance with budget management.');

    await page.getByText(/Contacts/i).first().click();
    await expect(page.getByText('Jane Doe')).toBeVisible();

    await page.getByText(/Hygiene/i).first().click();
    await expect(page.locator('textarea#morning_routine')).toHaveValue('Wake up at 7am, brush teeth.');

    await page.getByText(/Practices/i).first().click();
    await expect(page.locator('textarea#restrictive_practices')).toHaveValue('None currently authorized.');

    await page.getByText(/Notes/i).first().click();
    await expect(page.locator('textarea#general_notes')).toHaveValue('Participant is adjusting well to the new environment.');

    await page.getByText(/Documents/i).first().click();
    await expect(page.getByText('behavior_plan.pdf')).toBeVisible();

    // 14. Cleanup (Archive Participant)
    await page.goto('/participants');
    const participantRow = page.locator('tr').filter({ hasText: participantName });
    await participantRow.getByRole('button', { name: /Archive/i }).click();
    await expect(page.getByText(/Participant archived successfully/i)).toBeVisible();
  });
});
