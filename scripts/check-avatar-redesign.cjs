const {chromium}=require("playwright-core");const assert=require("node:assert/strict");const fs=require("node:fs");const path=require("node:path");
const chrome=process.env.CHROME_PATH||["/usr/bin/google-chrome","/usr/bin/chromium"].find(fs.existsSync);
(async()=>{const browser=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox"]});
try{for(const width of [390,689,768,1080,1440]){
 const page=await browser.newPage({viewport:{width,height:980},deviceScaleFactor:2});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("http://127.0.0.1:8765/",{waitUntil:"networkidle",timeout:45000});
 const sheet=await page.request.get("http://127.0.0.1:8765/assets/agent-portrait-redesign-7520.css"); assert.equal(sheet.status(),200);
 const image=await page.request.get("http://127.0.0.1:8765/avatars/personas-hires.webp");assert.equal(image.status(),200);
 const roster=page.locator('aside[aria-labelledby="overview-agent-strip"]');
 await roster.waitFor();
 const states=await page.evaluate(()=>{
  const bounds=el=>{if(!el)return null;const x=el.getBoundingClientRect();return {y:x.y,b:x.bottom,w:x.width,h:x.height};};
  const hero=document.getElementById("introduction-title")?.closest("section");
  const kpi=document.getElementById("overview-kpis")?.closest("section");
  const agent=document.querySelector('aside[aria-labelledby="overview-agent-strip"]');
  const pics=[...agent.querySelectorAll('[role="img"]')].map(x=>{let a=x.getBoundingClientRect();return {w:a.width,h:a.height,bg:getComputedStyle(x).backgroundImage}});
  const labels=[...agent.querySelectorAll("li strong")].map(e=>e.textContent.trim());
  const descriptions=[...agent.querySelectorAll("li")].map(li=>li.querySelector("a > span:last-child")?.textContent.trim()||"");
  return {hero:bounds(hero),kpi:bounds(kpi),agents:bounds(agent),pics,labels,descriptions,
   horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
   portraitStylesheets:[...document.querySelectorAll("link[rel='stylesheet']")].map(a=>a.href).filter(h=>h.includes("agent-portrait-redesign"))};
 });
 assert.equal(states.labels.length,8);assert.deepEqual(states.labels,["Proponent","Opponent","Judge","Attacker","Analytics","Integrator","Audit","Reporter"]);
 assert.equal(states.descriptions.length,8);assert(states.descriptions.every(s=>s.length>=30),"Role summaries are too vague: "+JSON.stringify(states.descriptions));
 assert.equal(states.pics.length,8);assert(states.pics.every(p=>p.bg.includes("personas-hires.webp")),"Not all portraits use the higher-res atlas");
 assert(states.pics.every(p=>p.w>=95&&p.h>=95),"Portrait too small "+JSON.stringify(states.pics));
 assert(states.hero&&states.kpi&&states.agents,"Missing sections");
 assert(states.hero.b<=states.kpi.y+4,"KPIs not immediately following business introduction");
 assert(states.kpi.b<=states.agents.y+4,"Agents not below KPI explanation");
 assert(states.horizontalOverflow<4,"Horizontal overflow "+states.horizontalOverflow);
 assert(states.portraitStylesheets.length>=1,"New portrait CSS not present");
 assert(!errors.length,"Page errors: "+errors.join(" | "));
 const folder="/tmp/gac-avatar-redesign";fs.mkdirSync(folder,{recursive:true});
 await roster.screenshot({path:path.join(folder,"agents-"+width+".png")});
 await page.screenshot({path:path.join(folder,"introduction-"+width+".png"),fullPage:false});
 console.log("PASS responsive roster",width,"avatars",states.pics.map(p=>Math.round(p.w)).join(","),"KPI order","card width",Math.round(states.agents.w));
 await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
