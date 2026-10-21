/* Execution view for the existing modular React architecture.
 * Presentation only: every result comes from the verified scenario JSON.
 * Source ownership and supporting control evidence are distinct. */
(function(){
 "use strict";
 const escape=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
 const NODES=[
  ["orchestrator","Workflow orchestrator"],["request","Collection request"],["reminders","Deadline reminders"],
  ["intake","Supplier intake"],["memory","Case history"],["rules","Invoice checks"],
  ["crosscheck","Contract cross-check"],["external","Approved contract"],["sanitiser","Input sanitiser"],
  ["proponent","Proponent"],["opponent","Opponent"],["firewall","Pre-Judge CoVe"],
  ["judge","Judge"],["post_cove","Post-Judge CoVe"],["token_economics","Committee orchestration · proposal bounds"],
  ["advisory","Review package"],["remediation","Supplier correction"],["disposition","Human-in-the-loop (HITL)"],
  ["archive","Evidence archive"],["process_semantics","Workflow event record"]
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
  {key:"orchestration",code:"D",title:"Workflow orchestration",note:"SupplierWorkflow coordinates every recorded case · LangGraph is the broader design implementation",rail:true,ids:["orchestrator"]},
  {key:"collection",code:"01",title:"Request & receive",note:"Collection request → reminders → intake → case history",ids:["request","reminders","intake","memory"]},
  {key:"checks",code:"02",title:"Deterministic verification",note:"Invoice checks + contract comparisons · approved contract as reference input",ids:["rules","crosscheck","external"]},
  {key:"review",code:"03",title:"Bounded exception review",note:"Input boundary → bounded proposals → claim verification → Judge · post-Judge CoVe belongs to the broader design",ids:["sanitiser","proponent","opponent","firewall","judge","post_cove","token_economics"]},
  {key:"decision",code:"04",title:"Human decision & outcome",note:"Review package → human gate → corrections if needed / archive",ids:["advisory","disposition","remediation","archive"]},
  {key:"semantics",code:"S",title:"Workflow events & state transitions",note:"SupplierWorkflow.events is the recorded event log · audit.row_appended records allowed state changes",rail:true,ids:["process_semantics"]}
 ];
 const model=window.ArchitectureRunModel;
 const normalize=model.normalize;
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
  return `<div class="ax-rail-header"><div><span class="ax-overline">SUPPLIER WORKFLOW · RECORDED TRACE</span><h2>Workflow event log</h2></div><strong class="ax-event-progress">${Math.max(0,current+1)} / ${all.length}</strong></div>
    <p class="ax-rail-intro">Each row is one Event appended by SupplierWorkflow.emit(): a state change, check result, review claim or human action. One event is not a whole module. Select a row to seek to that recorded step.</p>
    <details class="ax-event-guide"><summary>What the event fields mean</summary><dl><dt>Type / kind</dt><dd>The recorded action, such as checks.rule or hitl.opened.</dd><dt>Recorded owner</dt><dd>The source node assigned to the event. It can also evidence a supporting control in another block.</dd><dt>Producer</dt><dd>The SupplierWorkflow method that emits the record.</dd><dt>Position</dt><dd>seq orders the records; ts_rel is an ordinal index, not elapsed seconds.</dd></dl><p>The source uses immutable supplier Event records. The broader generic ProcessEvent pool is a separate implementation.</p></details>
    <div class="ax-rail-list" role="list" aria-label="Recorded workflow events">
    ${all.map((e,i)=>`<button type="button" role="listitem" data-replay-seek="${i}" class="ax-rail-event ${i===current?'is-current':i<current?'is-done':'is-next'} ${status(e)==='fail'?'is-failure':''}" aria-current="${i===current?'step':'false'}">
      <span class="ax-seq">${String(e.seq??i+1).padStart(2,"0")}</span>
      <span class="ax-rail-event-text"><strong>${escape(e.label)}</strong><small class="ax-event-kind">${escape(model.eventInfo(e).category)} · <code>${escape(e.kind)}</code></small><small>Recorded owner: ${escape(labels[normalize(e.node)]||e.node||e.stage)} · ${escape(model.eventInfo(e).actor)}</small><small>Producer: ${escape(model.eventInfo(e).producer)}</small></span>
      <span class="ax-rail-mark">${i===current?'●':i<current?'✓':'·'}</span>
    </button>`).join("")}</div>
    <p class="ax-rail-foot">${all.length} original records in this case. Dimmed rows are later in replay. These are historical synthetic records, not live telemetry.</p>`;
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
   ${renderCard(id)}<div class="ax-check-totals" aria-label="All replayed check results, including previous versions">${badge(passes+' pass records','pass')}${failures?badge(failures+' fail records','fail'):''}</div>
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
  const states=Object.fromEntries(NODES.map(([id])=>[id,model.moduleState(id,all,cursor)]));
  const auditTotal=all.filter(e=>e.kind==="audit.row_appended").length;
  const auditSeen=visible.filter(e=>e.kind==="audit.row_appended").length;
  const humanTotal=all.filter(e=>e.kind==="hitl.opened"||e.kind==="hitl.resumed").length;
  const humanSeen=visible.filter(e=>e.kind==="hitl.opened"||e.kind==="hitl.resumed").length;
  const totalObserved=NODES.filter(([id])=>states[id].evidence.length).length;
  const visited=NODES.filter(([id])=>states[id].seen.length).length;
  const renderCard=id=>{
   const name=labels[id]||id;
   const {kind,label:stateText,countText,note}=states[id];
   return '<button type="button" class="ax-module ax-module-'+kind+'" data-architecture-module="'+escape(id)+'" data-module-status="'+escape(id)+'" aria-label="Inspect '+escape(name)+' in the original architecture. '+escape(note)+'" title="Inspect in the original diagram">'
    +'<span class="ax-module-number">'+escape(MODULE_NUMBERS[id])+'</span>'
    +'<span class="ax-module-copy"><strong class="ax-module-name">'+escape(name)+'</strong><small class="ax-module-scope">'+escape(note)+'</small></span>'
    +'<span class="ax-module-metrics"><span class="ax-module-state"><i class="ax-module-dot" aria-hidden="true"></i>'+escape(stateText)+'</span><span class="ax-module-n">'+escape(countText)+'</span></span>'
    +'</button>';
  };
  const content=MODULE_GROUPS.map(group=>{
   const reached=group.ids.filter(id=>states[id].seen.length).length;
   const recorded=group.ids.filter(id=>states[id].evidence.length).length;
   const groupCount=group.key==="semantics"
    ?'<span class="ax-phase-count">Supplier trace: '+auditSeen+' / '+auditTotal+' state transitions · '+humanSeen+' / '+humanTotal+' human-gate records</span>'
    :'<span class="ax-phase-count">'+reached+' evidenced so far <span>· '+recorded+'/'+group.ids.length+' evidenced in this case</span></span>';
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
   +'<div class="ax-module-summary"><strong>'+totalObserved+'<span> / 20</span></strong><small>Modules supported by evidence in this case</small></div></div>'
   +'<div class="ax-modules-progress"><span class="ax-module-key"><strong>'+visited+' of 20 evidenced so far</strong> · '+cursorStatus+'</span>'
   +'<div class="ax-module-legend" aria-label="Replay status legend">'
   +'<span><i class="ax-legend-dot ax-legend-current"></i>Current event</span>'
   +'<span><i class="ax-legend-dot ax-legend-reached"></i>Evidenced</span>'
   +'<span><i class="ax-legend-dot ax-legend-queued"></i>Later in trace</span>'
   +'<span><i class="ax-legend-dot ax-legend-quiet"></i>Unused / broader design</span></div></div>'
   +'<div class="ax-module-map">'+content+'</div>'
   +'<p class="ax-dash-foot"><strong>Reading the map:</strong> Workflow orchestration spans every case. A record can support several controls: security.input belongs to Case history and evidences the input boundary; contract.snapshot_loaded evidences the reference input. Module evidence counts overlap and do not add new events. LangGraph, live token metering and post-Judge CoVe remain broader design features. Click a block for its exact evidence.</p>'
   +'</section>';
 }
 function renderDashboard(all,cursor){
  const visible=seenAt(all,cursor),current=runningNode(all,cursor);
  const checks=visible.filter(e=>e.kind==='checks.rule'||e.kind==='contract.check');
  const failures=checks.filter(e=>status(e)==='fail').length;
  const amount=checks.filter(e=>status(e)==='pass').length;
  const moduleCount=NODES.filter(([id])=>model.moduleState(id,all,cursor).seen.length).length;
  const resume=visible.filter(e=>e.kind==="hitl.resumed");
  const hitl=visible.filter(e=>e.kind==="hitl.opened");
  const packaged=visible.filter(e=>e.kind==='review.package');
  const receipt=visible.filter(e=>e.kind==='case.archived');
  const currentEvent=cursor>=0?all[Math.min(cursor,all.length-1)]:null;
  const progress=cursor<0?'Choose a scenario and press Run':`Event ${Math.min(cursor+1,all.length)} of ${all.length}: ${escape(currentEvent?.label||'')}`;
  return `<div class="ax-run-dashboard">
    <div class="ax-dashboard-heading"><div><span class="ax-overline">MODULE EXECUTION · CONTROLS · EVIDENCE</span><h2>Workflow execution dashboard</h2><p>${progress}</p></div><span class="ax-ref-note">Original verified trace · replay only</span></div>
    <div class="ax-stat-row">
      <div class="ax-stat"><span>Workflow records replayed</span><strong>${visible.length}<small> / ${all.length||'—'}</small></strong></div>
      <div class="ax-stat"><span>Modules with evidence</span><strong>${moduleCount}<small> / 20</small></strong></div>
      <div class="ax-stat"><span>Passed check records · all versions</span><strong>${amount}</strong></div>
      <div class="ax-stat ${failures?'ax-stat-fail':''}"><span>Failed check records · all versions</span><strong>${failures}</strong></div>
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
  // React owns topology and active packets. Decorative metadata is based on
  // the events only, and survives rerenders by being reapplied on each tick.
  for(const node of doc.querySelectorAll('.deck [data-node]')){
   const id=node.dataset.node,state=model.moduleState(id,all,cursor),count=tally.get(id)||0;
   node.classList.toggle('ax-node-executed',state.seen.length>0);
   node.classList.toggle('ax-node-current',id===last);
   node.classList.toggle('ax-node-failure',state.failed);
   node.dataset.executionState=state.label;
   node.title=(labels[id]||id)+' · '+state.label+' · '+state.note;
   const runtime={orchestrator:['Workflow orchestrator','SupplierWorkflow · '+state.label],process_semantics:['Workflow event record','Event log · '+visible.length+' / '+all.length+' records'],token_economics:['Committee orchestration','Scripted proposals · no live token usage']};
   if(runtime[id]){const copy=node.querySelector('span.block');if(copy){const lines=copy.querySelectorAll(':scope > span');for(let i=0;i<2;i++)if(lines[i]&&lines[i].textContent!==runtime[id][i])lines[i].textContent=runtime[id][i];}}
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
