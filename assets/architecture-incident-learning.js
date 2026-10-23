/* Presentation-only architecture extension.
 * This file adds no SupplierWorkflow Event, model behavior, rule update or
 * backend capability. All three evidence links use existing module definitions. */
(function(){
 "use strict";
 const markup=`<section class="ail-module" aria-labelledby="incidentLearningTitle">
 <div class="ail-top"><div><span class="ail-eyebrow">Human-reviewed governance feedback · architecture extension</span>
 <h2 id="incidentLearningTitle">Incident reporting &amp; lessons learned</h2>
 <p>A proposed feedback path from recorded reviewer decisions and evidence toward reviewed, tested improvements. Only the starting evidence modules exist in the current reference implementation.</p></div>
 <span class="ail-proposal">DESIGN ONLY · NOT IMPLEMENTED</span></div>
 <div class="ail-sources"><p class="ail-rowlabel">Implemented source modules · select to inspect recorded evidence</p>
 <div class="ail-source-grid">
 <button type="button" class="ail-source" data-incident-source="disposition"><strong>Human reviewer decision ↗</strong><small>Review opens and authorised decisions, where present in the selected trace</small></button>
 <button type="button" class="ail-source" data-incident-source="process_semantics"><strong>Workflow event record ↗</strong><small>Original ordered events and audited state transitions</small></button>
 <button type="button" class="ail-source" data-incident-source="archive"><strong>Evidence archive ↗</strong><small>Recorded archive outcome when the selected case reaches this step</small></button>
 </div></div>
 <div class="ail-bridge" aria-hidden="true">Potential inputs: reviewed exceptions, control failures and near misses <span>↓</span></div>
 <div class="ail-future"><p class="ail-rowlabel">Proposed incident-to-improvement loop · not executed by the fixture runner</p>
 <ol class="ail-steps">
 <li><span class="ail-step-no">01</span><strong>Report incident</strong><p>Capture a missed check, recurrence or near miss and link its source evidence.</p></li>
 <li><span class="ail-step-no">02</span><strong>Human triage</strong><p>Investigate severity and root cause; assign accountable ownership.</p></li>
 <li><span class="ail-step-no">03</span><strong>Capture lesson</strong><p>Document the verified finding, control gap and corrective action.</p></li>
 <li><span class="ail-step-no">04</span><strong>Approve change</strong><p>Human-review proposed rule, prompt or test changes before acceptance.</p></li>
 <li><span class="ail-step-no">05</span><strong>Test &amp; monitor</strong><p>Regression-test and version an approved release; monitor recurrence.</p></li>
 </ol>
 <div class="ail-return"><span class="ail-return-arrow" aria-hidden="true">↶</span><div><strong>Controlled learning → future validation checks and reviewer guidance</strong><p>Only evidence-backed, tested and authorised improvements may enter a later workflow version. Earlier records remain unchanged.</p></div><span class="ail-return-tag">Human approval required</span></div></div>
 <p class="ail-scope"><strong>Implementation boundary:</strong> Existing code emits reviewer decisions, audit transitions and archive events, but has no incident-intake service, lessons register, automatic rule changes or autonomous model retraining. The dashed extension illustrates design intent and creates no new events.</p>
 </section>`;
 const insert=()=>{
  const canvas=document.querySelector("#main .unified-architecture-view .architecture-main-canvas");
  if(!canvas||canvas.querySelector(".ail-module"))return;
  const after=canvas.querySelector("#architectureTouchExit");
  if(!after)return;
  after.insertAdjacentHTML("afterend",markup);
 };
 const inspect=event=>{
  const target=event.target.closest?.("[data-incident-source]");
  if(!target)return;
  event.preventDefault();
  window.ArchitectureModuleInspector?.select(target.dataset.incidentSource);
 };
 document.addEventListener("click",inspect);
 const start=()=>{
  const main=document.getElementById("main");
  if(!main)return;
  insert();
  new MutationObserver(insert).observe(main,{childList:true});
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
 else start();
})();
