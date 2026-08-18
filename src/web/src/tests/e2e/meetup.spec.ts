import { test, expect } from "@playwright/test";
import {
  createListingAndReserve,
  scheduleMeetupAndCheckIn,
  dropMapPin,
  openCheckInModal,
} from "./helpers/reservation";

test.describe("meetup scheduling and check-in", () => {
  test.describe.configure({ mode: "serial" });

  test("seller and buyer can  schedule a meetup and both check in at the venue that they choose to meet up at ", async ({
    browser,
    request,
  }) => {
    test.setTimeout(150_000);

    const sellerContext = await browser.newContext();
    const buyerContext = await browser.newContext();
    await sellerContext.grantPermissions(["geolocation"]);
    await buyerContext.grantPermissions(["geolocation"]);

    await sellerContext.setGeolocation({
      latitude: -25.7487,
      longitude: 28.2379,
    });
    await buyerContext.setGeolocation({
      latitude: -25.7487,
      longitude: 28.2379,
    });

    const sellerPage = await sellerContext.newPage();
    const buyerPage = await buyerContext.newPage();

    const { reservationId } = await createListingAndReserve(
      sellerPage,
      buyerPage,
      request,
    );
    await scheduleMeetupAndCheckIn(sellerPage, buyerPage, reservationId);

    await expect(
      buyerPage.getByRole("button", { name: "Check In at Meetup" }),
    ).not.toBeVisible();
    await expect(
      sellerPage.getByRole("button", { name: "Check In at Meetup" }),
    ).not.toBeVisible();

    await sellerContext.close();
    await buyerContext.close();
  });

  test("buyer can decline a meetup proposal", async ({ browser, request }) => {
    const sellerContext = await browser.newContext();
    const buyerContext = await browser.newContext();

    const sellerPage = await sellerContext.newPage();
    const buyerPage = await buyerContext.newPage();

    await createListingAndReserve(sellerPage, buyerPage, request);

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
    await sellerPage.getByRole("button", { name: /send proposal/i }).click();

    await expect(
      buyerPage.getByText("Meetup Proposal", { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await buyerPage
      .getByRole("button", { name: "Decline", exact: true })
      .click();

    await expect(
      buyerPage.getByText("Meetup Declined", { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      sellerPage.getByText("Meetup Declined", { exact: true }),
    ).toBeVisible({ timeout: 10000 });

    await sellerContext.close();
    await buyerContext.close();
  });

  test("check-in card shows a message failure when location is denies", async ({
    browser,
    request,
  }) => {
    test.setTimeout(150_000);

    const sellerContext = await browser.newContext();
    const buyerContext = await browser.newContext();

    const sellerPage = await sellerContext.newPage();
    const buyerPage = await buyerContext.newPage();

    await buyerPage.addInitScript(() => {
      Object.defineProperty(window.navigator, "geolocation", {
        value: {
          getCurrentPosition: (
            _success: PositionCallback,
            error: PositionErrorCallback,
          ) => {
            error({
              code: 1,
              message: "User denied Geolocation",
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            });
          },
        },
        configurable: true,
      });
    });
    await createListingAndReserve(sellerPage, buyerPage, request);

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
    await sellerPage.getByRole("button", { name: /send proposal/i }).click();

    await expect(
      buyerPage.getByText("Meetup Proposal", { exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await buyerPage
      .getByRole("button", { name: "Accept", exact: true })
      .click();
    await expect(
      buyerPage.getByRole("heading", { name: "Meetup Details" }),
    ).toBeVisible({ timeout: 10000 });

    await openCheckInModal(buyerPage);

    await expect(buyerPage.getByText(/location access denied/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(
      buyerPage.getByRole("button", { name: "TRY AGAIN" }),
    ).toBeVisible();
    await expect(
      buyerPage.getByRole("button", { name: "CANCEL" }),
    ).toBeVisible();

    await buyerPage.getByRole("button", { name: "CANCEL" }).click();
    await expect(
      buyerPage.getByText(/location access denied/i),
    ).not.toBeVisible();

    await expect(
      buyerPage.getByRole("button", { name: "Check In at Meetup" }),
    ).toBeVisible();

    await sellerContext.close();
    await buyerContext.close();
  });
});
