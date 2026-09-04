import { Page, APIRequestContext, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { signupAndLogin, uniqueEmail } from "./auth";

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

export interface ReservedListing {
  reservationId: string;
  listingTitle: string;
  price: number;
}

async function dropMapPin(page: Page): Promise<void> {
  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible();
  await map.click({ position: { x: 100, y: 100 } });
}

export interface CreatedListing{
  listingId: string;
  listingTitle: string;
  price: number;
}

export async function createSellerListing(sellerPage: Page): Promise<CreatedListing> {
  const listingTitle = `E2E Listing ${Date.now()}`;
  const price = 250;

  await sellerPage.getByRole('link', { name: 'New Listing' }).click();
  await sellerPage.waitForURL(/\/seller\/upload/);

  await sellerPage.getByTestId('category-buttons').locator('button').first().click();
  await sellerPage.getByPlaceholder('Title').fill(listingTitle);
  await sellerPage.getByPlaceholder('Description').fill('A listing created by an automated test.');
  await sellerPage.locator('input[type="number"]').fill(String(price));

  await sellerPage.setInputFiles(
    'input[type="file"]',
    path.join(_dirname, '..', 'fixtures', 'test-image.jpg'),
  );

  const createResponse = sellerPage.waitForResponse(
    (res) => res.request().method() === 'POST' && /\/listings(\/?$|\?)/.test(res.url()) && res.ok(),
  );
  await sellerPage.getByRole('button', { name: /^submit listing$/i }).click();
  const res = await createResponse;

  const body = await res.json().catch(() => null);
  const listingId: string | undefined = body?.listingId ?? body?.id ?? body?.listing?.id;
  if (!listingId) {
    throw new Error(
      'createSellerListing: could not find a listing id (checked listingId/id/listing.id) ' +
      'on the create-listing response. Update this function once you confirm the real shape.',
    );
  }

  await sellerPage.waitForURL(/\/seller\/listings/);

  return { listingId, listingTitle, price };
}

export async function createListingAndReserve(
  sellerPage: Page,
  buyerPage: Page,
  request: APIRequestContext,
): Promise<ReservedListing> {
  await signupAndLogin(sellerPage, request, { email: uniqueEmail("seller") });

  const switchButton = sellerPage.getByRole('button', { name: 'Switch', exact: true });
  await switchButton.waitFor({ state: 'visible' });
  await switchButton.click();
  await sellerPage.waitForURL(/\/seller\/listings/);  

  const {listingTitle, price} = await createSellerListing(sellerPage);

  await signupAndLogin(buyerPage, request, { email: uniqueEmail("buyer") });
  await buyerPage.waitForURL(/\/buyer\/listings/); 

  const listingCard = buyerPage
  .getByTestId('listing-card')
  .filter({hasText: listingTitle});
  await expect(listingCard).toBeVisible({timeout: 10000});

  await listingCard.locator('img').click();
  await buyerPage.waitForURL(/\/buyer\/listings\/.+/);
 
  await buyerPage.getByRole('button', {name: /reserve this item/i}).click();
  await buyerPage.waitForURL(/\/buyer\/reservations/);
  
  await buyerPage.getByRole('button', {name: /message seller/i}).click();
  await buyerPage.waitForURL(/\/buyer\/messages\/(.+)/);

  const reservationId = new URL(buyerPage.url()).pathname.split('/').pop()!;
  
  await expect(
    buyerPage.getByText(/waiting for seller to accept reservation/i),
  ).toBeVisible();

  await sellerPage.goto(`/seller/messages/${reservationId}`);
  await expect(
    sellerPage.getByText(/accept this reservation to start chatting/i),
  ).toBeVisible();

  await sellerPage.goto('/seller/reservations');
  await sellerPage.getByRole('button', {name: 'Accept Reservation'}).click();

  await sellerPage.goto(`/seller/messages/${reservationId}`);
  await buyerPage.reload();

  await expect(buyerPage.getByPlaceholder('Type a message...')).toBeVisible({timeout: 10000});
  await expect(sellerPage.getByPlaceholder('Type a message...')).toBeVisible({timeout: 10000});
  
  return {reservationId, listingTitle, price};
}
  
async function openCheckInModal(page: Page): Promise<void> {
  const checkInButton = page.getByRole("button", {
    name: "Check In at Meetup",
  });
  await expect(checkInButton).toBeEnabled({ timeout: 90_000 });
  await checkInButton.click();
}

export async function scheduleMeetupAndCheckIn(
  sellerPage: Page,
  buyerPage: Page,
  reservationId: string,
): Promise<void> {
  await sellerPage.getByRole("button", { name: "SCHEDULE A MEETUP" }).click();
  await expect(
    sellerPage.getByRole("heading", { name: "Propose a Meetup" }),
  ).toBeVisible();

  const scheduledTime = await sellerPage.evaluate(() => {
    const d = new Date(Date.now() + 300_000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  await sellerPage.locator('input[type="time"]').fill(scheduledTime);

  await sellerPage
    .getByPlaceholder("e.g. Merensky Library - Main Entrance")
    .fill("Hatfield Plaza, Pretoria");

  await dropMapPin(sellerPage);

  const sendProposal = sellerPage.getByRole("button", {
    name: /send proposal/i,
  });
  await expect(sendProposal).toBeEnabled();
  await sendProposal.click();

  await expect(
    buyerPage.getByText("Meetup Proposal", { exact: true }),
  ).toBeVisible({ timeout: 10000 });
  await buyerPage.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(
    buyerPage.getByRole("heading", { name: "Meetup Details" }),
  ).toBeVisible({ timeout: 10000 });

  const buyerCheckInButton = buyerPage.getByRole("button", {
    name: "Check In at Meetup",
  });
  await expect(buyerCheckInButton).toBeEnabled({ timeout: 90_000 });

  await Promise.all([
    buyerPage.waitForResponse(
      (resp) =>
        resp.url().includes(`reservations/${reservationId}/meetup/check-in`) &&
        resp.request().method() === "POST",
    ),
    buyerCheckInButton.click(),
  ]);

  await expect(buyerPage.getByText(/you're checked in/i)).toBeVisible({
    timeout: 20000,
  });

  await buyerPage.getByRole("button", { name: "DONE" }).click({ timeout: 15000 });


  await sellerPage.getByRole("button", { name: "View Reservation" }).click();
  await sellerPage.getByRole("button", { name: "View Meetup Details" }).click();
  await expect(
    sellerPage.getByRole("heading", { name: "Meetup Details" }),
  ).toBeVisible({ timeout: 10000 });

  const sellerCheckInButton = sellerPage.getByRole("button", {
    name: "Check In at Meetup",
  });
  await expect(sellerCheckInButton).toBeEnabled({ timeout: 90_000 });

  await Promise.all([
    sellerPage.waitForResponse(
      (resp) =>
        resp.url().includes(`reservations/${reservationId}/meetup/check-in`) &&
        resp.request().method() === "POST",
    ),
    sellerCheckInButton.click(),
  ]);
  await expect(sellerPage.getByText(/you're checked in/i)).toBeVisible({
    timeout: 20000,
  });

  await sellerPage.getByRole("button", { name: "DONE" }).click({ timeout: 10000 });


}

export { dropMapPin, openCheckInModal };
