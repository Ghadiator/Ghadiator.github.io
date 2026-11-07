"use strict";
/** All fifteen case variants must be consistent with their actual exported
 * role and verification events; the UI may not invent a model invocation.
 */
const fs=require("node:fs"), assert=require("node:assert/strict"), path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const matrix=read("data/committee-case-evidence.json");
assert.equal(matrix.schema,"gac.committee_case_evidence.v1");
assert.equal(matrix.scope,"recorded_supplier_fixtures_only");
const names=fs.readdirSync(path.join(root,"data/scenarios")).filter(n=>n.endsWith(".json")&&n!=="index.json");
assert.equal(matrix.cases.length,names.length,"one entry for every scenario");
assert.equal(names.length,15);
const kinds=["committee.proponent.argument","committee.opponent.argument","verification.result","committee.adapter_failed","committee.budget_exceeded","committee.judge.argument"];
const counts={both:0,proponent_only:0,opponent_only:0,no_role:0,verify:0,fail:0};
for(const item of matrix.cases){
 const raw=read("data/scenarios/"+item.slug+".json");
 assert.equal(raw.slug,item.slug);
 assert.equal(raw.events.length,item.event_count);
 const expected=raw.events.filter(e=>kinds.includes(e.kind)).map(e=>({seq:e.seq,kind:e.kind,node:e.node,label:e.label,detail:e.detail,sub:e.sub??null}));
 assert.deepEqual(item.outputs,expected,item.slug+" role output must be verbatim from original events");
 const p=expected.some(e=>e.kind==="committee.proponent.argument");
 const o=expected.some(e=>e.kind==="committee.opponent.argument");
 const v=expected.some(e=>e.kind==="verification.result");
 const fail=expected.find(e=>["committee.adapter_failed","committee.budget_exceeded"].includes(e.kind));
 const category=p&&o?"both_arguments":p?"proponent_only":o?"opponent_only":"no_agent_argument";
 assert.equal(item.classification,category,item.slug);
 assert.equal(item.proponent_recorded,p,item.slug);
 assert.equal(item.opponent_recorded,o,item.slug);
 assert.equal(item.pre_judge_cove_recorded,v,item.slug);
 assert.equal(item.failure,fail?.kind??null,item.slug);
 assert.equal(item.models_invoked_flag,!!raw.outcome.models_invoked,item.slug);
 assert.equal(item.judge_recorded,expected.some(e=>e.kind==="committee.judge.argument"),item.slug);
 assert.equal(p||o,!!raw.outcome.models_invoked,item.slug);
 if(v){
  const first=expected.find(e=>e.kind==="committee.opponent.argument");
  const verification=expected.find(e=>e.kind==="verification.result");
  assert.ok(first&&first.seq<verification.seq,item.slug+" CoVe lacks preceding Opponent claim");
  assert.ok(verification.seq<expected.find(e=>e.kind==="committee.judge.argument").seq,item.slug+" CoVe must precede Judge");
 }
 if(fail){assert.equal(o,false,item.slug+" failed adapter cannot emit an Opponent proposal");assert.equal(v,false,item.slug+" admission failure cannot be a successful CoVe");}
 counts[category]++;
 if(v)counts.verify++;
 if(fail)counts.fail++;
}
assert.deepEqual([counts.both,counts.proponent_only,counts.opponent_only,counts.no_role,counts.verify,counts.fail],[4,2,0,9,4,2]);
assert.deepEqual([matrix.counts.both,matrix.counts.proponent_only,matrix.counts.opponent_only,matrix.counts.no_role,matrix.counts.verified_case_count,matrix.counts.failed_admission_cases],[4,2,0,9,4,2]);
const html=fs.readFileSync(path.join(root,"architecture/index.html"),"utf8");
assert.match(html,/committee-replay-fidelity-20261107\.js/);
assert.match(html,/committee-replay-fidelity-20261107\.css/);
const overlay=fs.readFileSync(path.join(root,"assets/committee-replay-fidelity-20261107.js"),"utf8");
assert.match(overlay,/data-gac-proponent-cove/);
assert.match(overlay,/proponent→judge/);
assert.match(overlay,/committee-case-evidence\.json/);
console.log("PASS: all 15 recorded committee traces match original Proponent/Opponent/CoVe/Judge events; 4 both, 2 Proponent-only, 9 none, 2 proposal failures.");
