/* Selected-architecture-block inspector. Reads only the public synthetic trace
 * supplied by the parent workbench; no inference of unrecorded model I/O. */
(function(){
  "use strict";
  const safe=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  // Canonical public architecture nodes, not invented supplier-run components.
  const SPEC={
    orchestrator:["Main orchestrator — LangGraph","Coordinates the broader source architecture's graph, routing and pauses.","Workflow graph state, task state and control decisions.","Next graph node and updated coordination state.",[]],
    request:["Collection request","Opens the supplier review and prepares a document request.","Case identifier, supplier and requested billing evidence.","A collection request and a recorded requested state.",[]],
    reminders:["Deadline reminders","Prepares reminders leading up to the supplier submission deadline.","Collection request and its due date.","Reminder records in the fixture outbox; no real email.",["request"]],
    intake:["Supplier intake","Receives the submitted workbook and validates the required structure.","Invoice workbook and supporting submission.","Parsed and versioned supplier billing input, or an intake rejection.",["reminders","request"]],
    memory:["Case history","Attaches prior submission versions while excluding untrusted free text from decision inputs.","Parsed invoice, previous version and supplier notes.","Case-version context and an input-boundary record.",["intake"]],
    rules:["Invoice checks","Applies repeatable invoice validation rules: arithmetic, dates, uniqueness and required reports.","Parsed invoice fields, service lines and attachments.","Individual deterministic pass/fail check results.",["intake","memory"]],
    crosscheck:["Contract cross-check","Compares the invoice with the approved contract, PO, rate card and limits.","Validated invoice and approved contract snapshot.","Contract-matching pass/fail results and baseline status.",["rules","intake"]],
    external:["Approved contract","Supplies the reference contract and approved commercial terms used for verification.","Approved contract, purchase-order and rate-card information.","Reference facts for contract cross-check; not necessarily its own trace event.",[]],
    sanitiser:["Input sanitiser","Defines the trusted-input boundary for supplier text before optional exception review.","Untrusted supplier text and already-validated case facts.","Restricted review input without supplier instructions being treated as authority.",["memory","crosscheck"]],
    proponent:["Proponent","Produces the supportive perspective in a bounded, scripted exception review.","Checked contract facts and case evidence when exception review is invoked.","A recorded supporting argument; not a payment approval.",["crosscheck","sanitiser"]],
    opponent:["Opponent","Challenges the submission and identifies possible unsupported or exceptional claims.","Checked case evidence and the review context.","A challenge or proposed finding requiring verification.",["proponent","crosscheck"]],
    firewall:["Pre-Judge CoVe","Checks proposed findings against supporting evidence before the Judge can use them.","Proponent and Opponent claims plus deterministic case facts.","Verified, revised or rejected claims based on evidence.",["opponent","proponent"]],
    judge:["Judge","Summarises verified findings for an authorised reviewer; cannot approve invoices.","Evidence-filtered findings and review context.","A scripted reviewer-facing summary of verified findings.",["firewall","opponent"]],
    post_cove:["Post-Judge CoVe","Represents a further post-Judge verification layer in the broader architecture.","Judge output and the reference evidence.","A further verification result in designs that execute this layer.",["judge"]],
    token_economics:["Committee orchestration — token economics","Defines limits or budgets for review participation in the broader architecture.","Committee workload and allocation limits.","A bounded committee execution or budget outcome; no live token metering in these fixtures.",["proponent","opponent"]],
    advisory:["Review package","Collects deterministic results and any supported exception findings for the human gate.","Invoice/contract checks and verified exception findings, when present.","A review package with counted failed checks and verified findings.",["judge","crosscheck"]],
    remediation:["Supplier correction","Prepares supplier clarification or correction requests when the review calls for one.","Findings and missing or inconsistent supporting evidence.","A drafted clarification/correction notice and review status.",["advisory","judge"]],
    disposition:["Human-in-the-loop (HITL)","Places final approval, rejection or correction authority with a named human reviewer.","Review package, supporting evidence and the reviewer's response.","Human gate events and a recorded terminal disposition.",["advisory","remediation"]],
    archive:["Evidence archive","Retains the recorded case outcome and audit evidence for inspection.","Recorded decision, rule results and event history.","An archive event; persistence is fixture memory, not a production repository.",["disposition"]],
    process_semantics:["DAiA ProcessEvent pool (architecture reference)","Describes a separate generic ProcessEvent semantics layer, distinct from the supplier fixture audit.","General workflow event semantics in the broader design.","A generic ProcessEvent stream if that separate source is run.",[]]
  };
  const DESIGN_ONLY=new Set(["orchestrator","post_cove","token_economics","process_semantics"]);
  // Interpretive, partial mappings. Business invoice checks are not Article 10
  // training-data governance, and a module cannot establish system compliance.
  const ACT={
    request:[[],"Defines the case owner and requested evidence before review starts.","Workflow preparation; no standalone EU AI Act obligation is fulfilled by creating a collection request."],
    reminders:[[],"Makes missing submissions and deadlines visible to the case owner.","Operational support; sending reminders is not itself an EU AI Act requirement."],
    intake:[["15(4)"],"Rejects malformed submissions before downstream processing.","A narrow robustness measure. Authenticity of input and resilience of a production AI system still require validation."],
    memory:[["12(1)"],"Links submission versions so recorded corrections can be reconstructed.","In-memory case history does not demonstrate logging throughout a deployed system’s lifetime or production retention."],
    rules:[["9(5)","15(4)"],"Uses repeatable arithmetic and completeness checks to reduce specified submission errors.","Business checks illustrate targeted controls; they do not establish lifecycle AI risk management or model accuracy."],
    crosscheck:[["15(4)"],"Compares submitted facts with contract evidence rather than relying on a persona’s opinion.","The contract snapshot is trusted by the fixture. Currency, authenticity and completeness of reference data remain assumptions."],
    external:[[],"Provides the contract, PO and rate-card baseline used by the checker.","Reference input, not an AI compliance control on its own. Invoice data is not evidence of Article 10 training-data governance."],
    sanitiser:[["15(5)"],"Keeps supplier free-text instructions outside the trusted review inputs.","Illustrates one input-boundary defence; it does not prove comprehensive prompt-injection resistance or cybersecurity."],
    proponent:[["14(4)(c)"],"Presents a supporting perspective for interpretation alongside the checked case facts.","Scripted advice only. The supplier fixture does not independently verify every positive sentence; human oversight also needs competent reviewers."],
    opponent:[["9(5)","14(4)(c)"],"Raises provisional concerns that must be checked against evidence before use.","A scripted challenge is not a comprehensive risk assessment or a live-model adversarial evaluation."],
    firewall:[["14(4)(c)","15(4)"],"Verifies proposed concerns against recorded facts before they enter the reviewer summary.","The smaller supplier fixture verifies Opponent findings only. Full two-role CoVe and production accuracy are not established by these events."],
    judge:[["13(1)","14(4)(c)"],"Summarises checked findings for interpretation while keeping decision authority with the reviewer.","The summary is scripted. It is not a complete set of deployer instructions and does not explain a live model’s internals."],
    post_cove:[["14(4)(c)","15(4)"],"The broader design checks new Judge claims against evidence before handover.","Architecture reference only: no separate post-Judge execution is evidenced in the supplier fixture."],
    token_economics:[["15(4)"],"The broader design bounds calls and retries and provides configured recovery paths without bypassing verification.","Architecture reference only. No live token metering runs here; a budget alone does not prove resilience or safe recovery."],
    orchestrator:[["12(1)","14(4)(d)"],"The broader design routes controlled transitions and pauses for human decisions.","The supplier fixture uses SupplierWorkflow, not LangGraph. A pause alone does not establish all human intervention and safe-stop capabilities."],
    advisory:[["13(1)","14(4)(c)"],"Combines check results and supported findings into an inspectable package for the human reviewer.","This supports output interpretation; complete deployer instructions, training and evaluation of actual reviewer understanding remain outside the demo."],
    remediation:[["14(4)(d)"],"Lets a reviewer request correction and sends revised submissions back through the checks.","A recorded correction path illustrates intervention. Real reviewer authority, identity assurance and operational procedures are not demonstrated."],
    disposition:[["14(4)(c)","14(4)(d)"],"Suspends for an authorised reviewer who can approve, reject or request correction; hard failures cannot be approved.","Fixture reviewer identities are configured stand-ins. Competence, automation-bias controls and safe interruption in deployment still need evidence."],
    archive:[["12(1)","12(2)"],"Retains the outcome and ordered events to reconstruct the recorded decision.","Fixture memory is not a durable audit service. Lifetime logging, access controls, retention and post-market monitoring are not established."],
    process_semantics:[["12(1)","12(2)"],"The broader ProcessEvent design provides typed events across stages for traceability.","Architecture reference only. The supplier audit is a separate in-memory sequence; no generic ProcessEvent execution is evidenced here."]
  };
  const REQUIREMENTS={
    "9(5)":["Targeted risk reduction","Reduce identified risks through design and controls, and assess residual risk."],
    "12(1)":["Automatic event logging","Enable automatic recording of events throughout the system’s lifetime."],
    "12(2)":["Purposeful traceability","Log events relevant to risk identification, monitoring and oversight."],
    "13(1)":["Interpretable outputs","Make operation transparent enough for deployers to interpret and appropriately use outputs."],
    "14(4)(c)":["Human interpretation","Enable the overseer to interpret the system’s output correctly."],
    "14(4)(d)":["Human decision authority","Enable the overseer to disregard, override or reverse the system’s output."],
    "15(4)":["Robustness","Address errors, faults and inconsistencies with technical and organisational measures."],
    "15(5)":["Cybersecurity","Resist unauthorised attempts to alter the system’s use, outputs or performance."]
  };
  function governance(id,matched){
    const [articles,mechanism,gap]=ACT[id];
    const state=DESIGN_ONLY.has(id)?"Architecture reference":matched?"Recorded fixture evidence":"No directly attributed event";
    return '<section class="ami-governance" id="ami-governance" aria-label="EU AI Act contribution">'
      +'<h3>EU AI Act · this module’s contribution</h3>'
      +'<p class="ami-scope">Supplier-invoice demonstration: not presented as an Annex III high-risk use case. These are partial design mappings to high-risk requirements, not a finding of legal applicability or compliance.</p>'
      +'<span class="ami-evidence-state">'+state+'</span>'
      +(articles.length?articles.map(ref=>{
        const [label,requirement]=REQUIREMENTS[ref];
        return '<div class="ami-requirement"><a href="https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-'+ref.match(/^\d+/)[0]+'" target="_blank" rel="noopener noreferrer">Article '+safe(ref)+' · '+safe(label)+' ↗</a><p>'+safe(requirement)+'</p></div>';
      }).join(""):'<p class="ami-no-obligation">No standalone obligation mapped</p>')
      +'<dl><dt>How the design contributes</dt><dd>'+safe(mechanism)+'</dd>'
      +'<dt>What remains unproven</dt><dd>'+safe(gap)+'</dd></dl>'
      +'<p class="ami-explain">Interpretive mapping · sources checked 20 October 2026. The recorded evidence below shows only what this selected fixture emitted.</p></section>';
  }
  const norm=n=>n==="gate"?"disposition":n;
  let scenario="",all=[],cursor=-1,selected="";
  const target=()=>document.getElementById("architecture-module-inspector");
  const eventLabel=(e,index)=>{
    const ref=(Array.isArray(e.refs)&&e.refs[0])?e.refs[0]:"Published synthetic fixture";
    return '<li class="ami-event"><button type="button" data-replay-seek="'+index+'" aria-label="Jump to recorded event '+safe(e.seq)+'">'
      +'<span class="ami-seq">#'+safe(e.seq)+'</span><span class="ami-event-copy"><b>'+safe(e.label)+'</b>'
      +(e.detail?'<span>'+safe(e.detail)+'</span>':'')
      +'<small>'+safe(e.kind)+' · '+safe(ref)+'</small></span><span aria-hidden="true">↗</span></button></li>';
  };
  function render(){
    const el=target();if(!el||!selected||!SPEC[selected])return;
    const [title,purpose,input,output,sources]=SPEC[selected];
    const active=all.map((e,i)=>({e,i})).filter(({e})=>norm(e.node)===selected);
    const first=active[0]?.i??-1;
    const relevant=sources.map(source=>{
      if(first<0)return null;
      return all.map((e,i)=>({e,i})).filter(({e,i})=>i<first&&norm(e.node)===source&&!String(e.kind).startsWith("audit.")).at(-1);
    }).filter(Boolean);
    const unique=[...new Map(relevant.map(v=>[v.i,v])).values()].sort((a,b)=>a.i-b.i);
    const loaded=all.length>0;
    const matched=active.length>0;
    const reached=active.filter(({i})=>i<=cursor).length;
    const runState=!loaded?"Case events are loading":!matched?"No directly attributed event in this case":
      reached?reached+" of "+active.length+" module events reached in replay":
      active.length+" module events recorded · later in replay";
    const context=matched
      ?unique.length?'<ol class="ami-event-list">'+unique.slice(-3).map(({e,i})=>eventLabel(e,i)).join("")+'</ol>':
        '<p class="ami-empty">No relevant upstream event is documented before this block’s first recorded event.</p>'
      :'<p class="ami-empty">No scenario-specific module input is recorded for this block.</p>';
    const outputs=matched
      ?'<ol class="ami-event-list">'+active.slice(0,5).map(({e,i})=>eventLabel(e,i)).join("")+'</ol>'
        +(active.length>5?'<details class="ami-more"><summary>Show '+(active.length-5)+' more recorded events</summary><ol class="ami-event-list">'+active.slice(5).map(({e,i})=>eventLabel(e,i)).join("")+'</ol></details>':'')
      :'<p class="ami-empty">No module output is directly emitted in this selected synthetic case. This does not establish that a separate source component ran or failed.</p>';
    const special=selected==="process_semantics"
      ?'<p class="ami-provenance">The supplier audit stream is not the separate generic DAiA ProcessEvent pool.</p>'
      :selected==="external"
      ?'<p class="ami-provenance">Approved contract details may appear inside contract cross-check events, not as events attributed to this reference-input block.</p>'
      :DESIGN_ONLY.has(selected)
      ?'<p class="ami-provenance">This source-architecture concept is not evidenced as executing in this supplier fixture.</p>':'';
    const scroll=el.querySelector?.(".ami-content")?.scrollTop||0;
    el.hidden=false;
    el.innerHTML='<div class="ami-header"><span class="ami-eyebrow">SELECTED ARCHITECTURE BLOCK</span>'
      +'<button type="button" class="ami-close" data-module-inspector-close aria-label="Close block details">×</button>'
      +'<h2>'+safe(title)+'</h2><p>'+safe(purpose)+'</p></div>'
      +'<nav class="ami-nav" aria-label="Block detail sections"><button type="button" data-module-section="ami-contract">Input & output</button><button type="button" data-module-section="ami-governance">EU AI Act</button><button type="button" data-module-section="ami-recorded">Run evidence</button></nav>'
      +'<div class="ami-content"><section class="ami-design" id="ami-contract" aria-label="Module contract">'
      +'<h3>What the block does</h3><ol class="ami-flow" aria-label="Input to processing to output">'
      +'<li><span class="ami-flow-label">01 · Input</span><h4>Expected input · architecture</h4><p>'+safe(input)+'</p></li>'
      +'<li><span class="ami-flow-label">02 · Processing</span><h4>'+safe(title)+'</h4><p>'+safe(purpose)+'</p></li>'
      +'<li><span class="ami-flow-label">03 · Output</span><h4>Expected output · architecture</h4><p>'+safe(output)+'</p></li></ol></section>'
      +governance(selected,matched)
      +'<section class="ami-trace" id="ami-recorded" aria-label="Recorded input and output">'
      +'<h3>In the selected scenario</h3><p class="ami-case">'+safe(scenario||"Scenario loading")+'</p>'
      +'<span class="ami-status">'+safe(runState)+'</span>'
      +'<h4>Input context in the recorded trace</h4>'
      +'<p class="ami-explain">Upstream events that precede this block. These are <strong>not</strong> captured function-call arguments.</p>'
      +context+'<h4>Recorded output from this block</h4>'
      +'<p class="ami-explain">Directly attributed fixture events, including their published details and source reference.</p>'
      +outputs+special+'</section>'
      +'<p class="ami-footer">Read-only synthetic scenario · scripted AI-style roles · no live model invocation or payment action.</p></div>';
    el.dataset.selectedModule=selected;
    const content=el.querySelector?.(".ami-content");
    if(content)content.scrollTop=scroll;
  }
  function place(){
    const el=target(),canvas=el?.closest?.(".architecture-main-canvas");
    if(!el||!canvas||!el.style)return;
    const box=canvas.getBoundingClientRect();
    const height=Math.min(el.getBoundingClientRect().height,canvas.clientHeight-32);
    // Stay inside the canvas while keeping details near the visible selection.
    const top=Math.max(80,Math.min(Math.max(80,24-box.top),canvas.clientHeight-height-16));
    el.style.setProperty("--ami-top",top+"px");
  }
  function select(id){
    if(!Object.hasOwn(SPEC,id))return false;
    const changed=selected!==id;
    selected=id;render();place();
    if(changed){const content=target()?.querySelector?.(".ami-content");if(content)content.scrollTop=0;}
    return true;
  }
  function setScenario(nextScenario,events,nextCursor){
    scenario=String(nextScenario||"");
    all=Array.isArray(events)?events:[];
    cursor=Number.isInteger(nextCursor)?nextCursor:-1;
    if(selected)render();
  }
  function close(){
    selected="";
    const el=target();
    if(el){el.hidden=true;el.innerHTML="";delete el.dataset.selectedModule;}
  }
  document.addEventListener("click",ev=>{
    if(ev.target?.closest?.("[data-module-inspector-close]")){close();return;}
    const link=ev.target?.closest?.("[data-module-section]");
    if(link){
      const el=target(),content=el?.querySelector?.(".ami-content"),section=el?.querySelector?.("#"+link.dataset.moduleSection);
      if(content&&section)content.scrollTop+=section.getBoundingClientRect().top-content.getBoundingClientRect().top-12;
    }
  });
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&selected)close();});
  window.ArchitectureModuleInspector={select,setScenario,close,definitions:SPEC,actMappings:ACT};
})();
