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
const normalized=s=>s.endsWith("/")?s:s+"/";
const currentPath=()=>normalized(location.pathname);
let searchInput=null;
let searchHandler=null;
function updateActive(root){
 const path=currentPath();
 root.querySelectorAll("a[href]").forEach(link=>{
  const href=normalized(new URL(link.href).pathname);
  const active=href==="/cases/"?tabs.some(([p])=>p===path):href===path;
  if(active)link.setAttribute("aria-current","page");
  else link.removeAttribute("aria-current");
 });
}
function searchNav(root){
 const input=document.querySelector('input[aria-label="Find a section"]');
 if(searchInput!==input){
  if(searchInput&&searchHandler)searchInput.removeEventListener("input",searchHandler);
  searchInput=input;searchHandler=null;
 }
 const filter=()=>{
  const q=(input?.value||"").trim().toLowerCase();
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
 if(input&&!searchHandler){searchHandler=()=>filter();input.addEventListener("input",searchHandler);}
 filter();
}
// Give Governance Code its own Code2 (brackets) icon. Some pinned static
// routes omit this link from the original sidebar; a cloned icon is therefore
// not reliable. Create the same SVG on every route and SPA remount.
function ensureGovernanceCodeIcon(root){
 const link=[...root.querySelectorAll("a[href]")].find(a=>normalized(new URL(a.href).pathname)==="/governance-code/");
 if(!link)return;
 const existing=link.querySelector("svg");
 if(existing?.dataset.gacCodeIcon==="true")return;
 const ns="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(ns,"svg");
 for(const [key,value] of Object.entries({width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true"}))svg.setAttribute(key,value);
 svg.dataset.gacCodeIcon="true";
 svg.classList.add("lucide","lucide-code-2");
 for(const d of ["m18 16 4-4-4-4","m6 8-4 4 4 4","m14.5 4-5 16"]){
  const p=document.createElementNS(ns,"path");p.setAttribute("d",d);svg.appendChild(p);
 }
 if(existing)existing.replaceWith(svg);else link.prepend(svg);
}
function patch(){
 const nav=document.querySelector("nav.public-nav");
 if(!nav)return;
 const old=[...nav.querySelectorAll(":scope > section")];
 let root=nav.querySelector("[data-gac-consolidated-nav]");
 if(!root){
  if(!old.length)return;
  const originals=[...nav.querySelectorAll("a[href]")];
  root=document.createElement("div");
  root.dataset.gacConsolidatedNav="true";
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
    section.appendChild(link);
   });
   root.appendChild(section);
  });
  nav.prepend(root);
 }
 // A Next.js client route change can re-render the original sidebar AFTER
 // this compatibility layer has been inserted. Hide every old section,
 // not just those present in the first document load.
 old.forEach(section=>{if(!section.hasAttribute("data-gac-old-nav"))section.setAttribute("data-gac-old-nav","true");});
 document.documentElement.dataset.gacNavEnabled="true";
 ensureGovernanceCodeIcon(root);
 updateActive(root);
 searchNav(root);
}
function tabsAndPool(){
 const pathname=location.pathname.replace(/\/$/,"")||"/";
 const main=document.querySelector("main#main-content");
 if(!main)return;
 const workspace=["/tickets","/inbound","/monitor","/cases","/audit","/upload"].includes(pathname);
 const oldRail=main.querySelector('[data-gac-workspace-tabs]');
 if(!workspace&&oldRail)oldRail.remove();
 if(workspace&&!oldRail){
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
 if(workspace){
  const rail=main.querySelector('[data-gac-workspace-tabs]');
  rail?.querySelectorAll("a[href]").forEach(a=>{
   if((a.pathname.endsWith("/")?a.pathname.slice(0,-1):a.pathname)===pathname)a.setAttribute("aria-current","page");
   else a.removeAttribute("aria-current");
  });
 }
 const previousPool=main.querySelector('[data-gac-legacy-pool]');
 if(pathname!=="/dashboard"&&previousPool)previousPool.remove();
 if(pathname==="/dashboard"&&!previousPool){
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
// App Router navigates in-place using history methods and React remounts.
 // Reconcile both the route and the sidebar DOM, without rewriting React-owned
 // sections. Child-list observation catches a newly remounted sidebar.
let queued=false;
let hydrated=false;
function schedule(){
 if(!hydrated||queued)return;
 queued=true;
 requestAnimationFrame(()=>{
  queued=false;
  patch();tabsAndPool();
 });
}
const originalPush=history.pushState;
const originalReplace=history.replaceState;
history.pushState=function(...args){const result=originalPush.apply(this,args);schedule();return result;};
history.replaceState=function(...args){const result=originalReplace.apply(this,args);schedule();return result;};
window.addEventListener("popstate",schedule);
window.addEventListener("hashchange",schedule);
window.addEventListener("pageshow",schedule);
const observer=new MutationObserver(records=>{
 if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>
  n.nodeType===1 && (n.matches?.("nav.public-nav,main#main-content,section,[data-gac-consolidated-nav]") ||
   n.querySelector?.("nav.public-nav,main#main-content")))))schedule();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
// The pinned Next.js build must hydrate BEFORE any compatibility-layer
// DOM insertions. Prior eager DOMContentLoaded updates triggered React #418.
// Subsequent SPA navigations are safe to reconcile immediately.
function activate(){
 if(hydrated)return;
 window.setTimeout(()=>{hydrated=true;schedule();},800);
}
if(document.readyState==="complete")activate();
else window.addEventListener("load",activate,{once:true});
})();
