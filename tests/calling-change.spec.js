const { test, expect } = require('@playwright/test');

test.describe('Calling Change Form', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // --- Form filling and auto-select behavior ---

  test('page loads with correct title and stake name', async ({ page }) => {
    await expect(page).toHaveTitle('Copperview Stake — Calling Change');
    await expect(page.locator('#stakeName')).toHaveText('Copperview Stake');
  });

  test('ward dropdown is populated with all wards sorted', async ({ page }) => {
    const options = page.locator('#ward option');
    // placeholder + 9 wards
    await expect(options).toHaveCount(10);
    // first real option should be "1st Ward"
    await expect(options.nth(1)).toHaveText('1st Ward');
    await expect(options.nth(9)).toHaveText('9th Ward');
  });

  test('building dropdown is populated with all buildings', async ({ page }) => {
    const options = page.locator('#building option');
    // placeholder + 3 buildings
    await expect(options).toHaveCount(4);
  });

  test('selecting a ward auto-selects the correct building', async ({ page }) => {
    await page.selectOption('#ward', '1st Ward');
    await expect(page.locator('#building')).toHaveValue('2700 Building');

    await page.selectOption('#ward', '5th Ward');
    await expect(page.locator('#building')).toHaveValue('Stake Center');

    await page.selectOption('#ward', '6th Ward');
    await expect(page.locator('#building')).toHaveValue('3200 Building');
  });

  test('can fill all form fields', async ({ page }) => {
    await page.selectOption('#ward', '3rd Ward');
    await page.selectOption('#changeType', 'new');
    await page.fill('#bulkChanges', 'John Doe, john@example.com, Sunday School Teacher');

    await expect(page.locator('#ward')).toHaveValue('3rd Ward');
    await expect(page.locator('#building')).toHaveValue('2700 Building');
    await expect(page.locator('#changeType')).toHaveValue('new');
    await expect(page.locator('#bulkChanges')).toHaveValue('John Doe, john@example.com, Sunday School Teacher');
  });

  // --- Validation errors ---

  test('form shows validation when submitted empty', async ({ page }) => {
    await page.click('.submit-btn');
    // Ward is required — the form should not have submitted
    const msg = page.locator('#message');
    await expect(msg).toHaveText('');
    // Ward should be invalid (browser native validation)
    const wardValid = await page.locator('#ward').evaluate(el => el.validity.valid);
    expect(wardValid).toBe(false);
  });

  test('form shows validation when only ward is selected', async ({ page }) => {
    await page.selectOption('#ward', '2nd Ward');
    await page.click('.submit-btn');
    // changeType is still empty — should not submit
    const msg = page.locator('#message');
    await expect(msg).toHaveText('');
    const changeTypeValid = await page.locator('#changeType').evaluate(el => el.validity.valid);
    expect(changeTypeValid).toBe(false);
  });

  test('form shows validation when textarea is empty', async ({ page }) => {
    await page.selectOption('#ward', '2nd Ward');
    await page.selectOption('#changeType', 'replace');
    await page.click('.submit-btn');
    const textareaValid = await page.locator('#bulkChanges').evaluate(el => el.validity.valid);
    expect(textareaValid).toBe(false);
  });

  // --- Successful submission with intercepted fetch ---

  test('successful submission shows success message and resets form', async ({ page }) => {
    // Intercept the fetch to Apps Script
    await page.route('**/macros/s/**', route => {
      route.fulfill({ status: 200, body: 'ok' });
    });

    await page.selectOption('#ward', '8th Ward');
    await page.selectOption('#changeType', 'new');
    await page.fill('#bulkChanges', 'Jane Smith, jane@example.com, Relief Society President');

    // Verify building was auto-selected
    await expect(page.locator('#building')).toHaveValue('Stake Center');

    await page.click('.submit-btn');

    // Button should show submitting state briefly
    const msg = page.locator('#message');
    await expect(msg).toHaveText('Calling change request submitted successfully!');
    await expect(msg).toHaveCSS('color', 'rgb(76, 175, 80)'); // #4caf50

    // Form should be reset after success
    await expect(page.locator('#ward')).toHaveValue('');
    await expect(page.locator('#changeType')).toHaveValue('');
    await expect(page.locator('#bulkChanges')).toHaveValue('');

    // Submit button should be re-enabled
    await expect(page.locator('.submit-btn')).toBeEnabled();
    await expect(page.locator('.submit-btn')).toHaveText('Submit Request');
  });

  test('submit button is disabled during submission', async ({ page }) => {
    // Use a delayed route to observe the loading state
    await page.route('**/macros/s/**', async route => {
      await new Promise(r => setTimeout(r, 500));
      route.fulfill({ status: 200, body: 'ok' });
    });

    await page.selectOption('#ward', '4th Ward');
    await page.selectOption('#changeType', 'replace');
    await page.fill('#bulkChanges', 'Test submission');

    await page.click('.submit-btn');

    // Button should be disabled and show submitting text
    await expect(page.locator('.submit-btn')).toBeDisabled();
    await expect(page.locator('.submit-btn')).toHaveText('Submitting...');

    // Wait for completion
    await expect(page.locator('#message')).toHaveText('Calling change request submitted successfully!');
    await expect(page.locator('.submit-btn')).toBeEnabled();
  });

  test('fetch sends correct data payload', async ({ page }) => {
    let capturedBody = '';
    await page.route('**/macros/s/**', route => {
      capturedBody = route.request().postData();
      route.fulfill({ status: 200, body: 'ok' });
    });

    await page.selectOption('#ward', '7th Ward');
    await page.selectOption('#changeType', 'new');
    await page.fill('#bulkChanges', 'Test Person, test@email.com, Bishop');

    await page.click('.submit-btn');
    await expect(page.locator('#message')).toHaveText('Calling change request submitted successfully!');

    // Verify the payload
    const decoded = decodeURIComponent(capturedBody.replace('data=', ''));
    const data = JSON.parse(decoded);
    expect(data).toEqual({
      type: 'callingChange',
      ward: '7th Ward',
      building: '3200 Building',
      changeType: 'new',
      bulkChanges: 'Test Person, test@email.com, Bishop',
    });
  });

  // --- Cancel button ---

  test('cancel clears form when confirmed', async ({ page }) => {
    await page.selectOption('#ward', '1st Ward');
    await page.fill('#bulkChanges', 'Some text');

    page.on('dialog', dialog => dialog.accept());
    await page.click('.cancel-btn');

    await expect(page.locator('#ward')).toHaveValue('');
    await expect(page.locator('#bulkChanges')).toHaveValue('');
  });

  test('cancel does not clear form when dismissed', async ({ page }) => {
    await page.selectOption('#ward', '1st Ward');
    await page.fill('#bulkChanges', 'Some text');

    page.on('dialog', dialog => dialog.dismiss());
    await page.click('.cancel-btn');

    await expect(page.locator('#ward')).toHaveValue('1st Ward');
    await expect(page.locator('#bulkChanges')).toHaveValue('Some text');
  });

  // --- Dark mode toggle ---

  test('dark mode toggle switches body class', async ({ page }) => {
    await expect(page.locator('body')).toHaveClass('light');
    await page.click('#modeToggle');
    await expect(page.locator('body')).not.toHaveClass(/light/);
    await page.click('#modeToggle');
    await expect(page.locator('body')).toHaveClass('light');
  });
});
