# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Public Page /auth/2fa loads without WSoD
- Location: tests/smoke.spec.ts:91:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.card, form, h1, h2').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('.card, form, h1, h2').first()

```

```yaml
- region "Notifications alt+T"
- heading "Verify your phone" [level=3]
- text: Enter the verification code we sent to
- link "****** 7859":
  - /url: "#"
- textbox
- textbox
- textbox
- textbox
- textbox
- textbox
- text: Didn’t receive a code? (37s)
- link "Resend":
  - /url: /auth/classic/login
- button "Continue"
- link "Back to Login":
  - /url: /auth/signin
```

# Test source

```ts
  1   | import { test as base, expect } from '@playwright/test';
  2   | import * as path from 'path';
  3   | import { fileURLToPath } from 'url';
  4   | 
  5   | const __filename = fileURLToPath(import.meta.url);
  6   | const __dirname = path.dirname(__filename);
  7   | 
  8   | const ADMIN_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/admin.json');
  9   | const STAFF_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/staff.json');
  10  | 
  11  | // Extend base test to create specialized test types
  12  | const publicTest = base.extend({
  13  |   storageState: async ({}, use) => {
  14  |     await use({ cookies: [], origins: [] });
  15  |   },
  16  | });
  17  | 
  18  | const staffTest = base.extend({
  19  |   storageState: async ({}, use) => {
  20  |     await use(STAFF_STORAGE_STATE);
  21  |   },
  22  | });
  23  | 
  24  | const adminTest = base.extend({
  25  |   storageState: async ({}, use) => {
  26  |     await use(ADMIN_STORAGE_STATE);
  27  |   },
  28  | });
  29  | 
  30  | // Pages that don't require authentication
  31  | const PUBLIC_PAGES = [
  32  |   '/auth/signin',
  33  |   '/auth/signup',
  34  |   '/auth/reset-password',
  35  |   '/auth/check-email',
  36  |   '/auth/change-password',
  37  |   '/auth/2fa',
  38  |   '/auth/reset-password/check-email',
  39  |   '/auth/reset-password/changed',
  40  |   '/auth/branded/signin',
  41  |   '/auth/branded/signup',
  42  |   '/error/404',
  43  | ];
  44  | 
  45  | // Pages accessible by both Staff and Admins
  46  | const STAFF_PAGES = [
  47  |   '/',
  48  |   '/staff/dashboard',
  49  |   '/staff/checklists',
  50  |   '/staff/roster',
  51  |   '/staff/timesheets',
  52  |   '/staff/leave',
  53  |   '/staff/leave/new',
  54  |   '/staff/profile',
  55  |   '/participants/profiles',
  56  |   '/participants/shift-notes',
  57  |   '/auth/welcome-message',
  58  | ];
  59  | 
  60  | // Pages accessible only by Admins
  61  | const ADMIN_PAGES = [
  62  |   '/employees/staff-profiles',
  63  |   '/employees/timesheets',
  64  |   '/employees/leave-requests',
  65  |   '/admin/checklist-templates',
  66  |   '/houses/profiles',
  67  |   '/roster-board',
  68  | ];
  69  | 
  70  | // Helper to check for White Screen of Death or major rendering errors
  71  | async function checkNoWSoD(page) {
  72  |   // 1. Ensure page is not completely empty
  73  |   const bodyContent = await page.content();
  74  |   expect(bodyContent.length).toBeGreaterThan(100);
  75  | 
  76  |   // 2. Ensure no standard error boundary text is visible
  77  |   const errorText = page.getByText(/Something went wrong/i);
  78  |   await expect(errorText).not.toBeVisible();
  79  | 
  80  |   // 3. Ensure no React error overlay (in dev mode)
  81  |   const viteError = page.locator('vite-error-overlay');
  82  |   await expect(viteError).not.toBeAttached();
  83  | 
  84  |   // 4. Ensure at least some main layout element is present after a short wait
  85  |   const layout = page.locator('.layout-container, .sidebar, .header, #root');
  86  |   await expect(layout.first()).toBeVisible({ timeout: 15000 });
  87  | }
  88  | 
  89  | // Public Pages Smoke Test
  90  | for (const path of PUBLIC_PAGES) {
  91  |   publicTest(`Public Page ${path} loads without WSoD`, async ({ page }) => {
  92  |     await page.goto(path);
  93  |     // For public auth pages, we check for cards or headings
  94  |     const authCard = page.locator('.card, form, h1, h2');
> 95  |     await expect(authCard.first()).toBeVisible({ timeout: 15000 });
      |                                    ^ Error: expect(locator).toBeVisible() failed
  96  |     await expect(page.getByText(/Something went wrong/i)).not.toBeVisible();
  97  |   });
  98  | }
  99  | 
  100 | // Staff Pages Smoke Test
  101 | for (const path of STAFF_PAGES) {
  102 |   staffTest(`Staff Page ${path} loads without WSoD`, async ({ page }) => {
  103 |     await page.goto(path);
  104 |     await checkNoWSoD(page);
  105 |   });
  106 | }
  107 | 
  108 | // Admin Pages Smoke Test
  109 | for (const path of ADMIN_PAGES) {
  110 |   adminTest(`Admin Page ${path} loads without WSoD`, async ({ page }) => {
  111 |     await page.goto(path);
  112 |     await checkNoWSoD(page);
  113 |   });
  114 | }
  115 | 
  116 | // Detail & Edit Pages (Using placeholder IDs for smoke testing)
  117 | // Note: In local/Prod environments, these IDs may need adjustment.
  118 | const MOCK_PARTICIPANT_ID = 'participant-1';
  119 | const MOCK_STAFF_ID = 'staff-1';
  120 | const MOCK_HOUSE_ID = 'house-1';
  121 | 
  122 | staffTest(`Participant Detail page loads`, async ({ page }) => {
  123 |   await page.goto(`/participants/detail/${MOCK_PARTICIPANT_ID}`);
  124 |   await checkNoWSoD(page);
  125 | });
  126 | 
  127 | staffTest(`Participant Edit page loads`, async ({ page }) => {
  128 |   await page.goto(`/participants/detail/${MOCK_PARTICIPANT_ID}/edit`);
  129 |   await checkNoWSoD(page);
  130 | });
  131 | 
  132 | adminTest(`Staff Detail page loads`, async ({ page }) => {
  133 |   await page.goto(`/employees/staff-detail/${MOCK_STAFF_ID}`);
  134 |   await checkNoWSoD(page);
  135 | });
  136 | 
  137 | adminTest(`House Detail page loads`, async ({ page }) => {
  138 |   await page.goto(`/houses/detail/${MOCK_HOUSE_ID}`);
  139 |   await checkNoWSoD(page);
  140 | });
  141 | 
  142 | staffTest(`Staff Leave Edit page loads`, async ({ page }) => {
  143 |   // Using a mock ID, this might fail if the record doesn't exist,
  144 |   // but for a smoke test, we check if the layout at least loads.
  145 |   await page.goto(`/staff/leave/mock-id/edit`);
  146 |   // If we get a 404 or redirect, that's also technically not a WSoD,
  147 |   // but here we just check for basic layout integrity.
  148 |   await checkNoWSoD(page);
  149 | });
  150 | 
```