/* Dedicated UX acceptance of public Validation Workspace and recorded Cases.
 * This exercises real published synthetic fixtures in Chromium, not fake cards.
 */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const variants = [
  { width: 390, height: 844, name: "mobile" },
  { width: 768, height: 1000, name: "tablet" },
  { width: 1440, height: 900, name: "desktop" }
];

(async () => {
  const executablePath = process.env.CHROME_PATH ||
    ["/usr/bin/google-chrome", "/usr/bin/chromium"].find(fs.existsSync);
  assert.ok(executablePath, "Chromium not available");
  const browser = await chromium.launch({
    executablePath, headless: true, args: ["--no-sandbox"]
  });
  try {
    for (const variant of variants) {
      const context = await browser.newContext({
        viewport: { width: variant.width, height: variant.height }
      });
      const page = await context.newPage();
      const errors = [], forbiddenApiCalls = [];
      page.on("pageerror", (e) => errors.push(page.url() + " :: " + e.message));
      page.on("request", (r) => {
        if (new URL(r.url()).pathname.startsWith("/api/")) forbiddenApiCalls.push(r.url());
      });

      // The workspace ships its own case queue (source 14797cd); the legacy
      // static overlay yields to it, so the native queue is what is tested.
      await page.goto(base + "/workspace/", { waitUntil: "load", timeout: 45000 });
      const queue = page.locator('section[aria-labelledby="workspace-queue-title"]');
      await queue.waitFor({ state: "visible", timeout: 16000 });
      assert.equal(await page.locator("#workspace-queue-title").count(), 1, "Exactly one case queue");
      assert.equal(await page.locator("#gac-workspace-guide").count(), 0,
        "The legacy overlay must not duplicate the native queue");
      const rows = queue.locator("tbody tr");
      await rows.first().getByText("Awaiting reviewer").waitFor({ state: "visible", timeout: 16000 });
      assert.equal(await rows.count(), 15,
        "All 15 recorded cases should be listed, not replaced by a separate showcase");
      const initial = await rows.allInnerTexts();
      assert.ok(initial[0].includes("Awaiting reviewer") && initial[1].includes("Awaiting supplier"),
        "Pending reviewer and supplier work must appear at the top");
      assert.ok((await queue.locator('[role="status"]').innerText()).includes("1 awaiting reviewer"));
      const filter = queue.locator('select[aria-label="Filter recorded workspace cases"]');
      await filter.selectOption("pending");
      assert.equal(await rows.count(), 2, "Pending filter must show exactly the two unresolved cases");
      await filter.selectOption("all");
      assert.equal(await rows.count(), 15);
      const search = queue.locator('input[aria-label="Search recorded workspace cases"]');
      await search.fill("currency");
      assert.equal(await rows.count(), 1);
      await search.fill("");
      assert.equal(await rows.count(), 15);
      assert.equal(await page.locator("nav[aria-label='Validation workspace views']").isVisible(), false,
        "Original five embedded-page tabs must not appear");
      assert.ok(await page.locator('a[href="/architecture#try"]').count() >= 1,
        "The workspace must point to the single upload path");

      // Queue-first workflow: open the pending case straight from the queue.
      const firstHref = await rows.first().locator("a").first().getAttribute("href");
      const firstId = new URL(firstHref, base).searchParams.get("id");
      assert.ok(firstId, "Queue rows must link to a case id");
      await rows.first().locator("a").first().click();
      await page.waitForURL(url => url.searchParams.get("id") === firstId);
      await page.locator("#source-evidence").first().waitFor({ state: "visible", timeout: 16000 });
      await page.goto(base + "/workspace/", { waitUntil: "load", timeout: 45000 });
      await queue.locator('a[href="/cases"], a[href="/cases/"]').first().click();
      await page.waitForURL((url) => url.pathname.replace(/\/$/, "") === "/cases");
      const guide = page.locator("#gac-cases-guide");
      await guide.waitFor({ state: "visible", timeout: 16000 });
      assert.equal(await guide.locator(".gac-clarity-case-grid > a").count(), 3);
      assert.equal(await page.locator('[data-gac-origin-panel]').isVisible(), false,
        "Redundant metric tabs must be hidden from the case decision path");
      assert.equal(await page.locator('section[aria-label="From collection to the case record"]').isVisible(), false,
        "Duplicated decorative diagram must be hidden in the case list");
      const table = page.locator("#recorded-case-list");
      await table.waitFor({ state: "visible", timeout: 16000 });
      assert.equal(await table.locator("tbody tr").count(), 15,
        "Existing 15-case record must remain intact and actionable");

      await guide.locator('a[href*="supplier_variance_review"]').click();
      await page.waitForURL((url) => url.searchParams.get("id") === "supplier_variance_review");
      const source = page.locator("#source-evidence");
      await source.getByText("Source evidence & validation trace").waitFor({ state: "visible", timeout: 16000 });
      assert.equal(await source.locator(".gac-src-walkthrough > li").count(), 4);
      assert.equal(await source.locator(".gac-src-story-step").count(), 3);
      const story = await source.locator(".gac-src-story").innerText();
      assert.ok(story.includes("13000.00") && story.includes("10000.00"));
      assert.ok(story.includes("30.0%") && story.includes("20.0%"));
      assert.ok(story.includes("event #30") && story.includes("event #31") && story.includes("event #32"));
      assert.ok((await source.locator("[data-gac-current-cell]").innerText()).includes("Submission!B9"),
        "Opening a finding must select its exact recorded input automatically");
      await source.getByRole("tab", { name: "Contract reference" }).click();
      assert.ok((await source.locator("[data-gac-grid]").innerText()).includes("Previous period total"));
      await source.locator(".gac-src-contract > summary").click();
      assert.ok((await source.locator(".gac-src-contract").innerText()).includes("event #22"),
        "Contract check provenance must show the actual archived event");
      assert.ok((await source.innerText()).includes("not a preview of an original uploaded XLSX"));
      assert.equal(await source.getByRole('button', {name:/^(Approve|Reject)(?: case)?$/i}).count(),0);

      const size = await page.evaluate(() => ({
        body: document.documentElement.scrollWidth, viewport: innerWidth
      }));
      assert.ok(size.body <= size.viewport + 1, variant.name + " page overflow");
      assert.deepEqual(forbiddenApiCalls, [], "Public UI must not call operational API");
      assert.deepEqual(errors, [], "Browser exceptions: " + errors.join(" | "));
      await context.close();
      console.log("PASS " + variant.name +
        ": queue first → 15 recorded cases → human oversight → source and validation trace");
    }
    const context = await browser.newContext({ viewport: { width: 1280, height: 820 } });
    const page = await context.newPage();
    await page.goto(base + "/case/?id=supplier_currency_mismatch#source-evidence",
      {waitUntil:"load",timeout:45000});
    const source = page.locator("#source-evidence");
    await source.getByText("Source evidence & validation trace").waitFor({state:"visible",timeout:16000});
    const explanation = await source.locator(".gac-src-story").innerText();
    assert.ok(explanation.includes("Submitted currency USD vs approved contract currency EUR — mismatch."));
    assert.ok(explanation.includes("event #22"));
    assert.ok((await source.locator("[data-gac-current-cell]").innerText()).includes("Submission!"),
      "Deterministic mismatch should preselect the related recorded field");
    await source.locator(".gac-src-contract > summary").click();
    const contractChecks = source.locator(".gac-src-contract .gac-src-rule");
    assert.equal(await contractChecks.count(), 8);
    assert.ok((await source.locator(".gac-src-contract").innerText()).includes("Currency matches contract"));
    await context.close();
    console.log("PASS contract mismatch: original recorded USD vs EUR, event #22 and named input paths");

    // Entry from another React route is not a full document refresh in all
    // Next.js journeys. A global script must keep the workspace guide and
    // source provenance discoverable from the sidebar as well.
    const navContext = await browser.newContext({viewport:{width:1440,height:900}});
    const navPage = await navContext.newPage();
    const navigationErrors = [];
    navPage.on("pageerror", e => navigationErrors.push(navPage.url()+" :: "+e.message));
    await navPage.goto(base + "/architecture/",{waitUntil:"load",timeout:45000});
    await navPage.locator('a[href="/workspace"]').first().click();
    await navPage.waitForURL(url => url.pathname.replace(/[/]$/, "") === "/workspace");
    const navigatedQueue = navPage.locator('section[aria-labelledby="workspace-queue-title"]');
    await navigatedQueue.waitFor({state:"visible",timeout:16000});
    await navigatedQueue.locator("tbody tr").first().getByText("Awaiting reviewer").waitFor({state:"visible",timeout:16000});
    assert.equal(await navigatedQueue.locator("tbody tr").count(), 15);
    assert.equal(await navPage.locator("#gac-workspace-guide").count(), 0);
    await navigatedQueue.locator('a[href="/cases"], a[href="/cases/"]').first().click();
    await navPage.waitForURL(url => url.pathname.replace(/[/]$/, "") === "/cases");
    await navPage.locator("#gac-cases-guide").waitFor({state:"visible",timeout:16000});
    await navPage.locator('.gac-clarity-case-grid a[href*="supplier_currency_mismatch"]').click();
    await navPage.waitForURL(url => url.searchParams.get("id")==="supplier_currency_mismatch");
    await navPage.locator("#source-evidence .gac-src-story").waitFor({state:"visible",timeout:16000});
    assert.ok((await navPage.locator("#source-evidence .gac-src-story").innerText()).includes("USD"));
    assert.deepEqual(navigationErrors, [],"React errors during cross-route navigation: "+navigationErrors.join(" | "));
    await navContext.close();
    console.log("PASS cross-route: Architecture sidebar → native case queue → Cases → recorded source evidence");

    // The native Next export ships its own queue; historical static
    // compatibility scripts must yield to it, and to native source evidence.
    // Exercise late-mounted native elements as well as ordinary routes.
    const coexistContext = await browser.newContext({viewport:{width:1280,height:820}});
    const coexistPage = await coexistContext.newPage();
    await coexistPage.goto(base + "/workspace/", {waitUntil:"load",timeout:45000});
    await coexistPage.locator("#workspace-queue-title").waitFor({state:"visible",timeout:16000});
    await coexistPage.waitForTimeout(1500);  // give the legacy script time to (not) mount
    assert.equal(await coexistPage.locator("#gac-workspace-guide").count(),0,
      "Legacy overlay must not duplicate the shipped native queue");
    assert.equal(await coexistPage.locator("main.gac-clarity-workspace").count(),0,
      "Legacy overlay must not hide an already-native workspace");
    await coexistPage.goto(base + "/case/?id=supplier_variance_review", {waitUntil:"load",timeout:45000});
    await coexistPage.locator("#source-evidence.gac-src-panel").waitFor({state:"visible",timeout:16000});
    await coexistPage.evaluate(() => {
      const main = document.querySelector("main#main-content");
      const native = document.createElement("section");
      native.id = "source-evidence";
      native.dataset.nativeSource = "yes";
      native.textContent = "Native source evidence";
      main.appendChild(native);
    });
    await coexistPage.waitForFunction(() =>
      document.querySelectorAll("#source-evidence").length === 1 &&
      document.querySelector("#source-evidence")?.dataset.nativeSource === "yes",
      null, {timeout:16000});
    assert.equal(await coexistPage.locator(".gac-src-panel").count(),0,
      "Legacy synthetic projection must yield to native original-workbook evidence");
    await coexistContext.close();
    console.log("PASS native coexistence: no duplicated workspace queue or source-evidence panel");
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exit(1); });