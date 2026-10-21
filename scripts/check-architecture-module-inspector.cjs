/* Regression tests for real, source-backed architecture block inspector. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const el={hidden:true,innerHTML:"",dataset:{}};
const registered={};
const document={
 getElementById(id){return id==="architecture-module-inspector"?el:null;},
 addEventListener(name,fn){registered[name]=fn;}
};
const window={};
vm.runInNewContext(fs.readFileSync("assets/architecture-run-model.js","utf8"),{window});
vm.runInNewContext(fs.readFileSync("assets/architecture-governance.js","utf8"),{window});
vm.runInNewContext(fs.readFileSync("assets/architecture-module-inspector.js","utf8"),{window,document});
const api=window.ArchitectureModuleInspector;
assert.ok(api,"Block inspector must expose a real selected-module controller");
assert.equal(Object.keys(api.definitions).length,20,"Define all 20 original architecture modules");
for(const [id,contract] of Object.entries(api.definitions)){
 assert.equal(contract.length,5,"Each block defines name, purpose, input, output and predecessors: "+id);
 for(const [index,part] of contract.slice(0,4).entries())assert.ok(String(part).trim().length>=(index===0?1:12),"Empty block definition: "+id);
}
assert.deepEqual(Object.keys(window.ArchitectureGovernance.modules).sort(),Object.keys(api.definitions).sort(),"Governance must cover exactly the original 20 blocks");
for(const id of Object.keys(api.definitions)){
 api.select(id);
 for(const phrase of ["EU AI Act relevance","What this does not establish","Scope of this mapping","01 · Input / output","03 · Evidence"]){
  assert.ok(el.innerHTML.includes(phrase),id+" is missing "+phrase);
 }
 const mapping=window.ArchitectureGovernance.modules[id];
 assert.equal(mapping.length,4);
 for(const n of mapping[3])assert.ok(el.innerHTML.includes("https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-"+n));
}
api.select("external");
assert.ok(el.innerHTML.includes("does not establish Article 10"),"Operational reference inputs must not be sold as training-data compliance");
api.select("token_economics");
assert.ok(el.innerHTML.includes("No direct article obligation mapped"),"Do not invent a mandatory token budget");
api.close();
const variance=JSON.parse(fs.readFileSync("data/scenarios/supplier_variance_review.json","utf8"));
const clean=JSON.parse(fs.readFileSync("data/scenarios/supplier_clean.json","utf8"));
api.setScenario(variance.slug,variance.events,-1);
assert.equal(api.select("proponent"),true);
assert.equal(el.hidden,false);
assert.ok(el.innerHTML.includes("Proponent"));
assert.ok(el.innerHTML.includes("Expected input · architecture"));
assert.ok(el.innerHTML.includes("Expected output · architecture"));
assert.ok(el.innerHTML.includes("Input context in the recorded trace"));
assert.ok(el.innerHTML.includes("Original source records"));
assert.ok(el.innerHTML.includes("Proponent: contractual checks passed"));
assert.ok(el.innerHTML.includes("Later in replay"),"Output must be discoverable before playback");
assert.match(el.innerHTML,/data-replay-seek="28"/,"Exact source event index must be navigable");
// Reading a check card must not seek the replay. Only its explicit action does.
const cards=[...el.innerHTML.matchAll(/<li class="ami-event">([\s\S]*?)<\/li>/g)];
assert.ok(cards.length>0);
for(const [,card] of cards){
 const [record,action]=card.split('</div>');
 assert.ok(record.startsWith('<div class="ami-event-record">'));
 assert.ok(!record.includes('<button')&&!record.includes('data-replay-seek'),
   'Evidence content must remain readable and selectable without seeking');
 assert.match(action,/<button class="ami-event-jump"[^>]+data-replay-seek="\d+"[^>]*>Jump to event \d+/,
   'Only an explicitly labeled replay action may seek');
}
assert.ok(el.innerHTML.includes("not</strong> captured function-call arguments"),
 "Upstream context must never be misrepresented as actual function-call input");
assert.ok(el.innerHTML.includes("Invoice is not already approved"),"Input context should come from real prior cross-check output");
api.setScenario(clean.slug,clean.events,clean.events.length-1);
assert.equal(el.dataset.selectedModule,"proponent","Selection survives scenario change");
assert.ok(el.innerHTML.includes("Not used in this case"),"Clean case bypasses the committee");
assert.ok(!el.innerHTML.includes("Proponent: contractual checks passed"),"Old run must not leak into changed selection");
api.select("disposition");
assert.ok(el.innerHTML.includes("Run suspended for authorised reviewer"),
 "Human gate must include real events normalized from node gate");
assert.ok(el.innerHTML.includes("Recorded outcome: Approved"),"Human outcome must include terminal fixture event");
api.select("external");
assert.ok(el.innerHTML.includes("Approved contract details may appear"),"Contract reference must not be claimed executed");
api.select("orchestrator");
assert.ok(el.innerHTML.includes("Every recorded scenario is coordinated by SupplierWorkflow"),
 "Workflow coordination must be evidenced even without a dedicated owner event");
assert.ok(el.innerHTML.includes("not a claim that LangGraph executed"));
api.select("process_semantics");
assert.ok(el.innerHTML.includes("not the separate generic DAiA ProcessEvent pool"),
 "Do not conflate supplier audit rows with generic ProcessEvent stream");
api.setScenario("synthetic_test",[
 {node:"request",seq:1,label:"<script>alert('x')</script>",detail:"<img src=x onerror=alert(1)>",kind:"workflow.start",refs:["file<unsafe>"]}
],0);
api.select("request");
assert.ok(!el.innerHTML.includes("<script>")&&!el.innerHTML.includes("<img "),
 "Untrusted event data must be escaped");
assert.ok(el.innerHTML.includes("&lt;script&gt;")&&el.innerHTML.includes("&lt;img"),
 "Escaped fixture text should still be visible");
assert.equal(api.select("not_a_node"),false);
api.close();
assert.equal(el.hidden,true);
assert.equal(el.innerHTML,"");
console.log("Module inspector: 20 definitions, exact trace provenance, source-only gaps, scenario switching and HTML escaping passed.");
