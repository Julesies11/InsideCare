import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local as priority, then .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const ADMIN_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/admin.json');
const STAFF_STORAGE_STATE = path.join(__dirname, '../playwright/.auth/staff.json');

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

const STAFF_EMAIL = process.env.PLAYWRIGHT_STAFF_EMAIL;
const STAFF_PASSWORD = process.env.PLAYWRIGHT_STAFF_PASSWORD;

setup('authenticate as admin', async ({ page }) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD environment variables must be set');
  }
  
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
  
  // Wait for the form to be visible
  await expect(page.getByLabel(/Email/i)).toBeVisible({ timeout: 15000 });
  
  await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/Password/i).fill(ADMIN_PASSWORD);
  
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');

  // Wait for either the error message OR the navigation to happen
  try {
    await Promise.race([
      page.waitForURL(url => !url.pathname.includes('/auth/signin'), { timeout: 30000 }),
      page.getByText(/Invalid login credentials/i).waitFor({ state: 'visible', timeout: 30000 }).then(() => {
        throw new Error('Login failed: Invalid login credentials');
      })
    ]);
  } catch (e) {
    if (e.message.includes('timeout')) {
      const isErrorVisible = await page.getByText(/Invalid login credentials/i).isVisible();
      if (isErrorVisible) {
        throw new Error('Login failed: Invalid login credentials');
      }
    }
    throw e;
  }
  
  // Basic check that we landed on a protected page
  await expect(page.locator('.layout-container, .sidebar, .header, #root').first()).toBeVisible({ timeout: 30000 });
  
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});

setup('authenticate as staff', async ({ page }) => {
  if (!STAFF_EMAIL || !STAFF_PASSWORD) {
    throw new Error('PLAYWRIGHT_STAFF_EMAIL and PLAYWRIGHT_STAFF_PASSWORD environment variables must be set');
  }
  
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
  
  // Wait for the form to be visible
  await expect(page.getByLabel(/Email/i)).toBeVisible({ timeout: 15000 });
  
  await page.getByLabel(/Email/i).fill(STAFF_EMAIL);
  await page.getByLabel(/Password/i).fill(STAFF_PASSWORD);
  
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');

  // Wait for either the error message OR the navigation to happen
  try {
    await Promise.race([
      page.waitForURL(url => !url.pathname.includes('/auth/signin'), { timeout: 30000 }),
      page.getByText(/Invalid login credentials/i).waitFor({ state: 'visible', timeout: 30000 }).then(() => {
        throw new Error('Login failed: Invalid login credentials');
      })
    ]);
  } catch (e) {
    if (e.message.includes('timeout')) {
      const isErrorVisible = await page.getByText(/Invalid login credentials/i).isVisible();
      if (isErrorVisible) {
        throw new Error('Login failed: Invalid login credentials');
      }
    }
    throw e;
  }
  
  // Staff usually redirects to /staff/dashboard
  await expect(page.locator('.layout-container, .sidebar, .header, #root').first()).toBeVisible({ timeout: 30000 });
  
  await page.context().storageState({ path: STAFF_STORAGE_STATE });
});
