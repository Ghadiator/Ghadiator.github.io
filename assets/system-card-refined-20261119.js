/* System-card decision explorer, shared by the exported page and frontend. */
(function(){
"use strict";
const styleId="gac-system-card-styles-20261119";
if(!document.getElementById(styleId)){const link=document.createElement("link");link.id=styleId;link.rel="stylesheet";link.href="/assets/system-card-refined-20261119.css";document.head.appendChild(link)}
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const add=(root,...items)=>{items.forEach(n=>root.appendChild(n));return root};
const features=new Set(["ADR-036","ADR-040","ADR-042","ADR-091","ADR-103","ADR-107","ADR-113","ADR-141","ADR-191","ADR-197","ADR-200"]);
async function mount(){
const root=document.getElementById("gac-system-card-app");
if(!root)return;
try{
const response=await fetch("/data/system-card-public.json",{cache:"no-store"});if(!response.ok)throw Error("HTTP "+response.status);
const data=await response.json();
if(!Array.isArray(data.decisions)||!data.decisions.every(d=>d.id&&d.title&&d.why&&d.choice&&d.limit))throw Error("Incomplete ADR record");
root.replaceChildren();
const hero=node("section","sc-hero");
add(hero,node("p","sc-eyebrow","PURPOSE · BOUNDARIES · ENGINEERING DECISIONS"),node("h1","","System card"),node("p","",data.purpose));
const foot=node("div","sc-hero-foot");add(foot,node("span","sc-dot"),node("span","","Source-traceable · human authority retained"));hero.appendChild(foot);root.appendChild(hero);
const stats=node("section","sc-stats");
[[String(data.decisions.length),"Complete, curated decisions"],["04","Workflow stages"],["01","Human decision authority"]].forEach(([n,label])=>{const s=node("div","sc-stat");add(s,node("strong","",n),node("span","",label));stats.appendChild(s)});root.appendChild(stats);
add(root,node("p","sc-eyebrow","01 / SYSTEM BOUNDARY"),node("h2","","Evidence moves forward; authority does not"),node("p","sc-lead","The tiered design separates objective invoice checks from disputed interpretations. AI supports unresolved exceptions but cannot make the final reviewer decision."));
const workflow=[["01","Receive","Typed supplier invoice and provenance"],["02","Validate","Arithmetic and independent contract evidence"],["03","Challenge","Bounded proposals and claim verification"],["04","Decide","Human disposition and process record"]];
const flow=node("div","sc-flow");
workflow.forEach(([number,title,desc])=>{const step=node("div","sc-step");add(step,node("b","",number),node("h3","",title),node("p","",desc));flow.appendChild(step)});root.appendChild(flow);
const boundary=node("div","sc-boundary");add(boundary,node("strong","","Human oversight is the terminal control"),node("p","",data.boundary));root.appendChild(boundary);
add(root,node("p","sc-eyebrow","02 / ARCHITECTURE DECISION RECORDS"),node("h2","","A decision catalogue you can actually inspect"),node("p","sc-lead","Each entry connects a design problem to a concrete engineering choice and the limitation that still matters. The public sequence contains no empty slots; the original ADR identifiers remain attached for traceability."));
const tools=node("div","sc-tools"),search=node("input","sc-search");search.type="search";search.placeholder="Search decisions, controls and ADR IDs";search.setAttribute("aria-label","Search architecture decisions");tools.appendChild(search);
const groups=["Featured","All","Architecture","Assurance","Accountability","Experience"],buttons=new Map();
let active="Featured",query="";
for(const group of groups){const b=node("button","sc-filter",group);b.type="button";b.setAttribute("aria-pressed",String(group===active));b.addEventListener("click",()=>{active=group;paint()});buttons.set(group,b);tools.appendChild(b)}
root.appendChild(tools);const count=node("p","sc-count"),grid=node("section","sc-grid");grid.setAttribute("aria-label","Architecture decision record catalogue");add(root,count,grid);
function paint(){buttons.forEach((b,g)=>b.setAttribute("aria-pressed",String(g===active)));grid.replaceChildren();
const selected=data.decisions.filter(d=>active==="All"||(active==="Featured"&&features.has(d.id))||d.group===active).filter(d=>[d.id,d.title,d.group,d.why,d.choice,d.limit].join(" ").toLowerCase().includes(query));
count.textContent=selected.length+" decisions shown · "+data.decisions.length+" in the public catalogue";
selected.forEach((d,index)=>{const card=node("details","sc-card"),summary=node("summary"),meta=node("span","sc-meta"),content=node("span");
add(meta,node("span","sc-ref",d.id),node("span","sc-tag",d.group));add(content,meta,node("span","sc-cardtitle",d.title));add(summary,node("span","sc-no",String(index+1).padStart(2,"0")),content,node("span","sc-plus","+"));
const detail=node("div","sc-detail");
[["Engineering problem",d.why],["Design decision",d.choice],["Residual limitation",d.limit]].forEach(([heading,text])=>add(detail,node("h4","",heading),node("p","",text)));
add(card,summary,detail);grid.appendChild(card)});
if(!selected.length)grid.appendChild(node("div","sc-empty","No matching records. Search for another control or choose All."));
}
search.addEventListener("input",()=>{query=search.value.trim().toLowerCase();if(query&&active==="Featured")active="All";paint()});paint();
root.appendChild(node("p","sc-note","Public display numbering is regenerated from the selected, fully described records. Canonical ADR identifiers are retained because architectural history and code references must not be renumbered."));
const links=node("div","sc-links");
[["Architecture explorer","/architecture/"],["Assurance argument","/ai-assurance/"],["Governance code","/governance-code/"]].forEach(([label,href])=>{const a=node("a","",label+" ↗");a.href=href;links.appendChild(a)});root.appendChild(links);
}catch(error){root.textContent="System card data could not be loaded: "+String(error instanceof Error?error.message:error)}
}
window.GacSystemCardMount=mount;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
const menu=document.querySelector(".menu-toggle"),sidebar=document.getElementById("site-navigation");
if(menu&&sidebar&&!menu.dataset.scBound){menu.dataset.scBound="true";menu.addEventListener("click",()=>{const opened=menu.getAttribute("aria-expanded")!=="true";menu.setAttribute("aria-expanded",String(opened));sidebar.classList.toggle("open",opened);sidebar.classList.toggle("is-open",opened)})}
})();
