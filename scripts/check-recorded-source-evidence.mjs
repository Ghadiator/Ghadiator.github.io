/** Verify recorded fixture identity and complete event evidence.
 * The canonical React workbench owns the source grid. No external overlay
 * may be required or injected into the compiled release.
 */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,existsSync} from "node:fs";
const bytes=path=>readFileSync(new URL("../"+path,import.meta.url));
const json=path=>JSON.parse(bytes(path).toString("utf8"));
const blob=value=>createHash("sha1").update("blob "+value.byteLength+"\0").update(value).digest("hex");
const manifest=json(".site-release.json");
const routes=new Set(manifest.published_routes);
const canonical=routes.has("workspace/case")&&routes.has("failure-lab");
const caseFile=bytes("data/cases.json");
const cases=json("data/cases.json").cases;
const metrics=json("data/recorded-kpi-evidence.json");
const governance=json("data/synthetic-governance-metrics.json");
assert.equal(cases.length,15,"All fifteen recorded cases must survive");
assert.equal(blob(caseFile),metrics.source_git_blob_sha,
  "Published source identity must match the actual case JSON");
assert.equal(blob(caseFile),governance.cases_blob_sha,
  "Synthetic analytics must refer to the same exact case file");
assert.equal(governance.scope,"recorded_scripted_supplier_fixtures_only");
assert.equal(metrics.scope,"synthetic_fixture_only");
assert.equal(metrics.counts.recorded_cases,15);
assert.equal(metrics.counts.validation_checks,208);
assert.equal(metrics.counts.emitted_events,571);
assert.ok(existsSync(new URL("../"+(canonical?"workspace/case":"case")+"/index.html",import.meta.url)),
  "Recorded case detail must be exported in one canonical place");
assert.ok(existsSync(new URL("../workspace/index.html",import.meta.url)),
  "Workspace case queue must be exported");
let totalChecks=0,totalEvents=0;
const bySlug=new Map(cases.map(c=>[c.slug,c]));
assert.equal(bySlug.size,15,"Duplicate fixture case identifiers");
for(const c of cases){
 const eventFile=bytes("data/scenarios/"+c.slug+".json");
 const events=JSON.parse(eventFile.toString("utf8")).events;
 assert.equal(events.length,c.event_count,"Event count must match the case metadata: "+c.slug);
 assert.ok(events.every((e,i)=>e.seq===i+1),"Event sequence must remain gap-free: "+c.slug);
 const attached=governance.per_case.find(r=>r.slug===c.slug);
 assert.ok(attached,"Missing governance metric provenance: "+c.slug);
 assert.equal(blob(eventFile),attached.scenario_blob_sha,"Scenario source hash drift: "+c.slug);
 totalEvents+=events.length;
 totalChecks+=(c.checks||[]).length+(c.contract_checks||[]).length;
}
assert.equal(totalEvents,571,"Full recorded audit sequence must be preserved");
assert.equal(totalChecks,208,"Full deterministic and crosscheck evidence must be preserved");
if(canonical){
 for(const removed of ["case","cases","red-team","introduction","analytics","tickets/new","workflow-reference"])
   assert.ok(!routes.has(removed),"No legacy route may remain: /"+removed);
}
console.log("PASS native case provenance:",cases.length,"cases,",totalChecks,
  "checks,",totalEvents,"source events, all SHA-1 Git blob pins valid.");
