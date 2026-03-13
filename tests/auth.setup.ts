import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/admin.json');
const STAFF_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/staff.json');

setup('authenticate as admin', async ({ page }) => {
  // We'll bypass the actual login UI by injecting into localStorage
  // This matches the AUTH_LOCAL_STORAGE_KEY logic in src/auth/lib/helpers.ts
  await page.goto('/');
  
  await page.evaluate(() => {
    const AUTH_KEY = 'InsideCare-auth-v1.0'; // Matches expected key in dev
    const authData = {
      access_token: 'fake-admin-token',
      refresh_token: 'fake-admin-refresh-token'
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  });

  // Wait for the app to recognize the state and redirect to dashboard
  await page.goto('/');
  // Basic check that we're not on the signin page anymore
  await expect(page).not.toHaveURL(/.*\/auth\/signin.*/);
  
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});

setup('authenticate as staff', async ({ page }) => {
  await page.goto('/');
  
  await page.evaluate(() => {
    const AUTH_KEY = 'InsideCare-auth-v1.0';
    const authData = {
      access_token: 'fake-staff-token',
      refresh_token: 'fake-staff-refresh-token'
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  });

  await page.goto('/staff/dashboard');
  await expect(page).not.toHaveURL(/.*\/auth\/signin.*/);
  
  await page.context().storageState({ path: STAFF_STORAGE_STATE });
});
