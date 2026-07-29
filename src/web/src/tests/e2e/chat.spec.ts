import {test, expect} from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { signupAndLogin,  uniqueEmail } from './helpers/auth';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

test('chat is locked for both the seller and the buyer until the seller accepts the reservation ', async({browser, request}) => {
    const listingTitle = `E2E Chat Listing ${Date.now()}`;

    const sellerContext = await browser.newContext();
    const sellerPage = await sellerContext.newPage();

    await signupAndLogin(sellerPage, request, {email: uniqueEmail('seller')});

    await sellerPage.getByText('Switch', {exact: true}).click();
    await sellerPage.waitForURL(/\/seller\/listings/);

    await sellerPage.getByRole('link', { name: 'New Listing' }).click();
    await sellerPage.waitForURL(/\/seller\/upload/);

    await sellerPage.getByTestId('category-buttons').locator('button').first().click();
    await sellerPage.getByPlaceholder('Title').fill(listingTitle);
    await sellerPage.getByPlaceholder('Description').fill('A listing created by an automated test.');
    await sellerPage.locator('input[type="number"]').fill('250');

    await sellerPage.setInputFiles(
        'input[type="file"]',
        path.join(_dirname, 'fixtures', 'test-image.jpg')
    );

    await sellerPage.getByRole('button', { name: /^submit listing$/i }).click();
    await sellerPage.waitForURL(/\/seller\/listings/);

    const buyerContext = await browser.newContext();
    const buyerPage = await buyerContext.newPage();

    await signupAndLogin(buyerPage, request, { email: uniqueEmail('buyer') });
    await buyerPage.waitForURL(/\/buyer\/listings/);

    const listingCard = buyerPage
        .getByTestId('listing-card')
        .filter({ hasText: listingTitle });
    await expect(listingCard).toBeVisible({ timeout: 10000 });

    await listingCard.locator('img').click();
    await buyerPage.waitForURL(/\/buyer\/listings\/.+/);
    await buyerPage.getByRole('button', { name: /reserve this item/i }).click();
    await buyerPage.waitForURL(/\/buyer\/reservations/);

    await buyerPage.getByRole('button', {name: /message seller/i}).click();
    await buyerPage.waitForURL(/\/buyer\/messages\/(.+)/);


    const reservationId = new URL(buyerPage.url()).pathname.split('/').pop();

    await expect(
        buyerPage.getByText(/waiting for seller to accept reservation/i)

    ).toBeVisible();
    await expect(buyerPage.getByPlaceholder('Type a message...')).not.toBeVisible();

    await sellerPage.goto(`/seller/messages/${reservationId}`);
    await expect(
        sellerPage.getByText(/accept this reservation to start chatting/i)
    ).toBeVisible();
    await expect(sellerPage.getByPlaceholder('Type a message...')).not.toBeVisible();

    await sellerContext.close();
    await buyerContext.close();



});