import { test, expect } from '@playwright/test';

import { signupAndLogin, uniqueEmail } from './helpers/auth';



test('seller can upload a listing', async ({ page, request }) => {
    const sellerEmail = uniqueEmail('seller');
    await signupAndLogin(page, request, { email: sellerEmail });

    await page.getByText('Switch', { exact: true }).click();
    await page.waitForURL(/\/seller\/listings/);

    await page.getByRole('button', {name: 'New Listing'}).click();
    await page.waitForURL(/\/seller\/upload/);
    await page.getByTestId('category-buttons').locator('button').first().click();

    await page.getByPlaceholder('Title').fill('E2E Test Textbook');
    await page.getByPlaceholder('Description').fill('A listing created by an automated test.');
    await page.locator('input[type="number"]').fill('250');

    await page.setInputFiles(
        'input[type="file"]',
        'src/tests/e2e/fixtures/test-image.jpg'
    );

    await page.getByRole('button', { name: /^submit listing$/i }).click();
    await page.waitForURL(/\/seller\/listings/);
    await expect(page).toHaveURL(/\/seller\/listings/);
    await expect(page.getByRole('heading', { name: 'My Listings' })).toBeVisible();
    await expect(page.getByText('E2E Test Textbook')).toBeVisible();
});