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
      // Holistic figure-led release: inspect actual interactive behavior,
      // not merely whether the old routes returned a successful status.
      await page.goto(base + "/", { waitUntil: "domcontentloaded" });
      const systemMap=page.locator('section[aria-label="Interactive three-tier validation and governance infographic"]');
      await systemMap.waitFor({state:"visible"});
      await systemMap.getByRole("button",{name:/Chain-of-Verification · pre-Judge/}).click();
      await systemMap.getByRole("heading",{name:"Chain-of-Verification · pre-Judge control"}).waitFor();
      await page.getByRole("group",{name:"Explanatory diagram category"})
        .getByRole("button",{name:"Chain-of-Verification"}).click();
      await page.getByText("Six evidential questions from the CoVe figure").waitFor();
      checks+=3;
      if(viewport.label==="desktop"){
        fs.mkdirSync("visual-acceptance", {recursive:true});
        await systemMap.screenshot({path:"visual-acceptance/validation-map.png"});
      }
      await page.goto(base + "/architecture/",{waitUntil:"domcontentloaded"});
      await page.locator('nav[aria-label="Architecture learning and execution modes"] button').nth(2).click();
      const schema=page.locator('[aria-label="Pydantic models canvas"]');
      const modular=page.locator('[aria-label="Modular architecture canvas"]');
      await schema.waitFor({state:"visible"});
      await modular.waitFor({state:"visible"});
      const sb=await schema.boundingBox(),mb=await modular.boundingBox();
      assert.ok(sb&&mb,viewport.label+": missing synchronized canvases");
      assert.ok(sb.y+sb.height<=mb.y+12,viewport.label+": Pydantic canvas must be above modular graph");
      assert.ok(Math.abs(sb.width-mb.width)<6,viewport.label+": both canvases should span the same width");
      await page.getByRole("heading",{name:"Inspect the committee without losing the architecture"}).waitFor();
      checks+=4;
      if(viewport.label==="desktop"){
        await page.screenshot({path:"visual-acceptance/architecture-cases.png"});
      }
      await page.goto(base+"/ai-assurance/",{waitUntil:"domcontentloaded"});
      await page.getByRole("heading",{name:/Interrogate a failure/}).waitFor();
      await page.getByRole("navigation",{name:"Select AI failure mode"}).getByRole("button",{name:/Prompt injection/}).click();
      await page.getByRole("region",{name:"AI failure and evidence explorer"}).getByRole("heading",{name:/Prompt injection — supplier-authored text instructs the model/}).waitFor();
      checks+=2;
      await page.goto(base+"/dashboard/",{waitUntil:"domcontentloaded"});
      await page.getByRole("heading",{name:"Behind every KPI is a control and an evidence trail."}).waitFor();
      await page.getByRole("button",{name:/Resource governance/}).click();
      await page.getByText("Where was model computation justified?").first().waitFor();
      checks+=2;
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
