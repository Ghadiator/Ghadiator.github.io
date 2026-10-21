/* Personal design rationale. Career facts follow the author-supplied CV;
 * the experience-to-control connections are the author's engineering interpretation. */
(function(){
 'use strict';
 const choices=[
  {icon:'shield-check',title:'Keep deterministic verification behind CoVe reviews',experience:'My functional safety work taught me to separate uncertain behaviour from checks whose results can be reproduced.',choice:'I added CoVe reviews to keep AI-style proposals behind an evidence-verification boundary. In this reference workflow, deterministic checks can reject unsupported findings even if a proposal is wrong; approval still requires the human gate.',view:'architecture',link:'Inspect the verification boundary'},
  {icon:'messages-square',title:'Challenge hallucinations with Proponent and Opponent',experience:'Architecture and software verification taught me to challenge a proposed result before accepting it.',choice:'I added Proponent and Opponent roles to surface contradictions and challenge hallucinated or unsupported claims. My aim was to improve review quality and confidence in the evidence. Agreement between roles is still not proof of correctness.',view:'personas',link:'Explore the opposing review roles'},
  {icon:'alert',title:'Use FMEA to expose failure modes and edge cases',experience:'I performed a Failure Mode and Effects Analysis (FMEA) to examine how this system could fail, the effects of each failure and the controls needed.',choice:'That shaped the failure and edge cases: fabricated findings, missing evidence, incorrect rates and unresolved reviews. The published hazard analysis connects failures to controls, tests and remaining limitations.',view:'assurance',link:'Inspect failure modes and controls'},
  {icon:'list-tree',title:'Make the system card and process audit traceable',experience:'Owning safety cases and supporting assessments taught me to connect each claim to its controls and evidence.',choice:'I added the system card and process audit aspects to make scope, limitations and decisions inspectable. Like monitoring software, the event record and replay dashboard make checks, exceptions and state changes visible and traceable.',view:'architecture',link:'Inspect the audit evidence'},
  {icon:'workflow',title:'Connect lessons learned with incident response',experience:'My experience with release processes and controlled changes shaped how I think about learning from failures.',choice:'I included lessons learned and incident response in the governance design so failures can lead to reviewed improvements. The showcase explains that loop; persistent lessons, incident handling and approved control updates need a connected backend.',view:'evidence',tab:'learning',link:'Examine lessons learned'},
  {icon:'user',title:'Keep human authority and automation limits explicit',experience:'I lead safety governance through to release recommendation, qualify development tools and coordinate technical project teams.',choice:'That shaped the named reviewer gate, bounded proposals and failure handling. Deterministic checks support the decision; neither an AI-style role nor monitoring software receives final approval authority.',view:'architecture',link:'Follow the human decision boundary'}
 ];
 const skillGroups=[
  {title:'Risk, requirements & assurance',items:[
   {name:'Risk classification and failure analysis',source:'Safety analysis strategy; FMEA, FTA and FMEDA.',transfer:'Identify failure modes, their effects, edge cases and residual risk before choosing controls. My FMEA informed the showcase failure analysis.',view:'assurance',scope:'Shown in showcase'},
   {name:'Requirements and evidence traceability',source:'Safety concepts, DOORS / ALM-DNG and release evidence.',transfer:'Connect an intended requirement to an implemented check, its result and its source. Formal requirements-to-test coverage would extend this foundation.',view:'case',scope:'Design foundation'},
   {name:'Safety cases and structured assurance',source:'Ownership of the safety case and release recommendation.',transfer:'Explain what a claim rests on and what its evidence cannot establish. The assurance view and system card make those boundaries inspectable.',view:'assurance',scope:'Shown in showcase'},
   {name:'Standards interpretation and audit preparation',source:'ISO 26262 governance; primary interface for audits and external assessments.',transfer:'Translate obligations into reviewable controls and documented evidence. AI-specific applicability and conformity still need their own assessment.',view:'governance',scope:'Design foundation'},
   {name:'Technical documentation and clear scope',source:'Safety concepts, assessment evidence and documented development scope.',transfer:'Describe purpose, inputs, outputs, assumptions and limitations. Each architecture block and the system card expose those contracts.',view:'architecture',scope:'Shown in showcase'}
  ]},
  {title:'Verification, architecture & tooling',items:[
   {name:'Deterministic software verification',source:'Verification of Simulink- and C-based architecture and software design.',transfer:'Use repeatable checks for facts, exercise edge cases and verify outputs before relying on them. Invoice rules and evidence-based CoVe embody that choice.',view:'architecture',scope:'Shown in showcase'},
   {name:'Systems architecture and interface definition',source:'Alignment of safety concepts, development scope and architecture with OEMs and suppliers; SysML / UML.',transfer:'Separate proposals, verification, coordination and decision authority. Define what each module consumes and emits.',view:'architecture',scope:'Shown in showcase'},
   {name:'Critical review and opposing perspectives',source:'Architecture verification and assessment-facing safety work.',transfer:'Challenge a proposal before accepting it. Proponent and Opponent provide opposing review perspectives; their agreement does not prove correctness or independent assurance.',view:'personas',scope:'Shown in showcase'},
   {name:'Tool qualification and bounded reliance',source:'Classification and qualification of regulated development toolchains.',transfer:'Examine tool failure consequences and bound reliance on uncertain output. Proposal caps and failed-adapter forfeits illustrate this; no live AI tool is qualified here.',view:'architecture',scope:'Design foundation'},
   {name:'Programming, modelling and process automation',source:'MATLAB / Simulink, VBA, Python and C; automated software release management.',transfer:'Turn recurring control work into reproducible checks and testable workflows. The local document checker, Excel examples and scenario regression checks apply that mindset.',view:'submissions',scope:'Shown in showcase'}
  ]},
  {title:'Lifecycle governance & accountability',items:[
   {name:'Human authority and escalation',source:'ASIL D governance through release recommendation and escalation processes.',transfer:'Keep decision rights explicit and prevent automation from silently acquiring approval authority. The named reviewer gate can approve, reject or request corrections.',view:'architecture',scope:'Shown in showcase'},
   {name:'Configuration and controlled change',source:'Project toolchains, a sandboxed change process and software release automation.',transfer:'Keep versions and revalidate corrected inputs. The correction scenarios preserve earlier failures; model/data versioning and production change approval need additional controls.',view:'cases',scope:'Shown in showcase'},
   {name:'Monitoring software and process conformance',source:'Traceability, toolchain work and controlled release processes.',transfer:'Make checks, exceptions, state transitions and unresolved waits visible. The replay illustrates monitoring software; continuous operational monitoring still needs a connected deployment.',view:'architecture',scope:'Shown in showcase'},
   {name:'Cybersecurity and safety interfaces',source:'Assessment of ISO 21434 cybersecurity measures against safety goals and architecture.',transfer:'Consider how malicious or untrusted inputs could undermine a decision. Supplier instructions are excluded from decision inputs; this does not establish broad security coverage.',view:'personas',scope:'Design foundation'},
   {name:'Incident response and reviewed learning',source:'Controlled-change and escalation experience; my incident-response and lessons-learned design decisions.',transfer:'Connect an incident to triage, evidence preservation, corrective action and a reviewed update. Persistent incident handling and approved lesson updates remain deployment work.',view:'evidence',tab:'learning',scope:'Needs live deployment'}
  ]},
  {title:'Leadership, delivery & communication',items:[
   {name:'Technical leadership and coordination',source:'Technical leadership of functional safety project teams and coordination of safety analyses.',transfer:'Align specialists around controls, responsibilities and review criteria. The model makes role boundaries visible; it does not demonstrate an operating governance organisation.',view:'architecture',scope:'Design foundation'},
   {name:'OEM and supplier stakeholder alignment',source:'Agreement on safety concepts, scope and architecture with OEMs and suppliers.',transfer:'Clarify who supplies evidence, which reference is authoritative and who resolves an exception. Supplier corrections and reviewer decisions reflect those interfaces.',view:'cases',scope:'Design foundation'},
   {name:'Communication across technical and business audiences',source:'Audit interfaces; business-proficient German, fluent English and native Arabic.',transfer:'Explain a finding, its evidence and its limits so another person can act. The review package and block inspector make the technical reasoning readable; the site itself is in English.',view:'case',scope:'Design foundation'},
   {name:'Business judgement and continued AI learning',source:'Ongoing TUM Master in Management and Oxford AI Foundations for Business Professionals training.',transfer:'Connect technical controls to organisational decisions, resources and accountability. This adds a business perspective; it is not a claim of ISO/IEC 42001 certification or proven live AI governance delivery.',view:'governance',scope:'Developing capability'}
  ]}
 ];
 function render(ctx){
  const e=ctx.h,icon=ctx.icon;
  const href=c=>'?view='+c.view+'&scenario='+encodeURIComponent(ctx.state.scenario);
  return `<div class="page-entrance safety-origin">
   <header class="so-hero">
    <span class="section-overline">THE ENGINEERING BEHIND THE MODEL</span>
    <h1>From functional safety<br><em>to AI governance.</em></h1>
    <p class="so-lead">How did my experience shape this model? I used FMEA to examine failure modes, deterministic checks to verify facts, opposing roles to challenge claims and process audits to keep decisions traceable.</p>
    <div class="so-author"><span class="so-author-icon">${icon('user')}</span><div><strong>Ali Ghader</strong><span>Functional Safety Manager · Systems engineering · AI governance</span></div></div>
   </header>
   <section class="so-background" aria-labelledby="so-background-title">
    <h2 id="so-background-title">The experience I bring</h2>
    <div class="so-career-grid">
     <article><span class="so-date">2023 — PRESENT</span><h3>Bosch Engineering</h3><p>Functional Safety Manager. ASIL D safety governance for five vehicle systems, safety cases, assessments, tool qualification and technical leadership.</p></article>
     <article><span class="so-date">2019 — 2022</span><h3>techcos</h3><p>Functional Safety Engineer. Safety analysis coordination for seven embedded software components for BMW, architecture verification, toolchains and release automation.</p></article>
    </div>
   </section>
   <section aria-labelledby="so-choices-title" class="so-choices">
    <div class="so-section-heading"><span class="section-overline">EXPERIENCE → DESIGN CHOICE</span><h2 id="so-choices-title">Where that thinking appears in the model</h2><p>These are the engineering decisions I carried into this model, and the reasoning behind each one.</p></div>
    <div class="so-choice-grid">${choices.map((c,i)=>`<article class="so-choice">
     <div class="so-choice-title"><span class="so-choice-icon">${icon(c.icon)}</span><span class="so-number">${String(i+1).padStart(2,'0')}</span><h3>${e(c.title)}</h3></div>
     <div class="so-experience"><span class="so-label">MY ENGINEERING EXPERIENCE</span><p>${e(c.experience)}</p></div>
     <div class="so-decision"><span class="so-label">WHAT I CARRIED INTO THIS MODEL</span><p>${e(c.choice)}</p></div>
     <a href="${e(href(c))}" class="so-inspect">${e(c.link)} <span aria-hidden="true">→</span></a>
    </article>`).join('')}</div>
   </section>
   <section class="so-skills" aria-labelledby="so-skills-title">
    <div class="so-section-heading"><span class="section-overline">TRANSFERABLE SKILLS · ${skillGroups.reduce((n,g)=>n+g.items.length,0)} CONNECTIONS</span><h2 id="so-skills-title">The capabilities I can bring to AI governance</h2><p>The six decisions above show how I built this model. This register covers the wider skills behind them, grounded in my CV and the design work described here.</p></div>
    <div class="so-skill-groups">${skillGroups.map((group,i)=>`<details class="so-skill-group"${i===0?' open':''}><summary><span>${e(group.title)}</span><small>${group.items.length} skills</small></summary><div class="so-skill-list">${group.items.map(skill=>`<article class="so-skill"><div class="so-skill-name"><h3>${e(skill.name)}</h3><span class="so-skill-scope">${e(skill.scope)}</span></div><dl><div><dt>My experience</dt><dd>${e(skill.source)}</dd></div><div><dt>How it transfers</dt><dd>${e(skill.transfer)}</dd></div></dl><a class="so-skill-link" href="${e(href(skill))}">Inspect the relevant part of the model <span aria-hidden="true">→</span></a></article>`).join('')}</div></details>`).join('')}</div>
   </section>
   <section class="so-transfer" aria-labelledby="so-transfer-title">
    <div><span class="section-overline">THE TRANSFER HAS LIMITS</span><h2 id="so-transfer-title">An engineering foundation.<br>AI-specific work still matters.</h2></div>
    <div><p>I bring risk analysis, traceability, verification and accountable release decisions. AI governance also needs evaluation of model and data behaviour, bias, misuse and performance after deployment.</p><p>This synthetic, scripted reference model demonstrates selected controls. It carries no automotive safety qualification or AI compliance claim.</p></div>
   </section>
   <footer class="so-source"><p>Professional background summarised from my CV. The mappings above are my design rationale, not equivalence between standards.</p><div><a href="https://www.iso.org/standard/68384.html" target="_blank" rel="noopener">ISO 26262: functional safety management ↗</a><a href="https://airc.nist.gov/airmf-resources/airmf/5-sec-core/" target="_blank" rel="noopener">NIST AI RMF: AI risk management ↗</a></div></footer>
  </div>`;
 }
 window.SafetyToGovernance={render,skillGroups};
})();
