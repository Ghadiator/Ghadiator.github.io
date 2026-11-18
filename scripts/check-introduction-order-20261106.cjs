const assert=require("node:assert/strict");
const {chromium}=require("playwright-core");
const fs=require("node:fs"),path=require("node:path");
const chrome=process.env.CHROME_PATH||["/usr/bin/google-chrome","/usr/bin/chromium"].find(fs.existsSync);
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox"]});
 try{
  for(const width of [390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:2});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto("http://127.0.0.1:8765/",{waitUntil:"networkidle",timeout:50000});
   const result=await page.evaluate(()=>{
    const rect=id=>{const el=document.querySelector(id);const r=el?.getBoundingClientRect();return r?{top:r.top+scrollY,bottom:r.bottom+scrollY,width:r.width}:null};
    const p=document.querySelector('[role="img"][aria-label="Analytics illustrated avatar"]');
    const k=document.querySelector('section:has(#overview-kpis)');
    const kStrong=k?.querySelector('.gac-kpi-baseline h4');
    const kDetail=k?.querySelector('.gac-kpi-baseline .gac-kpi-manual');
    const safety=document.querySelector('main .space-y-12:has(#introduction-title)>section:has(a[href^="/safety-origin"])');
    const detail=document.querySelector('[id^="task-detail-"]');
    return {
      intro:rect('section:has(#introduction-title)'),
      kpi:rect('section:has(#overview-kpis)'),
      usecase:rect('#use-case'),
      workflowRetired:document.getElementById("manual-workflow-title")?getComputedStyle(document.getElementById("manual-workflow-title")).display==="none":true,
      newVisualization:getComputedStyle(document.querySelector('main .space-y-12:has(#introduction-title)'),'::before').backgroundImage,
      agents:rect('[aria-labelledby="overview-agent-strip"]'),
      analyticsBg:p?getComputedStyle(p).backgroundImage:null,
      analyticsSize:p?{width:p.getBoundingClientRect().width,height:p.getBoundingClientRect().height}:null,
      kpiTitlePx:kStrong?parseFloat(getComputedStyle(kStrong).fontSize):null,
      kpiDetailPx:kDetail?parseFloat(getComputedStyle(kDetail).fontSize):null,
      manualCount:k?.querySelectorAll('.gac-kpi-baseline').length,
      comparisonCount:k?.querySelectorAll('.gac-kpi-pair').length,
      manualBeforeChange:!!(k?.querySelector('.gac-kpi-baselines')?.compareDocumentPosition(k?.querySelector('.gac-kpi-list'))&Node.DOCUMENT_POSITION_FOLLOWING),
      oldCallout:!![...document.querySelectorAll('strong')].find(e=>e.textContent?.includes('Why it matters:')),
      originalTokenClaim:k?.textContent?.includes('Possible all-AI calls'),
      hiddenSafety:safety?getComputedStyle(safety).display==="none":false,
      hiddenOldDetails:detail?!detail.getClientRects().length:true,

      overflow:document.documentElement.scrollWidth-innerWidth
    };
   });
   for(const p of ["intro","kpi","usecase","agents"])assert(result[p],"Missing Introduction section "+p);
   for(const [a,b] of [["intro","usecase"],["usecase","agents"]])
    assert(result[a].bottom<=result[b].top+8,"Incorrect visible Overview order "+a+" before "+b+" "+JSON.stringify(result));
   assert.equal(result.kpi.width,0,
     "The historical Introduction KPI duplicate is intentionally hidden; the catalogue belongs to Business Value");
   assert(result.analyticsBg?.includes("analytics-original-cropped.webp"),"Original Analytics avatar not active");
   assert((result.analyticsSize?.width??0)>=95,"Analytics portrait too small");
   assert((result.kpiTitlePx??0)>=16,"KPI title still tiny");
   assert((result.kpiDetailPx??0)>=13,"KPI explanations still tiny");
   assert.equal(result.manualCount,6,"Six manual KPI baselines must be shown");
   assert.equal(result.comparisonCount,6,"Each manual KPI needs a visual improvement path");
   assert(result.manualBeforeChange,"Manual KPIs must be listed before governed changes");
   assert(!result.oldCallout,"Why it matters callout must be deleted");
   assert(!result.originalTokenClaim,"Manual workflow cannot claim hypothetical AI token savings");
   assert(result.hiddenSafety,"Safety Origins teaser still visible on Introduction");
   assert(result.hiddenOldDetails,"Old Manual pain point / What changed / Governance boundary panels still visible");
   assert(result.workflowRetired,"Old task-by-task workflow must remain retired");
   assert(result.newVisualization?.includes("governed-human-agent-collaboration"),"New workflow visualization must remain visible");
   assert(result.overflow<4,"Horizontal overflow "+result.overflow);
   const invoiceSvg=await page.locator("#use-case").evaluate(el=>
     getComputedStyle(el,"::before").backgroundImage);
   assert(invoiceSvg.includes("overview-invoice-journey"),
     "Published Overview must display the six-stage source-backed supplier invoice visual");
   assert.equal(await page.locator("#gac-kpi-manual-comparison").isVisible(),false,
     "Obsolete KPI duplicate must not appear on the Introduction");
   assert.equal(await page.getByRole("heading",{name:"What exactly did the workflow automate?"}).isVisible().catch(()=>false),false,
     "Retired old task-by-task comparison must remain hidden");
   assert.equal(await page.locator("#manual-workflow-title").isVisible().catch(()=>false),false,
     "Old legacy task expander must remain hidden until a native source build replaces it");
   // Verify the intended canonical KPI destination independently rather than
   // asserting the intentionally hidden Introduction duplicate is visible.
   const canonical=await page.goto("http://127.0.0.1:8765/business-impact/",{waitUntil:"networkidle",timeout:45000});
   assert.equal(canonical?.status(),200,"Canonical business KPI page unavailable");
   const family=page.locator(".gac-kpi-business-groups");
   await family.waitFor({state:"visible"});
   assert.equal(await family.locator(":scope > article").count(),2,"KPI families no longer separated");
   assert((await family.innerText()).includes("Reviewer touch time"),
     "Manual KPI definition lost from the Business Value page");
   const publicBanner=page.locator("main#main-content");
   assert((await publicBanner.innerText()).includes("production ROI"),
     "Business Value must distinguish illustrative data from measured ROI");
   assert(!errors.length,"Browser errors: "+errors.join(" | "));
   const img=await page.request.get("http://127.0.0.1:8765/avatars/analytics-original-cropped.webp");
   assert.equal(img.status(),200,"Uploaded teal-hijab portrait unavailable");
   const dir="/tmp/gac-intro-check";fs.mkdirSync(dir,{recursive:true});
   await page.screenshot({path:path.join(dir,"introduction-"+width+".png"),fullPage:true});
   console.log("PASS intro order, KPI size, original Analytics, workflow slot and teaser removal at "+width+"px",result);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
