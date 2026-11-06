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
      workflow:rect('#manual-workflow-title'),
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
      workflowPlaceholder:getComputedStyle(document.getElementById('journey-title'),'::after').content,
      overflow:document.documentElement.scrollWidth-innerWidth
    };
   });
   for(const p of ["intro","kpi","usecase","workflow","agents"])assert(result[p],"Missing Introduction section "+p);
   for(const [a,b] of [["intro","kpi"],["kpi","usecase"],["usecase","workflow"],["workflow","agents"]])
    assert(result[a].bottom<=result[b].top+8,"Incorrect vertical order "+a+" before "+b+" "+JSON.stringify(result));
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
   assert(result.workflowPlaceholder?.includes("reserved"),"Manual-vs-agentic diagram slot missing");
   assert(result.overflow<4,"Horizontal overflow "+result.overflow);
   const kpiLink=page.getByRole("link",{name:/Compare the six manual and governed KPIs/});
   assert.equal(await kpiLink.count(),1,"KPI comparison must be discoverable immediately from the hero");
   await kpiLink.click();
   assert.equal(new URL(page.url()).hash,"#gac-kpi-manual-comparison","Hero link must scroll to the integrated KPI panel");
   const target=page.locator("#gac-kpi-manual-comparison");
   await target.waitFor({state:"visible"});
   const top=await target.evaluate(el=>el.getBoundingClientRect().top);
   assert(top>=-60 && top<innerHeight,"KPI anchor must reach visible viewport, position "+top);
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
