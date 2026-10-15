(function install(){
"use strict";
function renderEvidence(ctx){
 const s=ctx.state,e=ctx.h,rows=s.index?.scenarios||[],tab=s.evidenceTab||"reports";
 const counts=(state)=>rows.filter(r=>r.terminal_state===state).length;
 const selected=rows.find(r=>r.slug===s.scenario)||rows[0];
 const button=(value,label)=>`<button type="button" class="wb-tab ${tab===value?"selected":""}" data-evidence-tab="${value}" aria-pressed="${tab===value}">${label}</button>`;
 const list=`<div class="wb-local-rows">${rows.map(r=>`<article class="wb-local-row"><span><strong>${e(r.title)}</strong><small>${e(r.one_liner)}</small><small>${e(r.terminal_state.replaceAll("_"," "))} · ${Number(r.event_count)||0} recorded events · Human gate ${r.reached_human_gate?"reached":"not reached"}</small></span><a class="wb-button" data-view="case" href="?view=case&scenario=${encodeURIComponent(r.slug)}">Case evidence ↗</a></article>`).join("")}</div>`;
 const reports=`<section class="wb-panel"><div class="wb-panel-head"><h2>Case outcomes · executed synthetic fixtures</h2></div>
 <div class="wb-panel-body"><div class="wb-metrics"><div class="wb-metric"><span class="wb-metric-label">Recorded cases</span><strong>${rows.length}</strong><small>Deliberately selected scenarios</small></div>
 <div class="wb-metric"><span class="wb-metric-label">Approved outcomes</span><strong>${counts("Approved")}</strong><small>Recorded fixture dispositions</small></div>
 <div class="wb-metric"><span class="wb-metric-label">Rejected outcomes</span><strong>${counts("Rejected")}</strong><small>Not a supplier rejection rate</small></div>
 <div class="wb-metric"><span class="wb-metric-label">Human gate reached</span><strong>${rows.filter(r=>r.reached_human_gate).length}</strong><small>As recorded by reference runner</small></div></div>
 <div class="wb-local-rows">${list}</div></div></section>`;
 const rules=s.loaded.rules?.rules||[];
 const lessons=`<section class="wb-panel"><div class="wb-panel-head"><h2>Lessons learned · mechanism and boundary</h2></div>
 <div class="wb-panel-body"><p>The generic validation design can turn reviewed exceptions, corrections and control findings into a lessons-learned ledger once the authoritative backend provides it. No persistent learning ledger is published in this static reference.</p>
 <div class="wb-notice"><strong>Current evidence:</strong> ${rows.length} executed fixtures and ${rules.length} published control rules${rules.length?"":" (rule catalogue loading)"}. These are controls and examples, <strong>not</strong> entries that a learning agent generated.</div>
 <div class="wb-grid">${rules.slice(0,6).map(r=>`<article class="wb-small-card"><small>${e(r.mechanism_type)}</small><h3>${e(r.title)}</h3><p>${e(r.principle)}</p><code>${e(r.evidence_ref)}</code></article>`).join("")}</div>
 <p class="wb-file-hint">Future generic backend: source event → reviewed finding → approved lesson → versioned rule or control update → audit link. No automatic policy change is permitted from an unverified model suggestion.</p></div></section>`;
 const events=ctx.events();
 const trace=`<section class="wb-panel"><div class="wb-panel-head"><h2>What the engine can explain</h2></div>
 <div class="wb-panel-body"><p>Selected case: <strong>${e(selected?.title||"Loading case")}</strong>. ${e(selected?.one_liner||"")}</p>
 <div class="wb-local-rows">${events.slice(0,12).map(x=>`<div class="wb-local-row"><span><strong>${e(x.label)}</strong><small>${e(x.detail||"")}</small><small>Event ${Number(x.seq)} · ${e(x.stage)} · ${e(x.actor)}</small></span></div>`).join("")||'<p>Recorded events are loading from the verified source file.</p>'}</div>
 <div class="wb-inline-actions"><a class="wb-button" data-view="audit" href="?view=audit">Open complete audit trace ↗</a></div></div></section>`;
 return `<div class="wb-page"><div class="wb-head"><div><span class="wb-kicker">05 · MEASURE · EXPLAIN · LEARN</span><h1>Evidence & learning</h1>
 <p>Follow validated cases, inspect why a decision was recorded, and examine the controls that future reviewed lessons can improve. Every claim distinguishes source-backed fixtures from future live capabilities.</p></div></div>
 <div class="wb-tabs" role="group" aria-label="Evidence and learning sections">${button("reports","Case reports")}${button("learning","Lessons learned")}${button("trace","Decision trace")}</div>
 ${tab==="learning"?lessons:tab==="trace"?trace:reports}
 <div class="wb-notice"><strong>Evidence boundary:</strong> published cases are synthetic and scripted; they are not production outcomes, actual AI learning, or live backend reports.</div></div>`;
}
window.StoryJourney={renderEvidence};
})();
