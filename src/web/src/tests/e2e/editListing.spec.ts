import {test, expect} from '@playwright/test';

import { signupAndLogin, uniqueEmail } from './helpers/auth';

test.describe('Edit listing', () => {
    test.describe.configure({mode: 'serial'});
});

test('seller can edit a listing\'s title and price', async ({ page, request }) => {
    test.setTimeout(60_000);
    const originalTitle = `E2E Edit Listing ${Date.now()}`;
    const updatedTitle = `E2E Edit Listing UPDATED ${Date.now()}`;
    const sellerEmail = uniqueEmail('seller');

    await signupAndLogin(page, request, { email: sellerEmail });

    await page.getByText('Switch', { exact: true }).click();
    await page.waitForURL(/\/seller\/listings/);

    await page.getByRole('button', { name: 'New Listing' }).click();
    await page.waitForURL(/\/seller\/upload/);

    await page.getByTestId('category-buttons').locator('button').first().click();
    await page.getByPlaceholder('Title').fill(originalTitle);
    await page.getByPlaceholder('Description').fill('A listing created by an automated test.');
    await page.locator('input[type="number"]').fill('250');

    await page.setInputFiles(
        'input[type="file"]',
        'src/tests/e2e/fixtures/test-image.jpg'
    );

    await page.getByRole('button', {name: /^submit listing$/i}).click();
    await page.waitForURL(/\/seller\/listings/);
    await expect(page.getByText(originalTitle)).toBeVisible();


    await page.getByRole('button', { name: /^edit$/i }).click();
    await page.waitForURL(/\/seller\/editListing\/.+/);

    const titleInput = page.getByTestId('edit-title-input');
    await expect(titleInput).toHaveValue(originalTitle);

    await titleInput.fill(updatedTitle);
    await page.locator('input[type="number"]').fill('300');

    await page.getByRole('button', { name: /^save changes$/i }).click();

    await page.waitForURL(/\/seller\/listings/);
    await expect(page.getByText(updatedTitle)).toBeVisible({timeout: 10000});
    await expect(page.getByText(originalTitle, { exact: true })).not.toBeVisible();
    await expect(page.getByText('R300', { exact: false }).last()).toBeVisible();
});

test('cancelling out of edit discards changes', async ({ page, request }) => {
    test.setTimeout(60_000);
    const listingTitle = `E2E Edit Cancel Listing ${Date.now()}`;

    await signupAndLogin(page, request, { email: uniqueEmail('seller') });

    await page.getByText('Switch', { exact: true }).click();
    await page.waitForURL(/\/seller\/listings/);

    await page.getByRole('button', { name: 'New Listing' }).click();
    await page.waitForURL(/\/seller\/upload/);

    await page.getByTestId('category-buttons').locator('button').first().click();
    await page.getByPlaceholder('Title').fill(listingTitle);
    await page.getByPlaceholder('Description').fill('A listing created by an automated test.');
    await page.locator('input[type="number"]').fill('250');

    await page.setInputFiles(
        'input[type="file"]',
        'src/tests/e2e/fixtures/test-image.jpg'
    );

    await page.getByRole('button', { name: /^submit listing$/i }).click();
    await page.waitForURL(/\/seller\/listings/);

    await page.getByRole('button', { name: /^edit$/i }).click();
    await page.waitForURL(/\/seller\/editListing\/.+/);

    await page.getByTestId('edit-title-input').fill('This change should not be saved');
    await page.getByRole('button', { name: /^cancel changes$/i }).click();

    await page.waitForURL(/\/seller\/listings/);
    await expect(page.getByText(listingTitle)).toBeVisible();
    await expect(page.getByText('This change should not be saved')).not.toBeVisible();
});


