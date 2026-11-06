const {chromium}=require("playwright-core");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const chrome=["/usr/bin/google-chrome","/usr/bin/chromium"].find(fs.existsSync);
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox"]});
 try{
  for(const width of [390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2});
   const errors=[], privateCalls=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",r=>{if(r.url().includes("/api/kpis/governed-workflow"))privateCalls.push(r.url())});
   await page.goto("http://127.0.0.1:8765/",{waitUntil:"networkidle",timeout:45000});
   // Introduction is no longer the KPI dashboard.
   const introGroups=page.locator("#gac-kpi-manual-comparison, #ai-governance-kpis");
   assert.equal(await introGroups.count(),2);
   for(const element of await introGroups.all())assert.equal(await element.isVisible(),false,"KPI panels must be absent from the visible Introduction");
   const introOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert(introOverflow<5,"Unexpected Introduction x overflow");
   assert.equal(privateCalls.length,0,"Public Pages must not call protected KPI endpoint");
   assert.equal(errors.length,0,"Introduction hydration failed: "+errors.join("|"));
   await page.goto("http://127.0.0.1:8765/business-impact/",{waitUntil:"networkidle"});
   const taxonomy=page.locator(".gac-kpi-business-taxonomy");
   await taxonomy.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(() => document.querySelector("h1")?.closest("header")?.textContent?.includes("Supplier invoice validation combines routine calculations"), {timeout:10000});
   const order=await page.evaluate(()=>{
     const hero=document.querySelector("h1")?.closest("header")?.getBoundingClientRect();
     const groups=document.querySelector(".gac-kpi-business-taxonomy")?.getBoundingClientRect();
     return {heroTop:hero?.top,heroBottom:hero?.bottom,groupsTop:groups?.top};
   });
   assert(order.heroTop<order.groupsTop && order.heroBottom<=order.groupsTop+4,"The business case must appear above the KPI groups");
   assert.equal(await taxonomy.locator("article").count(),2);
   assert.equal(await taxonomy.locator("article").first().locator("li").count(),6);
   assert.equal(await taxonomy.locator("article").nth(1).locator("li").count(),7);
   const groupCards=taxonomy.locator("article");
   assert(await groupCards.first().isVisible());
   assert(await groupCards.nth(1).isVisible());
   assert.equal(await page.locator(".gac-ai-family").isVisible(),false,"Duplicate AI KPI catalogue should be hidden on Business Value");
   assert.equal(privateCalls.length,0);
   assert.equal(errors.length,0,"Business-impact hydration failed: "+errors.join("|"));
   const folder="/tmp/gac-kpi-families";
   fs.mkdirSync(folder,{recursive:true});
   await taxonomy.screenshot({path:path.join(folder,"consolidated-kpis-"+width+".png")});
   console.log("PASS separate KPI families",width,"6 business, 7 new AI, public read-only");
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
