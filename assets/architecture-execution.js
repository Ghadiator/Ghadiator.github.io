/* Execution view for the existing modular React architecture.
 * Presentation only: every result comes from the verified scenario JSON.
 * A block with no emitted event is NOT labelled as executed. */
(function(){
 "use strict";
 const escape=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
 const NODES=[
  ["orchestrator","Main orchestrator — LangGraph"],["request","Collection request"],["reminders","Deadline reminders"],
  ["intake","Supplier intake"],["memory","Case history"],["rules","Invoice checks"],
  ["crosscheck","Contract cross-check"],["external","Approved contract"],["sanitiser","Input sanitiser"],
  ["proponent","Proponent"],["opponent","Opponent"],["firewall","Pre-Judge CoVe"],
  ["judge","Judge"],["post_cove","Post-Judge CoVe"],["token_economics","Committee orchestration — token economics"],
  ["advisory","Review package"],["remediation","Supplier correction"],["disposition","Human-in-the-loop (HITL)"],
  ["archive","Evidence archive"],["process_semantics","DAiA ProcessEvent pool (architecture reference)"]
 ];
 const labels=Object.fromEntries(NODES);

 // Mirrors the actual numbered nodes and cross-cutting rails in the React graph.
 const MODULE_NUMBERS={
  request:"01",reminders:"02",intake:"03",memory:"04",rules:"05",
  crosscheck:"06",sanitiser:"07",proponent:"08",opponent:"09",firewall:"10",
  judge:"11",post_cove:"11b",advisory:"12",disposition:"13",archive:"14",
  external:"A",remediation:"C",orchestrator:"D",process_semantics:"S",token_economics:"T"
 };
 const MODULE_GROUPS=[
  {key:"orchestration",code:"D",title:"Workflow orchestration",note:"Workflow-wide LangGraph source · different from the supplier fixture",rail:true,ids:["orchestrator"]},
  {key:"collection",code:"01",title:"Request & receive",note:"Collection request → reminders → intake → case history",ids:["request","reminders","intake","memory"]},
  {key:"checks",code:"02",title:"Deterministic verification",note:"Invoice checks + contract comparisons · approved contract as reference input",ids:["rules","crosscheck","external"]},
  {key:"review",code:"03",title:"Bounded exception review",note:"Sanitise → Proponent & Opponent → pre-Judge CoVe → Judge → post-Judge CoVe · token guard",ids:["sanitiser","proponent","opponent","firewall","judge","post_cove","token_economics"]},
  {key:"decision",code:"04",title:"Human decision & outcome",note:"Review package → human gate → corrections if needed / archive",ids:["advisory","disposition","remediation","archive"]},
  {key:"semantics",code:"S",title:"Audit evidence & ProcessEvent design",note:"Supplier state changes are recorded; the separate DAiA ProcessEvent pool is not run by this fixture",rail:true,ids:["process_semantics"]}
 ];
 const SCOPE_NOTES={
  orchestrator:"Broader LangGraph design; this supplier fixture runs a separate Python state machine.",
  process_semantics:"Supplier audit transitions and human decisions are recorded in this fixture. The separate DAiA ProcessEvent emitter is not part of this run.",
  post_cove:"The supplier fixture has no separately emitted post-Judge CoVe event.",
  token_economics:"No live model token usage in these scripted supplier scenarios.",
  external:"Approved contract is reference input; no separate event may be emitted.",
  sanitiser:"Input boundary may be applied without a dedicated fixture event.",
  remediation:"Correction is a branch: not every scenario requires it."
 };

 const normalize=n=>n==="gate"?"disposition":n;
 const status=e=>/\bFAIL(?:ED)?\b/i.test(e.label)?"fail":/\bPASS(?:ED)?\b/i.test(e.label)?"pass":"record";
 const seenAt=(all,cursor)=>cursor<0?[]:all.slice(0,Math.min(cursor+1,all.length));
 const runningNode=(all,cursor)=>cursor<0?null:normalize(all[Math.min(cursor,all.length-1)]?.node);
 const counts=visible=>{
  const tally=new Map();
  for(const e of visible){const id=normalize(e.node);tally.set(id,(tally.get(id)||0)+1);}
  return tally;
 };
 function renderRail(all,cursor){
  if(!all.length)return '<div class="ax-rail-empty">The verified event trace is loading.</div>';
  const current=cursor>=0?Math.min(cursor,all.length-1):-1;
  return `<div class="ax-rail-header"><div><span class="ax-overline">EMITTED EVENT STREAM</span><h2>Process events</h2></div><strong class="ax-event-progress">${Math.max(0,current+1)} / ${all.length}</strong></div>
    <p class="ax-rail-intro">Chronological recorded events. Future records are dimmed until replay reaches them; select an event to inspect its point in the original trace.</p>
    <div class="ax-rail-list" role="list" aria-label="Recorded workflow events">
    ${all.map((e,i)=>`<button type="button" role="listitem" data-replay-seek="${i}" class="ax-rail-event ${i===current?'is-current':i<current?'is-done':'is-next'} ${status(e)==='fail'?'is-failure':''}" aria-current="${i===current?'step':'false'}">
      <span class="ax-seq">${String(e.seq??i+1).padStart(2,"0")}</span>
      <span class="ax-rail-event-text"><strong>${escape(e.label)}</strong><small>${escape(labels[normalize(e.node)]||e.node||e.stage)} · ${escape(e.actor)}</small></span>
      <span class="ax-rail-mark">${i===current?'●':i<current?'✓':'·'}</span>
    </button>`).join("")}</div>
    <p class="ax-rail-foot">Ordinal fixture records, not live telemetry or real-world timestamps.</p>`;
 }
 const badge=(label,kind)=>`<span class="ax-pill ax-pill-${kind}">${escape(label)}</span>`;
 function renderCheckPanel(kind,title,visible,renderCard,id){
  const checks=visible.filter(e=>e.kind===kind);
  const failures=checks.filter(e=>status(e)==="fail").length;
  const passes=checks.filter(e=>status(e)==="pass").length;
  const rows=checks.map(e=>`<li class="ax-check-row ax-check-${status(e)}">
    <span class="ax-check-result">${status(e)==='fail'?'✕':status(e)==='pass'?'✓':'•'}</span>
    <span class="ax-check-desc"><strong>${escape(e.label)}</strong>${e.detail?`<small>${escape(e.detail)}</small>`:''}<small>Event ${escape(e.seq)} · ${escape(e.refs?.[0]||'Recorded fixture')}</small></span>
    ${badge(status(e)==='fail'?'Failed':status(e)==='pass'?'Passed':'Recorded',status(e))}
  </li>`).join("");
  return `<article class="ax-module-result ax-check-panel" data-module-results="${id}" aria-label="${escape(title)}">
   ${renderCard(id)}<div class="ax-check-totals" aria-label="Replayed check results">${badge(passes+' passed','pass')}${failures?badge(failures+' failed','fail'):''}</div>
   ${checks.length?`<ol class="ax-check-list">${rows}</ol>`:'<p class="ax-panel-empty">No checks have been replayed for this module.</p>'}</article>`;
 }
 const roleKinds=[
  ["proponent","committee.proponent.argument","Supports the submission"],
  ["opponent","committee.opponent.argument","Challenges submitted evidence"],
  ["firewall","verification.result","Verifies claims against evidence"],
  ["judge","committee.judge.argument","Packages verified findings"]
 ];
 function renderCommittee(visible,renderCard){
  const forfeits=visible.filter(e=>["committee.adapter_failed","committee.budget_exceeded"].includes(e.kind));
  const cards=roleKinds.map(([id,kind,subtitle])=>{
   const lines=visible.filter(e=>e.kind===kind);
   return `<article class="ax-module-result ax-role-card ${lines.length?'ax-role-emitted':'ax-role-pending'}" data-module-results="${id}">${renderCard(id)}<p class="ax-role-purpose">${subtitle}</p>
    ${lines.length?lines.map(e=>`<div class="ax-role-message"><b>${escape(e.label)}</b><p>${escape(e.detail||'No narrative included in the recorded event.')}</p><small>Event ${escape(e.seq)} · ${escape(e.refs?.[0]||'Fixture trace')}</small></div>`).join(""):'<p class="ax-panel-empty">No recorded output from this role at the current step.</p>'}</article>`;
  }).join("");
  return `<div class="ax-role-grid">${cards}</div>
    <div class="ax-modules-grid ax-review-support" aria-label="Supporting review controls">${['sanitiser','post_cove','token_economics'].map(renderCard).join('')}</div>
    ${forfeits.map(e=>`<p class="ax-forfeit">${escape(e.label)} — ${escape(e.detail||'Proposals forfeited by the runner.')}</p>`).join("")}
    <p class="ax-dash-foot">Only emitted claims and verification results are shown. The broader source architecture contains Post-Judge CoVe, but the supplier fixture has no separate Post-Judge CoVe event.</p>`;
 }
 function renderModules(visible,current,all,cursor){
  // Full-run coverage and playback-to-date are independent measurements.
  const tally=counts(visible),whole=counts(all);
  const auditTotal=all.filter(e=>e.kind==="audit.row_appended").length;
  const auditSeen=visible.filter(e=>e.kind==="audit.row_appended").length;
  const humanTotal=all.filter(e=>e.kind==="hitl.opened"||e.kind==="hitl.resumed").length;
  const humanSeen=visible.filter(e=>e.kind==="hitl.opened"||e.kind==="hitl.resumed").length;
  const failed=new Set(visible.filter(e=>status(e)==="fail").map(e=>normalize(e.node)));
  const totalObserved=NODES.filter(item=>whole.has(item[0])).length;
  const visited=NODES.filter(item=>tally.has(item[0])).length;
  const renderCard=id=>{
   const name=labels[id]||id;
   const n=tally.get(id)||0,full=whole.get(id)||0;
   // The generic ProcessEvent pool is a reference architecture component,
   // not a stage in the supplier fixture. Show the real supplier audit trail
   // without assigning any audit event to this separate module.
   const reference=id==="process_semantics";
   const kind=reference?"reference":id===current&&n?"active":failed.has(id)?"fail":n?"done":full?"queued":"unobserved";
   const stateText=reference?"Separate pool not executed":n?"Reached in replay":full?"Later in replay":"No direct event";
   const countText=reference?auditSeen+" / "+auditTotal+" audit transitions · "+humanSeen+" / "+humanTotal+" human-gate events":n?n+" / "+full+" events":full?full+" in full run":"None in this run";
   const note=reference?SCOPE_NOTES[id]:n?n+" recorded event(s) reached at this playback position"
    :full?"Recorded in the selected case, but not reached by playback"
    :(SCOPE_NOTES[id]||"No event is directly attributed to this block in the selected fixture.");
   return '<button type="button" class="ax-module ax-module-'+kind+'" data-architecture-module="'+escape(id)+'" data-module-status="'+escape(id)+'" aria-label="Inspect '+escape(name)+' in the original architecture. '+escape(note)+'" title="Inspect in the original diagram">'
    +'<span class="ax-module-number">'+escape(MODULE_NUMBERS[id])+'</span>'
    +'<span class="ax-module-copy"><strong class="ax-module-name">'+escape(name)+'</strong><small class="ax-module-scope">'+escape(note)+'</small></span>'
    +'<span class="ax-module-metrics"><span class="ax-module-state"><i class="ax-module-dot" aria-hidden="true"></i>'+escape(stateText)+'</span><span class="ax-module-n">'+escape(countText)+'</span></span>'
    +'</button>';
  };
  const content=MODULE_GROUPS.map(group=>{
   const reached=group.ids.filter(id=>tally.has(id)).length;
   const recorded=group.ids.filter(id=>whole.has(id)).length;
   const groupCount=group.key==="semantics"
    ?'<span class="ax-phase-count">Supplier trace: '+auditSeen+' / '+auditTotal+' audit transitions · '+humanSeen+' / '+humanTotal+' human-gate events <span>· Separate DAiA pool not executed</span></span>'
    :'<span class="ax-phase-count">'+reached+' reached <span>· '+recorded+'/'+group.ids.length+' in full run</span></span>';
   const detailed=group.key==='checks'||group.key==='review';
   const body=group.key==='checks'
    ?'<div class="ax-validation-grid">'+renderCheckPanel('checks.rule','Invoice rule checks',visible,renderCard,'rules')+renderCheckPanel('contract.check','Contract checks',visible,renderCard,'crosscheck')+'</div>'
      +'<div class="ax-modules-grid ax-check-reference" aria-label="Verification reference input">'+renderCard('external')+'</div>'
    :group.key==='review'?renderCommittee(visible,renderCard)
    :'<div class="ax-modules-grid">'+group.ids.map(renderCard).join('')+'</div>';
   return '<section class="ax-module-group '+(group.rail?'ax-module-group-rail':'')+(detailed?' ax-integrated-group':'')+(group.key==='review'?' ax-committee':'')+'" data-architecture-stage="'+group.key+'" aria-label="'+escape(group.title)+'">'
    +'<div class="ax-module-group-head"><span class="ax-phase-number">'+escape(group.code)+'</span>'
    +'<span class="ax-phase-heading"><strong>'+escape(group.title)+'</strong><small>'+escape(group.note)+'</small></span>'
    +groupCount+(group.key==='review'?badge('Scripted roles · no live AI','record'):'')+'</div>'
    +body+'</section>';
  }).join('');
  const cursorStatus=cursor<0?"Replay not started":cursor>=all.length-1?"At the final recorded event":"Replay in progress";
  return '<section class="ax-dash-panel ax-modules" aria-labelledby="ax-modules-title">'
   +'<div class="ax-panel-head ax-modules-head"><div><span class="ax-overline">20-BLOCK MODULAR ARCHITECTURE</span><h3 id="ax-modules-title">Execution state by module</h3>'
   +'<p class="ax-module-subtitle">Organised by the diagram’s workflow stages, supporting branches and cross-cutting rails.</p></div>'
   +'<div class="ax-module-summary"><strong>'+totalObserved+'<span> / 20</span></strong><small>Blocks with an event in the full recorded case</small></div></div>'
   +'<div class="ax-modules-progress"><span class="ax-module-key"><strong>'+visited+' of 20 reached so far</strong> · '+cursorStatus+'</span>'
   +'<div class="ax-module-legend" aria-label="Replay status legend">'
   +'<span><i class="ax-legend-dot ax-legend-current"></i>Current event</span>'
   +'<span><i class="ax-legend-dot ax-legend-reached"></i>Reached</span>'
   +'<span><i class="ax-legend-dot ax-legend-queued"></i>Later in trace</span>'
   +'<span><i class="ax-legend-dot ax-legend-quiet"></i>No direct event</span></div></div>'
   +'<div class="ax-module-map">'+content+'</div>'
   +'<p class="ax-dash-foot"><strong>Reading the map:</strong> Module reach counts are based on directly attributed fixture events. The supplier audit trail includes state transitions and human-gate events, but it is not the separate DAiA ProcessEvent stream. That pool, the broader LangGraph and live token metering are architectural references, not executed supplier components. Click a block to inspect the original diagram.</p>'
   +'</section>';
 }
 function renderDashboard(all,cursor){
  const visible=seenAt(all,cursor),current=runningNode(all,cursor);
  const checks=visible.filter(e=>e.kind==='checks.rule'||e.kind==='contract.check');
  const failures=checks.filter(e=>status(e)==='fail').length;
  const amount=checks.filter(e=>status(e)==='pass').length;
  const moduleCount=NODES.filter(item=>counts(visible).has(item[0])).length;
  const resume=visible.filter(e=>e.kind==="hitl.resumed");
  const hitl=visible.filter(e=>e.kind==="hitl.opened");
  const packaged=visible.filter(e=>e.kind==='review.package');
  const receipt=visible.filter(e=>e.kind==='case.archived');
  const currentEvent=cursor>=0?all[Math.min(cursor,all.length-1)]:null;
  const progress=cursor<0?'Choose a scenario and press Run':`Event ${Math.min(cursor+1,all.length)} of ${all.length}: ${escape(currentEvent?.label||'')}`;
  return `<div class="ax-run-dashboard">
    <div class="ax-dashboard-heading"><div><span class="ax-overline">MODULE EXECUTION · CONTROLS · EVIDENCE</span><h2>Workflow execution dashboard</h2><p>${progress}</p></div><span class="ax-ref-note">Original verified trace · replay only</span></div>
    <div class="ax-stat-row">
      <div class="ax-stat"><span>Emitted events</span><strong>${visible.length}<small> / ${all.length||'—'}</small></strong></div>
      <div class="ax-stat"><span>Blocks reached in replay</span><strong>${moduleCount}<small> / 20</small></strong></div>
      <div class="ax-stat"><span>Checks passed</span><strong>${amount}</strong></div>
      <div class="ax-stat ${failures?'ax-stat-fail':''}"><span>Checks failed</span><strong>${failures}</strong></div>
      <div class="ax-stat"><span>Human gate opened</span><strong>${hitl.length}</strong></div>
    </div>
    ${renderModules(visible,current,all,cursor)}
    <section class="ax-dash-panel"><div class="ax-panel-head"><div><span class="ax-overline">REVIEWER AUTHORITY &amp; OUTPUT</span><h3>Handover and recorded decisions</h3></div></div>
      <div class="ax-decision-grid">
        <div><b>Review package</b><p>${packaged.length?escape(packaged.at(-1).detail||packaged.at(-1).label):'Not assembled at this point in the recorded run.'}</p></div>
        <div><b>Human decisions</b><p>${resume.length?resume.map(e=>escape(e.label+' — '+(e.detail||''))).join('<hr>'):hitl.length?'At reviewer gate. No resumed decision has been replayed yet.':'No reviewer decision has been replayed.'}</p></div>
        <div><b>Evidence archive</b><p>${receipt.length?escape(receipt.at(-1).label):'Not archived at the current point in the recorded run.'}</p></div>
      </div>
    </section>
  </div>`;
 }
 function decorateGraph(doc,all,cursor){
  const visible=seenAt(all,cursor),last=runningNode(all,cursor),tally=counts(visible);
  const failed=new Set(visible.filter(e=>status(e)==="fail").map(e=>normalize(e.node)));
  // React owns topology and active packets. Decorative metadata is based on
  // the events only, and survives rerenders by being reapplied on each tick.
  for(const node of doc.querySelectorAll('.deck [data-node]')){
   const id=node.dataset.node,count=tally.get(id)||0;
   node.classList.toggle('ax-node-executed',count>0);
   node.classList.toggle('ax-node-current',id===last);
   node.classList.toggle('ax-node-failure',failed.has(id));
   if(count)node.dataset.traceCount=String(count);
   else delete node.dataset.traceCount;
  }
 }
 function seek(doc,index){
  const scrub=doc?.querySelector('.deck input[aria-label="Position in the recorded run"]');
  if(!scrub||!Number.isInteger(index))return false;
  const number=Math.max(-1,Math.min(index,Number(scrub.max)));
  const setter=Object.getOwnPropertyDescriptor(doc.defaultView.HTMLInputElement.prototype,'value')?.set;
  if(!setter)return false;
  setter.call(scrub,String(number));
  scrub.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));
  scrub.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));
  return true;
 }
 // Clicking a module opens its real React graph block; it never executes a run.
 if(typeof document!=="undefined"){
  document.addEventListener("click",event=>{
   const trigger=event.target?.closest?.("[data-architecture-module]");
   if(!trigger||!document.getElementById("architecture-execution-dashboard")?.contains(trigger))return;
   const frame=document.getElementById("modularArchitectureFrame");
   let doc;
   try{doc=frame?.contentDocument;}catch{}
   const id=trigger.dataset.architectureModule;
   window.ArchitectureModuleInspector?.select(id);
   const node=Array.from(doc?.querySelectorAll(".deck [data-node]")||[]).find(el=>el.dataset.node===id);
   if(!node)return;
   node.click();
   if(frame?.scrollIntoView){
    const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    frame.scrollIntoView({block:"start",behavior:reduced?"auto":"smooth"});
   }
  });
 }
 window.ArchitectureExecution={renderRail,renderDashboard,decorateGraph,seek};
})();
