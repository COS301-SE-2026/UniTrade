import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { signupAndLogin, uniqueEmail } from "./helpers/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("buyer can view and reserve a seller's listing", async ({
  browser,
  request,
}) => {
  const listingTitle = `E2E Listing ${Date.now()}`;

  const sellerContext = await browser.newContext();
  const sellerPage = await sellerContext.newPage();

  await signupAndLogin(sellerPage, request, { email: uniqueEmail("seller") });

  await sellerPage.getByText("Switch", { exact: true }).click();
  await sellerPage.waitForURL(/\/seller\/listings/);

  await sellerPage.getByRole("link", { name: "New Listing" }).click();
  await sellerPage.waitForURL(/\/seller\/upload/);

  await sellerPage
    .getByTestId("category-buttons")
    .locator("button")
    .first()
    .click();
  await sellerPage.getByPlaceholder("Title").fill(listingTitle);
  await sellerPage
    .getByPlaceholder("Description")
    .fill("A listing created by an automated test.");
  await sellerPage.locator('input[type="number"]').fill("250");

  await sellerPage.setInputFiles(
    'input[type="file"]',
    path.join(__dirname, "fixtures", "test-image.jpg"),
  );

  await sellerPage.getByRole("button", { name: /^submit listing$/i }).click();
  await sellerPage.waitForURL(/\/seller\/listings/);
  await expect(sellerPage.getByText(listingTitle)).toBeVisible();

  await sellerContext.close();

  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();

  await signupAndLogin(buyerPage, request, { email: uniqueEmail("buyer") });
  await buyerPage.waitForURL(/\/buyer\/listings/);

  const listingCard = buyerPage
    .getByTestId("listing-card")
    .filter({ hasText: listingTitle });

  await expect(listingCard).toBeVisible({ timeout: 10000 });

  await listingCard.locator("img").click();
  await buyerPage.waitForURL(/\/buyer\/listings\/.+/);
  await expect(
    buyerPage.getByRole("heading", { name: listingTitle }),
  ).toBeVisible();

  await buyerPage.getByRole("button", { name: /reserve this item/i }).click();

  await buyerPage.waitForURL(/\/buyer\/reservations/);
  await expect(buyerPage).toHaveURL(/\/buyer\/reservations/);
});

test("reservation filter narrows the list to the selected status", async ({
  browser,
  request,
}) => {
  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();

  await signupAndLogin(buyerPage, request, {
    email: uniqueEmail("buyer-filter"),
  });
  await buyerPage.waitForURL(/\/buyer\/listings/);

  await buyerPage.goto("/buyer/reservations");

  await buyerPage.getByRole("button", { name: /filter/i }).click();
  await buyerPage.getByRole("button", { name: /^cancelled$/i }).click();

  await expect(buyerPage.getByText(/no reservations found/i)).toBeVisible();
  await expect(
    buyerPage.getByText(/there are no reservations with "cancelled" status/i),
  ).toBeVisible();

  await buyerContext.close();
});
