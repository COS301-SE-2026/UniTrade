import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { signupVerifyAndLogin, uniqueEmail } from "./helpers/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("buyer can view and reserve a seller's listing", async ({
  browser,
  request,
}) => {
  test.setTimeout(180000);

  const listingTitle = `E2E Listing ${Date.now()}`;

  const sellerAdminContext = await browser.newContext();
  const sellerAdminPage = await sellerAdminContext.newPage();
  const sellerContext = await browser.newContext();
  const sellerPage = await sellerContext.newPage();

  await signupVerifyAndLogin(sellerPage, request, sellerAdminPage, {
    email: uniqueEmail("seller"),
  });
  await sellerAdminContext.close();

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

  const buyerAdminContext = await browser.newContext();
  const buyerAdminPage = await buyerAdminContext.newPage();
  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();

  await signupVerifyAndLogin(buyerPage, request, buyerAdminPage, {
    email: uniqueEmail("buyer"),
  });
  await buyerAdminContext.close();

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

  await buyerContext.close();
});

test("reservation filter narrows the list to the selected status", async ({
  browser,
  request,
}) => {
  test.setTimeout(120000);

  const buyerAdminContext = await browser.newContext();
  const buyerAdminPage = await buyerAdminContext.newPage();
  const buyerContext = await browser.newContext();
  const buyerPage = await buyerContext.newPage();

  await signupVerifyAndLogin(buyerPage, request, buyerAdminPage, {
    email: uniqueEmail("buyer-filter"),
  });
  await buyerAdminContext.close();

  await buyerPage.waitForURL(/\/buyer\/listings/);

  await buyerPage.goto("/buyer/reservations");

  await buyerPage.getByRole("button", { name: /filter/i }).click();
  await buyerPage.getByRole("button", { name: /^cancelled$/i }).click();

  await expect(buyerPage.getByText(/no reservations found/i)).toBeVisible();
  await expect(
    buyerPage.getByText(/reserve items from listings to see them here/i),
  ).toBeVisible();

  await buyerContext.close();
});
