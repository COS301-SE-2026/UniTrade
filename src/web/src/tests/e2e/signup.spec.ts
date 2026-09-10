import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}@tuks.co.za`;
}

test("user can sign up, verify OTP, and reach the login page, login, reach their listings dashboard", async ({
  page,
  request,
}) => {
  const email = uniqueEmail();
  const password = "Tafadzwa123!";

  await page.goto("/auth/Signup");

  await page.locator('input[name="firstName"]').fill("Test");
  await page.locator('input[name="lastName"]').fill("User");
  await page.locator('input[name="email"]').fill(email);

  const universitySelect = page.locator('select[name="university"]');
  await expect(universitySelect.locator("option").nth(1)).not.toHaveText("", {
    timeout: 100000,
  });
  await universitySelect.selectOption({ index: 1 });

  await page.locator('input[name="yearOfStudy"]').fill("2");
  await page.locator('input[name="password"]').fill(password);

  const scrollRegion = page.getByRole("region", {
    name: "Terms and Conditions",
  });
  await expect(scrollRegion).toBeVisible({ timeout: 5000 });
  await scrollRegion.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });

  const agreeCheckBox = page.getByRole("checkbox", {
    name: /I have read and agree to the Terms & Conditions/i,
  });
  await expect(agreeCheckBox).toBeEnabled({ timeout: 5000 });
  await agreeCheckBox.check();

  await page.getByRole("button", { name: "Accept & Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Terms & Conditions" }),
  ).not.toBeVisible({ timeout: 5000 });

  await page.getByRole("button", { name: /^signup$/i }).click();

  await page.waitForURL(/verify-otp/);

  const otpResponse = await request.get(
    `http://localhost:8080/api/dev/otp?email=${encodeURIComponent(email)}`,
  );
  expect(otpResponse.ok()).toBeTruthy();
  const { otp } = await otpResponse.json();

  const otpInputs = page.locator('input[maxlength="1"]');
  for (let i = 0; i < 6; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }

  await page.getByRole("button", { name: /^verify otp$/i }).click();

  await page.waitForURL(/\/auth\/ProofUpload/);
  await page.locator('input[type="file"]').setInputFiles({
    name: "proof-of-registration.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });


  await page.getByRole("button", { name: /proceed to login/i }).click();

  await page.waitForURL(/\/auth\/Login/);
  await expect(page).toHaveURL(/\/auth\/Login/);

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  await page.getByRole("button", { name: /^login$/i }).click();

 
  const continueAfterLoginBtn = page.getByRole("button", { name: /^continue$/i });

  try {
    await continueAfterLoginBtn.waitFor({ state: "visible", timeout: 5000 });
    await continueAfterLoginBtn.click();
  } catch {
    // the user is already verified, no need for verification modal at all
  }

  await page.waitForURL(/\/buyer\/listings/);
  await expect(page).toHaveURL(/\/buyer\/listings/);
  await expect(page.getByText(/browse all listings/i)).toBeVisible();
});
