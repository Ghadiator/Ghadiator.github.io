/**
 * Published-site acceptance for canonical routes and recorded-case HITL.
 * Copied into the Pages repository by publish-github-pages.sh. Run against
 * an actual HTTP-served static export, never the protected API.
 */
const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { chromium } = require("playwright-core");

const base = process.env.GAC_TEST_BASE_URL || "http://127.0.0.1:8765";
const retired = ["/case/", "/cases/", "/red-team/", "/analytics/",
  "/introduction/", "/workflow-reference/", "/tickets/new/"];
const important = ["/", "/architecture/", "/workspace/", "/failure-lab/",
  "/workspace/case/?id=supplier_variance_review", "/system-card/"];
const chrome = ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]
  .find(existsSync);
if (!chrome) throw new Error("System Chromium/Chrome is required for published browser acceptance");

async function check(page, route) {
  const response = await page.goto(base + route, {waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response?.status(), 200, "Missing canonical route: " + route);
  await page.locator("main#main-content").waitFor({state:"visible",timeout:15000});
  assert.ok((await page.locator("main h1").first().textContent())?.trim(),
    "Missing accessible page heading: " + route);
  assert.equal(await page.locator(".public-shell").count(), 1,
    "One page renderer/shell per route: " + route);
}

(async () => {
 const browser = await chromium.launch({executablePath:chrome, headless:true, args:["--no-sandbox"]});
 let checks = 0;
 try {
  for (const viewport of [
    {width:390,height:844},{width:820,height:1050},{width:1440,height:900},
  ]) {
   const context = await browser.newContext({viewport});
   const page = await context.newPage();
   const errors = [];
   const protectedCalls = [];
   page.on("pageerror", err => errors.push(err.message));
   page.on("request", req => {
     const url = new URL(req.url());
     if (url.origin === new URL(base).origin && url.pathname.startsWith("/api/"))
       protectedCalls.push(url.pathname);
   });
   for (const route of important) { await check(page, route); checks++; }
   await page.goto(base + "/");
   const nav = page.locator(".public-nav");
   assert.equal(await nav.locator('a[href="/workspace"]').count(),1);
   assert.equal(await nav.locator('a[href="/failure-lab"]').count(),1);
   const links = await nav.locator("a").evaluateAll(els=>els.map(e=>e.getAttribute("href")));
   assert.equal(links.length,new Set(links).size,"Duplicate navigation destinations");
   assert.ok(links.every(href=>!retired.includes(href+"/") && !retired.includes(href)),
     "Retired URL in navigation: "+links.join(","));
   assert.deepEqual(errors,[],"Browser runtime errors");
   assert.deepEqual(protectedCalls,[],"Public site contacted protected API");
   await context.close();
  }

  const context = await browser.newContext({viewport:{width:1280,height:900}});
  const page = await context.newPage();
  // No redirects: old pages should be genuinely absent in static output.
  for (const path of retired) {
    const response = await page.goto(base+path,{waitUntil:"domcontentloaded"});
    assert.equal(response?.status(),404,"Retired path should 404, not redirect: "+path);
    assert.equal(response?.headers()?.location,undefined,"No legacy redirect: "+path);
  }

  // The recorded evidence remains available on the canonical case page.
  await check(page,"/workspace/case/?id=supplier_variance_review");
  await page.locator("#source-evidence").waitFor({state:"visible",timeout:15000});
  assert.match(await page.locator("#source-evidence").innerText(),/What was found, where, and how it was worked/);
  await page.locator("#practice-reviewer").waitFor({state:"visible",timeout:15000});
  await page.locator("#practice-reviewer").fill("Training Reviewer");
  await page.locator("#practice-action").selectOption("APPROVE");
  await page.locator("#practice-reason").fill("Verified the recorded invoice and contract evidence.");
  await page.getByRole("button",{name:"Confirm simulated HITL decision"}).click();
  await page.getByText("SIMULATED: Approved",{exact:false}).first().waitFor({state:"visible"});
  await page.getByText("SIMULATION EVENT LOG",{exact:false}).first().waitFor({state:"visible"});
  assert.match(await page.locator('[aria-label="Simulated event logging"]').innerText(),
    /SIMULATED reviewer decision: APPROVE/);
  // The supplier email approval is distinct from simulated dispatch.
  await check(page,"/workspace/case/?id=supplier_total_mismatch");
  await page.locator("#practice-reviewer").fill("Training Reviewer");
  await page.locator("#practice-action").selectOption("REQUEST_CHANGES");
  await page.locator("#practice-reason").fill("Correct the mismatched invoice total.");
  await page.getByRole("button",{name:"Confirm simulated HITL decision"}).click();
  await page.locator("#practice-email-body").fill("Please send a corrected invoice total with line evidence.");
  await page.getByRole("button",{name:"Preview email"}).click();
  await page.getByRole("button",{name:/Approve draft/}).click();
  await page.getByRole("button",{name:/Simulate dispatch/}).click();
  assert.match(await page.locator('[aria-label="Simulated event logging"]').innerText(),
    /SIMULATED email dispatch/);
  assert.match(await page.locator("main").innerText(),/awaiting a fictional response/i);
  await check(page,"/failure-lab/");
  await page.locator("#challenge-me").waitFor({state:"visible",timeout:15000});
  assert.ok(await page.locator("#arena-payload").count(),"Challenge editor must exist");
  await context.close();
  console.log("Canonical browser acceptance passed:",checks,
    "page renders, no aliases, HITL and supplier simulation, Failure Lab.");
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
