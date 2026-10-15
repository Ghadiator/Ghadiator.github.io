/* Execution view for the existing modular React architecture.
 * Presentation only: every result comes from the verified scenario JSON.
 * A block with no emitted event is NOT labelled as executed. */
(function(){
 "use strict";
 const escape=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
 const NODES=[
  ["orchestrator","Main orchestrator"],["request","Collection request"],["reminders","Deadline reminders"],
  ["intake","Supplier intake"],["memory","Case history"],["rules","Invoice rules"],
  ["crosscheck","Contract cross-check"],["external","Approved contract"],["sanitiser","Input sanitiser"],
  ["proponent","Proponent"],["opponent","Opponent"],["firewall","Pre-Judge CoVe"],
  ["judge","Judge"],["post_cove","Post-Judge CoVe"],["token_economics","Token controls"],
  ["advisory","Review package"],["remediation","Supplier correction"],["disposition","Human review / decision"],
  ["archive","Evidence archive"],["process_semantics","ProcessEvent pool"]
 ];
 const labels=Object.fromEntries(NODES);
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
 function renderCheckPanel(kind,title,visible){
  const checks=visible.filter(e=>e.kind===kind);
  const failures=checks.filter(e=>status(e)==="fail").length;
  const passes=checks.filter(e=>status(e)==="pass").length;
  const rows=checks.map(e=>`<li class="ax-check-row ax-check-${status(e)}">
    <span class="ax-check-result">${status(e)==='fail'?'✕':status(e)==='pass'?'✓':'•'}</span>
    <span class="ax-check-desc"><strong>${escape(e.label)}</strong>${e.detail?`<small>${escape(e.detail)}</small>`:''}<small>Event ${escape(e.seq)} · ${escape(e.refs?.[0]||'Recorded fixture')}</small></span>
    ${badge(status(e)==='fail'?'Failed':status(e)==='pass'?'Passed':'Recorded',status(e))}
  </li>`).join("");
  return `<section class="ax-dash-panel"><div class="ax-panel-head"><div><span class="ax-overline">DETERMINISTIC VALIDATION</span><h3>${escape(title)}</h3></div><div class="ax-check-totals">${badge(passes+' passed','pass')}${failures?badge(failures+' failed','fail'):''}</div></div>
   ${checks.length?`<ol class="ax-check-list">${rows}</ol>`:'<p class="ax-panel-empty">No checks of this kind have been emitted yet in this replay.</p>'}</section>`;
 }
 const roleKinds=[
  ["Proponent","committee.proponent.argument","Supports the submission"],
  ["Opponent","committee.opponent.argument","Challenges submitted evidence"],
  ["Pre-Judge CoVe","verification.result","Verifies claims against evidence"],
  ["Judge","committee.judge.argument","Packages verified findings"]
 ];
 function renderCommittee(visible){
  const forfeits=visible.filter(e=>["committee.adapter_failed","committee.budget_exceeded"].includes(e.kind));
  const cards=roleKinds.map(([title,kind,subtitle])=>{
   const lines=visible.filter(e=>e.kind===kind);
   return `<article class="ax-role-card ${lines.length?'ax-role-emitted':'ax-role-pending'}"><div class="ax-role-head"><div><h4>${title}</h4><span>${subtitle}</span></div>${badge(lines.length?lines.length+' event'+(lines.length===1?'':'s'):'Not reached',lines.length?'record':'pending')}</div>
    ${lines.length?lines.map(e=>`<div class="ax-role-message"><b>${escape(e.label)}</b><p>${escape(e.detail||'No narrative included in the recorded event.')}</p><small>Event ${escape(e.seq)} · ${escape(e.refs?.[0]||'Fixture trace')}</small></div>`).join(""):'<p class="ax-panel-empty">No recorded output from this role at the current step.</p>'}</article>`;
  }).join("");
  return `<section class="ax-dash-panel ax-committee"><div class="ax-panel-head"><div><span class="ax-overline">BOUNDED REVIEW COMMITTEE</span><h3>Proponent · Opponent · CoVe · Judge</h3></div>${badge('Scripted roles · no live AI','record')}</div><div class="ax-role-grid">${cards}</div>
    ${forfeits.map(e=>`<p class="ax-forfeit">${escape(e.label)} — ${escape(e.detail||'Proposals forfeited by the runner.')}</p>`).join("")}
    <p class="ax-dash-foot">Only emitted claims and verification results are shown. The broader source architecture contains Post-Judge CoVe, but the supplier fixture has no separate Post-Judge CoVe event.</p></section>`;
 }
 function renderModules(visible,current){
  const count=counts(visible),failed=new Set(visible.filter(e=>status(e)==='fail').map(e=>normalize(e.node)));
  const rows=NODES.map(([id,name])=>{
   const n=count.get(id)||0;
   let kind=id===current?'active':failed.has(id)?'fail':n?'done':'idle';
   return `<div class="ax-module ax-module-${kind}" data-module-status="${id}"><span class="ax-module-dot"></span><span class="ax-module-name">${escape(name)}</span><span class="ax-module-n">${n? n+' events': '—'}</span></div>`;
  });
  return `<section class="ax-dash-panel ax-modules"><div class="ax-panel-head"><div><span class="ax-overline">20-BLOCK MODULAR ARCHITECTURE</span><h3>Execution state by module</h3></div><span class="ax-module-key">${count.size} modules emitted events</span></div>
  <div class="ax-modules-grid">${rows.join("")}</div>
  <p class="ax-dash-foot">Active = latest recorded event; executed = an event was emitted by that module. Blank modules remain part of the architecture but are not claimed to have executed. Supporting boundaries may have no dedicated fixture event.</p></section>`;
 }
 function renderDashboard(all,cursor){
  const visible=seenAt(all,cursor),current=runningNode(all,cursor);
  const checks=visible.filter(e=>e.kind==='checks.rule'||e.kind==='contract.check');
  const failures=checks.filter(e=>status(e)==='fail').length;
  const amount=checks.filter(e=>status(e)==='pass').length;
  const moduleCount=counts(visible).size;
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
      <div class="ax-stat"><span>Modules with events</span><strong>${moduleCount}<small> / 20</small></strong></div>
      <div class="ax-stat"><span>Checks passed</span><strong>${amount}</strong></div>
      <div class="ax-stat ${failures?'ax-stat-fail':''}"><span>Checks failed</span><strong>${failures}</strong></div>
      <div class="ax-stat"><span>Human gate opened</span><strong>${hitl.length}</strong></div>
    </div>
    ${renderModules(visible,current)}
    <div class="ax-validation-grid">${renderCheckPanel('checks.rule','Invoice rule checks',visible)}${renderCheckPanel('contract.check','Contract checks',visible)}</div>
    ${renderCommittee(visible)}
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
 window.ArchitectureExecution={renderRail,renderDashboard,decorateGraph,seek};
})();
