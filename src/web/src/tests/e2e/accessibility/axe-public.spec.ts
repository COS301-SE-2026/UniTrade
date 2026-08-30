import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const public_pages = [
    {name: "login", path: "/auth/Login"},
    {name: "signup", path: "/auth/Signup"},
    {name: "buyer-browse-listings", path: "/buyer/listings"},
];

test.describe("public pages accessibility", () =>
{
    for (const { name, path } of public_pages) {
        test(`no serious/critical violations: ${name}`,async ({page}, testInfo) => {
            await page.goto(path);
            await page.waitForLoadState("networkidle");

            const resulrts = await new AxeBuilder ({ page}).withTags(
                ["wcag2a", "wcag2aa","wcag21a","wcag21aa"]
            ).analyze();

            const state = resulrts.violations.filter(
                (v) => v.impact === "serious" || v.impact === "critical",

            );

            await testInfo.attach(`${name}-axe-results`, {
                body:JSON.stringify(resulrts.violations, null,2),
                contentType: "application/json",
            });

            expect(
                state, `Found ${state.length} serious/critical violations(s) on ${name}: ` +
                state.map((v) => v.id).join(", "),
            ).toEqual([]);
        
        })
    }
})


