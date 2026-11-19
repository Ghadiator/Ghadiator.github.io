/* Browser acceptance for the NATIVE public build (source 7.6.5+).
 *
 * The earlier suite exercised hand-applied overlays on the pinned 7.5.19
 * bundle (consolidated-nav shims, workspace tabs, injected KPI panels). The
 * native build renders those views from source, where their content is
 * asserted at build time (review_frontend/scripts/check-public-static.mjs and
 * check-target-release.mjs). This suite checks what only a browser can see on
 * the published output: every route renders, no page errors, no /api calls,
 * no horizontal overflow, and the three recorded-evidence panels (rendered
 * from source since 7.6.6) actually render.
 */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const routes = [
  "/", "/introduction/", "/business-impact/", "/use-case-assessment/", "/architecture/",
  "/ai-roles/", "/context-engineering/", "/governance/", "/governance-code/", "/ai-assurance/",
  "/red-team/", "/safety/", "/safety-origin/", "/workspace/", "/cases/", "/dashboard/",
  "/token-economics/", "/audit/", "/pool-analytics/", "/upload/", "/integration/", "/system-card/"
];
const widths = [
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" }
];
const settle = page => page.waitForTimeout(1500);

(async () => {
  const chrome = process.env.CHROME_PATH || ["/usr/bin/google-chrome", "/usr/bin/chromium"].find(fs.existsSync);
  assert.ok(chrome, "Missing Chrome/Chromium");
  const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
  let checks = 0;
  try {
    for (const viewport of widths) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      const errors = [], api = [];
      page.on("pageerror", e => errors.push(page.url() + " :: " + e.message));
      page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/api/")) api.push(r.url()); });

      // ── Every route renders inside the native shell ──
      for (const route of routes) {
        const response = await page.goto(base + route, { waitUntil: "load", timeout: 45000 });
        assert.equal(response?.status(), 200, `${viewport.label} ${route} HTTP`);
        await page.locator("main#main-content").waitFor({ state: "visible", timeout: 15000 });
        assert.equal(await page.locator(".public-shell").count(), 1, `${viewport.label} ${route}: one shell`);
        const heading = await page.locator("main h1").first().textContent();
        assert.ok(heading?.trim(), `${viewport.label} ${route}: missing h1`);
        await settle(page);
        const size = await page.evaluate(() => ({ body: document.body.scrollWidth, width: innerWidth }));
        assert.ok(size.body <= size.width + 1, `${viewport.label} ${route}: horizontal overflow ${size.body}>${size.width}`);
        checks++;
      }

      // ── Restored collaboration: aligned stages, fitted avatars, true bypass ──
      await page.goto(base + "/introduction/", { waitUntil: "load" });
      await page.locator("#human-agent-collaboration[data-aligned-collaboration='1']").waitFor({ state: "attached", timeout: 15000 });
      assert.equal(await page.locator("#human-agent-collaboration [data-lane='fast-path-bypass']").count(), 1,
        "Fast path bypass highlight must be present");
      const alignment = await page.evaluate(() => {
        const figure = document.querySelector("#human-agent-collaboration");
        const step = figure?.querySelector(".gac-main-steps article");
        const exception = figure?.querySelector("[data-lane='exception-path']");
        const human = figure?.querySelector(".gac-final-steps>article");
        const mode = figure?.querySelector(".gac-mode");
        const avatars = Array.from(exception?.querySelectorAll("a[href*='/ai-roles/']") || []);
        const rect = el => el.getBoundingClientRect();
        if (!step || !exception || !human || !mode || avatars.length !== 3) return null;
        const ex = rect(exception);
        return {
          aligned: Math.max(Math.abs(rect(step).top - ex.top), Math.abs(rect(human).top - ex.top)),
          fitted: avatars.every(a => {
            const b = rect(a);
            return b.left >= ex.left - 2 && b.right <= ex.right + 2
              && b.top >= ex.top - 2 && b.bottom <= ex.bottom + 2;
          }),
          mode: mode.textContent.includes("Human-led agent operations"),
          attackerOutside: Boolean(figure.querySelector(".gac-independent-assurance a[href*='#attacker']")),
          horizontalScrollInsideFigure: Boolean(figure.querySelector("figure").scrollWidth > figure.querySelector("figure").clientWidth),
        };
      });
      assert.ok(alignment, "Collaboration restoration did not mount");
      assert.ok(alignment.aligned <= 5, `Workflow cards lost horizontal alignment: ${alignment.aligned}px`);
      assert.ok(alignment.fitted, "Tier-3 agents extend beyond their exception block");
      assert.ok(alignment.mode && alignment.attackerOutside, "Operating model or isolated assurance missing");
      if (viewport.width < 1200) assert.ok(alignment.horizontalScrollInsideFigure, "Small viewports need an internal horizontal scroll");

      // ── System card must render complete, domain-neutral ADRs ──
      await page.goto(base + "/system-card/", { waitUntil: "load" });
      await page.locator(".sc-card").first().waitFor({ state: "visible", timeout: 15000 });
      assert.equal(await page.locator(".sc-card").count(), 11, "Featured ADR count");
      await page.getByRole("button", { name: "All", exact: true }).click();
      assert.equal(await page.locator(".sc-card").count(), 35, "All public ADRs must have content");
      await page.locator(".sc-card summary").first().click();
      assert.ok((await page.locator(".sc-detail").first().textContent()).includes("Design decision"),
        "Expanded ADR has a decision");
      await page.getByRole("searchbox", { name: "Search architecture decisions" }).fill("ADR-082");
      assert.equal(await page.locator(".sc-card").count(), 0, "Excluded ADR must not appear");
      await page.getByRole("searchbox", { name: "Search architecture decisions" }).fill("");

      // ── Recorded-evidence panels must render ──
      await page.goto(base + "/architecture/", { waitUntil: "load" });
      await page.locator("[data-gac-committee-audit]").waitFor({ state: "attached", timeout: 15000 });
      assert.match(await page.locator("[data-gac-committee-audit]").innerText(), /4\/15 cases record both arguments/,
        "Committee replay audit must state the recorded 4/15 split");

      await page.goto(base + "/token-economics/", { waitUntil: "load" });
      await page.locator("[data-gac-token-measures]").waitFor({ state: "attached", timeout: 15000 });
      assert.match(await page.locator("[data-gac-token-measures]").innerText(), /No provider-model usage events in (synthetic fixtures|these cases)/);

      await page.goto(base + "/cases/", { waitUntil: "load" });
      await page.locator("[data-gac-origin-panel]").waitFor({ state: "attached", timeout: 15000 });
      assert.match(await page.locator("[data-gac-origin-panel]").innerText(), /208/);
      assert.match(await page.locator("[data-gac-origin-panel]").innerText(), /571/);

      // ── Native content that carries the governance story ──
      await page.goto(base + "/business-impact/", { waitUntil: "load" });
      // 8.0.0 Business Value rework: old KPIs and the new AI-created KPIs.
      for (const group of ["Business KPIs the governed workflow aims to improve", "New risks, new KPIs, and their results"])
        assert.ok((await page.locator("main h2").allTextContents()).some(t => t.includes(group)), "Missing KPI family: " + group);

      await page.goto(base + "/governance-code/", { waitUntil: "load" });
      assert.equal(await page.locator('main button[aria-pressed]').count(), 8, "Eight governance mechanisms");

      assert.deepEqual(errors, [], `${viewport.label}: page errors`);
      assert.deepEqual(api, [], `${viewport.label}: public pages must not call /api`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`Native public build: ${checks} route renders across 3 viewports, overlays and evidence panels verified.`);
})().catch(e => { console.error(e); process.exit(1); });
