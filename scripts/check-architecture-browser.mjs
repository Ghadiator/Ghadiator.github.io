import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||"/usr/bin/google-chrome",args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
const responses=[];
page.on("pageerror",e=>errors.push("PAGEERROR "+e.message.slice(0,300)));
page.on("console",m=>{if(m.type()==="error")errors.push("CONSOLE "+m.text().slice(0,300));});
page.on("response",r=>{if(r.status()>=400)responses.push(r.status()+" "+r.url().slice(0,170));});
try{
 await page.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+"/?view=architecture",{waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForTimeout(4500);
 const state=await page.evaluate(()=>{
  const iframe=document.getElementById("modularArchitectureFrame");
  const main=document.getElementById("main");
  const content=iframe?.contentDocument;
  const root=content?.querySelector("body > div.flex.min-h-screen > div > main");
  return {
   parentTitle:document.title,parentView:document.getElementById("currentCrumb")?.textContent,
   tabs:[...document.querySelectorAll("[data-architecture-tab]")].map(x=>({name:x.textContent.trim(),selected:x.className.includes("selected")})),
   iframeExists:Boolean(iframe),iframeSrc:iframe?.src,
   frameHeight:iframe?.getBoundingClientRect().height,frameVisibility:iframe?getComputedStyle(iframe).visibility:"",
   iframeReady:content?.readyState,iframeTitle:content?.title,
   iframeBody:content?.body?.innerText.slice(0,550),
   iframeTextSize:content?.body?.innerText?.length,
   mainExists:Boolean(root),mainHeight:root?.scrollHeight,
   nodeCount:content?.querySelectorAll('[data-node]').length,
   iframeScripts:content?.scripts?.length,
   originalFallback:main?.innerText.includes("could not be")
  };
 });
 console.log("EMBED_PROBE",JSON.stringify(state));
 console.log("ERRORS",JSON.stringify(errors.slice(0,20)));
 assert.equal(state.parentView,"Architecture");
 assert.equal(state.nodeCount,20,"The original 20-node architecture must be rendered");
 assert.ok(state.mainExists,"The source Architecture main must be present");
 assert.ok(state.frameHeight>=1000,"Modular architecture frame must remain at least 1000px tall after Next hydration");
 assert.ok((state.iframeTextSize||0)>900,"The architecture graph and controls must be visible");
 assert.ok(await page.frameLocator('#modularArchitectureFrame').locator('main h1').isHidden(),
   "Hide the duplicate embedded Validation / Architecture heading");
 assert.equal(await page.locator('.unified-architecture-view .run-journey').count(),0);
 // Generation beside the picker creates a separate local input, not fake trace events.
 const generator=page.frameLocator('#modularArchitectureFrame').locator('#architecture-case-generator');
 await generator.waitFor({state:'visible',timeout:12000});
 assert.ok(await generator.locator('[data-case-download]').isDisabled());
 const pickerBefore=await page.frameLocator('#modularArchitectureFrame').locator('select[aria-label="Recorded scenario"]').inputValue();
 const railBefore=await page.locator('#architecture-event-rail').innerText();
 await generator.locator('[data-case-generate]').click();
 const generatedId=await generator.getAttribute('data-invoice-id');
 assert.ok(generatedId?.startsWith('INV-DEMO-'));
 assert.ok(await generator.locator('[data-case-download]').isEnabled());
 const generatedDownloadEvent=page.waitForEvent('download');
 await generator.locator('[data-case-download]').click();
 const generatedDownload=await generatedDownloadEvent;
 assert.ok(generatedDownload.suggestedFilename().includes(generatedId));
 const generatedBytes=[...await readFile(await generatedDownload.path())];
 const downloadedRecord=await page.evaluate(async bytes=>PublicSupplierWorkbook.read(new File([new Uint8Array(bytes)],'generated.xlsx')),generatedBytes);
 assert.equal(downloadedRecord.invoice_id,generatedId,"Download must contain the exact generated case");
 const repeatedDownloadEvent=page.waitForEvent('download');
 await generator.locator('[data-case-download]').click();
 const repeatedDownload=await repeatedDownloadEvent;
 assert.deepEqual(await readFile(await repeatedDownload.path()),Buffer.from(generatedBytes),"Repeated download must not silently generate a new invoice");
 assert.equal(await page.frameLocator('#modularArchitectureFrame').locator('select[aria-label="Recorded scenario"]').inputValue(),pickerBefore);
 assert.equal(await page.locator('#architecture-event-rail').innerText(),railBefore,"Generation must not invent or alter recorded execution events");
 assert.equal(await page.locator('.unified-architecture-context,.architecture-canvas-hint strong').count(),0,
   "Merge the stacked architecture introduction labels into one header");
 const orchestration=page.frameLocator("#modularArchitectureFrame").locator('[data-node="orchestrator"]');
 const before=await orchestration.getAttribute("aria-pressed");
 await orchestration.click();
 await page.waitForTimeout(500);
 const after=await orchestration.getAttribute("aria-pressed");
 console.log("NODE_INTERACTION",JSON.stringify({before,after}));
 assert.equal(after,"true","Clicking the original orchestrator block must activate the React interaction");
 const blockDetails=page.locator('#architecture-module-inspector');
 await page.waitForFunction(()=>document.getElementById('architecture-module-inspector')?.dataset.selectedModule==='orchestrator',
   null,{timeout:10000});
 assert.ok(await blockDetails.isVisible(),"Clicking a source-architecture block must immediately show its explanation");
 let detailText=await blockDetails.innerText();
 for(const phrase of ["Main orchestrator","Expected input","Expected output","No directly attributed event"]){
   assert.ok(detailText.includes(phrase),"Module description must explain purpose, I/O and evidence limits: "+phrase);
 }
 assert.ok(detailText.includes("not evidenced as executing"),
   "Source-only LangGraph orchestrator must not be described as an executed supplier block");
 const inspectPosition=await blockDetails.boundingBox();
 assert.ok(inspectPosition&&inspectPosition.x>500&&inspectPosition.y>=0,
   "Selected module details must be visible beside the diagram without scrolling beneath it");

 // Every canonical source block must open its own complete governance detail.
 const nodeIds=await page.frameLocator("#modularArchitectureFrame").locator('.deck [data-node]').evaluateAll(nodes=>nodes.map(n=>n.dataset.node));
 assert.equal(new Set(nodeIds).size,20);
 for(const id of nodeIds){
   await blockDetails.locator("[data-module-inspector-close]").click();
   await page.frameLocator("#modularArchitectureFrame").locator('[data-node="'+id+'"]').click();
   assert.equal(await blockDetails.getAttribute('data-selected-module'),id);
   for(const phrase of ['Expected input','Expected output','EU AI Act relevance','What this does not establish','Scope of this mapping']){
     assert.ok((await blockDetails.innerText()).includes(phrase),id+" must explain "+phrase);
   }
 }
 assert.equal(await blockDetails.getAttribute('role'),'dialog');
 assert.equal(await blockDetails.getAttribute('aria-modal'),'false',"Keep the graph available for further selection");
 await blockDetails.locator('[data-module-section="ami-governance"]').click();
 assert.ok(await blockDetails.locator('#ami-governance-title').isVisible());
 assert.ok(await blockDetails.locator('.ami-content').evaluate(el=>el.scrollTop)>0,"Governance navigation must scroll inside the popup");
 await blockDetails.locator('.ami-scope summary').click();
 await blockDetails.locator('[data-module-section="ami-governance"]').click();
 const detailScroll=await blockDetails.locator('.ami-content').evaluate(el=>el.scrollTop);
 const recordedFixture=JSON.parse(await readFile('data/scenarios/supplier_variance_review.json','utf8'));
 await page.evaluate(fixture=>window.ArchitectureModuleInspector.setScenario(fixture.slug,fixture.events,0),recordedFixture);
 assert.ok(await blockDetails.locator('.ami-scope').evaluate(el=>el.open),"Keep expanded assurance scope during replay updates");
 assert.ok(Math.abs((await blockDetails.locator('.ami-content').evaluate(el=>el.scrollTop))-detailScroll)<2,"Keep reading position during replay updates");
 assert.equal(await page.evaluate(()=>document.activeElement.id),'ami-nav-governance',"Keep keyboard focus during evidence updates");
 await page.keyboard.press('Escape');
 assert.ok(await blockDetails.isHidden(),"Escape must close the detail view");

 // Clicking React's actual Proponent node must use the real selected fixture.
 const proposalNode=page.frameLocator("#modularArchitectureFrame").locator('[data-node="proponent"]');
 await proposalNode.evaluate(el=>el.click());
 await page.waitForFunction(()=>document.getElementById('architecture-module-inspector')?.dataset.selectedModule==='proponent',
   null,{timeout:10000});
 detailText=await blockDetails.innerText();
 assert.ok(detailText.includes("Proponent: contractual checks passed"),
   "Recorded scenario output must show directly attributed source events before replay begins");
 assert.ok(detailText.includes("Invoice is not already approved"),
   "Scenario input should display the earlier, published cross-check evidence");
 assert.ok(detailText.includes("not captured function-call arguments"),
   "Do not imply upstream trace context is a structured function argument");
 assert.ok(await blockDetails.locator('[data-replay-seek="28"]').count(),
   "Recorded module output must link to its exact fixture event index");

 console.log("BAD_RESPONSES",JSON.stringify(responses.slice(0,30)));
 await page.screenshot({path:"architecture-embedded-test.png",fullPage:false});
 const deck=page.frameLocator("#modularArchitectureFrame");
 const picker=deck.locator('select[aria-label="Recorded scenario"]');
 assert.ok(await picker.count(),"Scenario selector must appear in the original modular canvas");
 assert.ok((await picker.locator("option").count())>=10,"The recorded scenarios must be selectable");
 const outsideBefore=page.locator("#architecture-detail");
 assert.equal((await outsideBefore.innerText()).trim(),"","Before replay, no introductory or drill panels may appear below the diagram");
 assert.equal(await outsideBefore.locator('[data-deck-action="start"],[data-deck-action="drill"],[data-deck-action="back"]').count(),0);
 for(const phrase of ['Pick a case and step through it','Look inside · modular components','Step through this run →']){
   assert.ok(!(await page.locator('#main').innerText()).includes(phrase),"Deleted parent panel returned: "+phrase);
 }
 const processEvents=page.locator('#architecture-event-rail [data-replay-seek]');
 assert.equal(await processEvents.count(),42,"The full 42-event source trace must be shown beside the graph");
 assert.ok((await page.locator('#architecture-execution-dashboard').innerText()).includes("Execution state by module"),
   "Execution dashboard must show the 20 module statuses");
 assert.equal(await page.locator('.ax-module').count(),20,"Display every architecture module, including non-emitting support modules");
 const initialSnapshot=await page.locator('#architecture-execution-dashboard').innerText();
 assert.ok(initialSnapshot.includes("0 / 20"),"No module is claimed executed before replay begins");
 assert.ok(initialSnapshot.includes("14 / 20"),"The full 42-event fixture must show 14 observed architecture blocks even before replay starts");
 assert.equal(await page.locator("[data-architecture-stage]").count(),6,"Group modules by architecture lanes and workflow-wide rails");
 assert.equal(await page.locator("[data-architecture-module]").count(),20,"Each original diagram block must have an inspection action");
 const checksGroup=page.locator('[data-architecture-stage="checks"]');
 const reviewGroup=page.locator('[data-architecture-stage="review"]');
 assert.equal(await checksGroup.locator('.ax-check-panel').count(),2,"Keep both result sets inside the verification phase");
 assert.equal(await reviewGroup.locator('.ax-role-card').count(),4,"Keep all committee outputs inside exception review");
 assert.equal(await checksGroup.locator('[data-architecture-module]').count(),3);
 assert.equal(await reviewGroup.locator('[data-architecture-module]').count(),7);
 assert.equal(await page.locator('.ax-module-result').count(),6,"Each check or role has one combined status/output card");
 assert.equal(await page.locator('.ax-run-dashboard > .ax-validation-grid,.ax-run-dashboard > .ax-committee').count(),0,
   "Do not render duplicate results panels outside their phase");
 // Clicking the 20-block status cards must open that SAME inspector.
 await page.locator('[data-architecture-module="rules"]').click();
 await page.waitForFunction(()=>document.getElementById('architecture-module-inspector')?.dataset.selectedModule==='rules',
   null,{timeout:10000});
 assert.ok((await blockDetails.innerText()).includes("R1 PASS"),
   "Dashboard card must reveal the deterministic rule's recorded outputs");
 // Retain this selection through scenario switching; its evidence must refresh.
 await proposalNode.evaluate(el=>el.click());

  const diagram=deck.locator(".deck-canvas");
 const header=deck.locator(".deck > div").filter({has:deck.locator("span.w-full.min-w-0")}).first();
 const graphRect=await diagram.boundingBox(),summaryBefore=await header.boundingBox();
 assert.ok(graphRect,"The modular graph must be visible before the replay begins");
 assert.equal(summaryBefore,null,"The terminal-state summary must be hidden before a run starts");
 await picker.selectOption("supplier_clean");
 await page.waitForFunction(()=>{
   const el=document.getElementById('architecture-module-inspector');
   return el?.dataset.selectedModule==='proponent' &&
     el.innerText.includes("No directly attributed event in this case") &&
     !el.innerText.includes("Proponent: contractual checks passed");
 },null,{timeout:12000});
 assert.ok((await blockDetails.innerText()).includes("supplier_clean"),
   "Selected module details must follow the chosen scenario rather than leaking another case");
 await blockDetails.locator('[data-module-inspector-close]').click();
 assert.ok(await blockDetails.isHidden(),"Block details must be dismissible");

 await page.waitForTimeout(1100);
 const selected=await page.evaluate(()=>({
  scenario:new URLSearchParams(location.search).get("scenario"),
  src:document.getElementById("modularArchitectureFrame")?.getAttribute("src")
 }));
 assert.equal(selected.scenario,"supplier_clean","Parent and embedded selector must share the selected scenario");
 const runButton=deck.getByRole("button",{name:"Run",exact:true});
 await runButton.click();
 await page.waitForFunction(()=>{
  const box=document.getElementById("workflow-results");
  return box&&/Event [1-9] of/.test(document.getElementById("architecture-execution-dashboard")?.innerText||"");
 },{timeout:10000});
 // Replay must never reclaim the page from a visitor who is reading elsewhere.
 // Retain the actual scrolling element so native touch/wheel momentum survives.
 const liveList=await page.locator('.ax-rail-list').elementHandle();
 const readingPosition=await page.evaluate(()=>{
   const list=document.querySelector('.ax-rail-list');
   list.scrollTop=list.scrollHeight;
   window.scrollTo({top:0,behavior:'instant'});
   return {page:scrollY,list:list.scrollTop,cursor:Number(document.querySelector('#modularArchitectureFrame').contentDocument.querySelector('input[aria-label="Position in the recorded run"]').value)};
 });
 await page.waitForFunction(cursor=>Number(document.querySelector('#modularArchitectureFrame').contentDocument.querySelector('input[aria-label="Position in the recorded run"]').value)>=cursor+2,readingPosition.cursor,{timeout:10000});
 assert.ok(await liveList.evaluate(el=>el.isConnected&&el===document.querySelector('.ax-rail-list')),
   'Keep the event list DOM alive across replay ticks');
 assert.ok(Math.abs((await page.evaluate(()=>scrollY))-readingPosition.page)<3,
   'Replay must not scroll outer ancestors back to the event rail');
 assert.ok(Math.abs((await page.locator('.ax-rail-list').evaluate(el=>el.scrollTop))-readingPosition.list)<3,
   'Manual event-list browsing must override automatic following');
 await page.mouse.move(900,700);
 await page.mouse.wheel(0,350);
 await page.waitForTimeout(250);
 const wheelPosition=await page.evaluate(()=>scrollY);
 assert.ok(wheelPosition>readingPosition.page+100,'Wheel scrolling over the running canvas must move the page');
 const wheelCursor=await deck.locator('input[aria-label="Position in the recorded run"]').inputValue();
 await page.waitForFunction(cursor=>Number(document.querySelector('#modularArchitectureFrame').contentDocument.querySelector('input[aria-label="Position in the recorded run"]').value)>Number(cursor),wheelCursor,{timeout:10000});
 assert.ok(Math.abs((await page.evaluate(()=>scrollY))-wheelPosition)<3,'Replay must retain the wheel-selected page position');
 console.log('REPLAY_SCROLL_STABILITY','Page position, manual trace browsing, persistent list and canvas wheel passed');
 const summaryAfter=await header.boundingBox();
 assert.equal(summaryAfter,null,"Run narrative must never appear inside the graph section");
 const outside=page.locator("#architecture-detail");
 assert.ok((await outside.innerText()).includes("Current workflow step"),"Current workflow step must be beneath the iframe");
 const outsideRect=await outside.boundingBox(),frameRect=await page.locator("#modularArchitectureFrame").boundingBox();
 assert.ok(outsideRect&&frameRect&&outsideRect.y>=frameRect.y+frameRect.height-1,"Step explanations must be OUTSIDE and UNDER the architecture iframe");
 const output=await page.locator("#workflow-results").innerText();
 assert.equal(output.trim(),"","No duplicated evidence navigator or committee panels before completion");
 const dashboardText=await page.locator("#architecture-execution-dashboard").innerText();
 assert.ok(dashboardText.includes("Workflow execution dashboard"),"The execution dashboard remains active beneath the graph");
 const visiblePage=await page.locator("#main").innerText();
 for(const duplicate of ["Current evidence","Trace navigator","Scripted adversarial committee"]){
  assert.ok(!visiblePage.includes(duplicate),"Remove duplicate panel from Architecture: "+duplicate);
 }
 assert.ok(!output.includes("Recorded workflow result"),"The final outcome must not be shown before the run completes");
 console.log("SCENARIO_REPLAY",JSON.stringify({selected,dashboardText:dashboardText.slice(0,450)}));
 // The final verdict and AI-role exchanges must appear only when selected
 // replay events include them, never as a premature banner.
 await picker.selectOption("supplier_variance_review");
 await page.waitForTimeout(500);
 const scrub=deck.locator('input[aria-label="Position in the recorded run"]');
 await scrub.focus();
 await scrub.press("End");
 await page.waitForFunction(()=>document.getElementById("workflow-results")?.innerText.includes("Recorded workflow result"),null,{timeout:12000});
 for(let k=0;k<5;k++)await scrub.press("ArrowLeft");
 await page.waitForFunction(()=>document.getElementById("architecture-detail")?.innerText.includes("Step 37 of 42"),null,{timeout:10000});
 const rationale=await page.locator("#architecture-detail").innerText();
 assert.ok(rationale.includes("Why this step"),"The recorded 'Why this step' rationale must be below the architecture");
 assert.ok(rationale.includes("Run suspended for authorised reviewer"),"The reviewer-pause event must be below the architecture");
 // Scrubbing to a historical gate is inspection, not a real gate pause.
 // Start playback from the preceding event to exercise actual suspension.
 await scrub.press("ArrowLeft");
 await deck.getByRole("button",{name:"Run",exact:true}).click();
 await page.waitForFunction(()=>document.getElementById("architecture-detail")?.querySelector('[data-deck-action="resume"]'),null,{timeout:10000});
 const gateControls=await page.locator("#architecture-detail").innerText();
 assert.ok(gateControls.includes("Human review"),"Live reviewer gate must be accessible underneath");
 await page.locator('#architecture-detail [data-deck-action="resume"]').click();
 await page.waitForTimeout(100);
 await scrub.press("End");
 await page.waitForFunction(()=>document.getElementById("workflow-results")?.innerText.includes("Recorded workflow result"),null,{timeout:12000});
 const complete=await page.locator("#workflow-results").innerText();
 assert.ok(complete.includes("Recorded workflow result"),"Terminal state must appear when the replay reaches its last event");
 const committeeInDashboard=await page.locator("#architecture-execution-dashboard").innerText();
 assert.ok(committeeInDashboard.includes("Bounded exception review"),"Keep one combined review phase");
 for(const id of ['proponent','opponent','firewall','judge']){
   assert.equal(await page.locator('[data-architecture-stage="review"] [data-module-results="'+id+'"] .ax-role-message').count(),1,
     "Keep the completed role output once inside its own module card: "+id);
 }
 for(const duplicate of ["Current evidence","Trace navigator","Scripted adversarial committee"]){
  assert.ok(!(await page.locator("#main").innerText()).includes(duplicate),"Duplicated panel must remain deleted: "+duplicate);
 }
 console.log("COMPLETED_REPLAY",JSON.stringify({length:complete.length,committeeInDashboard:true,hasOutcome:true}));
 // Rules and cross-check results must come from recorded events, including
 // a correction case that contains both an earlier FAIL and a later PASS.
 await picker.selectOption("supplier_rate_correction");
 await page.waitForTimeout(500);
 await scrub.focus();
 await scrub.press("End");
 await page.waitForFunction(()=>document.querySelector('#architecture-execution-dashboard')?.innerText.includes("Rates match approved rate card — FAIL"),null,{timeout:12000});
 const ruleDash=await page.locator("#architecture-execution-dashboard").innerText();
 assert.ok(ruleDash.includes("R1 PASS — Line amounts equal quantity × rate"),"Each deterministic rule must be visible, not just the aggregate");
 assert.ok(ruleDash.includes("Rates match approved rate card — FAIL"),"Failed contract rule must remain inspectable");
 assert.ok(ruleDash.includes("Rates match approved rate card — PASS"),"Correction must retain the later passed re-check");
 assert.equal(await page.locator('.ax-module').count(),20,"All twenty module rows must persist across scenarios");
 const auditRail=page.locator('[data-architecture-stage="semantics"]');
 const auditText=await auditRail.innerText();
 assert.ok(auditText.includes("Supplier trace: 12 / 12 audit transitions"),"Show all recorded supplier state changes");
 assert.ok(auditText.includes("4 / 4 human-gate events"),"Show human review evidence on correction runs");
 assert.ok(auditText.includes("Separate DAiA pool not executed"),"Do not present the generic ProcessEvent pool as an unmet workflow step");
 assert.ok(!auditText.includes("0 reached"),"Do not show the misleading zero-reached indicator for architecture-only rail");
 assert.ok(await auditRail.locator('[data-module-status="process_semantics"].ax-module-reference').count(),
   "Keep the generic-only module available in the original diagram without marking it executed");

 assert.equal(await page.locator('#architecture-event-rail [data-replay-seek]').count(),64,"All 64 correction events must be shown in the rail");
 assert.ok(await deck.locator('[data-node="crosscheck"].ax-node-failure').count(),"Failed rule should highlight its actual architecture block");
 assert.ok(await deck.locator('[data-node="rules"].ax-node-executed').count(),"Executed rules should remain marked in the architecture");
 assert.equal(await deck.locator('[data-node="post_cove"].ax-node-executed').count(),0,"Do not invent a post-Judge CoVe execution");
 console.log("CHECK_DASHBOARD",JSON.stringify({rateFail:true,correctedPass:true,emitted:64,allModules:20}));

 // The event rail must be an actual navigation control, synchronized to the
 // source React deck, rather than a second independent fake timeline.
 await page.locator('#architecture-event-rail [data-replay-seek="23"]').click();
 await page.waitForFunction(()=>{
  const f=document.getElementById("modularArchitectureFrame")?.contentDocument;
  return f?.querySelector('input[aria-label="Position in the recorded run"]')?.value==="23";
 },null,{timeout:10000});
 await page.waitForFunction(()=>document.querySelector('#architecture-event-rail [data-replay-seek="23"]')?.classList.contains('is-current'),null,{timeout:10000});
 assert.ok(await page.locator('#architecture-event-rail [data-replay-seek="23"].is-current').count(),
   "Event rail selection and React scrubber must stay in sync");
 console.log("RAIL_NAVIGATION", "Selected emitted event 24 drives the native React scrubber");
 // Module-status cards must interact with the original 20-node React diagram.
 await page.locator('[data-architecture-module="rules"]').click();
 await page.waitForFunction(()=>{
   const doc=document.getElementById('modularArchitectureFrame')?.contentDocument;
   return doc?.querySelector('[data-node="rules"]')?.getAttribute('aria-pressed')==="true";
 },null,{timeout:10000});
 console.log("ARCHITECTURE_MODULE_MAP","Grouped 20-node coverage and click-through to original diagram passed");



 // Exercise the public run journey, including direct URL state and browser history.
 await page.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+
   "/?view=cases&scenario=supplier_clean&case_filter=Approved&case_search=Matching",
   {waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForSelector('.wb-table a[data-view="case"]',{timeout:15000});
 assert.equal(await page.locator("#caseSearch").inputValue(),"Matching");
 assert.equal(await page.locator("#caseFilter").inputValue(),"Approved");
 assert.equal(await page.locator('.wb-table a[data-view="case"]').count(),1,
   "The deep-link case filters must be applied, not just shown");
 await page.locator('.wb-table a[data-view="case"]').click();
 await page.waitForFunction(()=>new URLSearchParams(location.search).get("view")==="case",null,{timeout:10000});
 assert.equal(new URL(page.url()).searchParams.get("scenario"),"supplier_clean",
   "Case-link click must preserve its own selected scenario");
 assert.ok(await page.locator('.run-journey[aria-label="Selected run journey"]').count(),
   "Case detail must display the recorded-run journey");
 await page.goBack({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>new URLSearchParams(location.search).get("view")==="cases",null,{timeout:10000});
 assert.equal(await page.locator("#caseSearch").inputValue(),"Matching",
   "Returning to Cases must restore its search");
 assert.equal(await page.locator("#caseFilter").inputValue(),"Approved",
   "Returning to Cases must restore its outcome filter");
 await page.locator('.wb-table a[data-view="case"]').click();
 await page.locator('.run-journey-links a[data-view="architecture"]').click();
 await page.waitForFunction(()=>new URLSearchParams(location.search).get("view")==="architecture",null,{timeout:10000});
 assert.equal(new URL(page.url()).searchParams.get("scenario"),"supplier_clean");
 assert.equal(await page.locator('.unified-architecture-view .run-journey').count(),0,"Remove the recorded-run banner from Architecture");
 await page.locator('#sidebar [data-view="evidence"]').click();
 await page.locator('[data-evidence-tab="trace"]').click();
 await page.waitForFunction(()=>new URLSearchParams(location.search).get("view")==="evidence",null,{timeout:10000});
 assert.equal(new URL(page.url()).searchParams.get("tab"),"trace",
   "Run evidence links must open the Decision trace tab");
 assert.equal(new URL(page.url()).searchParams.get("scenario"),"supplier_clean");
 await page.waitForSelector('.wb-tabs [data-evidence-tab="trace"].selected',{timeout:10000});
 assert.ok((await page.locator(".run-journey-id").innerText()).includes("supplier_clean"));
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForSelector('.wb-tabs [data-evidence-tab="trace"].selected',{timeout:15000});
 assert.equal(new URL(page.url()).searchParams.get("scenario"),"supplier_clean",
   "Evidence deep link must survive browser reload");
 assert.equal(await page.locator('[data-evidence-tab]').count(),2,"Evidence has trace and learning tabs, not a second case browser");
 assert.equal(await page.locator('[data-evidence-tab="reports"]').count(),0);
 await page.locator('[data-evidence-tab="learning"]').click();
 assert.equal(new URL(page.url()).searchParams.get('tab'),'learning');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-evidence-tab="learning"].selected');
 await page.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+'/?view=evidence&scenario=supplier_clean&tab=reports',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('[data-evidence-tab="trace"].selected');
 assert.ok(!(await page.locator('#main').innerText()).includes('Case reports'),"Old report links fall back to the decision trace");
 console.log("RUN_JOURNEY", "Case filters, Back, case → Architecture → evidence, and reload passed");


 // The full design system keeps its hierarchy and mobile navigation functional.
 await page.setViewportSize({width:375,height:812});
 await page.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+"/?view=overview",
   {waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForSelector('.overview-example-note',{timeout:12000});
 assert.ok((await page.locator('.overview-example-note').innerText()).includes("scripted AI roles"));
 assert.equal(await page.locator('.featured-run,.original-context-cards,.promise-section,.balance-banner,.overview-scope').count(),0,
   "Introduction must omit the repeated pitch and boundary sections");
 const manualCards=page.locator('.original-workflow-list > .original-flow-card');
 assert.equal(await manualCards.count(),7,"Manual workflow must have seven distinct blocks");
 assert.equal(await page.locator('.original-workflow-list .original-step-icon svg').count(),7,
   "Each original workflow block must render an SVG pictogram");
 const flowGeometry=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.original-workflow-list > li')];
   const bounds=cards.map(card=>card.getBoundingClientRect());
   const connector=getComputedStyle(cards[0],'::after');
   return {ordered:bounds.every((box,i)=>i===0||box.top>bounds[i-1].bottom),
           connectorHeight:parseFloat(connector.height),
           fitsPhone:bounds.every(box=>box.left>=0&&box.right<=innerWidth)};
 });
 assert.ok(flowGeometry.ordered&&flowGeometry.connectorHeight>=16&&flowGeometry.fitsPhone,
   "Flow arrows and ordered cards must remain visible without horizontal overflow on mobile");
 await page.setViewportSize({width:1440,height:900});
 const desktopFlow=await page.evaluate(()=>{
   const boxes=[...document.querySelectorAll('.original-workflow-list > li')].map(el=>el.getBoundingClientRect());
   return boxes.every((box,i)=>i===0||box.top>boxes[i-1].bottom);
 });
 assert.ok(desktopFlow,"Desktop manual workflow must retain its top-to-bottom sequence");
 // The sidebar presents only one website identity, at the very bottom.
 assert.equal(await page.locator('#sidebar .brand').count(),1,
   "One Governance as Code home brand must remain");
 assert.equal(await page.locator('#sidebar .workspace-switch,#sidebar .sidebar-credit').count(),0,
   "Duplicate SR workspace and Governance Lab profiles must be removed");
 const footerBrandPosition=await page.evaluate(()=>{
   const sidebar=document.getElementById('sidebar');
   const footer=sidebar.querySelector('.sidebar-brand-footer');
   const identity=footer?.querySelector('a.brand');
   const context=sidebar.querySelector('.sidebar-scope');
   const lastNav=sidebar.querySelector('nav.nav-list:last-of-type');
   const sidebarRect=sidebar.getBoundingClientRect();
   const box=footer?.getBoundingClientRect();
   return {
     isLastSidebarChild:footer?.parentElement===sidebar.querySelector('.sidebar-bottom')&&
       footer===footer.parentElement.lastElementChild,
     afterContext:Boolean(box&&context&&box.top>=context.getBoundingClientRect().bottom-2),
     afterNavigation:Boolean(box&&lastNav&&box.top>lastNav.getBoundingClientRect().bottom),
     insideViewport:Boolean(box&&box.bottom<=sidebarRect.bottom+2),
     logoVisible:Boolean(identity&&identity.getClientRects().length)
   };
 });
 assert.ok(Object.values(footerBrandPosition).every(Boolean),
   'Desktop Governance brand must occupy the visible sidebar footer after navigation and reference context: '+JSON.stringify(footerBrandPosition));


 // The agentic overview must read as ONE connected vertical sequence, with no
 // branches. It remains separate from the original seven-stage manual workflow.
 const overviewMap=page.locator('.journey-section .agentic-flow-board');
 const sequence=overviewMap.locator('.agentic-flow-sequence > .af-sequence-item');
 assert.equal(await sequence.count(),6,"Show all six modules in a single sequence");
 assert.equal(await overviewMap.locator('.af-flow-node').count(),6,"Exactly six original overview modules");
 assert.equal(await overviewMap.locator('.agentic-flow-routes,.af-route-standard,.af-flow-merge,.af-flow-loop').count(),0,
   "No branches, split panels, merging arrows or visible correction-loop graphic");
 assert.ok((await overviewMap.innerText()).includes("Routine cases skip this step."),
   "AI-style stage must be explicitly optional");
 assert.ok((await overviewMap.innerText()).includes("authorised reviewer"),
   "A person retains final authority");
 assert.equal(await page.locator('#intro-guided-tour').count(),0,
   "The removed interactive walkthrough must not reappear");
 const linearGeometry=async()=>page.evaluate(()=>{
   const items=[...document.querySelectorAll('.agentic-flow-sequence > .af-sequence-item')];
   const cards=items.map(li=>li.querySelector('.af-flow-node').getBoundingClientRect());
   const viewWidth=innerWidth;
   return {
     six:cards.length===6,
     ordered:cards.every((r,i)=>i===0||r.top>cards[i-1].bottom),
     aligned:cards.every(r=>Math.abs(r.left-cards[0].left)<2),
     arrows:items.slice(0,-1).every(li=>getComputedStyle(li,'::after').content.includes('↓')),
     visible:cards.every(r=>r.width>0&&r.left>=-1&&r.right<=viewWidth+1)
   };
 });
 const desktopLinear=await linearGeometry();
 assert.ok(Object.values(desktopLinear).every(Boolean),
   "Desktop must render one connected top-to-bottom flow: "+JSON.stringify(desktopLinear));

 await page.setViewportSize({width:375,height:812});
 const phoneLinear=await linearGeometry();
 assert.ok(Object.values(phoneLinear).every(Boolean),
   "Phone must retain the same single readable flow without clipping: "+JSON.stringify(phoneLinear));

 const menu=page.locator("#mobileMenu");
 assert.ok(await menu.isVisible(),"Mobile menu must remain visible");
 await menu.click();
 assert.equal(await menu.getAttribute("aria-expanded"),"true");
 await page.keyboard.press("Escape");
 assert.equal(await menu.getAttribute("aria-expanded"),"false",
   "Escape must close the mobile drawer");
 await menu.click();
 assert.ok(await page.locator('#mobileClose').isVisible(),"Keep a top-of-drawer mobile close button");
 await page.locator('#sidebar .sidebar-brand-footer a.brand').click();
 await page.waitForFunction(()=>new URLSearchParams(location.search).get('view')==='overview',null,{timeout:10000});
 assert.equal(await menu.getAttribute('aria-expanded'),'false',
   'Footer brand must navigate home and close the mobile drawer');

 await page.locator('.overview-cta [data-view="cases"]').click();
 await page.locator('.wb-table a[data-view="case"]').first().click();
 await page.waitForFunction(()=>new URLSearchParams(location.search).get("view")==="case",null,{timeout:10000});
 assert.ok(await page.locator('.case-detail-facts').count(),
   "Case detail must show outcome and human authority before the event tabs");
 assert.ok(await page.locator('.case-review-evidence').count(),
   "Case summary must contain grounded human decision evidence");
 await page.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+"/?view=governance",
   {waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForSelector('.control-proof',{timeout:18000});
 assert.ok(await page.locator('.wb-tab.selected').innerText().then(x=>x.includes("Obligation mappings")),
   "Governance deep links must open the control mapping, not an empty tab");
 assert.ok(await page.locator('.control-proof').first().innerText().then(x=>x.toLowerCase().includes("evidence pointer")),
   "Each governance control must expose an evidence pointer");
 console.log("DESIGN_SYSTEM", "Mobile navigation, concise introduction, case authority and governance source mappings passed");

 // Keep the original seven-stage manual workflow; remove the duplicate guided tour.
 await page.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+"/?view=overview",
   {waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForSelector(".original-workflow-list .original-flow-card",{timeout:12000});
 assert.equal(await page.locator(".original-workflow-list .original-flow-card").count(),7,
   "The original manual workflow must retain all seven stages");
 assert.ok((await page.locator("#original-workflow-title").innerText()).includes("original supplier-invoice review workflow"));
 assert.ok((await page.locator(".original-workflow-heading").innerText()).includes("WORKFLOW VIEW"),
   "Manual process must be identified as the workflow view");
 assert.equal(await page.locator("#intro-guided-tour").count(),0,
   "Remove the redundant interactive walkthrough");
 assert.equal(await page.locator(".intro-step-trigger").count(),0,
   "No guided-tour buttons should be appended to the workflow cards");
 assert.equal(await page.locator(".intro-lab").count(),0,"Illustrative invoice toggle lab remains removed");

 // Generate, download, parse and run the same deterministic local checks.
 await page.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+"/?view=submissions",
   {waitUntil:"domcontentloaded",timeout:60000});
 await page.waitForSelector('[data-submission-action="generate"]',{timeout:12000});
 const variants=await page.evaluate(async()=>{
   const types=["clean","total","rate","missing","limit","currency"];
   const checks={};
   for(const type of types){
     const data=PublicSupplierWorkbook.sample(type),binary=PublicSupplierWorkbook.build(data);
     const parsed=await PublicSupplierWorkbook.read(new File([binary],"supplier.xlsx",{type:binary.type}));
     if(parsed.invoice_id!==data.invoice_id||parsed.lines.length!==data.lines.length)
       throw Error("Excel round-trip changed the supplier invoice input");
     const report=PublicLocalRunner.run(parsed,{sampleContract:true});
     checks[type]={status:report.status,failures:report.validation.filter(x=>x.passed===false).map(x=>x.title)};
   }
   const random=PublicSupplierWorkbook.random();
   const roundTrip=await PublicSupplierWorkbook.read(new File([PublicSupplierWorkbook.build(random.invoice)],'random.xlsx'));
   if(JSON.stringify(roundTrip)!==JSON.stringify(random.invoice)){
     for(const key of Object.keys(random.invoice))if(JSON.stringify(roundTrip[key])!==JSON.stringify(random.invoice[key]))throw Error('Random Excel round-trip changed '+key);
   }
   return checks;
 });
 assert.equal(variants.clean.status,"Local_checks_partial","Clean workbook must pass evaluated local rules");
 for(const [kind,check] of [["total","R2"],["rate","C6"],["missing","R6"],["limit","C7"],["currency","C4"]])
   assert.ok(variants[kind].failures.some(x=>x.startsWith(check)),kind+" workbook should fail "+check);
 await page.locator("#supplierCaseType").selectOption("rate");
 const [download]=await Promise.all([
   page.waitForEvent("download",{timeout:12000}),
   page.locator('[data-submission-action="generate"]').click()
 ]);
 assert.ok(download.suggestedFilename().endsWith(".xlsx"),"Generator must download a real XLSX");
 await page.locator('input[name="attachment"]').setInputFiles({name:download.suggestedFilename(),mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",buffer:await readFile(await download.path())});
 await page.locator('input[name="demoContract"]').check();
 await page.locator('#public-submission-form button[type="submit"]').click();
 await page.waitForFunction(()=>Boolean(document.querySelector('.wb-receipt-card'))||Boolean(document.querySelector('#submission-result:not([hidden])')),null,{timeout:12000});
 const submissionError=await page.locator('#submission-result:not([hidden])').allTextContents();
 assert.equal(submissionError.length,0,"XLSX upload error: "+submissionError.join("; "));
 await page.waitForSelector('.wb-receipt-card',{timeout:8000});
 const receipt=await page.locator('.wb-receipt-card').first().innerText();
 assert.ok(receipt.includes("Local_checks_failed")&&receipt.includes("parsed Invoice / LineItems XLSX"),
   "Uploaded workbook must receive a genuine local validation report, not a metadata-only receipt");
 await page.locator('.wb-receipt-card details summary').first().click();
 assert.ok((await page.locator('.wb-receipt-card details').first().innerText()).includes("C6: Rates match approved rate card"),
   "Report must surface the failing contract-rate check");
 console.log("EXCEL_ROUND_TRIP","Six generator scenarios, editable Excel download, upload and local rule report passed");

 // Reproduce a PHONE finger-swipe over the real iframe canvas. In normal
 // browsing mode the parent page must move; the old touch-action:none canvas
 // trapped this gesture and never passed it to the page.
 const mobileContext=await browser.newContext({
   viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true
 });
 try{
   const mobile=await mobileContext.newPage();
   mobile.on("pageerror",e=>errors.push("MOBILE PAGEERROR "+e.message.slice(0,300)));
   await mobile.goto((process.env.TEST_ORIGIN||"https://ghadiator.github.io")+"/?view=architecture",
     {waitUntil:"domcontentloaded",timeout:60000});
   await mobile.waitForFunction(()=>{
     const guard=document.getElementById("architectureTouchGuard");
     return matchMedia("(pointer: coarse)").matches && guard && !guard.hidden &&
       guard.getBoundingClientRect().height>500;
   },null,{timeout:25000});
   assert.equal(await mobile.locator("#architectureTouchToggle").getAttribute("aria-pressed"),"false",
     "Mobile must start with parent-page scrolling, not trapped diagram panning");
   const phoneGenerate=mobile.frameLocator('#modularArchitectureFrame').locator('[data-case-generate]');
   const phonePickerBox=await mobile.frameLocator('#modularArchitectureFrame').locator('select[aria-label="Recorded scenario"]').boundingBox();
   assert.ok(phonePickerBox&&phonePickerBox.width>=180,"Keep the phone scenario picker readable beside generation controls");
   const phoneGenerateBox=await phoneGenerate.boundingBox();
   assert.ok(phoneGenerateBox&&phoneGenerateBox.x>=0&&phoneGenerateBox.x+phoneGenerateBox.width<=390,
     "Random case control must fit the phone viewport without sideways scrolling");
   // A normal phone tap must work WITHOUT first enabling diagram panning.
   // This travels through the real scroll guard, not a programmatic node click.
   const mobileDetails=mobile.locator('#architecture-module-inspector');
   for(const id of ['request','intake']){
     const node=mobile.frameLocator('#modularArchitectureFrame').locator('[data-node="'+id+'"]');
     await node.scrollIntoViewIfNeeded();
     const box=await node.boundingBox();
     assert.ok(box,"The selected source block must have an on-screen hit target");
     const x=box.x+box.width/2,y=box.y+box.height/2;
     assert.equal(await mobile.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('#architectureTouchGuard')?.id,{x,y}),
       'architectureTouchGuard',"Reproduce the default scroll overlay covering the block");
     await mobile.touchscreen.tap(x,y);
     await mobile.waitForFunction(id=>document.getElementById('architecture-module-inspector')?.dataset.selectedModule===id,id);
     assert.ok(await mobileDetails.isVisible(),"Default phone tap must open block details");
     for(const phrase of ['Expected input','Expected output','EU AI Act relevance','Recorded output']){
       assert.ok((await mobileDetails.innerText()).includes(phrase),"Phone popup must include "+phrase);
     }
     assert.equal(await node.getAttribute('aria-pressed'),'true',"Tap must preserve the original React selection");
     assert.equal(await mobile.locator('#architectureTouchToggle').getAttribute('aria-pressed'),'false');
     await mobileDetails.locator('[data-module-inspector-close]').tap();
   }
   await mobile.frameLocator('#modularArchitectureFrame').getByRole('button',{name:'Run',exact:true}).tap();
   await mobile.waitForFunction(()=>Number(document.querySelector('#modularArchitectureFrame').contentDocument.querySelector('input[aria-label="Position in the recorded run"]').value)>=0);
   const firstPosition=await mobile.evaluate(()=>{
     const guard=document.getElementById("architectureTouchGuard");
     const rect=guard.getBoundingClientRect();
     window.scrollTo({top:window.scrollY+rect.top-140,behavior:"instant"});
     return window.scrollY;
   });
   await mobile.waitForTimeout(200);
   const guardRect=await mobile.locator("#architectureTouchGuard").boundingBox();
   assert.ok(guardRect&&guardRect.y<300&&guardRect.y+guardRect.height>650,
     "The touch guard must cover the visible diagram without covering its selector");
   const touchX=Math.round(guardRect.x+Math.min(130,guardRect.width/2));
   const scrollBefore=await mobile.evaluate(()=>document.scrollingElement.scrollTop);
   const client=await mobileContext.newCDPSession(mobile);
   const swipe=async (startY,endY)=>{
     await client.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:touchX,y:startY}]});
     for(let i=1;i<=12;i++){
       const y=Math.round(startY+(endY-startY)*i/12);
       await client.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:touchX,y}]});
       await mobile.waitForTimeout(22);
     }
     await client.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
     await mobile.waitForTimeout(550);
   };
   await swipe(560,245);
   const scrollAfter=await mobile.evaluate(()=>document.scrollingElement.scrollTop);
   assert.ok(scrollAfter>scrollBefore+60,
     "Swiping UP on the embedded diagram must scroll the outer page DOWN (before "+scrollBefore+" after "+scrollAfter+")");
   assert.ok(await mobileDetails.isHidden(),"Swiping over blocks must not open the popup");
   // Reposition under the finger and verify reverse scrolling as well.
   await mobile.evaluate(()=>{
     const box=document.getElementById("architectureTouchGuard").getBoundingClientRect();
     window.scrollBy({top:box.top-130,behavior:"instant"});
   });
   await mobile.waitForTimeout(180);
   const reverseBefore=await mobile.evaluate(()=>document.scrollingElement.scrollTop);
   await swipe(285,555);
   const reverseAfter=await mobile.evaluate(()=>document.scrollingElement.scrollTop);
   assert.ok(reverseAfter<reverseBefore-40,
     "Swiping DOWN over the diagram must scroll the outer page UP (before "+reverseBefore+" after "+reverseAfter+")");
   const mobileCursor=await mobile.frameLocator('#modularArchitectureFrame').locator('input[aria-label="Position in the recorded run"]').inputValue();
   await mobile.waitForFunction(cursor=>Number(document.querySelector('#modularArchitectureFrame').contentDocument.querySelector('input[aria-label="Position in the recorded run"]').value)>Number(cursor),mobileCursor,{timeout:10000});
   assert.ok(Math.abs((await mobile.evaluate(()=>scrollY))-reverseAfter)<3,'An active replay must preserve the phone reading position between gestures');
   // Native sideways swipes reveal the wide diagram without enabling pan mode.
   const viewport=mobile.locator('.architecture-canvas-viewport');
   assert.ok(await viewport.evaluate(el=>el.scrollWidth>el.clientWidth+400),"Phone canvas needs real horizontal overflow");
   assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),"Keep horizontal overflow inside the canvas, not the page");
   const scrollCanvas=async (startX,endX,y)=>{
     await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:startX,y}]});
     for(let i=1;i<=12;i++){
       await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(startX+(endX-startX)*i/12),y}]});
       await mobile.waitForTimeout(22);
     }
     await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
     await mobile.waitForTimeout(550);
   };
   await mobile.evaluate(()=>{
     const guard=document.getElementById('architectureTouchGuard');
     scrollBy({top:guard.getBoundingClientRect().top-130,behavior:'instant'});
     document.querySelector('.architecture-canvas-viewport').scrollLeft=0;
   });
   await mobile.waitForTimeout(180);
   const pageBeforeSideways=await mobile.evaluate(()=>scrollY);
   await scrollCanvas(320,65,420);
   const right=await viewport.evaluate(el=>el.scrollLeft);
   assert.ok(right>60,"Swipe left must scroll the canvas to the right: "+right);
   assert.ok(Math.abs((await mobile.evaluate(()=>scrollY))-pageBeforeSideways)<15,"Sideways canvas swipe must preserve page position");
   assert.ok(await mobileDetails.isHidden(),"Horizontal swipe must not open block details");
   await scrollCanvas(65,320,420);
   assert.ok((await viewport.evaluate(el=>el.scrollLeft))<right-40,"Swipe right must scroll the canvas back");
   // Taps must still hit the correct child block after a horizontal scroll.
   const farNode=mobile.frameLocator('#modularArchitectureFrame').locator('[data-node="archive"]');
   await farNode.scrollIntoViewIfNeeded();
   const farBox=await farNode.boundingBox();
   await mobile.touchscreen.tap(farBox.x+farBox.width/2,farBox.y+farBox.height/2);
   await mobile.waitForFunction(()=>document.getElementById('architecture-module-inspector')?.dataset.selectedModule==='archive');
   assert.ok(await mobileDetails.isVisible());
   await mobileDetails.locator('[data-module-inspector-close]').tap();
   // Explicit interaction mode must still allow selecting a real React node.
   await mobile.locator("#architectureTouchToggle").click();
   assert.equal(await mobile.locator("#architectureTouchToggle").getAttribute("aria-pressed"),"true");
   assert.ok(await mobile.locator("#architectureTouchGuard").isHidden(),"Uncover original React canvas for touch");
   assert.ok(await mobile.locator("#architectureTouchExit").isVisible(),"Fixed exit must stay accessible");
   await mobile.frameLocator("#modularArchitectureFrame").locator('[data-node="request"]').click();
   assert.equal(await mobile.frameLocator("#modularArchitectureFrame").locator('[data-node="request"]').getAttribute("aria-pressed"),"true");
   await mobile.locator("#architectureTouchExit").click();
   assert.equal(await mobile.locator("#architectureTouchToggle").getAttribute("aria-pressed"),"false");
   assert.ok(await mobile.locator("#architectureTouchGuard").isVisible(),
     "Exiting exploration must restore normal page swipe scrolling");
   console.log("MOBILE_DIAGRAM_SCROLL","Native upward/downward page swipes, explicit React interaction and one-tap exit passed");
   await mobile.locator('#mobileMenu').click();
   assert.ok(await mobileDetails.isHidden(),'Opening navigation must dismiss the block popup so it cannot cover the drawer');
   await mobile.locator('#sidebar [data-view="background"]').click();
   await mobile.locator('.so-choice').last().waitFor({state:'visible'});
   assert.equal(await mobile.locator('.so-choice').count(),6);
   assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Engineering story must fit the phone viewport');
   assert.equal(await mobile.locator('#sidebar [data-view="background"]').getAttribute('aria-current'),'page');
   await mobile.reload({waitUntil:'domcontentloaded'});
   await mobile.locator('.so-hero h1').waitFor({state:'visible'});
   assert.ok((await mobile.locator('.so-hero').innerText()).includes('How did my experience shape this model?'));
 }finally{await mobileContext.close();}

 await page.locator('#sidebar [data-view="background"]').click();
 assert.equal(await page.locator('nav[aria-labelledby="nav-background"] [data-view]').count(),1,'Personal engineering rationale has its own sidebar section');
 assert.equal(await page.locator('.so-choice').count(),6);
 assert.ok((await page.locator('#main').innerText()).includes('Bosch Engineering'));
 assert.ok((await page.locator('#main').innerText()).includes('techcos'));
 assert.ok((await page.locator('#main').innerText()).includes('not equivalence between standards'));
 await page.locator('.so-inspect[href*="view=evidence"]').click();
 await page.locator('[data-evidence-tab="trace"]').waitFor({state:'visible'});
 await page.goBack();
 await page.locator('.so-hero h1').waitFor({state:'visible'});
 console.log('SAFETY_TO_GOVERNANCE','Dedicated section, six experience/control connections, evidence navigation, history and phone reload passed');

 // The archived compiled architecture already has a React #418 HTML
 // hydration warning because its SSR markup was customized independently.
 // This PR intentionally does not edit the integrity-pinned compiled artifact.
 // Every other console or runtime error remains a regression.
 const unexpected=errors.filter(e=>!e.includes("Minified React error #418"));
 console.log("KNOWN_LEGACY_HYDRATION_WARNING",errors.filter(e=>e.includes("Minified React error #418")).length);
 if(unexpected.length)throw new Error(unexpected.slice(0,10).join("\\n"));
}finally{await browser.close();}
