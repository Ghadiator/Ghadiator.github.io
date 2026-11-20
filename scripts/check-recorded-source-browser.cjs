/* Browser acceptance scoped to the real recorded public fixture source.
 * Static public Pages only: no simulated original XLSX and no live actions.
 */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const widths = [
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" }
];

(async () => {
  const executablePath = process.env.CHROME_PATH ||
    ["/usr/bin/google-chrome", "/usr/bin/chromium"].find(fs.existsSync);
  assert.ok(executablePath, "No available browser");
  const browser = await chromium.launch({
    executablePath, headless: true, args: ["--no-sandbox"]
  });
  try {
    for (const viewport of widths) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      const errors = [], apiCalls = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("request", (req) => {
        if (new URL(req.url()).pathname.startsWith("/api/")) apiCalls.push(req.url());
      });
      await page.goto(base + "/cases/", { waitUntil: "load", timeout: 45000 });
      const caseLink = page.locator('a[href*="id=supplier_variance_review"]').first();
      await caseLink.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForFunction(() => {
        const link = document.querySelector('a[href*="id=supplier_variance_review"]');
        return link && link.getAttribute("href").endsWith("#source-evidence");
      }, null, { timeout: 15000 });
      await caseLink.click();
      await page.waitForURL((url) =>
        url.searchParams.get("id") === "supplier_variance_review", { timeout: 15000 });
      assert.ok(page.url().includes("id=supplier_variance_review"),
        "Queued case navigation: " + page.url());
      const panel = page.locator("#source-evidence");
      await panel.getByText("Show me where you found it").waitFor({ state: "visible", timeout: 15000 });
      const body = await panel.innerText();
      assert.ok(body.includes("42 verified event records"), "42 event records pinned");
      assert.ok(body.includes("30.0%") && body.includes("20.0%"), "Recorded volume finding reproducible");
      assert.ok(body.includes("not a preview of an original uploaded XLSX"), "Original source boundary transparent");
      assert.ok(body.includes("Recorded human outcome"), "Recorded reviewer action shown read-only");
      const finding = panel.locator(".gac-src-finding").first();
      await finding.hover();
      assert.match(await panel.locator("[data-gac-current-cell]").innerText(), /Submission!B9/);
      assert.ok((await panel.locator(".gac-src-cell.is-selected").count()) >= 1, "Hover highlights recorded source fields");
      await panel.getByRole("tab", { name: "Contract reference" }).click();
      assert.ok((await panel.locator("[data-gac-grid]").innerText()).includes("Previous period total"));
      await panel.getByRole("tab", { name: "LineItems" }).click();
      assert.ok((await panel.locator("[data-gac-grid]").innerText()).includes("13000.00"));
      await panel.locator(".gac-src-rules > summary").click();
      assert.ok((await panel.locator(".gac-src-rules").innerText()).includes("event #11"));
      assert.equal(await panel.locator("button").filter({ hasText: /Approve|Reject/i }).count(), 0);
      const dimensions = await page.evaluate(() => ({
        full: document.documentElement.scrollWidth, viewport: window.innerWidth
      }));
      assert.ok(dimensions.full <= dimensions.viewport + 1,
        viewport.label + " horizontal overflow " + dimensions.full + " > " + dimensions.viewport);
      assert.deepEqual(apiCalls, [], "Static Pages must never contact private API");
      assert.deepEqual(errors, [], "Browser errors: " + errors.join(" | "));
      if (viewport.label === "desktop") {
        await page.screenshot({
          path: "/tmp/recorded-case-source-desktop.png",
          fullPage: true
        });
      }
      await context.close();
      console.log("PASS " + viewport.label +
        ": queued case → 42-event recorded source → highlighted cells → method → archived decision");
    }

    // Second recorded execution, two attempts with repeated rule IDs.
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(base + "/case/?id=supplier_rate_correction#source-evidence", { waitUntil: "load" });
    const panel = page.locator("#source-evidence");
    await panel.getByText("Show me where you found it").waitFor({ state: "visible", timeout: 15000 });
    await panel.locator(".gac-src-rules > summary").click();
    assert.ok((await panel.locator(".gac-src-rules").innerText()).includes("event #40"),
      "Second submission attempt must point to its own recorded rule event, not attempt one");
    assert.equal(await panel.locator(".gac-src-rule").count(), 6);
    await context.close();
    console.log("PASS repeated submission: the recorded R1 rule event is #40, not #11");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});