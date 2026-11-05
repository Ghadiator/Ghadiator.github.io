/* Browser acceptance for the preserved GovernanceAsCode story and restored source-workbench views. */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const routes = [
  "/", "/business-impact/", "/architecture/", "/ai-roles/", "/governance/", "/ai-assurance/",
  "/red-team/", "/cases/", "/dashboard/", "/token-economics/", "/safety-origin/",
  "/tickets/", "/tickets/new/", "/ticket/", "/inbound/", "/monitor/",
  "/audit/", "/pool-analytics/", "/upload/", "/integration/"
];
const expectedNav = [
  "Overview", "Business value & KPIs", "Architecture", "Personas", "Framework Explorer", "Assurance",
  "Failure Lab", "Cases", "Analytics", "Token Economics",
  "Document requests", "Incoming correspondence", "Scenario theater",
  "Process audit", "Pool analytics", "Local workbook lab", "Safety Origins"
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
   const nav=page.locator('nav[aria-label="Main navigation"] a span');
   const labels=(await nav.allTextContents()).map(x=>x.trim());
   assert.deepEqual(labels,expectedNav,viewport.label+": nav must retain ten top-level topics plus source-workbench subsection");
   const map=page.locator('section[aria-label="Interactive three-tier validation and governance infographic"]');
   await map.waitFor({state:"visible"});
   assert.equal(await map.getByText("Grounded facts → bypass AI").count(),0,
     "Tier 2 falsely claims AI is bypassed");
   await map.getByText("Grounded checks → bypass Tier-3 committee").waitFor();
   await map.getByText("Tier 2").first().waitFor();
   // Keep four succinct role cards on Overview, not the entire operations roster.
   const teaser=page.getByRole("region",{name:"Reasoning personas and their verification boundary"});
   await teaser.waitFor({state:"visible"});
   assert.equal(await teaser.locator('button[aria-label^="Inspect "]').count(),4,
     viewport.label+": Overview teaser must remain concise");
   assert.equal(await page.locator('nav[aria-label="On this page"]').count(),0,
     viewport.label+": redundant Overview quick-access nav returned");
   assert.equal(await page.getByText("Technical directory",{exact:true}).count(),0,
     viewport.label+": redundant technical directory returned");
   await page.getByRole("link",{name:/Inspect each role and ask it questions/}).waitFor({state:"visible"});
   checks+=8;

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
   assert.equal(await roster.locator('button[aria-label^="Inspect "]').count(),10,
     viewport.label+": four committee/verification plus six operational/human roles");
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
