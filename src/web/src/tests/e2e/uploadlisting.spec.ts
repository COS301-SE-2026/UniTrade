import { test, expect } from "@playwright/test";

import {
  signupVerifyAndLogin,
  uniqueEmail,
} from "./helpers/auth";

test("verified seller can upload a listing", async ({
  browser,
  page,
  request,
}) => {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const sellerEmail = uniqueEmail("seller");
  await signupVerifyAndLogin(page, request, adminPage, { email: sellerEmail });
  await adminContext.close();
  
  await page.getByText("Switch", { exact: true }).click();
  await page.waitForURL(/\/seller\/listings/);

  await page.getByRole("button", { name: "New Listing" }).click();
  await page.waitForURL(/\/seller\/upload/);
  await page.getByTestId("category-buttons").locator("button").first().click();

  await page.getByPlaceholder("Title").fill("E2E Test Textbook");
  await page
    .getByPlaceholder("Description")
    .fill("A listing created by an automated test.");
  await page.locator('input[type="number"]').fill("250");

  await page.setInputFiles(
    'input[type="file"]',
    "src/tests/e2e/fixtures/test-image.jpg",
  );

  await page.getByRole("button", { name: /^submit listing$/i }).click();
  await page.waitForURL(/\/seller\/listings/);
  await expect(page).toHaveURL(/\/seller\/listings/);
  await expect(
    page.getByRole("heading", { name: "My Listings" }),
  ).toBeVisible();
  await expect(page.getByText("E2E Test Textbook")).toBeVisible();
});
