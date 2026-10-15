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
 assert.ok((state.iframeTextSize||0)>2000,"Architecture content must be visible");
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
 const diagram=deck.locator(".deck-canvas");
 const header=deck.locator(".deck > div").filter({has:deck.locator("span.w-full.min-w-0")}).first();
 const graphRect=await diagram.boundingBox(),summaryRect=await header.boundingBox();
 assert.ok(graphRect&&summaryRect&&graphRect.y<summaryRect.y,"The graph must precede the run result badges");
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
 const output=await page.locator("#workflow-results").innerText();
 assert.ok(output.includes("Module exchanges and evidence"),"Evidence must be beneath the diagram");
 assert.ok(!output.includes("Recorded workflow result"),"The final outcome must not be shown before the run completes");
 console.log("SCENARIO_REPLAY",JSON.stringify({selected,resultText:output.slice(0,450)}));
 if(errors.length)throw new Error(errors.slice(0,10).join("\n"));
}finally{await browser.close();}
