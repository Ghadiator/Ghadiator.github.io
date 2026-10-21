/* Interpret immutable SupplierWorkflow Event records. This is a view model:
 * supporting evidence can overlap, but source events are never added or moved.
 * Semantics checked against supplier_review/workflow.py and all 15 exports.
 * Reviewed workflow blob: 7580eedd39d44758cddf27cc6b0e31e7fe7ad396. */
(function(){
 'use strict';
 const normalize=id=>id==='gate'?'disposition':id;
 const TYPES={
  'workflow.start':['Workflow start','request()','Opens the authorised collection request.'],
  'audit.row_appended':['State transition','_transition()','Records an allowed change of workflow state.'],
  'collection.reminder':['Collection reminder','remind()','Prepares a reminder in the fixture outbox; no email is sent.'],
  'intake.received':['Submission received','submit()','Records the parsed invoice and its version.'],
  'intake.rejected':['Intake rejection','submit()','Rejects a payload that fails the typed input boundary.'],
  'history.attached':['Version history','submit()','Attaches the previous and current submission versions.'],
  'security.input':['Input boundary','submit()','Keeps supplier free text outside proposal and decision inputs.'],
  'checks.started':['Invoice validation','submit()','Starts the deterministic invoice checks.'],
  'checks.rule':['Invoice check result','submit()','Records one of the six invoice checks as PASS or FAIL.'],
  'contract.snapshot_loaded':['Reference input','submit()','Loads the approved contract used by the cross-checks.'],
  'contract.check':['Contract check result','submit()','Records one of the eight approved-contract checks as PASS or FAIL.'],
  'exception.started':['Exception review','_committee()','Starts bounded scripted review after the deterministic checks.'],
  'committee.proponent.argument':['Supporting argument','_committee()','Records a scripted supporting claim; it is not a verified fact.'],
  'committee.opponent.argument':['Proposed finding','_committee()','Records a scripted challenge that still requires verification.'],
  'committee.adapter_failed':['Handled adapter failure','_propose()','Discards the failed adapter contribution and continues to the reviewer.'],
  'committee.budget_exceeded':['Proposal guard','_propose()','Discards every proposal when the four-proposal limit is exceeded.'],
  'verification.result':['Claim verification','_committee()','Accepts, restates or removes a proposed finding against computed evidence.'],
  'committee.judge.argument':['Review summary','_committee()','Packages the verified findings; the Judge cannot approve a case.'],
  'review.package':['Review package','_open_review()','Assembles failed checks and verified findings for a human reviewer.'],
  'remediation.email.composed':['Clarification draft','_open_review()','Drafts a clarification from findings; no real email is sent.'],
  'hitl.opened':['Human review pause','_open_review()','Suspends the workflow for an authorised reviewer.'],
  'hitl.resumed':['Human decision','resume()','Records the named reviewer decision that resumes the workflow.'],
  'workflow.terminal':['Recorded disposition','resume()','Records approval, rejection or a request for supplier changes.'],
  'case.archived':['Archive record','archive()','Records the final evidence archive in fixture memory.']
 };
 const evidenceIds=e=>{
  const ids=new Set([normalize(e.node),'orchestrator','process_semantics']);
  if(e.kind==='security.input')ids.add('sanitiser');
  if(e.kind==='contract.snapshot_loaded')ids.add('external');
  if(['committee.opponent.argument','committee.adapter_failed','committee.budget_exceeded'].includes(e.kind))ids.add('token_economics');
  if(['committee.adapter_failed','committee.budget_exceeded'].includes(e.kind))ids.add('opponent');
  return [...ids].filter(Boolean);
 };
 const records=(all,cursor)=>cursor<0?[]:all.slice(0,Math.min(cursor+1,all.length));
 function eventInfo(e){
  const [category,method,meaning]=TYPES[e.kind]||['Workflow record','emit()','An original record emitted by the supplier workflow.'];
  return {category,method,meaning,producer:'SupplierWorkflow.'+method,owner:normalize(e.node),supports:evidenceIds(e),
   actor:e.actor==='ai'?'Scripted role':e.actor==='human'?'Human':'System'};
 }
 function lifecycle(visible){
  if(!visible.length)return {label:'Not started',state:'New'};
  const transition=visible.filter(e=>e.kind==='audit.row_appended').at(-1);
  const state=transition?.label.split('→').at(-1)?.trim()||'New';
  if(visible.some(e=>e.kind==='case.archived'))return {label:'Recorded run complete',state};
  if(visible.at(-1)?.kind==='hitl.resumed')return {label:'Resuming after reviewer',state};
  if(state==='Awaiting_reviewer')return {label:'Paused for reviewer',state};
  if(state==='Awaiting_supplier')return {label:'Waiting for supplier',state};
  return {label:'Coordinating recorded run',state};
 }
 function moduleState(id,all,cursor){
  const visible=records(all,cursor),life=lifecycle(visible);
  const evidence=all.map((e,i)=>({e,i,direct:normalize(e.node)===id})).filter(({e})=>evidenceIds(e).includes(id));
  const seen=evidence.filter(({i})=>i<=cursor),direct=evidence.filter(r=>r.direct);
  const current=cursor<0?null:all[Math.min(cursor,all.length-1)];
  let kind=seen.length?'done':evidence.length?'queued':'unobserved';
  let label=seen.length?'Evidenced in replay':evidence.length?'Later in replay':'Not used in this case';
  let note=seen.length?'Supported by recorded workflow evidence.':evidence.length?'Evidence exists later in this recorded case.':'This case does not take this branch.';
  let countText=seen.length+' / '+evidence.length+' evidence records';
  if(!all.length){label='Case loading';note='Waiting for verified scenario records.';countText='No records loaded';}
  if(id==='orchestrator'||id==='process_semantics'){
   label=life.label;
   kind=!seen.length?'queued':['Paused for reviewer','Waiting for supplier'].includes(life.label)?'waiting':life.state==='Archived'?'done':'active';
   note=id==='orchestrator'?'Every case is coordinated by SupplierWorkflow: routing, state changes, reviewer pauses and corrections.':'SupplierWorkflow.emit() appends every Event to the ordered workflow record; audit rows describe state changes.';
   countText=(id==='orchestrator'?'Workflow-wide · ':'Recorded log · ')+visible.length+' / '+all.length+' records';
   if(!visible.length)label=all.length?'Runs with every case':'Case loading';
   else if(id==='process_semantics')label='Event log available';
  }else if(id==='post_cove'){
   kind='reference';label='Broader design only';note='No separate post-Judge verification runs in SupplierWorkflow; it is a broader architecture layer.';countText='No supplier implementation';
  }else if(id==='external'){
   label=seen.length?'Reference loaded':evidence.length?'Loaded later in replay':all.length?'Not consulted in this case':label;
   note='Evidence: contract.snapshot_loaded is recorded under Contract cross-check, and supports this reference-input block.';
  }else if(id==='sanitiser'){
   label=seen.length?'Input boundary applied':evidence.length?'Applied later in replay':all.length?'Not reached after intake rejection':label;
   note='Evidence: security.input is recorded under Case history; supplier notes are excluded from proposal and decision inputs.';
  }else if(id==='token_economics'){
   const guard=seen.find(({e})=>e.kind==='committee.budget_exceeded');
   label=guard?'Proposal cap enforced':seen.length?'Bounded proposal path':evidence.length?'Later in exception review':all.length?'Exception review skipped':label;
   kind=guard?'guarded':kind;
   note='The fixture bounds scripted proposals to four and forfeits failed adapters. Live token metering and model fallback are broader design features.';
  }else if(id==='opponent'){
   const guard=seen.find(({e})=>['committee.adapter_failed','committee.budget_exceeded'].includes(e.kind));
   if(guard){kind='guarded';label=guard.e.kind==='committee.adapter_failed'?'No output · adapter failed':'No output · proposal cap';note='The adapter was attempted, but its contribution was discarded. No Opponent argument entered verification.';}
  }
  if(id==='firewall'&&seen.length&&!seen.some(({e})=>e.kind==='verification.result')){
   kind='guarded';label='Guard handled the failure';note='The adapter or proposal guard discarded all contributions. No claims reached the claim verifier.';
  }
  let failed=seen.some(({e})=>e.kind==='intake.rejected');
  if(id==='rules'||id==='crosscheck'){
   const start=id==='rules'?'checks.started':'contract.snapshot_loaded',result=id==='rules'?'checks.rule':'contract.check';
   const lastStart=seen.filter(({e})=>e.kind===start).at(-1)?.i??-1;
   const latest=seen.filter(({e,i})=>i>=lastStart&&e.kind===result);
   const earlierFailure=seen.some(({e,i})=>i<lastStart&&e.kind===result&&/\bFAIL\b/.test(e.label));
   failed=latest.some(({e})=>/\bFAIL\b/.test(e.label));
   if(latest.length){label=failed?'Latest pass has failed checks':latest.length===(id==='rules'?6:8)?earlierFailure?'Revalidated · checks passed':'Latest checks passed':'Validation pass in progress';}
   else if(lastStart>=0)label=earlierFailure?'Rechecking after correction':'Validation pass started';
   if(lastStart>=0)note='Latest validation pass: '+latest.length+' result(s). Earlier results remain in the event log; the block status follows the latest pass.';
  }
  if(failed)kind='fail';
  else if(!['orchestrator','process_semantics','post_cove'].includes(id)&&current&&normalize(current.node)===id&&kind==='done')kind='active';
  return {id,kind,label,note,countText,evidence,seen,direct,life,failed};
 }
 window.ArchitectureRunModel={normalize,eventInfo,evidenceIds,records,lifecycle,moduleState,types:TYPES};
})();
