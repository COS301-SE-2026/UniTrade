import { Page, APIRequestContext, expect } from "@playwright/test";

export function uniqueEmail(prefix = "e2e") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@tuks.co.za`;
}

export async function signupAndLogin(
  page: Page,
  request: APIRequestContext,
  { email, password = "Tafadzwa123!" }: { email: string; password?: string },
) {
  const universityResponse = page.waitForResponse(
    (res) => res.url().includes("/api/universities") && res.status() === 200,
  );

  await page.goto("/auth/Signup");
  await universityResponse;
  await page.locator('input[name="firstName"]').fill("Test");
  await page.locator('input[name="lastName"]').fill("User");
  await page.locator('input[name="email"]').fill(email);

  const universitySelect = page.locator('select[name="university"]');
  await expect(universitySelect.locator("option").nth(1)).not.toHaveText("", {
    timeout: 20000,
  });
  await universitySelect.selectOption({ index: 1 });

  await page.locator('input[name="yearOfStudy"]').fill("2");
  await page.locator('input[name="password"]').fill(password);
 

  const termsHeading = page.getByRole("heading", {name: "Terms & Conditions"});
  if (await termsHeading.isVisible({timeout: 3000}).catch(() => false)) {
    const scrollRegion = page.getByRole("region", {name: "Terms and Conditions"});
    if(await scrollRegion.isVisible().catch(() => false)) {
    await scrollRegion.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }

    const agreeCheckbox = page.getByRole("checkbox", {
      name: /I have read and agree to the Terms & Conditions/i,
    });
    await expect(agreeCheckbox).toBeEnabled({timeout: 5000});
    await agreeCheckbox.click({force: true});

    const acceptButton = page.getByRole("button", {name: "Accept & Continue"});
    await expect(acceptButton).toBeEnabled();
    await acceptButton.click();
    await expect(termsHeading).not.toBeVisible({timeout: 5000});
  }


   await page.getByRole("button", { name: /^signup$/i }).click();

  await page.waitForURL(/verify-otp/);

  let otp: string | undefined;
  for (let i = 0; i < 10; i++) {
    const res = await request.get(
      `http://localhost:8080/api/dev/otp?email=${encodeURIComponent(email)}`,
    );
    if (res.ok()) {
      ({ otp } = await res.json());
      if (otp) break;
    }
    await page.waitForTimeout(500);
  }
  expect(otp, "OTP was never stored").toBeTruthy();
  const code = otp!;
  const otpInputs = page.locator('input[maxlength="1"]');
  for (let i = 0; i < 6; i++) {
    await otpInputs.nth(i).fill(code[i]);
  }
  await page.getByRole("button", { name: /^verify otp$/i }).click();
  await page.waitForURL(/\/auth\/ProofUpload/);

  await page.locator('input[type="file"]').setInputFiles({
    name: "proof-of-registration.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });

  await expect(page.getByText("success", { exact: true })).toBeVisible({
    timeout: 20000,
  });

  await page.getByRole("button", {name: "Proceed to Login"}).click();

  
  await page.waitForURL(/\/auth\/Login/, {timeout: 10000});

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();

  const verificationHeading = page.getByRole("heading", {name: "Verification Status"});
  const modalAppeared = await verificationHeading
  .waitFor({state: "visible", timeout: 5000})
  .then(() => true)
  .catch(() => false);

  if (modalAppeared) {
    await page.getByRole("button", { name: /^continue$/i}).click();
  }


  await page.waitForURL(/\/buyer\/listings/);
}

export async function loginAsAdmin(page: Page, request: APIRequestContext) {
  const res = await request.post("http://localhost:8080/api/dev/admin");
  expect(
    res.ok(),
    "dev admin endpoint failed - is the backend in Development?",
  ).toBeTruthy();
  const { email, password } = await res.json();

  await page.goto("/auth/Login", {waitUntil: "domcontentloaded"});
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();

  await page.waitForURL(/\/admin\/disputes/);
}
