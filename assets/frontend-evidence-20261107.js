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
// The measured Group B rows are built from archived synthetic case evidence,
// not inferred from generic validation-event volume or provider usage.
const metricPct=(n,d)=>d?(Number((100*n/d).toFixed(1))+"%"):"Not measured";
function governanceMetrics(g){
 const m=g.metrics;
 return [
  ["Discrepancy flagging",m.discrepancy_flagged_cases+" cases",m.discrepancy_flagged_cases+" / "+m.discrepancy_denominator+" valid cases · rule or contract failures detected; independent accuracy not scored"],
  ["Contract cross-check coverage",metricPct(m.contract_crosscheck_cases,m.contract_crosscheck_denominator),m.contract_crosscheck_cases+" / "+m.contract_crosscheck_denominator+" valid cases · one invoice failed earlier checks"],
  ["History-aware resubmissions",metricPct(m.updated_cases_with_recalled_prior_version,m.updated_cases),m.updated_cases_with_recalled_prior_version+" / "+m.updated_cases+" revised cases · prior submission history attached"],
  ["Selective committee escalation",metricPct(m.committee_routed_cases,m.recorded_cases),m.committee_routed_cases+" exceptions escalated · "+m.committee_skipped_cases+" / "+m.recorded_cases+" bypassed scripted committee; escalation correctness unscored"],
  ["Claim grounding and containment",m.cove_claim_decisions+" checks",m.cove_supported_or_restated+" claims supported/restated · "+m.cove_unsupported_blocked+" unsupported claim removed · scripted Opponent findings"],
  ["Human review safeguard",metricPct(m.reviewer_gated_cases,m.reviewer_gate_denominator),m.reviewer_gated_cases+" / "+m.reviewer_gate_denominator+" valid cases reached reviewer gate · not a count of approvals"],
  ["Case trace availability",metricPct(m.trace_available_cases,m.recorded_cases),m.trace_available_cases+" / "+m.recorded_cases+" cases have event histories · not a complete-trace audit score"]
 ];
}
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
function addBusinessTable(parent,items,manual,g){
 const sec=section(parent,"Group A · Business performance");
 const wrapper=el("div","gac-table-scroll");const table=el("table","gac-measured-table");
 const head=el("thead");const tr=el("tr");
 for(const v of ["Business KPI","Representative manual AP reference","Our workflow · recorded"]){tr.append(el("th","",v));}
 head.append(tr);table.append(head);const body=el("tbody");
 for(let i=0;i<items.length;i++){
  const [name]=items[i];
  const lit=manual.entries[i];
  const line=el("tr");line.append(el("th","",name));
  const benchmark=el("td");benchmark.append(el("strong","gac-literature-value",lit.display));
  const link=el("a","gac-measured-link",lit.source+" · "+lit.year);
  link.href=lit.url;link.target="_blank";link.rel="noopener noreferrer";benchmark.append(link);
  line.append(benchmark);
  const governed=el("td");
  const m=g.metrics;
  // Related observations can support a useful process proxy, but they must
  // not be relabelled as full business-outcome measures.
  const values={
   "First-submission validation pass rate":[(m.valid_intake_cases-m.discrepancy_flagged_cases)+"/"+m.valid_intake_cases+" clean checks",
     "First-attempt rule/contract check proxy, not complete first-pass approval"],
   "Cases needing resubmission":[m.updated_cases+"/"+m.valid_intake_cases+" revised ("+metricPct(m.updated_cases,m.valid_intake_cases)+")",
     "Actual repeated submissions; not necessarily avoidable rework"]
  };
  const related=values[name];
  governed.append(el("strong","",related?related[0]:"Not measured"));
  governed.append(el("small","gac-cell-sub",related?related[1]:"Outcome not captured in these scripted records"));
  line.append(governed);body.append(line);
 }
 table.append(body);wrapper.append(table);sec.append(wrapper);
}
function addAiTable(parent,items){
 const sec=section(parent,"Group B · AI-assistance and governance evidence");
 const wrapper=el("div","gac-table-scroll");const table=el("table","gac-measured-table");
 const head=el("thead");const tr=el("tr");
 for(const v of ["Governance capability","Recorded result","What the result establishes"]){tr.append(el("th","",v));}
 head.append(tr);table.append(head);const body=el("tbody");
 for(const [name,value,evidence] of items){
  const line=el("tr");line.append(el("th","",name));
  const result=el("td");result.append(el("strong","",value));line.append(result);
  line.append(el("td","",evidence));body.append(line);
 }
 table.append(body);wrapper.append(table);sec.append(wrapper);
}
function createBusiness(data,main,manual,g){
 if(main.querySelector("[data-gac-measured-business]"))return;
 const box=el("div","gac-measured-block");box.dataset.gacMeasuredBusiness="true";
 const note=el("div","gac-kpi-representative-note");
 note.append(el("strong","","Illustrating potential time savings and ROI for similar invoice-processing workflows"));
 note.append(el("p","","Industry benchmarks help illustrate where AI-assisted invoice review may create potential efficiency and ROI opportunities. Our 15 recorded synthetic cases demonstrate checking, escalation, history recall and human oversight; the figures are representative, not measured productivity savings or a financial ROI forecast."));
 box.append(note);
 const m=g.metrics;
 const intro=section(box,"What our workflow demonstrated",
  "Recorded synthetic supplier cases · outcomes from checks, case history, CoVe and routing—not provider-model accuracy or measured labour savings.");
 metricCards(intro,[
  ["Discrepancies flagged",m.discrepancy_flagged_cases+"/"+m.discrepancy_denominator+" cases","Rules or approved-contract comparison"],
  ["Contract comparisons",m.contract_crosscheck_cases+"/"+m.contract_crosscheck_denominator+" cases","Approved reference evaluated"],
  ["Prior versions recalled",m.updated_cases_with_recalled_prior_version+"/"+m.updated_cases+" revisions","Historical context attached"],
  ["Committee bypass",metricPct(m.committee_skipped_cases,m.recorded_cases),m.committee_skipped_cases+"/"+m.recorded_cases+" cases used no scripted committee"],
  ["CoVe claim checks",m.cove_claim_decisions+" checks",m.cove_unsupported_blocked+" unsupported claim removed"],
  ["Human review gate",m.reviewer_gated_cases+"/"+m.reviewer_gate_denominator+" cases","All valid-intake cases retained oversight"]
 ]);
 addBusinessTable(box,business,manual,g);
 addAiTable(box,governanceMetrics(g));
 const details=el("details","gac-measured-literature");
 details.append(el("summary","","Methods, limitations and research sources"));
 details.append(el("p","","The displayed capability results were recomputed from all 15 scripted supplier case records, including recorded invoice and contract check outcomes, history.attached events, CoVe claim decisions and reviewer routing. They demonstrate system behaviours, not independently validated detection accuracy, correctly targeted escalations, causal efficiency gains or provider model performance. The manual figures describe broader accounts-payable populations, including proxies for first-pass matching, exceptions and purchase-order coverage. A future matched study could test potential ROI, but these fixtures cannot quantify it."));
 for(const ref of manual.entries){
  const p=el("p","",ref.name+": "+ref.basis+" ");
  const link=el("a","gac-measured-link",ref.source+" ("+ref.year+")");
  link.href=ref.url;link.rel="noopener noreferrer";link.target="_blank";p.append(link);details.append(p);
 }
 const extra=manual.other_reference;
 const p=el("p","",extra.display+" · "+extra.year+" · "+extra.limitation+" ");
 const link=el("a","gac-measured-link",extra.source);link.href=extra.url;link.rel="noopener noreferrer";link.target="_blank";p.append(link);details.append(p);
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
   const governanceResponse=await fetch("/data/synthetic-governance-metrics.json",{cache:"no-cache",credentials:"omit"});
   if(!governanceResponse.ok)return;
   const governance=await governanceResponse.json();
   if(governance.schema!=="gac.derived_synthetic_governance_metrics.v1" ||
      governance.scope!=="recorded_scripted_supplier_fixtures_only" ||
      governance.cases_blob_sha!==data.source_git_blob_sha ||
      governance.metrics?.recorded_cases!==data.counts.recorded_cases)return;
   createBusiness(data,main,literature,governance);
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
