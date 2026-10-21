(function install(){
"use strict";
function renderEvidence(ctx){
 const s=ctx.state,e=ctx.h,rows=s.index?.scenarios||[],tab=s.evidenceTab==="learning"?"learning":"trace";
 const selected=rows.find(r=>r.slug===s.scenario)||rows[0];
 const button=(value,label)=>`<button type="button" class="wb-tab ${tab===value?"selected":""}" data-evidence-tab="${value}" aria-pressed="${tab===value}">${label}</button>`;
 const rules=s.loaded.rules?.rules||[];
 const designChoices=[
  ['Deterministic checks first','Use explicit rules for arithmetic and contract facts. Keep interpretation bounded to exceptional cases.','Rule coverage depends on the encoded checks and the quality of authoritative inputs.'],
  ['Verify before summarising','Treat a proposed finding as a claim. Require evidence verification before it can inform the reviewer summary.','The public supplier trace demonstrates its recorded verifier; it does not execute every layer in the broader architecture.'],
  ['Keep human decision authority','Separate the review package from the human approval, rejection or correction decision.','A recorded gate demonstrates the workflow boundary; production authorisation and reviewer competence require deployment controls.'],
  ['Bound recovery and preserve evidence','Make adapter failures, proposal limits and corrections inspectable alongside the event history.','These cases use scripted roles and fixture storage; they do not establish live-model reliability or durable audit retention.']
 ];
 const lessons=`<section class="wb-panel design-decisions"><div class="wb-panel-head"><h2>Design decisions &amp; tradeoffs</h2></div><div class="wb-panel-body"><p>How the reference workflow translates governance concerns into engineering choices.</p><div class="wb-grid">${designChoices.map(([title,reason,boundary])=>`<article class="wb-small-card"><small>ENGINEERING CHOICE</small><h3>${title}</h3><p>${reason}</p><p class="design-boundary"><strong>Remaining boundary</strong> ${boundary}</p></article>`).join('')}</div></div></section>
 <section class="wb-panel"><div class="wb-panel-head"><h2>Lessons learned · mechanism and boundary</h2></div>
 <div class="wb-panel-body"><p>The generic validation design can turn reviewed exceptions, corrections and control findings into a lessons-learned ledger once the authoritative backend provides it. No persistent learning ledger is published in this static reference.</p>
 <div class="wb-notice"><strong>Current evidence:</strong> ${rows.length} executed fixtures and ${rules.length} published control rules${rules.length?"":" (rule catalogue loading)"}. These are controls and examples, <strong>not</strong> entries that a learning agent generated.</div>
 <div class="wb-grid">${rules.slice(0,6).map(r=>`<article class="wb-small-card"><small>${e(r.mechanism_type)}</small><h3>${e(r.title)}</h3><p>${e(r.principle)}</p><code>${e(r.evidence_ref)}</code></article>`).join("")}</div>
 <p class="wb-file-hint">Future generic backend: source event → reviewed finding → approved lesson → versioned rule or control update → audit link. No automatic policy change is permitted from an unverified model suggestion.</p></div></section>`;
 const events=ctx.events();
 const journey=selected?`<nav class="run-journey" aria-label="Selected run journey">
   <div class="run-journey-id"><span class="run-journey-eyebrow">RECORDED RUN · ${e(selected.slug)}</span><strong>${e(selected.title)}</strong><span class="run-journey-note">Synthetic reference execution · ${e(selected.terminal_state.replaceAll("_"," "))}</span></div>
   <div class="run-journey-links">
    <a data-view="case" data-scenario="${e(selected.slug)}" href="?view=case&amp;scenario=${encodeURIComponent(selected.slug)}">1 · Case detail</a>
    <a data-view="architecture" data-scenario="${e(selected.slug)}" href="?view=architecture&amp;scenario=${encodeURIComponent(selected.slug)}">2 · Architecture</a>
    <span class="active" aria-current="step">3 · Decision evidence</span>
   </div>
  </nav>`:"";
 const trace=`<section class="wb-panel"><div class="wb-panel-head"><h2>What the engine can explain</h2></div>
 <div class="wb-panel-body"><p>Selected run: <strong>${e(selected?.title||"Loading case")}</strong>. ${e(selected?.one_liner||"")}</p><p class="wb-file-hint">Previewing the first ${Math.min(events.length,12)} of ${events.length} verified recorded events. For every event and the original source JSON, open the complete audit trace.</p>
 <div class="wb-local-rows">${events.slice(0,12).map(x=>`<div class="wb-local-row"><span><strong>${e(x.label)}</strong><small>${e(x.detail||"")}</small><small>Event ${Number(x.seq)} · ${e(x.stage)} · ${e(x.actor)}</small></span></div>`).join("")||'<p>Recorded events are loading from the verified source file.</p>'}</div>
 <div class="wb-inline-actions"><a class="wb-button" data-view="audit" data-scenario="${e(selected?.slug||s.scenario)}" href="?view=audit&amp;scenario=${encodeURIComponent(selected?.slug||s.scenario)}">Open complete audit trace ↗</a></div></div></section>`;
 return `<div class="wb-page"><div class="wb-head"><div><span class="wb-kicker">05 · MEASURE · EXPLAIN · LEARN</span><h1>Evidence & learning</h1>
 <p>Inspect a recorded decision and the engineering lessons behind its controls.</p></div></div>
 ${tab==="trace"?journey:""}
 <div class="wb-tabs" role="group" aria-label="Evidence and learning sections">${button("trace","Decision trace")}${button("learning","Lessons learned")}</div>
 ${tab==="learning"?lessons:trace}
 <div class="wb-notice"><strong>Evidence boundary:</strong> published cases are synthetic and scripted; they are not production outcomes, actual AI learning, or live backend reports.</div></div>`;
}
window.StoryJourney={renderEvidence};
})();
