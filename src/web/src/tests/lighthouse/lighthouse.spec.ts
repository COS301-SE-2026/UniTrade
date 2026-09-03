import { test } from "@playwright/test";
import {playAudit } from "playwright-lighthouse";
import * as fs from "fs";
import * as path from "path";
import { Lighthouse_pages } from "./lighthouse-pages";
import {loginAsAdmin, signupAndLogin, uniqueEmail } from "../e2e/helpers/auth";
import type { Page, APIRequestContext } from "@playwright/test";

const cdp_port = 9222;
const reportDir = path.join(process.cwd(), "lighthouse-reports");
fs.mkdirSync(reportDir, { recursive: true });

async function authenticate(page: Page, request: APIRequestContext, authRole: string)
{
    if (authRole ==="admin"){
        await loginAsAdmin(page, request);
    }else if(authRole === "buyer")
        {
            await signupAndLogin(page,request, { email: 
                uniqueEmail("lighthouse")});
            }} 

test.describe("Lighthouse - accessibility", () => {
    for (const pageConfig of Lighthouse_pages) {
        test(`accs: ${pageConfig.name}`, async ({ page, request},
            testInfo) => {
                await authenticate(page, request, pageConfig.authRole);
                await page.goto(pageConfig.path);
                await page.waitForLoadState("networkidle");

                const jsonName = `${pageConfig.name}-accs`;
                const htmlReportPath = path.join(reportDir, `${jsonName}.report.html`); 
                const jsonReportPath = path.join(reportDir, `${jsonName}.report.json`);

                try{
                    await playAudit({
                        page, port: cdp_port,
                        thresholds: { accessibility: 
                            pageConfig.thresholds.accessibility
                        },
                        opts: { onlyCategories: ["accessibility"] },
                        reports: { formats: { html: true, json: true },name:
                    jsonName, directory: reportDir }
                    })
                } finally {
                    if (fs.existsSync(jsonReportPath)) {
                        const lhr = JSON.parse(fs.readFileSync(jsonReportPath, "utf-8"));
                        const score = Math.round((lhr.categories.accessibility.score ?? 0) * 100);
                        console.log(`lighthouse accessibility score for ${pageConfig.name}:`, score);
                            await testInfo.attach(`${pageConfig.name}-accessibility-score`, { body: JSON.stringify({ accessiblility: score },
                            null, 2),
                            contentType: "application/json", });
                    }
        
    if(fs.existsSync(htmlReportPath)){
        await testInfo.attach(`${pageConfig.name}-accessibility-report`, { path: htmlReportPath, contentType: "text/html" });
    }
}
})
}
});


