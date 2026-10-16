(function installGenericWorkbench(){
  "use strict";
  const safe=(ctx,v)=>ctx.h(v??"");
  const goto=(view,slug)=>`?view=${encodeURIComponent(view)}${slug?`&scenario=${encodeURIComponent(slug)}`:""}`;
  const empty=(title,message)=>`<div class="wb-empty"><strong>${title}</strong><p>${message}</p></div>`;
  const notice=(text)=>`<div class="wb-notice">${text}</div>`;
  const hero=(kicker,title,summary,actions="")=>`<div class="wb-head"><div><span class="wb-kicker">${kicker}</span><h1>${title}</h1><p>${summary}</p></div><div class="wb-head-actions">${actions}</div></div>`;
  const action=(v,label,scenario)=>`<a class="wb-button" data-view="${v}" ${scenario?`data-scenario="${encodeURIComponent(scenario)}"`:""} href="${goto(v,scenario)}">${label} <span aria-hidden="true">↗</span></a>`;
  const panel=(title,children,extra="")=>`<section class="wb-panel"><div class="wb-panel-head"><h2>${title}</h2>${extra}</div><div class="wb-panel-body">${children}</div></section>`;
  const chips=(items)=>`<div class="wb-chip-row">${items.map(x=>`<span class="wb-chip">${x}</span>`).join("")}</div>`;
  const pills=(list,selected,prefix)=>`<div class="wb-tabs" role="group" aria-label="View selection">${list.map(([key,label])=>`<button type="button" class="wb-tab ${selected===key?"selected":""}" data-wb-tab="${prefix}:${key}" aria-pressed="${selected===key}">${label}</button>`).join("")}</div>`;
  const card=(value,title,note)=>`<div class="wb-metric"><span class="wb-metric-label">${title}</span><strong>${value}</strong><small>${note}</small></div>`;
  const stateLabel=(ctx,s)=>`<span class="wb-status">${safe(ctx,s.terminal_state).replaceAll("_"," ")}</span>`;
  const all=(ctx)=>ctx.state.index?.scenarios||[];
  const selected=(ctx)=>ctx.currentCase();
  const docs=(ctx)=>ctx.scenarioData();
  const events=(ctx)=>ctx.events();
  const hydrateHint=()=>notice(`<strong>Recorded fixture view.</strong> All displayed evidence comes from synthetic supplier invoice runs. This public static site cannot receive email, send requests, execute provider models or resume a real reviewer session.`);
  function overview(ctx){
    const rows=all(ctx);const count=(s)=>rows.filter(r=>r.terminal_state===s).length;
    const c=ctx.state.facts?.facts||[];
    const fact=(id,fallback)=>safe(ctx,c.find(x=>x.id===id)?.display??fallback);
    const status=panel("Case outcomes in recorded fixtures",`<div class="wb-bars">${[["Approved",count("Approved")],["Rejected",count("Rejected")],["Awaiting_reviewer",count("Awaiting_reviewer")],["Awaiting_supplier",count("Awaiting_supplier")],["Intake_rejected",count("Intake_rejected")]].map(([name,n])=>`<div class="wb-bar-row"><span>${safe(ctx,name).replaceAll("_"," ")}</span><div class="wb-track"><span style="width:${rows.length?Math.round(100*n/rows.length):0}%"></span></div><strong>${n}</strong></div>`).join("")}</div><p class="wb-foot">A distribution across published synthetic scenarios, not real supplier throughput.</p>`);
    const steps=["Document request","Typed invoice intake","Rule checks","Contract cross-check","Adversarial committee","Human review","Recorded disposition","Evidence archive","Source traceability"];
    return `<div class="wb-page">${hero("SUPPLIER VALIDATION · GENERIC DASHBOARD","Validation dashboard","DAiA-style overview mapped to the public supplier reference. Counts are traceable to executed fixture exports.",action("architecture","View scenario theater")+action("cases","Review recorded cases"))}
      <div class="wb-metrics">${card(fact("supplier_scenarios",rows.length),"Recorded scenarios","Executed synthetic cases")}${card(fact("deterministic_checks",14),"Deterministic checks","Six invoice + eight contract checks")}${card("0","Live model calls","Scripted personas, no provider usage")}${card(fact("control_probes",7),"Control probes","Deterministic fixture tests")}</div>
      ${panel("Validation flow · nine-step workbench view",`<div class="wb-steps">${steps.map((s,i)=>`<div class="wb-step"><b>${String(i+1).padStart(2,"0")}</b><span>${s}</span></div>`).join("")}</div><p class="wb-foot">A navigation summary. The complete interactive 20-block modular architecture remains available separately.</p>${action("architecture","Open modular architecture")}`)}
      <div class="wb-two">${status}${panel("Quick access",`<div class="wb-quick">${[["tickets","Document requests"],["inbound","Intake correspondence"],["cases","Reviewed cases"],["architecture","Interactive architecture"],["tokens","Committee token controls"],["dashboard","Outcome summary"],["governance","Governance"],["integration","Integration"],["audit","Process audit"]].map(([id,name])=>`<a data-view="${id}" href="${goto(id)}">${name}<span>↗</span></a>`).join("")}</div>`)}</div>
      ${hydrateHint()}</div>`;
  }
  function tickets(ctx){
    const items=all(ctx);const search=ctx.state.search.toLowerCase(),filter=ctx.state.filter||"all";
    const filtered=items.filter(r=>(filter==="all"||r.terminal_state===filter)&&`${r.title} ${r.one_liner} ${r.slug}`.toLowerCase().includes(search));
    const controls=`<div class="wb-toolbar"><input type="search" id="caseSearch" placeholder="Search recorded requests" value="${safe(ctx,ctx.state.search)}" aria-label="Search recorded requests"/><select id="caseFilter" aria-label="Request status"><option value="all">All recorded requests</option>${[...new Set(items.map(x=>x.terminal_state))].map(s=>`<option value="${safe(ctx,s)}" ${filter===s?"selected":""}>${safe(ctx,s).replaceAll("_"," ")}</option>`).join("")}</select></div>`;
    return `<div class="wb-page">${hero("COLLECTION WORKBENCH","Document requests","Supplier-document collection records derived from the same executed fixtures—not a live ticketing inbox.",action("submissions","Create a submission"))}${chips(["All fixture-originated","No outbound email","Human authority preserved"])}${controls}
      ${panel("Request register",`<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Request / scenario</th><th>Review route</th><th>Recorded outcome</th><th>Events</th><th></th></tr></thead><tbody>${filtered.map(r=>`<tr><td><strong>${safe(ctx,r.title)}</strong><small>${safe(ctx,r.one_liner)}</small></td><td>${safe(ctx,r.group)}</td><td>${stateLabel(ctx,r)}</td><td>${Number(r.event_count)||0}</td><td><a data-view="ticket" data-scenario="${safe(ctx,r.slug)}" href="${goto("ticket",r.slug)}">Open →</a></td></tr>`).join("")}</tbody></table>${filtered.length?"":empty("No matching requests","Try another filter or search term.")}</div>`)}
      ${hydrateHint()}</div>`;
  }
  function inbound(ctx){
    const es=events(ctx),received=es.filter(e=>e.kind==="intake.received"||e.kind==="intake.rejected"||e.kind==="collection.reminder");
    const isPending=ctx.state.workbenchTab!=="unmatched";
    return `<div class="wb-page">${hero("INTAKE & CORRESPONDENCE","Inbound intake","DAiA's inbound review pools adapted to the supplier workflow. Only recorded fixture events are shown.",action("submissions","Document collection"))}${ctx.renderCaseSelector()}
    ${pills([["pending","Case-bound intake"],["unmatched","Unmatched correspondence"]],isPending?"pending":"unmatched","inbound")}
    ${isPending?panel("Recorded intake / collection activity",received.length?`<div class="wb-list">${received.map(e=>`<button type="button" class="wb-list-row" data-event="${es.indexOf(e)}"><b>${String(e.seq).padStart(2,"0")}</b><span><strong>${safe(ctx,e.label)}</strong><small>${safe(ctx,e.detail||"No detail recorded")}</small></span><em>${safe(ctx,e.actor)}</em></button>`).join("")}</div>`:empty("No intake events","Select a fixture with intake or reminders.")):panel("Unmatched supplier mail",empty("No unmatched-mail records are published","The supplier fixture does not emit an unmatched-email pool. A blank live inbox cannot be inferred from this synthetic trace."))}
    ${hydrateHint()}</div>`;
  }
  function cases(ctx){
    const rows=all(ctx),filter=ctx.state.caseFilter??ctx.state.filter??"all",query=(ctx.state.caseSearch??ctx.state.search??"").toLowerCase();
    const items=rows.filter(r=>(filter==="all"||r.terminal_state===filter)&&`${r.title} ${r.one_liner} ${r.group}`.toLowerCase().includes(query));
    return `<div class="wb-page">${hero("VALIDATION · CASE WORKBENCH","Recorded cases","Search synthetic supplier-review runs by scenario and outcome. Each result links to its recorded decision path, architecture, and original event evidence.",action("architecture","Explore architecture"))}
    <div class="case-register-summary"><strong>${rows.length} recorded runs</strong><span>${rows.filter(r=>r.reached_human_gate).length} reached a human decision gate</span><span>0 production supplier cases</span></div>
    <div class="wb-toolbar"><input id="caseSearch" type="search" value="${safe(ctx,ctx.state.caseSearch??ctx.state.search)}" placeholder="Search cases, outcomes, controls" aria-label="Search cases"/><select id="caseFilter" aria-label="Case status"><option value="all">All outcomes</option>${[...new Set(rows.map(r=>r.terminal_state))].map(s=>`<option value="${safe(ctx,s)}" ${s===filter?"selected":""}>${safe(ctx,s).replaceAll("_"," ")}</option>`).join("")}</select>${filter!=="all"||query?`<button type="button" class="wb-clear-filters" data-clear-case-filters>Clear filters</button>`:""}</div>
    ${panel(`Case register · ${items.length} of ${rows.length} recorded runs`,`<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Recorded run / purpose</th><th>Scenario type</th><th>Recorded outcome</th><th>Human gate</th><th><span class="sr-only">Open record</span></th></tr></thead><tbody>${items.map(r=>`<tr><td><strong>${safe(ctx,r.title)}</strong><small>${safe(ctx,r.one_liner)}</small><code class="case-run-id">${safe(ctx,r.slug)}</code></td><td>${safe(ctx,r.group)}</td><td>${stateLabel(ctx,r)}</td><td><span class="case-gate-label">${r.reached_human_gate?"Reached":"Not reached"}</span></td><td><a class="case-open-link" data-view="case" data-scenario="${safe(ctx,r.slug)}" href="${goto("case",r.slug)}" aria-label="Inspect recorded run ${safe(ctx,r.slug)}">Inspect →</a></td></tr>`).join("")}</tbody></table>${items.length?"":empty("No matching runs","Adjust the search or use Clear filters to see all recorded scenarios.")}</div>`)}
    ${hydrateHint()}</div>`;
  }
  function committee(ctx){
    const es=events(ctx),found=(kind)=>es.find(e=>e.kind===kind);
    const mk=(kind,title,desc)=>{const e=found(kind);return `<div class="wb-debate"><span>${title}</span><p>${e?safe(ctx,e.detail):"No event of this type emitted in the selected supplier fixture."}</p><small>${desc}</small></div>`};
    return `<div class="wb-committee"><div class="wb-committee-head"><strong>Scripted adversarial committee</strong><span>Evidence-first · no live-model call</span></div>
      <div class="wb-committee-grid">${mk("committee.proponent.argument","Proponent","Proposal · not a decision")}${mk("committee.opponent.argument","Opponent","Contested finding · unverified")}${mk("verification.result","Pre-Judge CoVe","Grounding against invoice and contract")}${mk("committee.judge.argument","Judge","Advisory package only")}</div>
      <p class="wb-foot">The broader source architecture includes a separate post-Judge CoVe step, bounded retries, and configurable token controls. The supplier fixture does not emit that separate post-Judge event.</p></div>`;
  }
  function monitor(ctx){
    const es=events(ctx),e=ctx.activeEvent(),d=docs(ctx),i=ctx.state.eventIndex;
    const active=e?.stage??"",stages=d?.stages||[];
    return `<div class="wb-page">${hero("RECORDED SCENARIO THEATER","Validation scenarios","DAiA's interactive validation theater translated to supplier invoice checks, scripted committee roles, and human oversight.",action("architecture","Modular architecture"))}
      ${ctx.renderCaseSelector()}${notice("<strong>No live run:</strong> The controls replay original, sequentially recorded fixture events, not a network model execution.")}
      ${panel("Validation cascade",`<div class="wb-stage-grid">${stages.map((s,j)=>`<button type="button" data-stage="${safe(ctx,s)}" class="wb-stage ${active===s?"current":""}"><b>${String(j+1).padStart(2,"0")}</b><span>${safe(ctx,ctx.DISPLAY_STAGES[s]||s)}</span><small>${es.filter(e=>e.stage===s).length} events</small></button>`).join("")}</div>
      <div class="wb-playback"><button data-action="reset">↺ Reset</button><button data-action="prev">← Previous</button><button class="wb-primary" data-action="toggle-play">${ctx.state.playing?"Pause":"Play"} recorded events</button><button data-action="next">Next →</button><strong>${es.length?`${i+1} / ${es.length}`:"No event file loaded"}</strong></div>`)}
      <div class="wb-two">${panel("Current evidence",e?`<div class="wb-current"><strong>${safe(ctx,e.label)}</strong><p>${safe(ctx,e.detail)}</p>${chips([safe(ctx,e.kind),safe(ctx,e.actor),`Event ${e.seq}`])}</div>`:empty("Select an event","The recorded case event file is loading or unavailable."))}${panel("Trace navigator",ctx.renderTimeline())}</div>
      ${committee(ctx)}${hydrateHint()}</div>`;
  }
  function economics(ctx){
    return `<div class="wb-page">${hero("RESOURCE GOVERNANCE · COMMITTEE","Token economics","DAiA's token-control board adapted to the generic committee. No fictitious usage figures or budget savings are shown.",action("architecture","Open committee on architecture"))}
    <div class="wb-metrics">${card(0,"Live model tokens","Supplier fixtures use scripted roles")}${card(0,"Provider charges observed","No model billing evidence in these runs")}${card("Bounded","Proposal loop","Up to four structured proposals in fixture")}${card("Conditional","Retries / fallback","Broader source only; not a fixture run")}</div>
    ${panel("Committee-scoped resource controls",`<div class="wb-resource"><div><span>01</span><strong>Admission & budget guard</strong><p>Configured provider rate budgets and token windows may constrain model calls in the broader source system.</p></div><div><span>02</span><strong>Proponent · Opponent · CoVe · Judge</strong><p>Verification is mandatory; cost constraints never authorise bypassing the checked-claim chain.</p></div><div><span>03</span><strong>Bounded recovery</strong><p>Retry or fallback is conditional and capped, with a safe deferral to human review when the budget is exhausted.</p></div></div>`)}
    ${notice("<strong>Implementation boundary:</strong> The real workflow has token-economics source modules, but this supplier reference has no live provider usage, token log, provider latency or measured cash savings.")}
    ${committee(ctx)}</div>`;
  }
  function pool(ctx){
    const rows=all(ctx);const count=s=>rows.filter(r=>r.terminal_state===s).length;
    const grouped={};rows.forEach(r=>{grouped[r.group]=(grouped[r.group]||0)+1});
    return `<div class="wb-page">${hero("AGGREGATED REFERENCE EVIDENCE","Pool analytics","DAiA's cross-case analytics adapted to a bounded set of executed synthetic supplier scenarios.",action("cases","Inspect case register"))}
    <div class="wb-metrics">${card(rows.length,"Scenario population","Not a supplier portfolio")}${card(count("Approved"),"Approved fixture outcomes","Recorded reviewer decisions")}${card(count("Rejected"),"Rejected fixture outcomes","Recorded terminal outcomes")}${card(rows.filter(r=>r.reached_human_gate).length,"Reached human gate","HITL in reference workflow")}</div>
    <div class="wb-two">${panel("Case outcome distribution",`<div class="wb-bars">${[...new Set(rows.map(r=>r.terminal_state))].map(k=>{const n=count(k);return `<div class="wb-bar-row"><span>${safe(ctx,k).replaceAll("_"," ")}</span><div class="wb-track"><span style="width:${rows.length?100*n/rows.length:0}%"></span></div><b>${n}</b></div>`}).join("")}</div>`)}
    ${panel("Scenario groups",`<div class="wb-bars">${Object.entries(grouped).map(([k,n])=>`<div class="wb-bar-row"><span>${safe(ctx,k)}</span><div class="wb-track"><span style="width:${rows.length?100*n/rows.length:0}%"></span></div><b>${n}</b></div>`).join("")}</div>`)}</div>
    ${notice("<strong>Not production portfolio analytics.</strong> These descriptive figures aggregate deliberately selected test scenarios. They cannot be interpreted as supplier risk rates, model accuracy, automation savings or operational performance.")}</div>`;
  }
  function detail(ctx){
    const r=selected(ctx),es=events(ctx),d=docs(ctx);
    const rev=es.filter(x=>x.actor==="human"),decision=es.find(x=>x.kind==="hitl.resumed");
    const intake=es.filter(x=>/^(intake|submission|invoice|document|contract)\./.test(x.kind)).slice(0,12);
    return `<div class="wb-page">
    <nav class="run-journey" aria-label="Selected run journey">
      <div class="run-journey-id"><span class="run-journey-eyebrow">RECORDED RUN · ${safe(ctx,r.slug)}</span><strong>${safe(ctx,r.title)}</strong><span class="run-journey-note">Synthetic reference execution · ${safe(ctx,r.terminal_state.replaceAll("_"," "))}</span></div>
      <div class="run-journey-links">
        <span class="active" aria-current="step">1 · Case detail</span>
        <a data-view="architecture" data-scenario="${safe(ctx,r.slug)}" href="${goto("architecture",r.slug)}">2 · Architecture →</a>
        <a data-journey-trace data-scenario="${safe(ctx,r.slug)}" href="?view=evidence&amp;scenario=${encodeURIComponent(r.slug)}&amp;tab=trace">3 · Decision evidence →</a>
      </div>
    </nav>
    ${hero("RECORDED CASE · "+safe(ctx,r.slug),"Case review · "+safe(ctx,r.title),safe(ctx,r.one_liner),action("cases","← Back to cases"))}
    <div class="case-detail-facts"><div><span>Recorded outcome</span><strong>${stateLabel(ctx,r)}</strong></div><div><span>Original events</span><strong>${es.length||r.event_count}</strong></div><div><span>Human gate</span><strong>${r.reached_human_gate?"Reached":"Not reached"}</strong></div><div><span>AI proposal interface</span><strong>Scripted · no live LLM</strong></div></div>
    ${pills([["summary","Summary"],["submission","Submission & context"],["committee","Checks & verification"],["human","Human decision"],["timeline","Audit events"]],ctx.state.workbenchTab||"summary","case")}
    ${(ctx.state.workbenchTab==="committee")?committee(ctx):ctx.state.workbenchTab==="timeline"?panel("Complete event log",ctx.renderTimeline()+`<div class="wb-inline-actions"><a class="wb-button" data-view="audit" data-scenario="${safe(ctx,r.slug)}" href="${goto("audit",r.slug)}">Open full event inspector →</a></div>`):ctx.state.workbenchTab==="submission"?panel("Submission and contract context",intake.length?`<div class="wb-list">${intake.map(e=>`<div class="wb-list-row"><b>${safe(ctx,e.seq)}</b><span><strong>${safe(ctx,e.label)}</strong><small>${safe(ctx,e.detail)}</small></span></div>`).join("")}</div>`:empty("No specific intake events loaded","Consult the original scenario JSON for the recorded input context.")):ctx.state.workbenchTab==="human"?panel("Human-review evidence",rev.length?`<div class="wb-list">${rev.map(e=>`<div class="wb-list-row"><b>${e.seq}</b><span><strong>${safe(ctx,e.label)}</strong><small>${safe(ctx,e.detail)}</small></span></div>`).join("")}</div>`:empty("No human event","This fixture did not emit a human decision event.")):panel("Outcome, authority & evidence",`<div class="case-summary-grid"><div><h3>What happened</h3><p>${safe(ctx,r.one_liner)}</p><dl class="wb-defs"><dt>Scenario type</dt><dd>${safe(ctx,r.group)}</dd><dt>Recorded disposition</dt><dd>${stateLabel(ctx,r)}</dd><dt>Authority</dt><dd>${decision?"Recorded human reviewer event":"No recorded reviewer disposition in the loaded event stream"}</dd></dl></div><div class="case-review-evidence"><h3>Human decision evidence</h3>${decision?`<strong>${safe(ctx,decision.label)}</strong><p>${safe(ctx,decision.detail)}</p><span class="run-journey-eyebrow">EVENT ${safe(ctx,decision.seq)}</span>`:empty("No reviewer decision recorded",r.reached_human_gate?"This run reached human review, but no final decision event appears in the loaded trace.":"This scenario did not reach a recorded human decision gate.")}</div></div><div class="case-source-footer"><span><strong>Original run:</strong> <code>data/scenarios/${safe(ctx,r.slug)}.json</code></span><p>${safe(ctx,d?.provenance?.derivation??"Evidence is loading from the published supplier reference run.")}</p><a class="wb-button" data-journey-trace data-scenario="${safe(ctx,r.slug)}" href="?view=evidence&amp;scenario=${encodeURIComponent(r.slug)}&amp;tab=trace">Inspect source-backed decision trace →</a></div>`)}
    ${notice("<strong>Read-only detail.</strong> No approve, reject, or request-changes action is provided here: decisions shown are already emitted by the supplier fixture, not executed by this browser.")}</div>`;
  }
  function ticket(ctx){
    const r=selected(ctx),es=events(ctx),collection=es.filter(x=>x.stage==="request"||x.stage==="reminders"||x.stage==="ingest");
    return `<div class="wb-page">${hero("REQUEST DETAIL","Document collection · "+safe(ctx,r.title),"DAiA request detail layout, populated only from the recorded supplier collection events.",action("submissions","Document collection")+action("case","Linked case",r.slug))}
    ${panel("Request summary",`<dl class="wb-defs"><dt>Scenario reference</dt><dd>${safe(ctx,r.slug)}</dd><dt>Recorded outcome</dt><dd>${stateLabel(ctx,r)}</dd><dt>Human gate reached</dt><dd>${r.reached_human_gate?"Yes":"No"}</dd><dt>Mail transport</dt><dd>Fixture outbox only; no messages delivered</dd></dl>`)}
    ${panel("Collection timeline",collection.length?`<div class="wb-list">${collection.map(e=>`<div class="wb-list-row"><b>${e.seq}</b><span><strong>${safe(ctx,e.label)}</strong><small>${safe(ctx,e.detail)}</small></span></div>`).join("")}</div>`:empty("No recorded collection event","The selected fixture has no matching collection rows in its public trace."))}
    ${notice("Supplier notifications, reviewer assignments and correspondence composer in DAiA require private APIs. This public counterpart shows authentic emitted fixture records instead.")}</div>`;
  }
  function newticket(ctx){
    return `<div class="wb-page">${hero("REQUEST CREATION · DESIGN-ONLY","Draft document request","This reproduces the DAiA new-ticket form without pretending that a public static portfolio can open live cases.",action("submissions","Document collection"))}
    ${panel("New supplier request · local preview",`<form id="wb-draft-form" class="wb-form"><label>Supplier reference<input name="supplier" required maxlength="90" placeholder="e.g. Supplier A (example)" autocomplete="off"/></label><label>Document type<select name="document"><option>Invoice</option><option>Service report</option><option>Corrected invoice</option></select></label><label>Review purpose<textarea name="purpose" placeholder="What needs to be checked?" rows="4" maxlength="400"></textarea></label><div class="wb-form-actions"><button type="submit" class="wb-primary">Preview request (no send)</button><span>Local preview only · no submission or storage</span></div></form><div id="wb-draft-preview" class="wb-preview" role="status" aria-live="polite"></div>`)}
    ${hydrateHint()}</div>`;
  }
  function governanceHub(ctx,renderOriginal){
    const k=ctx.state.workbenchTab||"system";const r=ctx.state.loaded.rules?.rules||[];
    const orig=renderOriginal();
    return `<div class="wb-page">${hero("AI ASSURANCE · GOVERNANCE","Governance controls","Inspect each proposed obligation alongside its implemented control, published evidence and explicit limitation.",action("evidence","Inspect evidence"))}
    ${pills([["system","System card"],["controls","Obligation mappings"],["rules","Implemented rules"],["incidents","Incident scope"]],k,"gov")}
    ${k==="controls"?orig:k==="rules"?panel("Reference rule catalog",r.length?`<div class="wb-grid">${r.map(x=>`<article class="wb-small-card"><small>${safe(ctx,x.mechanism_type)}</small><h3>${safe(ctx,x.title)}</h3><p>${safe(ctx,x.principle)}</p><code>${safe(ctx,x.evidence_ref)}</code></article>`).join("")}</div>`:empty("Ruleset file is not loaded","The verified original rule catalogue has not been fetched.")):k==="system"?panel("Public system card",`<dl class="wb-defs"><dt>Intended purpose</dt><dd>Reference supplier-invoice checks and human-gated decisions</dd><dt>Model deployment</dt><dd>No live LLM in public fixtures</dd><dt>Human oversight</dt><dd>Named reviewer retains final authority</dd><dt>Audit</dt><dd>Fixture event list; no durable production log</dd><dt>Legal scope</dt><dd>Conceptual mapping, not a claim of EU AI Act conformity</dd></dl>`):panel("Incident channel",empty("No production incident inbox is published","The generic backend is not connected. Recorded control probes and emitted events can be inspected without inventing production incidents."))}
    ${hydrateHint()}</div>`;
  }
  function analytics(ctx){return overview(ctx);}
  function login(ctx){return `<div class="wb-page">${hero("ACCESS BOUNDARY","Public access","DAiA has a protected reviewer login. This public generic validation portfolio intentionally has no login and grants no operational write permission.",action("dashboard","Open dashboard"))}${hydrateHint()}</div>`}
  window.GenericWorkbench={overview,tickets,inbound,cases,monitor,economics,pool,detail,ticket,newticket,governanceHub,analytics,login};
})();
