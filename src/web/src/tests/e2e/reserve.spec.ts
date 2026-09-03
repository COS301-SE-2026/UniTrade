import { test, expect } from "@playwright/test";
import { signupAndLogin, uniqueEmail} from "./helpers/auth";

test("reservation filter narrows the list to the selected status", async ({
  browser,
  request,
}) => {
  test.setTimeout(60_000);
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
    buyerPage.getByText(/reserve items from listings to see them here/i),
  ).toBeVisible();

  await buyerContext.close();
});
