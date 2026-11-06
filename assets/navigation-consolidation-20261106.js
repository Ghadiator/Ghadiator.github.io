/* GovernanceAsCode public-static navigation compatibility patch.
 * Runs only after the pinned Next.js 7.5.19 hydration has completed.
 * Original routes remain valid; this changes navigation presentation,
 * not actions, permissions, backend calls, or evidence records.
 * Remove once the feature-branch source is rebuilt into static artifacts.
 */
(function(){
"use strict";
const grouped=[
 {heading:"START",items:[["/","Overview"],["/business-impact/","Business value & KPIs"],["/architecture/","Architecture"]]},
 {heading:"GOVERNANCE & DEFENCES",items:[["/ai-roles/","Personas"],["/ai-assurance/","Assurance"],["/red-team/","Failure Lab"]]},
 {heading:"VALIDATION & INSIGHTS",items:[["/cases/","Validation workspace"],["/dashboard/","Analytics"],["/token-economics/","Token Economics"]]},
 {heading:"ORIGINS",items:[["/safety-origin/","Safety Origins"],["/governance/","Framework Explorer"],["/governance-code/","Governance Code"]]}
];
const tabs=[
 ["/tickets/","Document requests"],["/inbound/","Correspondence"],
 ["/monitor/","Scenario theater"],["/cases/","Cases"],["/audit/","Process audit"],["/upload/","Workbook lab"]
];
function patch(){
 const nav=document.querySelector('nav.public-nav');
 if(!nav || nav.querySelector('[data-gac-consolidated-nav]'))return;
 const old=[...nav.querySelectorAll(':scope > section')];
 if(!old.length)return;
 const originals=[...nav.querySelectorAll("a[href]")];
 const root=document.createElement("div");
 root.dataset.gacConsolidatedNav="true";
 const normalized=s=>s.endsWith("/")?s:s+"/";
 grouped.forEach(group=>{
  const section=document.createElement("section");
  const title=document.createElement("h2");title.textContent=group.heading;
  section.appendChild(title);
  group.items.forEach(([href,label])=>{
   const original=originals.find(x=>normalized(new URL(x.href).pathname)===href);
   const link=original?original.cloneNode(true):document.createElement("a");
   link.href=href;
   let caption=link.querySelector("span");
   if(!caption){caption=document.createElement("span");link.appendChild(caption);}
   caption.textContent=label;
   link.removeAttribute("aria-current");
   const pathname=location.pathname.endsWith("/")?location.pathname:location.pathname+"/";
   const active=href==="/cases/"?tabs.some(([path])=>path===pathname):pathname===href;
   if(active)link.setAttribute("aria-current","page");
   section.appendChild(link);
  });
  root.appendChild(section);
 });
 old.forEach(section=>section.setAttribute("data-gac-old-nav","true"));
 nav.prepend(root);
 const input=document.querySelector('input[aria-label="Find a section"]');
 if(input){
  const filter=()=>{
   const q=input.value.trim().toLowerCase();
   for(const section of root.children){
    let matches=0;
    for(const a of section.querySelectorAll("a")){
     const visible=!q||(section.querySelector("h2").textContent+" "+a.textContent).toLowerCase().includes(q);
     a.hidden=!visible;
     if(visible)matches++;
    }
    section.hidden=matches===0;
   }
  };
  input.addEventListener("input",filter);
  filter();
 }
}
function tabsAndPool(){
 const pathname=location.pathname.replace(/\/$/,"")||"/";
 const main=document.querySelector("main#main-content");
 if(!main)return;
 if(["/tickets","/inbound","/monitor","/cases","/audit","/upload"].includes(pathname)
   && !main.querySelector('[data-gac-workspace-tabs]')){
  const nav=document.createElement("nav");
  nav.dataset.gacWorkspaceTabs="true";
  nav.setAttribute("aria-label","Validation workspace views");
  const heading=document.createElement("strong");heading.textContent="Validation workspace";nav.appendChild(heading);
  const rail=document.createElement("div");
  tabs.forEach(([href,label])=>{
   const a=document.createElement("a");a.href=href;a.textContent=label;
   if(href.replace(/\/$/,"")===pathname)a.setAttribute("aria-current","page");
   rail.appendChild(a);
  });
  nav.appendChild(rail);main.prepend(nav);
 }
 if(pathname==="/dashboard"&&!main.querySelector('[data-gac-legacy-pool]')){
  const section=document.createElement("details");
  section.dataset.gacLegacyPool="true";
  section.className="gac-legacy-pool";
  const summary=document.createElement("summary");
  summary.textContent="Historical pool analytics · recorded reference";
  const paragraph=document.createElement("p");
  paragraph.textContent="Pool analysis comes from recorded reference runs, not verified supplier accounting or live operational throughput.";
  const link=document.createElement("a");link.href="/pool-analytics/";
  link.textContent="Inspect historical pool analysis →";
  section.append(summary,paragraph,link);main.appendChild(section);
 }
}
function init(){patch();tabsAndPool();}
if(document.readyState==="complete")setTimeout(init,800);
else window.addEventListener("load",()=>setTimeout(init,800),{once:true});
window.addEventListener("pageshow",()=>setTimeout(init,800));
})();
