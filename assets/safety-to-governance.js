/* Personal design rationale. Career facts follow the author-supplied CV;
 * the experience-to-control connections are the author's engineering interpretation. */
(function(){
 'use strict';
 const choices=[
  {icon:'shield-check',title:'Keep deterministic verification behind CoVe reviews',experience:'My functional safety work taught me to separate uncertain behaviour from checks whose results can be reproduced.',choice:'I added CoVe reviews to keep AI-style proposals behind an evidence-verification boundary. In this reference workflow, deterministic checks can reject unsupported findings even if a proposal is wrong; approval still requires the human gate.',view:'architecture',link:'Inspect the verification boundary'},
  {icon:'messages-square',title:'Challenge hallucinations with Proponent and Opponent',experience:'Architecture and software verification taught me to challenge a proposed result before accepting it.',choice:'I added Proponent and Opponent roles to surface contradictions and challenge hallucinated or unsupported claims. My aim was to improve review quality and confidence in the evidence. Agreement between roles is still not proof of correctness.',view:'personas',link:'Explore the opposing review roles'},
  {icon:'alert',title:'Use FMEA to expose failure modes and edge cases',experience:'I performed a Failure Mode and Effects Analysis (FMEA) to examine how this system could fail, the effects of each failure and the controls needed.',choice:'That shaped the failure and edge cases: fabricated findings, missing evidence, incorrect rates and unresolved reviews. The published hazard analysis connects failures to controls, tests and remaining limitations.',view:'assurance',link:'Inspect failure modes and controls'},
  {icon:'list-tree',title:'Make the system card and process audit traceable',experience:'Owning safety cases and supporting assessments taught me to connect each claim to its controls and evidence.',choice:'I added the system card and process audit aspects to make scope, limitations and decisions inspectable. Like monitoring software, the event record and replay dashboard make checks, exceptions and state changes visible and traceable.',view:'evidence',tab:'trace',link:'Inspect the audit evidence'},
  {icon:'workflow',title:'Connect lessons learned with incident response',experience:'My experience with release processes and controlled changes shaped how I think about learning from failures.',choice:'I included lessons learned and incident response in the governance design so failures can lead to reviewed improvements. The showcase explains that loop; persistent lessons, incident handling and approved control updates need a connected backend.',view:'evidence',tab:'learning',link:'Examine lessons learned'},
  {icon:'user',title:'Keep human authority and automation limits explicit',experience:'I lead safety governance through to release recommendation, qualify development tools and coordinate technical project teams.',choice:'That shaped the named reviewer gate, bounded proposals and failure handling. Deterministic checks support the decision; neither an AI-style role nor monitoring software receives final approval authority.',view:'architecture',link:'Follow the human decision boundary'}
 ];
 function render(ctx){
  const e=ctx.h,icon=ctx.icon;
  const href=c=>'?view='+c.view+'&scenario='+encodeURIComponent(ctx.state.scenario)+(c.view==='evidence'?'&tab='+(c.tab||'trace'):'');
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
   <section class="so-transfer" aria-labelledby="so-transfer-title">
    <div><span class="section-overline">THE TRANSFER HAS LIMITS</span><h2 id="so-transfer-title">An engineering foundation.<br>AI-specific work still matters.</h2></div>
    <div><p>I bring risk analysis, traceability, verification and accountable release decisions. AI governance also needs evaluation of model and data behaviour, bias, misuse and performance after deployment.</p><p>This synthetic, scripted reference model demonstrates selected controls. It carries no automotive safety qualification or AI compliance claim.</p></div>
   </section>
   <footer class="so-source"><p>Professional background summarised from my CV. The mappings above are my design rationale, not equivalence between standards.</p><div><a href="https://www.iso.org/standard/68384.html" target="_blank" rel="noopener">ISO 26262: functional safety management ↗</a><a href="https://airc.nist.gov/airmf-resources/airmf/5-sec-core/" target="_blank" rel="noopener">NIST AI RMF: AI risk management ↗</a></div></footer>
  </div>`;
 }
 window.SafetyToGovernance={render};
})();
