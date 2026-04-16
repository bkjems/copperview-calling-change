const { test, expect } = require('@playwright/test');

test('live submission to real endpoint', async ({ page }) => {
  await page.goto('/');

  await page.selectOption('#ward', '1st Ward');
  await page.selectOption('#changeType', 'new');
  await page.fill('#bulkChanges', 'Test Person, test@example.com, Sunday School Teacher\nAnother Person, another@example.com, Elders Quorum President');

  await expect(page.locator('#building')).toHaveValue('2700 Building');

  await page.click('.submit-btn');

  await expect(page.locator('.submit-btn')).toBeDisabled();
  await expect(page.locator('.submit-btn')).toHaveText('Submitting...');

  // Wait for success — real network call, give it time
  await expect(page.locator('#message')).toHaveText('Calling change request submitted successfully!', { timeout: 15000 });
  await expect(page.locator('.submit-btn')).toBeEnabled();

  // Pause so you can see the result before the browser closes
  await page.waitForTimeout(3000);
});
