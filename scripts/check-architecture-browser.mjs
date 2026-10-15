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
 const tabs=page.locator("[data-architecture-tab]");
 await tabs.nth(1).click();
 await page.waitForTimeout(400);
 console.log("REPLAY_PROBE",JSON.stringify({text:(await page.locator("#main").innerText()).slice(0,300),selected:await tabs.nth(1).getAttribute("class")}));
 await tabs.nth(2).click();
 console.log("IO_PROBE",(await page.locator("#main").innerText()).slice(0,270));
}finally{await browser.close();}
