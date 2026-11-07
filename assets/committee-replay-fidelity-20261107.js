/* Recorded committee fidelity bridge for the pinned static Next.js bundle.
 * Post-hydration only: source traces are authoritative; no live calls, invented
 * arguments or silently inferred independent Proponent CoVe verdicts.
 */
(function(){
"use strict";
const PAGE=(location.pathname.endsWith("/")?location.pathname.slice(0,-1):location.pathname)||"/";
if(PAGE!=="/architecture")return;
const SOURCE="/data/committee-case-evidence.json";
const NS="http://www.w3.org/2000/svg";
let matrix=null,lastKey="",busy=false,loaded=false;
const roleSpec=[
 {id:"proponent",label:"Proponent",input:"Sanitised submission and approved contract context",kinds:["committee.proponent.argument"]},
 {id:"opponent",label:"Opponent",input:"Sanitised submission passed independently to proposal adapter",kinds:["committee.opponent.argument"]},
 {id:"firewall",label:"Pre-Judge CoVe",input:"Structured Opponent proposals, if admitted. Proponent argument converges at this evidence boundary but is NOT separately claim-verified in these historic captures.",kinds:["verification.result","committee.adapter_failed","committee.budget_exceeded"]},
 {id:"judge",label:"Judge",input:"Proponent acceptance argument plus evidence-qualified Opponent findings (or no admitted findings after a failure)",kinds:["committee.judge.argument"]}
];
function node(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=text;return x;}
function current(){const sel=document.querySelector('select[aria-label="Recorded scenario"]');if(!sel||!matrix)return null;return matrix.cases.find(c=>c.slug===sel.value)||null;}
function seq(){const r=document.querySelector('input.deck-scrub[type="range"]');return r?Number(r.value)+1:0;}
function state(c,k,step){
 const events=c.outputs.filter(e=>k.includes(e.kind));
 const found=events.filter(e=>e.seq<=step);
 const any=events.length>0;
 return {events,found,last:found.at(-1)||null,upcoming:events.find(e=>e.seq>step)||null,
  status:found.length?"recorded":any?"later":"not-invoked"};
}
function tableCell(tr,value){tr.append(node("td","",value));}
function recordModule(box,c,step){
 let parent=box.querySelector("[data-gac-module-evidence]");
 if(!parent){
  parent=node("section","gac-committee-matrix");
  parent.dataset.gacModuleEvidence="true";
  const h=node("h3","","Case-specific input/output evidence · current replay position");
  const sub=node("p","gac-committee-note","These are original captured event labels and details. Module inputs are described from the fixture code; no missing output is invented.");
  const table=node("table","gac-committee-table");
  const header=node("thead");
  const hr=node("tr");
  for(const x of ["Module","Observed status","Input","Recorded output"]){hr.append(node("th","",x));}
  header.append(hr);table.append(header);
  table.append(node("tbody"));
  const scroll=node("div","gac-committee-scroll");scroll.append(table);
  parent.append(h,sub,scroll);
  const intro=box.firstElementChild;intro?intro.insertAdjacentElement("afterend",parent):box.prepend(parent);
 }
 const tbody=parent.querySelector("tbody");
 tbody.replaceChildren();
 for(const spec of roleSpec){
  const s=state(c,spec.kinds,step);
  const tr=node("tr");
  const th=node("th","",spec.label);th.scope="row";tr.append(th);
  const status=node("td");
  const statusEl=node("span","gac-state-chip",s.status==="recorded"?"Recorded":s.status==="later"?"Later in this case":"Not invoked");
  statusEl.dataset.state=s.status;status.append(statusEl);tr.append(status);
  tableCell(tr,spec.input);
  const out=node("td");
  if(s.last){
   out.append(node("strong","",s.last.label));
   out.append(node("small","gac-committee-detail",s.last.detail||"No detail field was recorded."));
   out.append(node("small","gac-committee-seq","Event "+s.last.seq+" · "+s.last.kind));
  }else if(s.upcoming){
   out.append(node("span","gac-committee-wait","Not yet reached · event "+s.upcoming.seq));
  }else{
   const failure=c.failure&&spec.id==="opponent";
   out.append(node("span","gac-committee-absent",failure?"No Opponent proposal output; adapter or budget forfeited proposals.":"No event for this module in this case."));
  }
  tr.append(out);tbody.append(tr);
 }
 const note=parent.querySelector("[data-gac-limitation]");
 if(note)note.remove();
 const p=node("p","gac-committee-note",c.limitations);
 p.dataset.gacLimitation="true";parent.append(p);
}
function syncGraph(c,step){
 const old=document.querySelector('path[data-route="proponent→judge"]');
 if(old){
  const parent=old.closest("g");
  if(parent)parent.style.setProperty("display","none","important");
 }
 const chip=document.querySelector('button[data-edge="proponent→judge"]');
 if(chip)chip.style.setProperty("display","none","important");
 // The original route Proponent→Judge bypasses CoVe. Replace it in this
 // static build; the canonical source uses the same geometry.
 const svg=document.querySelector('path[data-route="opponent→firewall"]')?.closest("svg");
 if(svg&&!svg.querySelector('path[data-gac-proponent-cove]')){
  const lines=svg.querySelector('path[data-route="opponent→firewall"]');
  const wrapper=lines?.parentElement?.parentElement;
  if(wrapper){
   const g=document.createElementNS(NS,"g");
   g.setAttribute("data-gac-proponent-cove-group","true");
   const path=document.createElementNS(NS,"path");
   path.setAttribute("data-gac-proponent-cove","true");
   path.setAttribute("data-route","proponent→firewall");
   path.setAttribute("data-from","proponent");
   path.setAttribute("data-to","firewall");
   path.setAttribute("d","M550,77 L558,77 Q561,77 561,86 L561,98 Q561,102 566,102");
   path.setAttribute("fill","none");
   path.setAttribute("stroke-width","2");
   path.setAttribute("stroke-linecap","round");
   path.setAttribute("stroke-linejoin","round");
   path.setAttribute("marker-end","url(#deck-arw-idle)");
   path.style.pointerEvents="none";
   const title=document.createElementNS(NS,"title");
   title.textContent="Proponent argument enters Pre-Judge evidence boundary; no independent Proponent claim-verification event in historical fixture";
   path.append(title);g.append(path);wrapper.append(g);
  }
 }
 const newEdge=document.querySelector('path[data-gac-proponent-cove]');
 if(newEdge){
  const s=state(c,["committee.proponent.argument"],step);
  newEdge.setAttribute("stroke",s.status==="recorded"?"var(--deck-model)":"var(--deck-line-2)");
  newEdge.setAttribute("stroke-width",s.status==="recorded"?"2.4":"1.2");
  newEdge.setAttribute("opacity",s.status==="not-invoked"?"0.35":s.status==="later"?"0.65":"1");
  newEdge.setAttribute("marker-end",s.status==="recorded"?"url(#deck-arw-model)":"url(#deck-arw-idle)");
 }
 for(const spec of roleSpec){
  const el=document.querySelector('[data-node="'+spec.id+'"]');
  if(!el)continue;
  const s=state(c,spec.kinds,step);
  el.setAttribute("data-gac-evidence-state",s.status);
  const original="Recorded "+spec.label+" in current reference case";
  el.setAttribute("title",s.status==="not-invoked"?"No "+spec.label+" event in this case":s.status==="later"?"Later recorded "+spec.label+" event":original);
 }
}
function render(){
 if(busy||!matrix)return;
 const c=current();if(!c)return;
 const step=seq();const key=c.slug+":"+step;
 if(key===lastKey&&document.querySelector("[data-gac-module-evidence]")&&document.querySelector('path[data-gac-proponent-cove]'))return;
 busy=true;
 try{
  const panel=document.querySelector('section[aria-label="Execution state by module"]');
  if(panel){
   const roleLabel={both_arguments:"Proponent + Opponent",proponent_only:"Proponent only",opponent_only:"Opponent only",no_agent_argument:"No committee arguments"}[c.classification];
   let header=panel.querySelector("[data-gac-case-classification]");
   if(!header){header=node("div","gac-committee-summary");header.dataset.gacCaseClassification="true";panel.prepend(header);}
   header.textContent=c.title+" · "+roleLabel+" · "+(c.failure?"proposal admission failed":c.pre_judge_cove_recorded?"structured Opponent claims checked":"no claim-verification record")+" · event "+step+"/"+c.event_count;
   recordModule(panel,c,step);
  }
  syncGraph(c,step);
  lastKey=key;
 }finally{busy=false;}
}
function start(){
 if(loaded)return;
 loaded=true;
 fetch(SOURCE,{cache:"no-cache",credentials:"omit"}).then(r=>r.ok?r.json():null).then(d=>{
  if(!d||d.schema!=="gac.committee_case_evidence.v1"||d.scope!=="recorded_supplier_fixtures_only")return;
  matrix=d;
  const root=document.querySelector("main#main-content");
  if(root){
   let banner=root.querySelector("[data-gac-committee-audit]");
   if(!banner){
    banner=node("aside","gac-committee-banner");
    banner.dataset.gacCommitteeAudit="true";
    banner.append(node("strong","","Committee routes are evidence-dependent"));
    banner.append(node("p","","4/15 cases record both arguments with structured Opponent CoVe; 2/15 record Proponent alone after proposal admission failed; 9/15 never entered the committee. The historic supplier runner does not independently verify the Proponent narrative."));
    const anchor=root.querySelector("select[aria-label='Recorded scenario']");
    const toolbar=anchor?.closest(".deck");
    if(toolbar)toolbar.insertAdjacentElement("beforebegin",banner);else root.prepend(banner);
   }
  }
  document.addEventListener("input",e=>{
   if(e.target?.matches?.('select[aria-label="Recorded scenario"], input.deck-scrub')){lastKey="";queueMicrotask(render);}
  },true);
  document.addEventListener("change",e=>{
   if(e.target?.matches?.('select[aria-label="Recorded scenario"], input.deck-scrub')){lastKey="";queueMicrotask(render);}
  },true);
  render();
  // React re-renders the canvas while the cursor advances; a short reconciliation
  // poll keeps the compatibility edge and module evidence aligned without
  // replacing React-owned components or touching their internal state.
  setInterval(render,300);
 }).catch(()=>{});
}
if(document.readyState==="complete")setTimeout(start,950);
else window.addEventListener("load",()=>setTimeout(start,950),{once:true});
})();
