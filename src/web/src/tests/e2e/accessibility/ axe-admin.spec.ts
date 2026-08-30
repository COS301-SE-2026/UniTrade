import {test, expect, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright";
import {loginAsAdmin} from "../helpers/auth";
import { describe } from "node:test";
import { text } from "stream/consumers";
import { request } from "https";

const admin_pages: { name: string; path: string}[]= [


    {name: "dashboard", path: "/admin/dashboard"},
    {name: "verifications_queue", path: "/admin/verifications"},
    {name: "verification_review", path: " /admin/verifications/nonexistent-test-id"},
    {name: "disputes_queue" , path: "/admin/disputes"},
    {name: "disputes_review" , path: "/admin/disputes/nonexistent-test-id"},
    {name: "users_list" , path: "/admin/users"},
    {name: "user_view" , path: "/admin/users/1"}

];

test.describe("admin pages accessibility" , () =>
{
    test.beforeEach(async ({
        page, request
    }) => {
        await loginAsAdmin(page, request);

    })

    for(const { name, path} of admin_pages){
         test(` no serious or critical violations: ${name}`, async ({ page}, testInfo) => {
            await page.goto(path);
            await waitForPageToSettle(page);

            const results = await new AxeBuilder ({ page}).withTags(
                   ["wcag2a", "wcag2aa","wcag21a","wcag21aa"]
            ).analyze();
             const impactState = results.violations.filter(
                (v) => v.impact === "serious" || v.impact === "critical",

            );

            await testInfo.attach(`${name}-axe-results`, {
                body: JSON.stringify(results.violations,null,2),
                contentType: "application/json",
            })

            expect(
                impactState,
                `Found ${impactState.length} critical violations(s) on ${name}: `
                + impactState.map((v) => `${v.id} (${v.nodes.length} node(s))`).join(","),
            ).toEqual([]);
         })
    }
})

async function waitForPageToSettle(page:Page) {
    await page.waitForLoadState("networkidle");
    const loading = page.getByText(/loading/i);
    await loading.first().waitFor({ state: "detached", timeout: 5000}). catch(()=> {});
    
}