/* Smoke test the published native GovernanceAsCode static site in Chromium. */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const widths = [
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" },
];
const routes = [
  "/", "/architecture/", "/cases/", "/case/", "/audit/", "/safety/",
  "/red-team/", "/governance/", "/ai-roles/", "/token-economics/",
  "/integration/", "/upload/", "/safety-origin/",
];
(async () => {
  const chrome = process.env.CHROME_PATH ||
    ["/usr/bin/google-chrome", "/usr/bin/chromium"].find(fs.existsSync);
  assert.ok(chrome, "Missing Chrome/Chromium on Actions runner");
  const browser = await chromium.launch({
    executablePath: chrome, headless: true, args: ["--no-sandbox"],
  });
  let checks = 0;
  try {
    for (const viewport of widths) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      const errors = [];
      const apiRequests = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("request", request => {
        if (new URL(request.url()).pathname.startsWith("/api/")) {
          apiRequests.push(request.url());
        }
      });
      for (const route of routes) {
        const response = await page.goto(base + route, {
          waitUntil: "domcontentloaded", timeout: 45000,
        });
        assert.equal(response?.status(), 200, viewport.label + " " + route + ": HTTP");
        await page.locator("main#main-content").waitFor({ state: "visible", timeout: 15000 });
        await page.locator(".public-shell").waitFor({ state: "visible", timeout: 15000 });
        const heading = await page.locator("main h1").first().textContent();
        assert.ok(heading?.trim(), viewport.label + " " + route + ": no heading");
        await page.waitForTimeout(100);
        const dimensions = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        }));
        assert.ok(dimensions.document <= dimensions.viewport + 4,
          viewport.label + " " + route + ": horizontal overflow " +
          dimensions.document + " > " + dimensions.viewport);
        checks++;
      }
      await page.goto(base + "/governance/", { waitUntil: "domcontentloaded" });
      await page.getByRole("navigation", { name: "Governance channels" })
        .getByRole("link", { name: "Lessons", exact: true }).click();
      await page.getByRole("heading", { name: "From evidence to an approved change" }).waitFor();
      checks++;
      await page.goto(base + "/integration/", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Backend not deployed" }).waitFor();
      checks++;
      await page.goto(base + "/upload/", { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Supplier workbook lab" }).waitFor();
      checks++;
      if (viewport.label === "mobile") {
        await page.getByRole("button", { name: /Explore/ }).click();
        await page.getByRole("navigation", { name: "Main navigation" })
          .getByRole("link", { name: "Architecture explorer" }).click();
        await page.getByRole("heading", { name: "Architecture explorer" }).waitFor();
        checks++;
      }
      assert.deepEqual(apiRequests, [], viewport.label + ": unexpected /api calls");
      assert.deepEqual(errors, [], viewport.label + ": JavaScript errors");
      console.log(viewport.label + ": responsive routes, navigation, API isolation OK");
      await context.close();
    }
    console.log("PASS: " + checks + " public browser checks");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
