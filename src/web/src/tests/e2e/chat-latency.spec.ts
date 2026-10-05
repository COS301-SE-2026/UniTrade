import { test, expect } from "@playwright/test";
import path from "path";
import { createListingAndReserve } from "./helpers/reservation";
import fs from "fs";

test("QR-01b: chat delivery latency stays under 500ms p95", async ({
  browser,
  request,
}) => {
  test.setTimeout(180_000);

  const sellerContext = await browser.newContext();
  const buyerContext = await browser.newContext();
  const sellerPage = await sellerContext.newPage();
  const buyerPage = await buyerContext.newPage();

  const { reservationId } = await createListingAndReserve(
    sellerPage,
    buyerPage,
    request,
    browser,
  );

  await buyerPage.goto(`/buyer/messages/${reservationId}`);
  await sellerPage.goto(`/seller/messages/${reservationId}`);
  const buyerInput = buyerPage.getByPlaceholder("Type a message...");
  await expect(buyerInput).toBeVisible({ timeout: 15_000 });

  const SAMPLES = 20;
  const latencies: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const marker = `probe-${i}-${Date.now()}`;
    await buyerInput.fill(marker);
    const sentAt = Date.now();
    await buyerInput.press("Enter");
    await sellerPage
      .locator("p.whitespace-pre-wrap", {hasText: marker})
      .waitFor({ state: "visible", timeout: 5_000 });
    latencies.push(Date.now() - sentAt);
    await buyerPage.waitForTimeout(150);
  }

  latencies.sort((a, b) => a - b);
  const pct = (p: number) =>
    latencies[
      Math.min(
        latencies.length - 1,
        Math.ceil((p / 100) * latencies.length) - 1,
      )
    ];
  const p95 = pct(95);
  const summary = {
    metric: "chat_message_delivery_ms",
    samples: SAMPLES,
    p50_ms: pct(50),
    p95_ms: p95,
    max_ms: latencies.at(-1),
    target_ms: 500,
    pass: p95 <= 500,
    measuredAt: new Date().toISOString(),
    note: "Recipient-side send->receive over SignalR, measured through the built UI (includes minor render).",
  };

  const outDir = path.resolve(
    process.cwd(),
    "../../tests/nfr/evidence/chat-latency",
  );
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "chat-latency.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(
    `chat delivery p50=${summary.p50_ms}ms p95=${p95}ms over ${SAMPLES} msgs`,
  );

  await sellerContext.close();
  await buyerContext.close();
  expect(p95).toBeLessThanOrEqual(500);
});
