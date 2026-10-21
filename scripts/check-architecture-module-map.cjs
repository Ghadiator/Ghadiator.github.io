'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('assets/architecture-execution.js','utf8');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('assets/architecture-run-model.js','utf8'),sandbox);
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
assert.match(initial,/19<span> \/ 20<\/span>/,'Full case supports 19 controls; post-Judge CoVe is broader design');
assert.match(initial,/0 of 20 evidenced so far/,'No future evidence is shown as reached');
assert.match(initial,/Replay not started/);
assert.match(block(initial,'request'),/ax-module-queued/);
assert.match(block(initial,'orchestrator'),/Runs with every case/);
assert.match(block(initial,'process_semantics'),/Recorded log · 0 \/ 42 records/);
assert.match(block(initial,'post_cove'),/ax-module-reference/);
assert.match(block(initial,'token_economics'),/Later in exception review/);
assert.match(mid,/3 of 20 evidenced so far/,'Start evidences request, coordination and event logging');
assert.match(block(mid,'request'),/ax-module-active/);
assert.match(block(mid,'orchestrator'),/Coordinating recorded run/);
assert.match(complete,/19 of 20 evidenced so far/);
assert.match(block(complete,'archive'),/ax-module-active/);
assert.match(block(complete,'disposition'),/ax-module-done/);
assert.match(block(complete,'orchestrator'),/Recorded run complete/);
assert.match(block(complete,'process_semantics'),/Recorded log · 42 \/ 42 records/);
assert.match(complete,/Supplier trace: 8 \/ 8 state transitions · 2 \/ 2 human-gate records/);
assert.match(complete,/42<small> \/ 42<\/small>/,'Do not fabricate extra emitted events');
assert.equal(JSON.stringify(events),snapshot,'Rendering must not mutate verified source events');
const corrected=JSON.parse(fs.readFileSync('data/scenarios/supplier_rate_correction.json','utf8'));
const correctedHtml=engine.renderDashboard(corrected.events,corrected.events.length-1);
assertStructure(correctedHtml);
assert.equal((correctedHtml.match(/data-module-status="/g)||[]).length,20);
assert.ok(correctedHtml.includes('Rate')||correctedHtml.includes('rate'),'Correction run remains visible');
assert.match(correctedHtml,/12 \/ 12 state transitions · 4 \/ 4 human-gate records/,'Correction evidence stays sourced from the fixture');
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
