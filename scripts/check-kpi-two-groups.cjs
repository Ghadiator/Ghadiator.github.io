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
   const groupA=page.locator("#gac-kpi-manual-comparison");
   const groupB=page.locator("#ai-governance-kpis");
   await groupB.waitFor({state:"visible",timeout:18000});
   assert.equal(await groupA.locator(".gac-kpi-baseline").count(),6);
   assert.equal(await groupA.locator(".gac-kpi-pair").count(),6);
   assert.equal(await groupB.locator(".gac-ai-card").count(),7);
   assert(await groupA.getByText("Total validation cost per invoice").count()>0);
   assert.equal(await groupA.getByText("Model-token demand",{exact:true}).count(),0);
   assert(await groupB.getByText("Tokens and model cost").count()>0);
   const positions=await page.evaluate(()=>{
    const a=document.getElementById("gac-kpi-manual-comparison")?.getBoundingClientRect();
    const b=document.getElementById("ai-governance-kpis")?.getBoundingClientRect();
    return {aY:a?.top,bY:b?.top,aBottom:a?.bottom,overflow:document.documentElement.scrollWidth-innerWidth};
   });
   assert(positions.aBottom<=positions.bY+5,"The new AI family must appear after business deltas");
   assert(positions.overflow<5,"Unexpected x overflow");
   assert.equal(privateCalls.length,0,"Public Pages must not call protected KPI endpoint");
   assert.equal(errors.length,0,"Introduction hydration failed: "+errors.join("|"));
   await page.goto("http://127.0.0.1:8765/business-impact/",{waitUntil:"networkidle"});
   const taxonomy=page.locator(".gac-kpi-business-taxonomy");
   await taxonomy.waitFor({state:"visible",timeout:15000});
   assert.equal(await taxonomy.locator("article").count(),2);
   assert.equal(await taxonomy.locator("article").first().locator("li").count(),6);
   assert.equal(await taxonomy.locator("article").nth(1).locator("li").count(),7);
   await taxonomy.getByRole("link",{name:/governance measures/}).click();
   assert.equal(new URL(page.url()).hash,"#ai-governance-kpis");
   await page.locator("#ai-governance-kpis").waitFor({state:"visible"});
   assert.equal(privateCalls.length,0);
   assert.equal(errors.length,0,"Business-impact hydration failed: "+errors.join("|"));
   const folder="/tmp/gac-kpi-families";
   fs.mkdirSync(folder,{recursive:true});
   await page.locator("#ai-governance-kpis").screenshot({path:path.join(folder,"ai-kpis-"+width+".png")});
   console.log("PASS separate KPI families",width,"6 business, 7 new AI, public read-only");
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
