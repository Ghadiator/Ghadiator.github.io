'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('assets/architecture-execution.js','utf8');
const sandbox={window:{}};
vm.runInNewContext(script,sandbox,{filename:'architecture-execution.js'});
const engine=sandbox.window.ArchitectureExecution;
assert.equal(typeof engine.renderDashboard,'function');
assert.equal(typeof engine.renderRail,'function');
const fixture=JSON.parse(fs.readFileSync('data/scenarios/supplier_variance_review.json','utf8'));
const events=fixture.events;
assert.equal(events.length,42,'The baseline scenario must use the published 42-event fixture');
const snapshot=JSON.stringify(events);
const initial=engine.renderDashboard(events,-1);
const complete=engine.renderDashboard(events,events.length-1);
const mid=engine.renderDashboard(events,0);
const block=(markup,id)=>{
 const regex=new RegExp('<button[^>]*data-module-status="'+id+'"[^>]*>[\\s\\S]*?<\\/button>');
 const match=markup.match(regex);
 assert.ok(match,'Missing diagram module '+id);
 return match[0];
};
function assertStructure(html){
 const ids=[...html.matchAll(/data-module-status="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,20,'Each of the 20 source architecture modules has exactly one status card');
 assert.equal(new Set(ids).size,20,'Every node is uniquely represented');
 const groups=[...html.matchAll(/data-architecture-stage="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(groups,['orchestration','collection','checks','review','decision','semantics'],
  'The status view must follow the architecture lanes and workflow-wide rails');
 for(const id of ids)assert.match(block(html,id),/data-architecture-module=/,'Module must open the actual graph node');
}
for(const markup of [initial,mid,complete])assertStructure(markup);
const phase=(html,key)=>{
 const match=html.match(new RegExp('<section[^>]*data-architecture-stage="'+key+'"[\\s\\S]*?<\\/section>'));
 assert.ok(match,'Missing combined phase '+key);
 return match[0];
};
for(const markup of [initial,mid,complete]){
 const checks=phase(markup,'checks'),review=phase(markup,'review');
 assert.equal((checks.match(/data-module-status=/g)||[]).length,3);
 assert.equal((review.match(/data-module-status=/g)||[]).length,7);
 assert.equal((checks.match(/data-module-results=/g)||[]).length,2,'Both check result sets belong to verification');
 assert.equal((review.match(/data-module-results=/g)||[]).length,4,'All four role outputs belong to exception review');
 assert.equal((markup.match(/data-module-results=/g)||[]).length,6,'Results must not be repeated outside the two phases');
 assert.doesNotMatch(markup,/DETERMINISTIC VALIDATION|BOUNDED REVIEW COMMITTEE/,'Remove duplicate panel headings');
}
assert.doesNotMatch(initial,/class="ax-check-row /,'No future check may appear before replay');
assert.doesNotMatch(initial,/class="ax-role-message"/,'No future committee output may appear before replay');
const completedChecks=phase(complete,'checks');
assert.equal((completedChecks.match(/class="ax-check-row /g)||[]).length,
 events.filter(e=>['checks.rule','contract.check'].includes(e.kind)).length,'Keep every recorded deterministic result exactly once');
const completedReview=phase(complete,'review');
assert.equal((completedReview.match(/class="ax-role-message"/g)||[]).length,
 events.filter(e=>['committee.proponent.argument','committee.opponent.argument','verification.result','committee.judge.argument'].includes(e.kind)).length,
 'Keep every recorded role output exactly once');
assert.match(initial,/14<span> \/ 20<\/span>/,'Full case has 14 blocks with emitted events');
assert.match(initial,/0 of 20 reached so far/,'Cursor begins before the first recorded event');
assert.match(initial,/Replay not started/);
assert.match(block(initial,'request'),/ax-module-queued/,'First step exists later in the trace');
assert.match(block(initial,'orchestrator'),/ax-module-unobserved/,'LangGraph controller is NOT an executed supplier component');
assert.match(block(initial,'process_semantics'),/ax-module-reference/,'Generic ProcessEvent pool must be shown as architecture reference');
assert.match(block(initial,'process_semantics'),/Separate pool not executed/,'Reference status must not imply a supplier workflow failure');
assert.match(block(initial,'process_semantics'),/0 \/ 8 audit transitions · 0 \/ 2 human-gate events/,'Supplier audit coverage must be visible even before playback');
assert.doesNotMatch(initial.match(/<section[^>]*data-architecture-stage="semantics"[\s\S]*?<\/section>/)[0],/0 reached/,'Reference-only rail must not say zero reached');
assert.match(block(initial,'post_cove'),/ax-module-unobserved/,'Post-Judge CoVe has no separate fixture event');
assert.match(block(initial,'token_economics'),/ax-module-unobserved/,'Scripted personas have no live token accounting');
assert.match(mid,/1 of 20 reached so far/,'First event reaches only its source module');
assert.match(block(mid,'request'),/ax-module-active/,'Current source node should highlight');
assert.match(complete,/14 of 20 reached so far/,'The complete run reaches exactly 14 original nodes');
assert.match(block(complete,'archive'),/ax-module-active/,'Final archive event is current');
assert.match(block(complete,'disposition'),/ax-module-done/,'Prior human gate remains reached');
assert.match(block(complete,'orchestrator'),/ax-module-unobserved/,'Do not fabricate LangGraph execution');
assert.match(block(complete,'process_semantics'),/ax-module-reference/,'Generic ProcessEvent pool is never marked executed');
assert.match(block(complete,'process_semantics'),/8 \/ 8 audit transitions · 2 \/ 2 human-gate events/,'Trace must show all actual supplier audit evidence');
assert.match(complete,/Supplier trace: 8 \/ 8 audit transitions · 2 \/ 2 human-gate events/,'Audit evidence rail must report source-backed counts');
assert.match(complete,/Separate DAiA pool not executed/,'Keep generic ProcessEvent pool scope explicit');
assert.match(complete,/42<small> \/ 42<\/small>/,'Do not fabricate extra emitted events');
assert.equal(JSON.stringify(events),snapshot,'Rendering must not mutate verified source events');
const corrected=JSON.parse(fs.readFileSync('data/scenarios/supplier_rate_correction.json','utf8'));
const correctedHtml=engine.renderDashboard(corrected.events,corrected.events.length-1);
assertStructure(correctedHtml);
assert.equal((correctedHtml.match(/data-module-status="/g)||[]).length,20);
assert.ok(correctedHtml.includes('Rate')||correctedHtml.includes('rate'),'Correction run remains visible');
assert.match(block(correctedHtml,'process_semantics'),/12 \/ 12 audit transitions · 4 \/ 4 human-gate events/,'Correction-loop evidence count must remain sourced from fixture, not hard-coded');
assertStructure(engine.renderDashboard([], -1));
for(const slug of ['supplier_clean','supplier_unsupported_claim','supplier_adapter_failure','supplier_proposal_budget']){
 const fixture=JSON.parse(fs.readFileSync('data/scenarios/'+slug+'.json','utf8'));
 const html=engine.renderDashboard(fixture.events,fixture.events.length-1);
 assertStructure(html);
 const review=phase(html,'review');
 for(const event of fixture.events.filter(e=>['committee.adapter_failed','committee.budget_exceeded'].includes(e.kind))){
  assert.ok(review.includes(event.label),'Retain recorded adapter failures and proposal forfeits: '+slug);
 }
 if(slug==='supplier_clean')assert.doesNotMatch(review,/class="ax-role-message"/,'Clean case does not invent committee execution');
}
console.log('Architecture module map: phase grouping, 20-node identity, replay-vs-run coverage and source integrity passed.');
