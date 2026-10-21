'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};
for(const file of ['architecture-run-model','architecture-execution'])vm.runInNewContext(fs.readFileSync('assets/'+file+'.js','utf8'),{window});
const m=window.ArchitectureRunModel,engine=window.ArchitectureExecution;
const ids=['orchestrator','request','reminders','intake','memory','rules','crosscheck','external','sanitiser','proponent','opponent','firewall','judge','post_cove','token_economics','advisory','remediation','disposition','archive','process_semantics'];
// Source-verified branch coverage, including supporting controls (not new events).
const expected={supplier_variance_review:19,supplier_clean:13,supplier_rate_correction:14,supplier_missing_document:14,supplier_unsupported_claim:18,supplier_invented_narrative:19,supplier_injection:19,supplier_duplicate:14,supplier_over_limit:14,supplier_total_mismatch:11,supplier_currency_mismatch:14,supplier_invalid:6,supplier_pending:12,supplier_adapter_failure:18,supplier_proposal_budget:18};
let prefixes=0;
for(const [slug,total] of Object.entries(expected)){
 const f=JSON.parse(fs.readFileSync('data/scenarios/'+slug+'.json','utf8')),all=f.events,before=JSON.stringify(f);
 for(const e of all){assert.ok(m.types[e.kind],slug+': unreviewed event kind '+e.kind);assert.ok(m.eventInfo(e).producer.startsWith('SupplierWorkflow.'));}
 for(let cursor=-1;cursor<all.length;cursor++){
  prefixes++;
  const visible=all.slice(0,cursor+1);
  for(const id of ids){
   const s=m.moduleState(id,all,cursor);
   assert.ok(s.seen.every(r=>r.i<=cursor),slug+': future evidence leaked for '+id);
   assert.equal(s.direct.length,all.filter(e=>m.normalize(e.node)===id).length,'Preserve source ownership');
   assert.ok(s.seen.every(r=>r.e===all[r.i]),'Evidence must reference the original event');
  }
  const orchestration=m.moduleState('orchestrator',all,cursor),log=m.moduleState('process_semantics',all,cursor);
  assert.equal(orchestration.evidence.length,all.length,'Every case has workflow coordination');
  assert.equal(orchestration.seen.length,visible.length);
  assert.equal(log.seen.length,visible.length,'Every source Event is in the workflow log');
  assert.equal(m.moduleState('post_cove',all,cursor).kind,'reference','SupplierWorkflow has no post-Judge implementation');
  if(visible.at(-1)?.kind==='hitl.opened')assert.equal(orchestration.label,'Paused for reviewer');
  if(visible.at(-1)?.kind==='hitl.resumed')assert.equal(orchestration.label,'Resuming after reviewer');
  const security=visible.filter(e=>e.kind==='security.input');
  assert.equal(m.moduleState('sanitiser',all,cursor).seen.length,security.length,'Input boundary evidence is recorded under Case history');
  const contracts=visible.filter(e=>e.kind==='contract.snapshot_loaded');
  assert.equal(m.moduleState('external',all,cursor).seen.length,contracts.length,'Contract input is evidenced by loaded snapshots');
  for(const [id,start,result] of [['rules','checks.started','checks.rule'],['crosscheck','contract.snapshot_loaded','contract.check']]){
   const lastStart=visible.map(e=>e.kind).lastIndexOf(start);
   const latest=visible.slice(Math.max(0,lastStart)).filter(e=>e.kind===result);
   assert.equal(m.moduleState(id,all,cursor).failed,latest.some(e=>/\bFAIL\b/.test(e.label)),slug+': status must follow latest validation pass');
  }
  const page=engine.renderDashboard(all,cursor),rail=engine.renderRail(all,cursor);
  assert.equal((rail.match(/data-replay-seek=/g)||[]).length,all.length,'Never insert extra events');
  assert.equal((page.match(/class="ax-check-row /g)||[]).length,visible.filter(e=>['checks.rule','contract.check'].includes(e.kind)).length);
  assert.equal((page.match(/class="ax-role-message"/g)||[]).length,visible.filter(e=>['committee.proponent.argument','committee.opponent.argument','verification.result','committee.judge.argument'].includes(e.kind)).length);
 }
 assert.equal(ids.filter(id=>m.moduleState(id,all,all.length-1).seen.length).length,total,slug+': incorrect case/control coverage');
 const last=m.moduleState('orchestrator',all,all.length-1);
 assert.equal(last.label,slug==='supplier_pending'?'Paused for reviewer':slug==='supplier_total_mismatch'?'Waiting for supplier':'Recorded run complete');
 if(['supplier_adapter_failure','supplier_proposal_budget'].includes(slug)){
  assert.match(m.moduleState('opponent',all,all.length-1).label,/No output/);
  assert.equal(all.filter(e=>e.kind==='committee.opponent.argument'||e.kind==='verification.result').length,0,'No claims were admitted to verification');
  assert.equal(m.moduleState('firewall',all,all.length-1).label,'Guard handled the failure');
 }
 if(['supplier_rate_correction','supplier_missing_document'].includes(slug)){
  for(const id of ['rules','crosscheck'])assert.equal(m.moduleState(id,all,all.length-1).failed,false,'Corrected checks must clear the active failure state');
 }
 assert.equal(JSON.stringify(f),before,'Never mutate published evidence');
}
console.log('Run consistency: all 15 source-verified cases, '+prefixes+' playback prefixes, shared control attribution, guard outcomes and event meanings passed.');
