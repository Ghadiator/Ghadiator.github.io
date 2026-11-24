/* Canonical Validation Workspace browser acceptance.
 * One queue, one case route, preserved source and human decision controls.
 * Never depend on a retired /cases tab or an injected compatibility overlay.
 */
"use strict";
const assert=require("node:assert/strict");
const {chromium}=require("playwright-core");
const fs=require("node:fs");
const base=process.env.BASE_URL||"http://127.0.0.1:8765";
const routes=new Set(JSON.parse(fs.readFileSync(".site-release.json","utf8")).published_routes);
const canonical=routes.has("workspace/case")&&routes.has("failure-lab");
const dest=canonical?"/workspace/case/":"/case/";
const chrome=process.env.CHROME_PATH||["/usr/bin/google-chrome","/usr/bin/chromium"].find(fs.existsSync);
assert.ok(chrome,"Chrome/Chromium is required");
const sizes=[{width:390,height:844,label:"mobile"},
 {width:768,height:1024,label:"tablet"},
 {width:1440,height:900,label:"desktop"}];
(async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:["--no-sandbox"]});
 try{
  for(const size of sizes){
   const ctx=await browser.newContext({viewport:{width:size.width,height:size.height}});
   const page=await ctx.newPage();
   const errors=[],calls=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",r=>{
     if(new URL(r.url()).origin===new URL(base).origin&&new URL(r.url()).pathname.startsWith("/api/"))
       calls.push(r.url());
   });
   await page.goto(base+"/architecture/",{waitUntil:"load",timeout:45000});
   await page.locator('.public-sidebar a[href="/workspace"]').first().click();
   await page.waitForURL(url=>url.pathname.replace(/\/$/,"")==="/workspace",{timeout:16000});
   const q=page.locator('section[aria-labelledby="workspace-queue-title"]');
   await q.waitFor({state:"visible",timeout:16000});
   assert.equal(await q.count(),1,"Validation Workspace must show exactly one unified queue");
   let rows=q.locator("tbody tr");
   assert.equal(await rows.count(),15,"All fifteen scripted examples must be in the same queue");
   assert.ok((await rows.first().innerText()).includes("Awaiting reviewer"),
     "Pending human review must be prioritised");
   assert.ok((await rows.nth(1).innerText()).includes("Awaiting supplier"),
     "Waiting for supplier must be visible in the queue");
   await q.getByRole("combobox",{name:"Filter by review status"}).selectOption("pending");
   assert.equal(await rows.count(),2,"Pending filter must include reviewer and supplier");
   await q.getByRole("combobox",{name:"Filter by review status"}).selectOption("all");
   const search=q.getByRole("searchbox",{name:"Search cases"});
   await search.fill("currency");
   assert.equal(await rows.count(),1,"Currency mismatch must be searchable");
   await search.fill("");
   assert.equal(await rows.count(),15);
   assert.equal(await page.locator("#gac-workspace-guide").count(),0,
     "Historic overlay must not duplicate the native queue");
   const link=q.locator('a[href*="id=supplier_currency_mismatch"]').first();
   const href=await link.getAttribute("href");
   assert.ok(href.startsWith(dest+"?id="),"Queue must point to the case detail in its owner route");
   await link.click();
   await page.waitForURL(url=>url.pathname.replace(/\/$/,"")===dest.replace(/\/$/,"")&&
      url.searchParams.get("id")==="supplier_currency_mismatch",{timeout:15000});
   await page.locator("#source-evidence").waitFor({state:"visible",timeout:15000});
   const evidence=await page.locator("#source-evidence").innerText();
   assert.ok(evidence.includes("USD")&&evidence.includes("EUR"),
     "Original currency mismatch and reference values must be preserved");
   assert.ok((await page.locator("main").innerText()).includes("Human review and supplier clarification"));
   assert.deepEqual(calls,[],size.label+" public navigation called private API");
   assert.deepEqual(errors,[],size.label+" JavaScript exceptions");
   const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(dimensions.scroll<=dimensions.width+2,
     size.label+" case detail must not overflow");
   await ctx.close();
  }
 }finally{await browser.close();}
 console.log("PASS: canonical workspace queue, filters, prioritisation and recorded case evidence on 3 viewports.");
})().catch(err=>{console.error(err);process.exit(1)});
