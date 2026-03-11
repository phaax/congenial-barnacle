import { test, expect } from '@playwright/test';

test.describe('Chronicles of the Realm', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Chronicles of the Realm');
  });

  test('canvas element is present', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('loading overlay disappears after init', async ({ page }) => {
    await page.goto('/');
    // Trigger a user gesture so the game initialises fully
    await page.click('body');
    const overlay = page.locator('#loading-overlay');
    await expect(overlay).toBeHidden({ timeout: 10_000 });
  });

  test('canvas has non-zero dimensions', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('no uncaught console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('keyboard + key increases scale hint text', async ({ page }) => {
    await page.goto('/');
    await page.click('body');
    // Wait for game to initialise
    await page.waitForSelector('#loading-overlay', { state: 'hidden', timeout: 10_000 });
    const hint = page.locator('#scale-hint');
    await page.keyboard.press('+');
    await expect(hint).toContainText('1.5×');
  });
});
