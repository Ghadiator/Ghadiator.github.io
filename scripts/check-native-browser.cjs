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
  "/token-economics/", "/audit/", "/upload/", "/integration/", "/system-card/"
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

      // ── Original eight-stage figure; no two-row CSS reflow ──
      await page.goto(base + "/introduction/", { waitUntil: "load" });
      await page.locator("#gac-horizontal-figure-20261119[data-horizontal-restored='original-8-step-svg']")
        .waitFor({ state: "attached", timeout: 15000 });
      assert.ok(await page.locator("#gac-horizontal-figure-20261119 img").isVisible(),
        "Recovered horizontal figure must be visible, not merely present in the DOM");
      const horizontal = await page.evaluate(async () => {
        const section = document.getElementById("gac-horizontal-figure-20261119");
        const image = section?.querySelector("img");
        const scroller = section?.querySelector(".gac-horizontal-scroll");
        if (!image || !scroller) return null;
        if (!image.complete) await new Promise(resolve => { image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true}); });
        const svg = await fetch(image.src).then(r => r.text());
        return {
          loaded: image.naturalWidth === 1800 && image.naturalHeight === 1140,
          original: svg.includes('x="245" y="600"') && svg.includes('x="1424" y="600"'),
          eight: (svg.match(/text x=".*?" y="625"/g)||[]).length >= 8,
          bypass: svg.includes('gac-fast-path-bypass') && svg.includes('FAST PATH · SKIP STEP 5'),
          human: svg.includes('HUMAN SIGN-OFF'),
          committee: ["Proponent","Opponent","CoVe","Judge"].every(x=>svg.includes(x)),
          scroller: scroller.scrollWidth > scroller.clientWidth,
          olderRowRemoved: !document.getElementById("human-agent-collaboration")
        };
      });
      assert.ok(horizontal, "Horizontal SVG not mounted");
      assert.ok(horizontal.loaded && horizontal.original && horizontal.bypass && horizontal.human && horizontal.committee,
        "The original horizontal figure or its true bypass is missing: " + JSON.stringify(horizontal));
      assert.ok(horizontal.olderRowRemoved, "The new two-row component is still displayed");
      if(viewport.width < 1200) assert.ok(horizontal.scroller, "Small viewports must scroll inside the figure");

      // ── Failure Lab: real-LLM attacker game, honest offline state, hints and collapsed evidence ──
      await page.goto(base + "/red-team/", { waitUntil: "load" });
      // The Failure Lab is native in the source build since a082cb20d6c3
      // (owner commits 77509ec/b94b74c); the static patch ids are gone.
      await page.locator("#failure-lab-intro").waitFor({ state: "visible", timeout: 15000 });
      assert.match(await page.locator("#failure-lab-intro").innerText(), /How can a governed AI workflow fail\?/);
      const threats = page.locator("section:has(#threats-heading) article");
      assert.equal(await threats.count(), 6, "Six grounded threat categories");
      assert.ok((await page.locator("main").innerText()).includes("Obfuscation"));
      await page.locator("#challenge-me").waitFor({state:"visible",timeout:15000});
      await page.locator("#arena-technique").selectOption({ index: 1 });
      await page.getByRole("button",{name:/Use example/}).click();
      assert.ok((await page.locator("#arena-payload").inputValue()).trim().length > 0,
        "Sample must load a real attack draft");
      await page.getByRole("button",{name:/Reveal next hint/}).click();
      assert.match(await page.locator("#challenge-me").innerText(), /Hint 1/i,
        "Challenge hints must be progressive and usable");
      assert.equal(await page.getByRole("button",{name:/Attack the defender/}).isDisabled(),true,
        "No LLM attack must be submitted without an explicitly configured sandbox");
      const campaign = page.locator("details#adversarial-red-team");
      assert.equal(await campaign.evaluate(el=>el.open), false, "Recorded red team should start collapsed");
      await campaign.locator("summary").first().click();
      assert.equal(await page.locator("[data-attack]").count(),7, "Recorded control probes remain accessible");
      const topLinks = await page.locator(".public-sidebar .public-nav a").evaluateAll(as=>as.map(a=>a.getAttribute("href")));
      assert.ok(topLinks.indexOf("/red-team") === topLinks.indexOf("/architecture")+1,
        "Failure Lab should be directly after Architecture in the sidebar");

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

      // ── Recorded case: source → check → evidence → reviewer outcome ──
      const recordedLink = page.locator('a[href*="id=supplier_variance_review"]').first();
      await recordedLink.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForFunction(() => {
        const a = document.querySelector('a[href*="id=supplier_variance_review"]');
        return a?.getAttribute("href")?.endsWith("#source-evidence");
      }, { timeout: 10000 });
      await recordedLink.click();
      assert.ok(page.url().includes("id=supplier_variance_review"), "Queue link must open the selected recorded case");
      const source = page.locator("#source-evidence");
      await source.waitFor({ state: "visible", timeout: 15000 });
      await source.getByText("Source evidence & validation trace").waitFor({ state: "visible" });
      const text = await source.innerText();
      assert.ok(text.includes("42 verified event records"), "Exact recorded event count");
      assert.ok(text.includes("30.0%") && text.includes("20.0%"), "Actual recorded variance and contract threshold");
      assert.ok(text.includes("not a preview of an original uploaded XLSX"), "No invented original Excel provenance");
      assert.ok(text.includes("Recorded human outcome"), "Recorded reviewer outcome remains visible");
      assert.ok(text.includes("data/cases.json") || text.includes("cases.json"), "Source file disclosure");
      await source.locator(".gac-src-finding").first().hover();
      assert.match(await source.locator("[data-gac-current-cell]").innerText(), /Submission!B9/);
      assert.ok((await source.locator(".gac-src-cell.is-selected").count()) >= 1, "Hover must highlight real recorded fixture fields");
      await source.getByRole("tab", { name: "Contract reference" }).click();
      assert.ok(await source.getByRole("tab", { name: "Contract reference" }).getAttribute("aria-selected") === "true");
      assert.ok((await source.locator("[data-gac-grid]").innerText()).includes("Previous period total"), "Recorded baseline sheet available");
      await source.getByRole("tab", { name: "LineItems" }).click();
      assert.ok((await source.locator("[data-gac-grid]").innerText()).includes("13000.00"), "Recorded line-item values preserved");
      // Two rule lists exist (Tier 2 contract checks + deterministic rules); R1 lives in the deterministic one.
      const ruleList = source.locator(".gac-src-rules:not(.gac-src-contract)");
      await ruleList.locator(":scope > summary").click();
      assert.ok((await ruleList.innerText()).includes("event #11"), "Recorded R1 rule event must be linked");
      assert.equal(await source.getByRole("button", { name: /^(Approve|Reject)(?: case)?$/i }).count(), 0,
        "Public evidence preview must not offer live reviewer decisions");
      const caseSize = await page.evaluate(() => ({ body: document.body.scrollWidth, width: innerWidth }));
      assert.ok(caseSize.body <= caseSize.width + 1,
        `${viewport.label}: case source panel must not overflow the page`);
      checks++;

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
