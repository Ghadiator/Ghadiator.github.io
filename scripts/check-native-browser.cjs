/* Browser acceptance for the preserved GovernanceAsCode story and restored source-workbench views. */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const routes = [
  "/", "/architecture/", "/ai-roles/", "/governance/", "/ai-assurance/",
  "/red-team/", "/cases/", "/dashboard/", "/token-economics/", "/safety-origin/",
  "/tickets/", "/tickets/new/", "/ticket/", "/inbound/", "/monitor/",
  "/audit/", "/pool-analytics/", "/upload/", "/integration/"
];
const expectedNav = [
  "Overview", "Architecture", "Personas", "Framework Explorer", "Assurance",
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
   checks+=4;

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
   const modes=page.getByRole("navigation",{name:"Architecture learning and execution modes"});
   assert.equal(await modes.getByRole("button").count(),4,viewport.label+": four original architecture modes");
   await modes.getByRole("button",{name:/Replay a case/}).click();
   await page.locator('[aria-label="Modular architecture canvas"]').waitFor({state:"visible"});
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
