/* Native recorded-case browser acceptance, not the removed overlay.
 * Replays genuine pinned fixtures and exercises LOCAL human-review events.
 * The simulation must never make a network request or approve a real invoice.
 */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {chromium}=require("playwright-core");
const base=process.env.BASE_URL||"http://127.0.0.1:8765";
const manifest=JSON.parse(fs.readFileSync(".site-release.json","utf8"));
const canonical=manifest.published_routes.includes("workspace/case");
const caseRoot=canonical?"/workspace/case/":"/case/";
const cases=JSON.parse(fs.readFileSync("data/cases.json","utf8")).cases;
const vari=cases.find(c=>c.slug==="supplier_variance_review");
assert.equal(vari.event_count,42,"Preserve original variance-case event count");
const chrome=process.env.CHROME_PATH||
  ["/usr/bin/google-chrome","/usr/bin/chromium"].find(fs.existsSync);
const sizes=[{width:390,height:844,label:"mobile"},
 {width:768,height:1024,label:"tablet"},
 {width:1440,height:900,label:"desktop"}];
(async()=>{
  assert.ok(chrome,"No Chrome/Chromium installed");
  const browser=await chromium.launch({executablePath:chrome,headless:true,args:["--no-sandbox"]});
  try{
    for(const size of sizes){
      const ctx=await browser.newContext({viewport:{width:size.width,height:size.height}});
      const page=await ctx.newPage();
      const errors=[],privateCalls=[];
      page.on("pageerror",e=>errors.push(e.message));
      page.on("request",r=>{
        if(new URL(r.url()).pathname.startsWith("/api/"))
          privateCalls.push(r.url());
      });
      await page.goto(base+caseRoot+"?id=supplier_variance_review",{waitUntil:"load",timeout:45000});
      const source=page.locator("#source-evidence");
      await source.getByRole("heading",{name:"What was found, where, and how it was worked"})
        .waitFor({state:"visible",timeout:16000});
      assert.equal(await source.count(),1,"One native source evidence panel");
      const text=await source.innerText();
      assert.ok(text.includes("30.0%")&&text.includes("20.0%"),
        "Original 30% discrepancy and 20% permitted threshold are both visible");
      assert.ok(text.includes("Where it was found")&&text.includes("How the checks worked it"),
        "Both field provenance and executed checks must be visible");
      const selected=source.locator('[role="status"]').first();
      assert.match(await selected.innerText(),/Submission!B9/,
        "The actual recorded input cell is selected by default");
      await source.getByRole("tab",{name:/Contract reference/}).click();
      assert.equal(await source.getByRole("tab",{name:/Contract reference/}).getAttribute("aria-selected"),"true");
      assert.match(await source.getByRole("region",{name:"Contract reference fields"}).innerText(),
        /Previous period total/);
      await source.getByRole("tab",{name:/LineItems/}).click();
      assert.match(await source.getByRole("region",{name:"LineItems fields"}).innerText(),/13000.00/);
      const record=await page.locator("main").innerText();
      assert.ok(record.includes("42 recorded"),"Original event sequence remains displayed");
      assert.ok(record.includes("Human review and supplier clarification"),
        "Original human oversight is preserved");
      const panel=page.locator('section[aria-labelledby="reference-practice-title"]');
      await panel.locator("#practice-reviewer").fill("QA Reviewer");
      await panel.locator("#practice-action").selectOption("REQUEST_CHANGES");
      await panel.locator("#practice-reason").fill(
        "Invoice volume exceeds the reference by thirty percent; please clarify.");
      await panel.getByRole("button",{name:"Confirm simulated HITL decision"}).click();
      assert.match(await panel.innerText(),/Simulated status:\s*Awaiting email approval/);
      assert.match(await page.locator("main").innerText(),/simulation.hitl.decided/);
      await panel.locator("#practice-email-subject").fill("Clarify invoice variance");
      await panel.locator("#practice-email-body").fill(
        "Please explain the variance and attach a corrected invoice for review.");
      await panel.getByRole("button",{name:"Preview email"}).click();
      await panel.getByRole("button",{name:/Approve draft/}).click();
      assert.match(await panel.innerText(),/Simulated status:\s*Email approved/);
      await panel.getByRole("button",{name:"Simulate dispatch (no email sent)"}).click();
      assert.match(await panel.innerText(),/Simulated status:\s*Awaiting supplier/);
      await panel.getByRole("button",{name:/Simulate supplier reply/}).click();
      assert.match(await panel.innerText(),/Simulated status:\s*Awaiting reviewer/);
      await page.locator('ol[aria-label="Simulated event logging"]').waitFor({state:"visible"});
      const events=await page.locator('ol[aria-label="Simulated event logging"]').innerText();
      for(const kind of ["simulation.hitl.decided","simulation.email.approved",
          "simulation.email.dispatch","simulation.supplier.reply"])
        assert.ok(events.includes(kind),"Missing simulated event: "+kind);
      assert.ok((await page.locator("main").innerText()).includes("Recorded source events · unchanged"),
        "Immutable real source history must be labelled separately");
      assert.deepEqual(errors,[],size.label+" uncaught browser errors");
      assert.deepEqual(privateCalls,[],size.label+" must not send protected API requests");
      const dim=await page.evaluate(()=>({full:document.documentElement.scrollWidth,width:innerWidth}));
      assert.ok(dim.full<=dim.width+2,size.label+" case overflow");
      await ctx.close();
    }
  }finally{await browser.close();}
  console.log("PASS native recorded cases: source fields, checks, HITL email approval, simulated events, no actual dispatch.");
})().catch(err=>{console.error(err);process.exit(1);});
