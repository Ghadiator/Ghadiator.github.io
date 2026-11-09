/* Frontend-only evidence release: post-hydration, no API requests, no real-case data.
 * The native backend and its migrations remain protected and unmerged.
 */
(function(){
"use strict";
const PATH=location.pathname.replace(/\/$/,"")||"/";
const EVIDENCE="/data/recorded-kpi-evidence.json";
const APP="https://aigovernanceascodelab.com/";
const fmt=n=>Number(n).toLocaleString("en-GB");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const business=[
 ["Reviewer touch time","Active reviewer minutes per eligible invoice","No timed manual and governed review observations"],
 ["Resolution time","Receipt-to-human-decision hours per decided invoice","No comparable complete decision timestamps"],
 ["First-submission validation pass rate","Passed initial validations / eligible initial submissions","Fixture final states cannot prove a first-submission pass"],
 ["Cases needing resubmission","Cases with confirmed resubmission / eligible cases","Attempt counts are not a verified resubmission denominator"],
 ["Evidence completeness","Cases meeting all versioned required-source criteria / evaluated cases","A complete mandatory-evidence checklist was not recorded"],
 ["Cost per invoice","(Reviewer labour + inference + infrastructure + rework) / decided invoices","No case-level labour or billed charges"]
];
const ai=[
 ["Conditional reasoning escalation","Committee-routed paths / eligible recorded cases","40%","6 / 15","Scripted routing flag; not live inference usage"],
 ["Model tokens and provider costs","Provider input/output token totals and validated rate-card estimate","0 provider tokens","0 provider calls","Recorded fixtures use scripted roles; does not describe real-case usage or billed charges"],
 ["Unsupported-claim detection","Verified unsupported model claims / independently evaluated claims",null,null,"Missing evaluated model claim denominator"],
 ["Human override rate","Human decisions diverging from paired recorded AI recommendations / paired decisions",null,null,"Gate reached is not an override"],
 ["Guardrail intervention rate","Blocked or modified guarded steps / eligible guard evaluations",null,null,"No complete guard-evaluation denominator"],
 ["Decision trace completeness","Decisions satisfying mandatory trace checklist / evaluated decisions",null,null,"571 emitted events do not establish trace completeness"],
 ["Agentic execution error rate","Failed AI-supported executions / eligible AI-supported executions",null,null,"Generic fixture failures are not model-execution errors"]
];
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function attach(parent,html){const node=document.createElement("div");node.innerHTML=html;parent.append(node);return node;}
function section(parent,title,desc){const s=el("section","gac-measured-section");const h=el("h2","gac-measured-heading",title);s.append(h);if(desc)s.append(el("p","gac-measured-detail",desc));parent.append(s);return s;}
function metricCards(parent,records){
 const grid=el("div","gac-measured-grid");
 records.forEach(([label,val,detail])=>{const card=el("article","gac-measured-card");card.append(el("strong","gac-measured-value",String(val)),el("span","gac-measured-label",label));if(detail)card.append(el("small","gac-measured-note",detail));grid.append(card);});
 parent.append(grid);
}
function createCases(data,main){
 if(main.querySelector("[data-gac-origin-panel]"))return;
 const nav=main.querySelector("[data-gac-workspace-tabs]");
 const panel=el("section","gac-mode-panel");panel.dataset.gacOriginPanel="true";
 const heading=el("h2","gac-measured-heading","Validation workspace · two evidence origins");
 const row=el("div","gac-mode-selector");
 const recorded=el("button","gac-mode-button","Recorded Cases");
 const real=el("button","gac-mode-button","Real Cases");
 for(const btn of [recorded,real])btn.type="button";
 const expl=el("p","gac-measured-detail","");
 const content=el("div","gac-mode-content");
 const realPane=el("section","gac-real-pane");
 realPane.append(el("h3","","Protected operational cases"),el("p","","Real supplier requests, correspondence, validated runs, human decisions and audit records are not published on GitHub Pages."));
 const a=el("a","gac-measured-link","Open authenticated Real Cases");a.href=APP;realPane.append(a);
 const cards=section(content,"Observed synthetic executions","These values are recomputed from the published fixture captures. They do not establish manual time savings, provider charges or production ROI.");
 metricCards(cards,[
 ["Recorded cases",fmt(data.counts.recorded_cases)],
 ["Validation checks",fmt(data.counts.validation_checks)],
 ["Recorded events",fmt(data.counts.emitted_events)],
 ["Scripted committee routing","40%","6 / 15 recorded cases"],
 ["Reviewer gate reached","93.33%","14 / 15 cases; not a human override"],
 ["No committee","60%","9 / 15 recorded cases"]
 ]);
 const foot=el("p","gac-measured-detail","Source: recorded supplier case fixtures; audit-event volume is not trace completeness, and attempt counts are not treated as resubmission.");
 content.append(foot);
 panel.append(heading,row,expl,content,realPane);
 row.append(recorded,real);
 if(nav)nav.insertAdjacentElement("beforebegin",panel);else main.prepend(panel);
 // Leave the legacy rendered synthetic case gallery intact and hide it only
 // when the user explicitly selects the protected Real Cases mode.
 const referenceChildren=[...main.children].filter(x=>x!==panel&&x!==nav);
 const setMode=mode=>{
  const isReal=mode==="real";
  recorded.setAttribute("aria-pressed",String(!isReal));
  real.setAttribute("aria-pressed",String(isReal));
  expl.textContent=isReal?"Real Cases are protected; no case identifiers, private documents, model usage or operations can be loaded on this static site.":"Synthetic reference cases and their recorded evidence. No real supplier invoices, provider calls or approvals.";
  content.hidden=isReal;realPane.hidden=!isReal;
  if(nav)nav.hidden=isReal;
  referenceChildren.forEach(c=>{c.hidden=isReal;});
  if(isReal)history.replaceState(null,"",location.pathname+"#real-cases");
  else history.replaceState(null,"",location.pathname+"#recorded-cases");
 };
 recorded.addEventListener("click",()=>setMode("recorded"));
 real.addEventListener("click",()=>setMode("real"));
 setMode(location.hash==="#real-cases"?"real":"recorded");
}
function addBusinessTable(parent,items,manual){
 const sec=section(parent,"Group A · Business performance",
  "External manual AP benchmarks are published values, not observations from our workflow. Proxy measures are explicitly labelled; no business uplift is calculated.");
 const wrapper=el("div","gac-table-scroll");const table=el("table","gac-measured-table");
 const head=el("thead");const tr=el("tr");
 for(const v of ["Business KPI","Published manual AP reference","Recorded AI / governed","Measurement boundary"]){tr.append(el("th","",v));}
 head.append(tr);table.append(head);const body=el("tbody");
 for(let i=0;i<items.length;i++){
  const [name,definition,reason]=items[i];
  const lit=manual.entries[i];
  const line=el("tr");line.append(el("th","",name));
  const benchmark=el("td");
  const main=el("strong","gac-literature-value",lit.display);
  benchmark.append(main);
  benchmark.append(el("small","gac-cell-sub","Published "+lit.year+" · "+(lit.basis.startsWith("proxy:")?"Industry proxy — not the same KPI":"Broader AP process — not a matched baseline")));
  const link=el("a","gac-measured-link",lit.source+" · "+lit.location);link.href=lit.url;link.target="_blank";link.rel="noopener noreferrer";benchmark.append(link);
  line.append(benchmark);
  const governed=el("td");governed.append(el("strong","","Not measured"));
  governed.append(el("small","gac-cell-sub","No equivalent production or timed AI-assisted cohort"));line.append(governed);
  const boundary=el("td");boundary.append(el("span","",definition));
  boundary.append(el("small","gac-cell-sub",lit.basis));
  boundary.append(el("small","gac-cell-sub",reason));line.append(boundary);
  body.append(line);
 }
 table.append(body);wrapper.append(table);sec.append(wrapper);
}
function addAiTable(parent,items){
 const sec=section(parent,"Group B · AI operations and governance",
  "AI-specific KPIs have no manual-process column. Values represent recorded synthetic executions only when evidence exists.");
 const wrapper=el("div","gac-table-scroll");const table=el("table","gac-measured-table");
 const head=el("thead");const tr=el("tr");
 for(const v of ["AI-specific KPI","Recorded observation","Measurement and evidence"]){tr.append(el("th","",v));}
 head.append(tr);table.append(head);const body=el("tbody");
 for(const [name,definition,value,denominator,limitation] of items){
  const line=el("tr");line.append(el("th","",name));
  const result=el("td");result.append(el("strong","",value==null?"Not measured":value));
  if(denominator)result.append(el("small","gac-cell-sub",denominator));
  line.append(result);
  const evidence=el("td");evidence.append(el("span","",definition));evidence.append(el("small","gac-cell-sub",limitation));line.append(evidence);body.append(line);
 }
 table.append(body);wrapper.append(table);sec.append(wrapper);
}
function createBusiness(data,main,manual){
 if(main.querySelector("[data-gac-measured-business]"))return;
 const box=el("div","gac-measured-block");box.dataset.gacMeasuredBusiness="true";
 const intro=section(box,"Business benchmarks and measured AI-governance evidence",
  "Group A: published external AP benchmarks with figures, scope and source. Group B: AI-only observations—no manual counterpart. The external figures are not matched manual cases and must not be subtracted from our recorded runs.");
 metricCards(intro,[
  ["Recorded cases",fmt(data.counts.recorded_cases)],
  ["Committee routing","40%","6 / 15 scripted cases"],
  ["Reviewer gate","93.33%","14 / 15 fixture cases"],
  ["Source checks",fmt(data.counts.validation_checks)]
 ]);
 addBusinessTable(box,business,manual);
 addAiTable(box,ai);
 const details=el("details","gac-measured-literature");
 details.append(el("summary","","Research methodology and additional AP reference"));
 details.append(el("p","","The six values use supplier-invoice and accounts-payable benchmarks collected from different organisations. Review time, exceptions, PO matching and purchase-order coverage have different numerators or process boundaries than our six workflow KPIs. No manual reference is a matched company baseline, and no numeric AI savings, ROI, or uplift has been inferred."));
 const ref=manual.other_reference;
 const p=el("p","",ref.display+" · "+ref.year+" · "+ref.limitation);details.append(p);
 const link=el("a","gac-measured-link",ref.source);link.href=ref.url;link.rel="noopener noreferrer";link.target="_blank";details.append(link);
 box.append(details);
 const existing=main.querySelector(".gac-kpi-business-taxonomy");
 if(existing)existing.insertAdjacentElement("afterend",box);else main.prepend(box);
}
function createTokens(data,main){
 if(main.querySelector("[data-gac-token-measures]"))return;
 const box=el("div","gac-measured-block");box.dataset.gacTokenMeasures="true";
 const top=section(box,"Token pool and model consumption · recorded evidence","This public GitHub Pages build contains scripted examples, not actual provider inference records. Zero fixture API calls is a known scenario property; real provider usage is unavailable here.");
 metricCards(top,[
 ["Recorded committee routes","6 / 15","Scripted roles, not provider calls"],
 ["Provider model calls","0","Only in these scripted fixtures"],
 ["Provider input tokens","0","No provider model invoked by these fixtures"],
 ["Provider output tokens","0","No provider model invoked by these fixtures"],
 ["Real provider billing","Not available","No reconciled invoices or production usage records"],
 ["Live token pool","Protected","TPM, RPM, dispatches and key counts require authentication"]
 ]);
 const sec=section(box,"Consumption by model · source-aware","No provider model was invoked in these recorded synthetic cases. Per-model input/output tokens and cost estimates are available only when a real model-usage event exists in the protected server.");
 const wrapper=el("div","gac-table-scroll");
 const table=el("table","gac-measured-table");
 const tr=el("tr");for(const t of ["Model","Calls","Input tokens","Output tokens","Estimated EUR cost","Evidence"]){tr.append(el("th","",t));}
 const head=el("thead");head.append(tr);table.append(head);
 const tbody=el("tbody");const row=el("tr");const cell=el("td");cell.colSpan=6;cell.textContent="No provider-model usage events in synthetic fixtures. No model-by-model cost figures are invented.";row.append(cell);tbody.append(row);table.append(tbody);wrapper.append(table);sec.append(wrapper);
 const detail=el("details","gac-measured-literature");
 detail.append(el("summary","","How the protected token pool is measured"));
 detail.append(el("p","","For authenticated live runs: attribute each successful model call to its actual provider/model, sum provider-reported input/output tokens, show calls per model and rate-card estimated costs, and compare TPM/RPM occupancy to configured per-provider limits. The current native backend story is process-scoped and resets on restart. Configured free-tier prices are not verified billing."));
 const link=el("a","gac-measured-link","Open protected Token Economics");link.href=APP;detail.append(link);box.append(detail);
 const heading=main.querySelector("h1");
 if(heading){const lead=main.querySelector(".page-lead");(lead||heading).insertAdjacentElement("afterend",box);}else main.prepend(box);
}
let attempts=0,stopped=false;
async function mount(){
 if(stopped)return;
 const main=document.querySelector("main#main-content");
 if(!main||!main.querySelector("h1"))return;
 try{
  const resp=await fetch(EVIDENCE,{cache:"no-cache",credentials:"omit"});
  if(!resp.ok)return;
  const data=await resp.json();
  if(data.scope!=="synthetic_fixture_only"||data.source_git_blob_sha!=="0a60ad3044c06d37e21fbef1a3bd6218044643c6")return;
  if(PATH==="/cases")createCases(data,main);
  if(PATH==="/business-impact"){
   const literatureResponse=await fetch("/data/manual-ap-literature-benchmarks.json",{cache:"no-cache",credentials:"omit"});
   if(!literatureResponse.ok)return;
   const literature=await literatureResponse.json();
   if(literature.schema!=="gac.manual_ap_literature.v1" ||
      literature.scope!=="published_external_process_benchmarks_not_company_manual_cohort" ||
      literature.entries?.length!==business.length ||
      !business.every(([name],i)=>literature.entries[i]?.name===name) ||
      literature.entries.some(e=>e.comparable!==false))return;
   createBusiness(data,main,literature);
  }
  if(PATH==="/token-economics")createTokens(data,main);
  stopped=true;
 }catch(_e){/* No substitute numbers on fetch failure. */}
}
function wait(){if(++attempts>45)return;void mount();if(!stopped)setTimeout(wait,350);}
if(["/cases","/business-impact","/token-economics"].includes(PATH)){
 if(document.readyState==="complete")setTimeout(wait,850);
 else window.addEventListener("load",()=>setTimeout(wait,850),{once:true});
}
})();
