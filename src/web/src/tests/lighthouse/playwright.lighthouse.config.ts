import {defineConfig, devices } from '@playwright/test';
const preview_port = process.env.LIGHTHOUSE_PORT ?? "4173";
const cdp_port =9222;

export default defineConfig({
    testDir:"./",
    timeout: 90_000,
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [["html", {outputFolder: "lighthouse-report", open: "never"}],
    ["list"],
],

use: {
    baseURL: `http://localhost:${preview_port}`,
    trace: "off",
    video: "off",
    screenshot: "off",
},
projects: [
    {
        name: "chromium-lighthouse",
        use: {
            ...devices["Desktop Chrome"],
            launchOptions: {
                args: [`--remote-debugging-port=${cdp_port}`],
            }

        }
    }
],
webServer:
{
    command: `npm run build && npm run preview -- --port ${preview_port} -- strictPort`,
    url: `http://localhost:${preview_port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
}

    
})