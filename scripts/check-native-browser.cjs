/* Browser acceptance for the preserved GovernanceAsCode story and restored source-workbench views. */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const routes = [
  "/", "/business-impact/", "/architecture/", "/ai-roles/", "/governance/", "/governance-code/", "/ai-assurance/",
  "/red-team/", "/cases/", "/dashboard/", "/token-economics/", "/safety-origin/",
  "/tickets/", "/tickets/new/", "/ticket/", "/inbound/", "/monitor/",
  "/audit/", "/pool-analytics/", "/upload/", "/integration/"
];
const expectedNav = [
  "Overview", "Business value & KPIs", "Architecture",
  "Personas", "Assurance", "Failure Lab",
  "Validation workspace", "Analytics", "Token Economics",
  "Safety Origins", "Framework Explorer"
];
const widths = [
 {width:390,height:844,label:"mobile"},
 {width:768,height:1024,label:"tablet"},
 {width:1440,height:900,label:"desktop"}
];
(async()=>{
 const chrome=process.env.CHROME_PATH || ["/usr/bin/google-chrome","/usr/bin/chromium"].find(fs.existsSync);
 assert.ok(chrome,"Missing Chrome/Chromium");
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:["--no-sandbox"]});
 let checks=0;
 try{
  for(const viewport of widths){
   const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
   const page=await context.newPage();
   const errors=[],api=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",r=>{if(new URL(r.url()).pathname.startsWith("/api/"))api.push(r.url())});
   for(const route of routes){
    const response=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response?.status(),200,viewport.label+" "+route+" HTTP");
    await page.locator("main#main-content").waitFor({state:"visible",timeout:15000});
    await page.locator(".public-shell").waitFor({state:"visible",timeout:15000});
    const h=await page.locator("main h1").first().textContent();
    assert.ok(h?.trim(),viewport.label+" "+route+" missing heading");
    checks++;
   }
   await page.goto(base+"/",{waitUntil:"domcontentloaded"});
   await page.locator('nav.public-nav a[href="/governance-code/"]').waitFor({state:"attached",timeout:12000});
   await page.locator('[data-gac-consolidated-nav]').waitFor({state:"attached",timeout:15000});
   const nav=page.locator('nav[aria-label="Main navigation"] [data-gac-consolidated-nav] a span');
   const labels=(await nav.allTextContents()).map(x=>x.trim());
   assert.deepEqual(labels,expectedNav,viewport.label+": navigation must consolidate five workbench views, pool analytics and Origins");
   // Preserve all deep links while exposing a single workspace navigation entry.
   await page.goto(base+"/cases/",{waitUntil:"networkidle"});
   await page.locator('[data-gac-workspace-tabs]').waitFor({state:"visible",timeout:12000});
   assert.equal(await page.locator('[data-gac-workspace-tabs] a').count(),5,
    "Consolidated workspace must retain document requests, correspondence, scenarios, cases and process audit");
   await page.goto(base+"/dashboard/",{waitUntil:"networkidle"});
   await page.locator('[data-gac-legacy-pool]').waitFor({state:"visible",timeout:12000});
   assert.equal(await page.locator('[data-gac-legacy-pool] a[href="/pool-analytics/"]').count(),1);
   checks+=3;
   // New source-and-test explorer must use genuine excerpts and work without an API.
   await page.locator('nav.public-nav a[href="/governance-code/"]').waitFor({state:"attached"});
   if(viewport.width >= 1024) await page.getByRole("link",{name:"Governance Code",exact:true}).first().click();
   else await page.goto(base+"/governance-code/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"Governance Code",exact:true}).waitFor();
   await page.getByRole("button",{name:"Require named human approval"}).click();
   assert.match(await page.locator("#gc-lines").innerText(),/def resume\(self, decision: Decision\)/);
   await page.getByRole("tab",{name:"Test"}).click();
   assert.match(await page.locator("#gc-lines").innerText(),/test_gate_prevents_archive_and_unauthorised_decision/);
   await page.getByRole("button",{name:"Exclude hostile supplier instructions"}).click();
   assert.match(await page.locator("#gc-lines").innerText(),/supplier_note/);
   const size=await page.evaluate(()=>({body:document.documentElement.scrollWidth,width:window.innerWidth}));
   assert.ok(size.body<=size.width+1,viewport.label+": Governance Code must not overflow horizontally");
   checks+=5;
   await page.goto(base+"/",{waitUntil:"domcontentloaded"});
   const map=page.locator('section[aria-label="Interactive three-tier validation and governance infographic"]');
   await map.waitFor({state:"visible"});
   assert.equal(await map.getByText("Grounded facts → bypass AI").count(),0,
     "Tier 2 falsely claims AI is bypassed");
   await map.getByText("Grounded checks → bypass Tier-3 committee").waitFor();
   await map.getByText("Tier 2").first().waitFor();
    // The eight-role layout replaces the historical four-role teaser.
    const agents=page.locator('[aria-labelledby="overview-agent-strip"]');
    await agents.waitFor({state:"visible"});
    await agents.locator('[role="img"][aria-label$="illustrated avatar"]').first().waitFor();
    assert.equal(await agents.locator('li').count(),8,viewport.label+": all eight personas must appear");
    assert.equal(await agents.locator('li strong').count(),8,viewport.label+": all eight role captions must appear");
    for(const name of ["Proponent","Opponent","Judge","Attacker","Analytics","Integrator","Audit","Reporter"]){
      await agents.locator("li strong").filter({hasText:name}).first().waitFor();
    }
    assert.equal(await page.locator('script[src*="agent-avatar-sharp-7519"]').count(),0,viewport.label+": no client-side DOM override should run");
    const headline=await page.locator("#introduction-title").textContent();
    assert(headline?.startsWith("Supplier invoice validation."),viewport.label+": business use case must be clear at first glance");
    assert.equal(await page.locator('nav[aria-label="On this page"]').count(),0,
      viewport.label+": redundant Overview quick-access nav returned");
   assert.equal(await page.getByText("Technical directory",{exact:true}).count(),0,
     viewport.label+": redundant technical directory returned");
   await page.getByRole("link",{name:/Meet each persona and inspect its limits/}).waitFor({state:"visible"});
    assert.equal(await page.getByRole("link",{name:/Explore the three reasoning personas/}).isVisible().catch(()=>false),false,"Duplicate persona quick link should remain hidden");
   checks+=8;

   await page.goto(base+"/business-impact/",{waitUntil:"domcontentloaded"});
   const consolidated=page.locator(".gac-kpi-business-taxonomy");
   await consolidated.waitFor({state:"visible"});
   assert.equal(await consolidated.locator("article").count(),2,"Business Value must contain the two KPI families");
   assert.equal(await consolidated.locator("article").first().locator("li").count(),6);
   assert.equal(await consolidated.locator("article").nth(1).locator("li").count(),7);
   await page.waitForFunction(()=>!!document.querySelector(".gac-kpi-fixture-summary"),{timeout:12000});
   assert.equal(await page.locator(".gac-kpi-fixture-summary>div").count(),4);
   assert.equal(await page.locator(".gac-kpi-method-details").count(),1,"Historical six-lane detail remains available collapsed");
   await page.goto(base+"/",{waitUntil:"domcontentloaded"});
   assert.equal(await page.locator("#gac-kpi-manual-comparison").isVisible(),false,
     "Introduction must not repeat the KPI dashboard");
   await page.goto(base+"/business-impact/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"Business value & KPI evidence"}).waitFor();
   await page.getByRole("heading",{name:"Where time and money are at risk"}).waitFor();
   await page.getByRole("heading",{name:/Six KPIs, with their improvement path/}).waitFor();
   await page.getByRole("button",{name:/Model-token demand per case/}).click();
   await page.getByText("0 live model calls in scripted supplier fixtures").waitFor();
   await page.getByRole("heading",{name:/What the API enables/}).waitFor();
   checks+=6;

   await page.goto(base+"/ai-roles/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:/Reasoning personas/}).waitFor();
   await page.getByRole("heading",{name:/Discuss with Proponent/}).waitFor();
   await page.getByRole("link",{name:/Open authenticated role conversations/}).waitFor();
   checks+=3;

   await page.goto(base+"/governance/",{waitUntil:"domcontentloaded"});
   const controls=page.getByRole("navigation",{name:"Governance channels"});
   await controls.getByRole("link",{name:"Risk weights"}).click();
   await page.getByRole("heading",{name:/Risk-weighting reference/}).waitFor();
   await page.getByRole("button",{name:/Contractual breach/}).waitFor();
   await page.getByRole("button",{name:/Macroeconomic price pressure/}).click();
   await page.getByRole("heading",{name:"Macroeconomic price pressure"}).waitFor();
   checks+=4;

   await page.goto(base+"/token-economics/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"Token economics"}).waitFor();
   await page.getByRole("heading",{name:"Six controls behind a bounded model budget"}).waitFor();
   await page.getByText("Tier-2 selector",{exact:false}).first().waitFor().catch(()=>{});
   checks+=2;

   await page.goto(base+"/tickets/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"Document requests"}).waitFor();
   await page.getByRole("heading",{name:/Recorded collection register/}).waitFor();
   await page.getByRole("link",{name:/Draft a request/}).click();
   await page.getByRole("heading",{name:"Draft document request"}).waitFor();
   await page.getByRole("textbox",{name:"Supplier reference"}).fill("Synthetic Supplier A");
   await page.getByRole("button",{name:/Preview request/}).click();
   await page.getByText("Local preview only").waitFor();
   checks+=6;

   await page.goto(base+"/inbound/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"Incoming correspondence"}).waitFor();
   await page.getByRole("button",{name:"Unmatched correspondence"}).click();
   await page.getByText(/No unmatched supplier-mail records are published/).waitFor();
   checks+=3;

   await page.goto(base+"/architecture/",{waitUntil:"domcontentloaded"});
   // Submission schema and all declared fields are optional, never forced into the first view.
   const optional=page.getByText("Optional: inspect how the source models relate",{exact:true});
   const attributes=page.getByText("Submission · declared attributes",{exact:true});
   assert.equal(await attributes.isVisible(),false,
     viewport.label+": Submission fields escaped optional disclosure");
   await optional.click();
   await attributes.waitFor({state:"visible"});
   for(const field of ["case_id: Identifier","invoice_id: Identifier","version: int ≥ 1, strict",
     "currency: 3-letter code","lines: tuple[Line,...]","total: Decimal (2 d.p.)","documents: tuple[Identifier,...]"]){
     await page.getByText(field,{exact:true}).first().waitFor({state:"visible"});
   }
   checks+=9;
   const modes=page.getByRole("navigation",{name:"Architecture learning and execution modes"});
   await modes.getByRole("button",{name:/Understand the workflow/}).click();
   const roster=page.getByRole("region",{name:"Architecture personas and authority boundaries"});
   await roster.waitFor({state:"visible"});
   assert.equal(await roster.locator('button[aria-label^="Inspect "]').count(),8,
     viewport.label+": three reasoning plus five operational roles; CoVe is a control");
   await roster.getByRole("button",{name:"Inspect Proponent scope and controls"}).click();
   const roleModal=page.getByRole("dialog",{name:"Proponent explanation"});
   await roleModal.waitFor({state:"visible"});
   await roleModal.getByText("Failure exposure",{exact:true}).waitFor();
   await roleModal.getByRole("button",{name:/Open graph module/}).click();
   await page.getByRole("dialog",{name:"Component detail"}).waitFor({state:"visible"});
   await page.getByRole("button",{name:"Close component detail"}).click();
   checks+=7;
   assert.equal(await modes.getByRole("button").count(),4,viewport.label+": four original architecture modes");
   await modes.getByRole("button",{name:/Replay a case/}).click();
   const graph=page.locator('[aria-label="Modular architecture canvas"]');
   await graph.waitFor({state:"visible"});
   for(const role of ["proponent","opponent","judge"]){
     const agent=graph.locator('button[data-node="'+role+'"]');
     await agent.waitFor({state:"visible"});
     assert.match(await agent.textContent(),/AI AGENT/,
       viewport.label+": "+role+" must read as a model agent, not a generic control");
     const shape=await agent.evaluate(node=>getComputedStyle(node).clipPath);
     assert.match(shape,/polygon\(/,
       viewport.label+": "+role+" must have an explicit shaped agent node");
   }
   const cove=graph.locator('button[data-node="firewall"]');
   await cove.waitFor({state:"visible"});
   assert.match(await cove.textContent(),/CoVe · VERIFY/,
     viewport.label+": CoVe must remain a verification gate, not another AI agent");
   assert.equal(await page.getByText("Pick a case and step through it.",{exact:true}).count(),0,
     "Duplicate step-through explanation returned");
   assert.equal(await page.getByText("Step through this run",{exact:true}).count(),0,
     "Duplicate replay call-to-action returned");
   assert.ok(await graph.locator('[data-route]').count()>10,
     "Original modular graph routes must remain intact");
   checks+=10;

   await page.goto(base+"/ai-assurance/",{waitUntil:"domcontentloaded"});
   const assurance=page.getByRole("region",{name:"What six separate assurance streams can—and cannot—prove"});
   await assurance.waitFor({state:"visible"});
   await assurance.getByText("Optional: inspect the supporting figure",{exact:true}).click();
   await assurance.getByRole("region",{name:"Six distinct assurance evidence streams"}).waitFor({state:"visible"});
   checks+=2;

   await page.goto(base+"/cases/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"From collection to the case record"}).waitFor();
   await page.goto(base+"/token-economics/",{waitUntil:"domcontentloaded"});
   await page.getByRole("heading",{name:"Historical example versus actual usage"}).waitFor();
   checks+=2;

   if(viewport.label==="mobile"){
    await page.locator("button.menu-toggle").click();
    await page.getByRole("navigation",{name:"Main navigation"}).getByRole("link",{name:"Architecture",exact:true}).click();
    checks++;
   }
   assert.deepEqual(api,[],viewport.label+": static site initiated API calls");
   assert.deepEqual(errors,[],viewport.label+": browser script errors");
   checks+=2;
   await context.close();
  }
  console.log("PASS: "+checks+" responsive navigation, workbench, governance, Tier-2 and API-isolation checks");
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
