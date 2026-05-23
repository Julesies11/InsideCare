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

const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || 'demo@kt.com';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'demo123';

const STAFF_EMAIL = process.env.PLAYWRIGHT_STAFF_EMAIL || 'staff@kt.com';
const STAFF_PASSWORD = process.env.PLAYWRIGHT_STAFF_PASSWORD || 'demo123';

setup('authenticate as admin', async ({ page }) => {
  // Capture console logs for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`BROWSER ERROR [admin]: ${msg.text()}`);
    } else {
      console.log(`BROWSER LOG [admin]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`BROWSER PAGE ERROR [admin]: ${err.message}`);
  });

  // Monitor failed requests to catch CORS or connection issues
  page.on('requestfailed', request => {
    console.error(`REQUEST FAILED [admin]: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to /auth/signin for admin...');
  // waitUntil: 'networkidle' ensures the SPA is fully loaded before we interact
  await page.goto('/auth/signin', { waitUntil: 'networkidle' });
  
  // Wait for the page to be ready and log content for debugging if it fails
  try {
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible({ timeout: 15000 });
  } catch (err) {
    console.error('Sign In heading not found. Current URL:', page.url());
    const content = await page.content();
    console.log('Page content snippet:', content.substring(0, 1000));
    throw err;
  }

  console.log('Filling admin credentials...');
  await page.getByLabel(/Email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/Password/i).fill(ADMIN_PASSWORD);
  
  console.log('Submitting login form...');
  await page.getByRole('button', { name: /Sign In/i }).click();

  console.log('Waiting for redirect...');
  // Wait for the app to recognize the state and redirect
  try {
    // Wait for the URL to change away from the signin page
    await page.waitForURL(url => !url.pathname.includes('/auth/signin'), { timeout: 15000 });
  } catch (err) {
    // Check if there's a visible error alert
    const errorAlert = page.locator('[data-slot="alert"]');
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.error(`Login FAILED with visible error alert: ${errorText}`);
    } else {
      console.error('Login TIMED OUT without a visible error alert. Still on signin page.');
      console.error('Current URL:', page.url());
    }
    throw err;
  }
  
  // Basic check that we landed on a protected page (admin usually goes to root / dashboard)
  await expect(page.locator('.layout-container, .sidebar, .header').first()).toBeVisible({ timeout: 15000 });
  
  console.log('Saving admin storage state...');
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});

setup('authenticate as staff', async ({ page }) => {
  // Capture console logs for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`BROWSER ERROR [staff]: ${msg.text()}`);
    } else {
      console.log(`BROWSER LOG [staff]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`BROWSER PAGE ERROR [staff]: ${err.message}`);
  });

  // Monitor failed requests
  page.on('requestfailed', request => {
    console.error(`REQUEST FAILED [staff]: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to /auth/signin for staff...');
  await page.goto('/auth/signin', { waitUntil: 'networkidle' });
  
  try {
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible({ timeout: 15000 });
  } catch (err) {
    console.error('Sign In heading not found for staff. Current URL:', page.url());
    throw err;
  }

  console.log('Filling staff credentials...');
  await page.getByLabel(/Email/i).fill(STAFF_EMAIL);
  await page.getByLabel(/Password/i).fill(STAFF_PASSWORD);
  
  console.log('Submitting login form for staff...');
  await page.getByRole('button', { name: /Sign In/i }).click();

  console.log('Waiting for redirect for staff...');
  try {
    await page.waitForURL(url => !url.pathname.includes('/auth/signin'), { timeout: 15000 });
  } catch (err) {
    const errorAlert = page.locator('[data-slot="alert"]');
    if (await errorAlert.isVisible()) {
      const errorText = await errorAlert.textContent();
      console.error(`Staff Login FAILED with visible error alert: ${errorText}`);
    } else {
      console.error('Staff Login TIMED OUT without a visible error alert.');
      console.error('Current URL:', page.url());
    }
    throw err;
  }
  
  // Staff usually redirects to /staff/dashboard
  await expect(page.locator('.layout-container, .sidebar, .header').first()).toBeVisible({ timeout: 15000 });
  
  console.log('Saving staff storage state...');
  await page.context().storageState({ path: STAFF_STORAGE_STATE });
});
