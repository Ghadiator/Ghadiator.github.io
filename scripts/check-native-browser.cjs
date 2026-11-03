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
      // The old redundant omnibus figure catalogue has been intentionally
      // removed. Check the actual use-case, original seven-step process,
      // five-step governed path, persona introduction, and technical source map.
      await page.getByRole("heading",{name:"What exactly did the workflow automate?"}).waitFor();
      await page.getByRole("heading",{name:"Before · Human-led review"}).waitFor();
      await page.getByRole("heading",{name:"After · Governed workflow"}).waitFor();
      await page.getByRole("heading",{name:"The personas behind controlled reasoning"}).waitFor();
      await page.getByRole("heading",{name:"Measure improvement without inventing a success story."}).waitFor();
      const taskRows=page.locator("#manual-workflow-title ol > li");
      assert.ok(await taskRows.count()>=8,viewport.label+": the detailed business workflow was truncated");
      await taskRows.first().getByRole("button").click();
      assert.equal(await taskRows.first().getByRole("button").getAttribute("aria-expanded"),"true",
        viewport.label+": before/after task inspection must be interactive");
      const navLabels=await page.locator('nav[aria-label="Main navigation"] a span').allTextContents();
      assert.deepEqual(navLabels.map(s=>s.trim()),[
        "Overview","Architecture","Personas","Framework Explorer",
        "Assurance","Failure Lab","Cases","Analytics","Safety Origins"
      ],viewport.label+": nine primary destinations");
      checks+=8;
      if(viewport.label==="desktop"){
        fs.mkdirSync("visual-acceptance", {recursive:true});
        await systemMap.screenshot({path:"visual-acceptance/validation-map.png"});
      }
      await page.goto(base + "/architecture/",{waitUntil:"domcontentloaded"});
      // Verify the new four-purpose navigation on the ACTUALLY published
      // hydrated page, rather than assuming the old four diagram labels.
      await page.getByText("These four choices are four purposes—not four canvases.").waitFor();
      const tabs=page.locator('nav[aria-label="Architecture learning and execution modes"] button');
      assert.equal(await tabs.count(),4,viewport.label+": expected four user journeys");
      const modeLabels=(await tabs.allTextContents()).map(x=>x.replace(/\s+/g," ").trim());
      ["Understand the data","Understand the workflow","Replay a case","Try a new case"]
        .forEach((label,i)=>assert.ok(modeLabels[i]?.includes(label),
          viewport.label+": missing Architecture purpose "+label));
      await tabs.nth(2).click();
      const schema=page.locator('[aria-label="Pydantic models canvas"]');
      const modular=page.locator('[aria-label="Modular architecture canvas"]');
      await modular.waitFor({state:"visible"});
      assert.equal(await schema.isVisible(),false,viewport.label+": typed canvas must not stack below graph");
      await page.getByRole("group",{name:"Choose execution view"})
        .getByRole("button",{name:"Typed data / event"}).click();
      await schema.waitFor({state:"visible"});
      assert.equal(await modular.isVisible(),false,viewport.label+": original graph must hide when the schema lens is selected");
      await page.getByRole("group",{name:"Choose execution view"})
        .getByRole("button",{name:"Workflow",exact:true}).click();
      await modular.waitFor({state:"visible"});
      assert.equal(await schema.isVisible(),false,viewport.label+": returning to workflow must hide the model lens");
      await page.getByRole("heading",{name:"Inspect the committee without losing the architecture"}).waitFor();
      checks+=6;
      if(viewport.label==="desktop"){
        await page.screenshot({path:"visual-acceptance/architecture-cases.png"});
      }
      await page.goto(base+"/ai-assurance/",{waitUntil:"domcontentloaded"});
      await page.getByRole("heading",{name:"AI assurance case"}).waitFor();
      await page.getByRole("region",{name:"Six distinct assurance evidence streams"}).waitFor();
      await page.getByRole("region",{name:"CoVe verification wall before and after the Judge"}).waitFor();
      checks+=3;
      await page.goto(base+"/red-team/",{waitUntil:"domcontentloaded"});
      await page.getByRole("heading",{name:/Interrogate a failure/}).waitFor();
      await page.getByRole("navigation",{name:"Select AI failure mode"}).getByRole("button",{name:/Prompt injection/}).click();
      await page.getByRole("region",{name:"AI failure and evidence explorer"}).getByRole("heading",{name:/Prompt injection — supplier-authored text instructs the model/}).waitFor();
      checks+=3;
      await page.goto(base+"/safety-origin/",{waitUntil:"domcontentloaded"});
      await page.getByRole("heading",{name:"Six decisions that shaped GovernanceAsCode"}).waitFor();
      await page.getByRole("heading",{name:/original engineering connections/}).waitFor();
      checks+=2;
      await page.goto(base+"/architecture/#pydantic",{waitUntil:"domcontentloaded"});
      await page.getByRole("heading",{name:"Typed contracts stop malformed data at the boundary."}).waitFor();
      const chooser=page.getByText(/Source figures: open one diagram only/);
      await chooser.click();
      await page.getByRole("region",{name:"Supplier workbook and authoritative reference anatomy"}).waitFor();
      await page.getByRole("button",{name:"Data preparation"}).click();
      await page.getByRole("region",{name:"Data preparation and typed handoffs"}).waitFor();
      assert.equal(await page.getByRole("region",{name:"Supplier workbook and authoritative reference anatomy"}).count(),0,viewport.label+": more than one Pydantic figure showing");
      checks+=4;
      await page.goto(base+"/dashboard/",{waitUntil:"domcontentloaded"});
      await page.getByRole("heading",{name:"Behind every KPI is a control and an evidence trail."}).waitFor();
      await page.getByRole("button",{name:/Resource governance/}).click();
      await page.getByText("Where was model computation justified?").first().waitFor();
      checks+=2;
      // v7.5.8: sources must render different directional topologies,
      // not the same flat four-card rail on every technical page.
      await page.goto(base+"/ai-roles/",{waitUntil:"domcontentloaded"});
      const committee=page.getByRole("region",{name:"Adversarial committee · dual verification gates"});
      await committee.waitFor({state:"visible"});
      assert.equal(await committee.getByRole("button").count(),7,
        viewport.label+": committee lost its seven distinct reasoning, verification and human gates");
      await committee.getByRole("button",{name:/Post-Judge CoVe/}).click();
      await committee.getByText(/checks newly introduced or rewritten claims/).waitFor();
      await committee.locator('[aria-label="Source-informed modular relationship diagram"]').waitFor();
      checks+=3;
      if(viewport.label==="desktop")await committee.screenshot({path:"visual-acceptance/source-committee-topology.png"});
      await page.goto(base+"/safety-origin/",{waitUntil:"domcontentloaded"});
      const fmea=page.getByRole("region",{name:"From four evidence families to structured failure-mode review"});
      await fmea.waitFor({state:"visible"});
      assert.equal(await fmea.getByRole("button").count(),8,
        viewport.label+": FMEA lost the four inputs, review and three evidence outcomes");
      await fmea.getByRole("button",{name:/Structured FMEA review/}).click();
      await fmea.getByText(/Classify what could go wrong/).waitFor();
      checks+=3;
      if(viewport.label==="desktop")await fmea.screenshot({path:"visual-acceptance/source-fmea-topology.png"});
      await page.goto(base+"/ai-assurance/",{waitUntil:"domcontentloaded"});
      const six=page.getByRole("region",{name:"Six distinct assurance evidence streams"});
      assert.equal(await six.getByRole("button").count(),6,
        viewport.label+": source six-stream diagram was flattened or truncated");
      assert.ok(!(await six.innerText()).includes("1,035"),
        viewport.label+": historical 1,035 tests wrongly attributed to six-stream methods figure");
      await page.getByRole("region",{name:"Historical hermetic suite · six closure streams"}).getByText("1,035",{exact:true}).waitFor();
      checks+=3;
      await page.goto(base+"/dashboard/",{waitUntil:"domcontentloaded"});
      const errorMatrix=page.locator('[aria-label="Error categories versus escalation tiers"]');
      await errorMatrix.waitFor({state:"visible"});
      assert.equal(await errorMatrix.locator("tbody tr").count(),8,
        viewport.label+": original eight tier/error categories were lost");
      checks+=2;
      await page.goto(base+"/token-economics/",{waitUntil:"domcontentloaded"});
      // Real metering is the default. Historical diagrams are deliberately
      // hidden behind an optional one-at-a-time figure picker.
      await page.getByText("Optional: historical diagrams explaining the economic controls").click();
      await page.getByRole("button",{name:"Historical 5,045-token example"}).click();
      const tokenExample=page.getByRole("region",{name:"One historical case: token use against a rate window"});
      await tokenExample.waitFor({state:"visible"});
      await tokenExample.getByText("5,045 tokens").waitFor();
      await tokenExample.getByRole("img",{name:/Historical example: 4,760 input tokens/}).waitFor();
      checks+=3;
      if(viewport.label==="desktop")await tokenExample.screenshot({path:"visual-acceptance/historical-token-example.png"});
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
          .getByRole("link", { name: "Architecture", exact: true }).click();
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
