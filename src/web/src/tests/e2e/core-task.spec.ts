import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { signupVerifyAndLogin, uniqueEmail } from "./helpers/auth";
import { createSellerListing, scheduleMeetupAndCheckIn } from "./helpers/reservation";
import { mkdirSync, writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 
 *  QR -06b Usability 
 *  Unitrade core marketplace tasks completes e2e in <= 120s 
 * browse-> reserve-> chat-> meetup-> initiate payment.
 * 
 */

const CORE_TASK_BUDGET_MS = 120_000;


const EVIDENCE_DIR = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "tests",
    "nfr",
    "evidence",
    "core-task",
);

test.describe("QR-06b core task end-to-end time", () => {
    test.describe.configure({ mode: "serial" });

    test("browse -> reserve -> chat -> meetup -> initiate payment in <= 120s", async ({
        browser,
        request,

    }) => {
        test.setTimeout(180_000);

        const sellerContext = await browser.newContext();
        const buyerContext = await browser.newContext();
        for (const ctx of [sellerContext, buyerContext]) {
            await ctx.grantPermissions(["geolocation"]);
            await ctx.setGeolocation({ latitude: -25.7487, longitude: 28.2379 });

        }

        await buyerContext.route(/payfast/i, (route) => route.abort());

        const sellerPage = await sellerContext.newPage();
        const buyerPage = await buyerContext.newPage();

        // preconditions 
        const sellerAdminContext = await browser.newContext();
        const sellerAdminPage = await sellerAdminContext.newPage();
        await signupVerifyAndLogin(sellerPage, request, sellerAdminPage, {
            email: uniqueEmail("seller"),
        });

        await sellerAdminContext.close();

        await sellerPage.getByText("Switch", { exact: true }).click();
        await sellerPage.waitForURL(/\/seller\/listings/);
        const { listingTitle } = await createSellerListing(sellerPage);

        const buyerAdminContext = await browser.newContext();
        const buyerAdminPage = await buyerAdminContext.newPage();
        await signupVerifyAndLogin(buyerPage, request, buyerAdminPage, {
            email: uniqueEmail("buyer"),
        });

        await buyerAdminContext.close();

        await buyerPage.waitForURL(/\/buyer\/listings/);

        // core tasks
        const startedAt = Date.now();

        //1 browse-> open listing -> reserve
        const listingCard = buyerPage
            .getByTestId("listing-card")
            .filter({ hasText: listingTitle });
        await expect(listingCard).toBeVisible({ timeout: 10000 });

        await listingCard.locator("img").click();
        await buyerPage.waitForURL(/\/buyer\/listings\/.+/);
        await buyerPage.getByRole("button", { name: /reserve this item/i }).click();
        await buyerPage.waitForURL(/\/buyer\/reservations/);
        // 2. open chat

        await buyerPage.getByRole("button", { name: /message seller/i }).click();
        await buyerPage.waitForURL(/\/buyer\/messages\/(.+)/);

        const reservationId = new URL(buyerPage.url()).pathname.split("/").pop()!;

        await expect(
            buyerPage.getByText(/waiting for seller to accept reservation/i),
        ).toBeVisible();
        await expect(
            buyerPage.getByPlaceholder("Type a message..."),
        ).not.toBeVisible();

        // 3 seller accepts -> chat opens for both parties
        await sellerPage.goto("/seller/reservations");
        await Promise.all([
            sellerPage.waitForResponse(
                (res) =>
                    /\/reservations\/.+\/acknowledge/i.test(res.url()) &&
                    res.request().method() === "POST" && res.ok(),

            ),
            sellerPage.getByRole("button", { name: "Accept Reservation" }).click(),

        ]);
        await sellerPage.goto(`/seller/messages/${reservationId}`);
        await buyerPage.reload(); 
        await expect(
            buyerPage.getByPlaceholder("Type a message..."),
        ).toBeVisible({ timeout: 15_000, });
        await expect(
            sellerPage.getByPlaceholder("Type a message..."),
        ).toBeVisible({ timeout: 15_000, });

        // 4. meetup schedule + both check in at the venue
        await scheduleMeetupAndCheckIn(sellerPage, buyerPage, reservationId);

        // 5 initiate payment pay fast hand-off
        await buyerPage.goto(`/payment/meetup/${reservationId}`);
        await expect(
            buyerPage.getByRole("heading", { name: "Meetup Details" }),
        ).toBeVisible({ timeout: 10000 });

        const payButton = buyerPage.getByRole("button", {name: /pay r/i });
        await expect(payButton).toBeEnabled({timeout: 30_000});

        const [txResponse] = await Promise.all([
            buyerPage.waitForResponse(
                (res) => 
                    /\/reservations\/.+\/Transaction-request/i.test(res.url()) && 
                res.request().method() === "POST",
                {timeout: 20_000},
            ),
            payButton.click(),
        ]);
        expect(txResponse.ok(), `Payfast hand-off (Transaction-request) should return 2xx got ${txResponse.status()}`,
    ).toBeTruthy();

    const elapsedMs = Date.now() - startedAt;
    // core task end

    const pass = elapsedMs <= CORE_TASK_BUDGET_MS;
     
    console.log(
        `[QR-06b] core task = ${(elapsedMs / 1000).toFixed(1)}s ` +
        `(budget ${CORE_TASK_BUDGET_MS / 1000}s) -> ${pass? "PASS":"FAIL"}`,
    );

    mkdirSync(EVIDENCE_DIR, {recursive: true});
    writeFileSync(
        path.join(EVIDENCE_DIR, "core-task.json"),
        JSON.stringify(
            {
                qr: "QR-06b",
                category: "Usability",
                requirement: 
                    "Core task (browse -> reserve -> chat -> meetup -> initiate payment) completes in <=120s",
                measurement: 
                    "buyer core-task wall-clock; EXCLUDES account onboarding + selle listing creation (precondition)",
                paymentMode:
                    "PayFast hand-off asserted (POST /reservations/:id/Transaction-request returns 2xx); external redirect blocked",
                drivenSynchronously:
                    "both parties driven back-to-back with no human think-time; number is the mechanical floor of the journey",
                budgetMs: CORE_TASK_BUDGET_MS,
                elapsedMs,
                elapsedSeconds: Math.round(elapsedMs / 100) / 10,
                pass,
                transactionRequestStatus: txResponse.status(),
                reservationId,
                measuredAt: new Date().toISOString(),
                        },
                        null,
                        2, 

        )+ 
       "\n",
    );

    expect(elapsedMs).toBeLessThanOrEqual(CORE_TASK_BUDGET_MS);

    await sellerContext.close();
    await buyerContext.close();
    

    });
});