import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('/api/me', async (route) => {
    await route.fulfill({
      json: { id: 'test-user', display_name: 'Test User' },
    });
  });

  await page.route('/api/subscriptions', async (route) => {
    await route.fulfill({ json: { subscriptions: [] } });
  });

  await page.route('/api/user-configuration', async (route) => {
    await route.fulfill({
      json: { configuration: { currency: 'USD', showCurrencySymbol: true } },
    });
  });
});

test('loads the subscription manager shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Subscription manager/i);
  await expect(page.locator('.app-title')).toContainText('SubscriptionManager');
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
});

test('opens settings', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Settings' }).click();

  await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();
});
