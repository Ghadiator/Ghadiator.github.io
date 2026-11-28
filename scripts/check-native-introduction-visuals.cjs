"use strict";
// Native published Introduction contract. The 2026-11-06 CSS-overlay
// placement is superseded by real sections and separate business KPI route.
// Do not modify the published site from this verification script.
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const path = require("node:path");
const mode = process.argv[2];
assert.ok(["manual", "human"].includes(mode), "Choose manual or human");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const chrome = process.env.CHROME_PATH ||
  ["/usr/bin/google-chrome", "/usr/bin/chromium"].find(fs.existsSync);
assert.ok(chrome, "Chrome/Chromium required");
const output = process.env.EVIDENCE_DIR;
assert.ok(output, "Set EVIDENCE_DIR to an isolated output directory");
fs.mkdirSync(output, { recursive: true });

async function requireLoadedImage(page, locator, expected) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForFunction(({ selector, expected }) => {
    const img = document.querySelector(selector);
    return img?.complete && img.naturalWidth > 0 &&
      new URL(img.currentSrc).pathname === expected;
  }, { selector: await locator.evaluate(el => "#" + el.closest("section").id + " img"), expected });
  assert.equal(new URL(await locator.evaluate(el => el.currentSrc)).pathname, expected);
  const response = await page.request.get(base + expected);
  assert.ok(response.ok(), "Missing or inaccessible visual: " + expected);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: chrome, headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  try {
    for (const width of [1440, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        const response = await page.goto(base + "/", { waitUntil: "load" });
        assert.equal(response?.status(), 200);
        const main = page.locator("main#main-content");
        const intro = main.locator("#introduction-title");
        const manual = main.locator("#manual-supplier-workflow");
        const flow = main.locator("#overview-usecase-flow");
        const collaboration = main.locator("#human-agent-collaboration");
        const roster = main.locator('section[aria-labelledby="overview-agent-strip"]');
        for (const section of [intro, manual, flow, collaboration, roster])
          await section.waitFor({ state: "visible", timeout: 15000 });
        const order = await main.evaluate(root => {
          const elements = ["#introduction-title", "#manual-supplier-workflow",
            "#overview-usecase-flow", "#human-agent-collaboration",
            'section[aria-labelledby="overview-agent-strip"]'].map(s => root.querySelector(s));
          return elements.every((el, i) => i === 0 ||
            !!(elements[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
        });
        assert.ok(order, "Introduction/manual/flow/collaboration/roster reading order");

        if (mode === "manual") {
          const expected = width <= 760
            ? "/visuals/manual-supplier-invoice-workflow-mobile-20261118.svg"
            : "/visuals/manual-supplier-invoice-workflow-20261118.svg";
          const image = manual.locator("picture img");
          await requireLoadedImage(page, image, expected);
          const alt = await image.getAttribute("alt");
          assert.match(alt, /Seven human-led supplier invoice validation steps/);
          assert.match(alt, /human decision/);
          assert.equal(await main.locator("#gac-kpi-manual-comparison, #business-kpis").count(), 0,
            "The manual overview must not be embedded inside the KPI section");
          const link = page.locator('.public-nav a[href="/business-impact"], .public-nav a[href="/business-impact/"]');
          assert.equal(await link.count(), 1);
          await page.screenshot({path: path.join(output, "manual-" + width + ".png"), fullPage: true});
          const kpi = await page.goto(base + "/business-impact/", {waitUntil:"load"});
          assert.equal(kpi?.status(), 200);
          const section = page.locator("main #business-kpis");
          await section.waitFor({state:"visible", timeout:15000});
          assert.match(await page.locator("main").innerText(), /Group A\s*·\s*Business KPIs/);
          assert.equal(await section.locator('img[src*="manual-supplier-invoice-workflow"]').count(), 0);
          assert.equal(await page.locator("main #manual-supplier-workflow").count(), 0);
          await page.screenshot({path: path.join(output, "business-kpis-" + width + ".png"), fullPage: true});
        } else {
          const image = collaboration.locator("img");
          await requireLoadedImage(page, image, "/visuals/human-agent-horizontal-fastpath-20261119.svg");
          const alt = await image.getAttribute("alt");
          assert.match(alt, /fast path skips conditional stage 5/i);
          assert.match(alt, /human sign-off at stage 7/i);
          assert.match(alt, /Attacker is isolated from case execution/i);
          assert.match(await collaboration.innerText(), /never the named reviewer decision/i);
          const names = await roster.locator("h4").allTextContents();
          assert.deepEqual(names, ["Proponent", "Opponent", "Judge", "Attacker",
            "Analytics", "Integrator", "Audit", "Reporter"]);
          assert.match(await roster.innerText(), /CoVe verifies claims; always-on orchestration coordinates stages; neither is an AI persona/);
          if (width <= 768) {
            const scroll = collaboration.locator('[aria-label^="Horizontal eight-stage"]');
            const sizes = await scroll.evaluate(el => ({
              overflow: getComputedStyle(el).overflowX,
              scrollWidth: el.scrollWidth, clientWidth: el.clientWidth
            }));
            assert.match(sizes.overflow, /auto|scroll/);
            assert.ok(sizes.scrollWidth > sizes.clientWidth, "Mobile workflow must be scrollable");
            await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth; });
            assert.ok(await scroll.evaluate(el => el.scrollLeft) > 0, "Cannot reach last stage");
            await scroll.evaluate(el => { el.scrollLeft = 0; });
          }
          await page.screenshot({path: path.join(output, "human-agent-" + width + ".png"), fullPage: true});
        }
        console.log("PASS native " + mode + " visual contract at " + width + "px");
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exit(1); });
