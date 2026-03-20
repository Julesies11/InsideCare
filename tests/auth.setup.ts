import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/admin.json');
const STAFF_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/staff.json');

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || 'admin@demo.com';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'demo';

const STAFF_EMAIL = process.env.PLAYWRIGHT_STAFF_EMAIL || 'staff@demo.com';
const STAFF_PASSWORD = process.env.PLAYWRIGHT_STAFF_PASSWORD || 'demo';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/auth/signin');
  
  await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/Password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();

  // Wait for the app to recognize the state and redirect
  await expect(page).not.toHaveURL(/.*\/auth\/signin.*/);
  
  // Basic check that we landed on a protected page (admin usually goes to root / dashboard)
  await expect(page.locator('.layout-container, .sidebar, .header').first()).toBeVisible({ timeout: 15000 });
  
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});

setup('authenticate as staff', async ({ page }) => {
  await page.goto('/auth/signin');
  
  await page.getByLabel(/Email/i).fill(STAFF_EMAIL);
  await page.getByLabel(/Password/i).fill(STAFF_PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();

  await expect(page).not.toHaveURL(/.*\/auth\/signin.*/);
  
  // Staff usually redirects to /staff/dashboard
  await expect(page.locator('.layout-container, .sidebar, .header').first()).toBeVisible({ timeout: 15000 });
  
  await page.context().storageState({ path: STAFF_STORAGE_STATE });
});
