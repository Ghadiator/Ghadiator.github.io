import { chromium } from "playwright-core";
import assert from "node:assert/strict";

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
 const orchestration=page.frameLocator("#modularArchitectureFrame").locator('[data-node="orchestrator"]');
 const before=await orchestration.getAttribute("aria-pressed");
 await orchestration.evaluate(el=>el.click());
 await page.waitForTimeout(500);
 const after=await orchestration.getAttribute("aria-pressed");
 console.log("NODE_INTERACTION",JSON.stringify({before,after}));
 assert.equal(after,"true","Clicking the original orchestrator block must activate the React interaction");
 console.log("BAD_RESPONSES",JSON.stringify(responses.slice(0,30)));
 await page.screenshot({path:"architecture-embedded-test.png",fullPage:false});
 const deck=page.frameLocator("#modularArchitectureFrame");
 const picker=deck.locator('select[aria-label="Recorded scenario"]');
 assert.ok(await picker.count(),"Scenario selector must appear in the original modular canvas");
 assert.ok((await picker.locator("option").count())>=10,"The recorded scenarios must be selectable");
 const outsideBefore=page.locator("#architecture-detail");
 assert.ok((await outsideBefore.innerText()).includes("Pick a case and step through it"),"Introductory text must appear below the graph");
 assert.ok((await outsideBefore.innerText()).includes("Look inside"),"Modular drill controls must appear below the graph");
 const drillControl=outsideBefore.locator('[data-deck-action="drill"]').first();
 await drillControl.click();
 await page.waitForFunction(()=>document.querySelector('#architecture-detail [data-deck-action="back"]'),null,{timeout:10000});
 await outsideBefore.locator('[data-deck-action="back"]').click();
 await page.waitForFunction(()=>!document.querySelector('#architecture-detail [data-deck-action="back"]'),null,{timeout:10000});
 console.log("MODULE_DRILL", "React drill-down and return are controlled from beneath the modular canvas");
 const diagram=deck.locator(".deck-canvas");
 const header=deck.locator(".deck > div").filter({has:deck.locator("span.w-full.min-w-0")}).first();
 const graphRect=await diagram.boundingBox(),summaryBefore=await header.boundingBox();
 assert.ok(graphRect,"The modular graph must be visible before the replay begins");
 assert.equal(summaryBefore,null,"The terminal-state summary must be hidden before a run starts");
 await picker.selectOption("supplier_clean");
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
  return box&&/Event [1-9] of/.test(box.innerText);
 },{timeout:10000});
 const summaryAfter=await header.boundingBox();
 assert.equal(summaryAfter,null,"Run narrative must never appear inside the graph section");
 const outside=page.locator("#architecture-detail");
 assert.ok((await outside.innerText()).includes("Current workflow step"),"Current workflow step must be beneath the iframe");
 const outsideRect=await outside.boundingBox(),frameRect=await page.locator("#modularArchitectureFrame").boundingBox();
 assert.ok(outsideRect&&frameRect&&outsideRect.y>=frameRect.y+frameRect.height-1,"Step explanations must be OUTSIDE and UNDER the architecture iframe");
 const output=await page.locator("#workflow-results").innerText();
 assert.ok(output.includes("Module exchanges and evidence"),"Evidence must be beneath the diagram");
 assert.ok(!output.includes("Recorded workflow result"),"The final outcome must not be shown before the run completes");
 console.log("SCENARIO_REPLAY",JSON.stringify({selected,resultText:output.slice(0,450)}));
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
 assert.ok(complete.includes("Scripted adversarial committee"),"Proponent/Opponent/verification/Judge dialogue must follow the recorded workflow");
 assert.ok(complete.includes("Recorded workflow result"),"Terminal state must appear when the replay reaches its last event");
 console.log("COMPLETED_REPLAY",JSON.stringify({length:complete.length,hasCommittee:true,hasOutcome:true}));

 // The archived compiled architecture already has a React #418 HTML
 // hydration warning because its SSR markup was customized independently.
 // This PR intentionally does not edit the integrity-pinned compiled artifact.
 // Every other console or runtime error remains a regression.
 const unexpected=errors.filter(e=>!e.includes("Minified React error #418"));
 console.log("KNOWN_LEGACY_HYDRATION_WARNING",errors.filter(e=>e.includes("Minified React error #418")).length);
 if(unexpected.length)throw new Error(unexpected.slice(0,10).join("\\n"));
}finally{await browser.close();}
