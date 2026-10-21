/* Personal design rationale. Career facts follow the author-supplied CV;
 * the experience-to-control connections are the author's engineering interpretation. */
(function(){
 'use strict';
 const choices=[
  {icon:'alert',title:'Start with what can go wrong',experience:'I define safety analysis strategies and align safety concepts with system architecture.',choice:'That shaped the failure cases: incorrect rates, missing evidence, duplicate invoices and unresolved reviews. Each concern has an explicit check or escalation path.',view:'cases',link:'Explore the failure cases'},
  {icon:'list-tree',title:'Make claims traceable to evidence',experience:'I own safety cases and act as an interface for audits and external assessments.',choice:'That shaped the event record. A reader can trace a check, proposed finding, verification result and human decision back to the published case.',view:'evidence',link:'Inspect the decision evidence'},
  {icon:'shield-check',title:'Verify before accepting a proposal',experience:'I have verified the architecture and design of Simulink- and C-based software.',choice:'That shaped the separation between proposal and verification. Scripted Proponent and Opponent outputs are claims; CoVe checks evidence before the Judge packages the findings.',view:'architecture',link:'Inspect the review architecture'},
  {icon:'user',title:'Keep decision authority explicit',experience:'I lead safety governance through to release recommendation and coordinate technical project teams.',choice:'That shaped the human review gate. The review package supports a named reviewer; it does not grant an AI role the authority to approve. The replay shows recorded decisions.',view:'architecture',link:'Follow the human review gate'},
  {icon:'lock',title:'Define limits for tools and changes',experience:'I classify and qualify development tools, and have designed a sandboxed change process.',choice:'That shaped bounded proposals, input separation and the adapter-failure and proposal-budget cases. These demonstrate control behaviour; they do not qualify a live AI tool.',view:'personas',link:'Examine AI roles and controls'},
  {icon:'code',title:'Automate repeatable work carefully',experience:'I automated software release management with VBA and developed project toolchains.',choice:'That shaped the rules-first approach: arithmetic and contract facts use fixed checks. Corrections return through validation, with versions and reviewer decisions kept visible.',view:'submissions',link:'Try local document checks'}
 ];
 function render(ctx){
  const e=ctx.h,icon=ctx.icon;
  const href=view=>'?view='+view+'&scenario='+encodeURIComponent(ctx.state.scenario)+(view==='evidence'?'&tab=trace':'');
  return `<div class="page-entrance safety-origin">
   <header class="so-hero">
    <span class="section-overline">THE ENGINEERING BEHIND THE MODEL</span>
    <h1>From functional safety<br><em>to AI governance.</em></h1>
    <p class="so-lead">How did my experience shape this model? It taught me to define the failure, make the control explicit, verify the evidence and keep decision authority clear.</p>
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
    <div class="so-section-heading"><span class="section-overline">EXPERIENCE → DESIGN CHOICE</span><h2 id="so-choices-title">Where that thinking appears in the model</h2><p>These connections explain my design rationale. Each one leads to a control you can inspect.</p></div>
    <div class="so-choice-grid">${choices.map((c,i)=>`<article class="so-choice">
     <div class="so-choice-title"><span class="so-choice-icon">${icon(c.icon)}</span><span class="so-number">${String(i+1).padStart(2,'0')}</span><h3>${e(c.title)}</h3></div>
     <div class="so-experience"><span class="so-label">MY ENGINEERING EXPERIENCE</span><p>${e(c.experience)}</p></div>
     <div class="so-decision"><span class="so-label">WHAT I CARRIED INTO THIS MODEL</span><p>${e(c.choice)}</p></div>
     <a href="${e(href(c.view))}" class="so-inspect">${e(c.link)} <span aria-hidden="true">→</span></a>
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
