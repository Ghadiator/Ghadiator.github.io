/* Browser acceptance for the compiled native site, not retired overlay scripts.
 * The published manifest determines the route inventory. On the next native
 * release, canonical aliases are required and the former routes are forbidden.
 */
"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");
const fs = require("node:fs");
const base = process.env.BASE_URL || "http://127.0.0.1:8765";
const manifest = JSON.parse(fs.readFileSync(".site-release.json", "utf8"));
const published = new Set(manifest.published_routes);
const canonical = published.has("workspace/case") && published.has("failure-lab");
const retired = ["cases", "case", "red-team", "analytics", "introduction",
  "workflow-reference", "tickets/new"];
const widths = [
  { width:390, height:844, label:"mobile" },
  { width:768, height:1024, label:"tablet" },
  { width:1440, height:900, label:"desktop" },
];
const pathOf = route => route === "." ? "/" : "/"+route+"/";
const siteOrigin = new URL(base).origin;
const chrome = process.env.CHROME_PATH ||
  ["/usr/bin/google-chrome", "/usr/bin/chromium"].find(fs.existsSync);
assert.ok(chrome, "Chrome/Chromium is required for browser acceptance");

(async () => {
  if(canonical) {
    for(const route of retired)
      assert.equal(published.has(route),false,"Retired duplicate route still published: /"+route);
    for(const route of ["workspace", "workspace/case", "failure-lab", "dashboard"])
      assert.ok(published.has(route),"Missing canonical page: /"+route);
  }

  const browser=await chromium.launch({
    executablePath:chrome, headless:true, args:["--no-sandbox"]});
  let checked=0;
  try{
    for(const viewport of widths){
      const ctx=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
      const page=await ctx.newPage();
      const errors=[], forbidden=[];
      page.on("pageerror",err=>errors.push(page.url()+" :: "+err.message));
      page.on("request",req=>{
        const url=new URL(req.url());
        if(url.origin===siteOrigin && url.pathname.startsWith("/api/"))
          forbidden.push(req.url());
        if(url.hostname==="app.aigovernanceascodelab.com")
          forbidden.push("Protected backend unexpectedly contacted: "+req.url());
      });

      // All manifest routes must actually work; don't test removed aliases.
      for(const route of published){
        if(route==="404")continue;
        const location=pathOf(route);
        const response=await page.goto(base+location,{waitUntil:"load",timeout:45000});
        assert.equal(response?.status(),200,viewport.label+" "+location+" HTTP");
        await page.locator("main#main-content").waitFor({state:"visible",timeout:15000});
        assert.equal(await page.locator(".public-shell").count(),1,
          viewport.label+" "+location+" must have one native shell");
        if(!["sign-in"].includes(route)){
          const heading=(await page.locator("main h1").first().textContent()||"").trim();
          assert.ok(heading,viewport.label+" "+location+" has no heading");
        }
        const sizes=await page.evaluate(()=>({
          width:innerWidth,document:document.documentElement.scrollWidth}));
        assert.ok(sizes.document<=sizes.width+2,
          viewport.label+" "+location+" overflows "+sizes.document+">"+sizes.width);
        checked++;
      }

      await page.goto(base+"/workspace/",{waitUntil:"load"});
      await page.locator("#workspace-queue-title").waitFor({state:"visible",timeout:15000});
      assert.equal(await page.locator("#workspace-queue-title").count(),1,
        "Workspace must contain one case queue, not duplicate tabs");
      const rows=page.locator('section[aria-labelledby="workspace-queue-title"] tbody tr');
      assert.equal(await rows.count(),15,"All 15 reference cases must remain available");
      const link=page.locator('a[href*="id=supplier_variance_review"]').first();
      await link.waitFor({state:"visible",timeout:15000});
      const href=await link.getAttribute("href");
      assert.ok(href.startsWith(canonical ? "/workspace/case/" : "/case/"),
        "Case queue must point to the single source-record view: "+href);
      await link.click();
      await page.waitForURL(url=>url.searchParams.get("id")==="supplier_variance_review",
        {timeout:15000});
      await page.locator("#source-evidence").waitFor({state:"visible",timeout:15000});
      const evidence=await page.locator("#source-evidence").innerText();
      assert.match(evidence,/What was found, where, and how it was worked/);
      assert.ok(evidence.includes("30.0%")&&evidence.includes("20.0%"),
        "The recorded volume finding and reference threshold must remain visible");
      assert.ok(await page.locator("#reference-practice-title").isVisible(),
        "Case lost public human-in-the-loop walkthrough");
      assert.ok((await page.locator("main").innerText()).includes("42 recorded"),
        "Case event record must be anchored to its real source trace");

      // A confirmed fictional approval must change local state AND create
      // a separate simulation event, without any backend request.
      await page.locator("#practice-reviewer").fill("QA Reviewer");
      await page.locator("#practice-action").selectOption("APPROVE");
      await page.locator("#practice-reason").fill(
        "Reviewed original evidence and the contract threshold in the case record.");
      await page.getByRole("button",{name:"Confirm simulated HITL decision"}).click();
      const practice=page.locator('section[aria-labelledby="reference-practice-title"]');
      assert.match(await practice.innerText(),/Simulated status:\s*Approved/);
      assert.ok((await page.locator("main").innerText()).includes("SIMULATION EVENT LOG"),
        "Approval must appear in the event log");
      assert.ok((await page.locator("main").innerText()).includes("simulation.hitl.decided"),
        "Audit event kind must be recorded and visually distinct");

      await page.goto(base+(canonical?"/failure-lab/":"/red-team/"),{waitUntil:"load"});
      await page.locator("#challenge-me").waitFor({state:"visible",timeout:15000});
      await page.getByRole("button",{name:/Use example/}).click();
      assert.ok((await page.locator("#arena-payload").inputValue()).trim().length>0,
        "Challenge example must populate the attack input");
      const cfg=JSON.parse(fs.readFileSync("data/challenge-config.json","utf8"));
      if(!cfg.endpoint)
        assert.equal(await page.getByRole("button",{name:/Attack the defender/}).isDisabled(),true,
          "Do not enable a fake defender without the isolated live service");
      assert.equal(await page.locator("details#adversarial-red-team").count(),1,
        "Original red-team probes must survive consolidation");

      if(canonical){
        const navigation=await page.locator(".public-sidebar .public-nav a").evaluateAll(
          anchors=>anchors.map(a=>a.getAttribute("href")));
        for(const href of navigation){
          if(!href||!href.startsWith("/")||href==="/")continue;
          const parsed=new URL(href,siteOrigin);
          const route=parsed.pathname.replace(/^\/+|\/+$/g,"");
          assert.ok(published.has(route),"Sidebar points to an unexported page: "+href);
        }
      }
      assert.deepEqual(forbidden,[],viewport.label+" browser contacted a protected API");
      assert.deepEqual(errors,[],viewport.label+" JavaScript exceptions");
      await ctx.close();
    }
  }finally{await browser.close();}
  console.log("PASS native browser acceptance:",checked,"route/viewport checks;",
    canonical?"canonical-only routing":"preconsolidation routing",
    "plus human review and Failure Lab.");
})().catch(err=>{console.error(err);process.exit(1);});
