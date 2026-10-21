/* Selected-architecture-block inspector. Reads only the public synthetic trace
 * supplied by the parent workbench; no inference of unrecorded model I/O. */
(function(){
  "use strict";
  const safe=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  // Canonical public architecture nodes, not invented supplier-run components.
  const SPEC={
    orchestrator:["Workflow orchestrator","Coordinates every recorded case: allowed transitions, routing, reviewer pauses, resumption and corrections. The recorded implementation is SupplierWorkflow; LangGraph is the broader design implementation.","Case request, validated submissions, current workflow state and authorised reviewer decisions.","Updated workflow state, routed checks and review steps, and ordered Event records.",[]],
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
    token_economics:["Committee orchestration · proposal bounds","Bounds scripted proposal contributions and forfeits failed or over-budget adapters. Live token metering and model fallback are broader design features.","Checked submission, scripted proposer and a maximum of four adapter proposals.","Bounded proposals, or no contribution after an adapter failure or exceeded cap.",["proponent"]],
    advisory:["Review package","Collects deterministic results and any supported exception findings for the human gate.","Invoice/contract checks and verified exception findings, when present.","A review package with counted failed checks and verified findings.",["judge","crosscheck"]],
    remediation:["Supplier correction","Prepares supplier clarification or correction requests when the review calls for one.","Findings and missing or inconsistent supporting evidence.","A drafted clarification/correction notice and review status.",["advisory","judge"]],
    disposition:["Human-in-the-loop (HITL)","Places final approval, rejection or correction authority with a named human reviewer.","Review package, supporting evidence and the reviewer's response.","Human gate events and a recorded terminal disposition.",["advisory","remediation"]],
    archive:["Evidence archive","Retains the recorded case outcome and audit evidence for inspection.","Recorded decision, rule results and event history.","An archive event; persistence is fixture memory, not a production repository.",["disposition"]],
    process_semantics:["Workflow event record","Records each SupplierWorkflow action in an ordered immutable Event. State changes add audit.row_appended records; the broader generic ProcessEvent pool is a different implementation of this architectural role.","Workflow actions, allowed state transitions, check results, scripted claims and human decisions.","SupplierWorkflow.events: ordered records with seq, kind, actor, node, detail and source references.",[]]
  };
  const DESIGN_ONLY=new Set(["post_cove"]);
  const model=window.ArchitectureRunModel;
  const norm=model.normalize;
  let scenario="",all=[],cursor=-1,selected="",returnFocus=null;
  const target=()=>document.getElementById("architecture-module-inspector");
  function position(){
    const el=target(),canvas=el?.closest?.(".architecture-main-canvas");
    if(!selected||!canvas||window.innerWidth<=770)return;
    const rect=canvas.getBoundingClientRect();
    const width=Math.min(500,rect.width-32,window.innerWidth-32);
    el.style.setProperty("--ami-left",Math.max(16,Math.min(rect.right-width-16,window.innerWidth-width-16))+"px");
    el.style.setProperty("--ami-top",Math.max(72,Math.min(rect.top+16,window.innerHeight-300))+"px");
    el.style.setProperty("--ami-width",width+"px");
  }
  function governance(){
    const g=window.ArchitectureGovernance,m=g?.modules[selected];
    if(!m)return "";
    const [control,contribution,gap,articles]=m;
    const links=articles.map(n=>'<a href="'+g.source+n+'" target="_blank" rel="noopener noreferrer">Article '+n+' · '+safe(g.articles[n])+' <span aria-hidden="true">↗</span></a>').join("");
    return '<section id="ami-governance" class="ami-governance" aria-labelledby="ami-governance-title">'
      +'<span class="ami-section-number">02 / GOVERNANCE</span><h3 id="ami-governance-title">EU AI Act relevance</h3>'
      +'<p class="ami-mapping-label">Architectural support · partial mapping, not compliance certification</p><p class="ami-control">'+safe(control)+'</p><p class="ami-contribution">'+safe(contribution)+'</p>'
      +'<div class="ami-article-links">'+(links||'<span>No direct article obligation mapped</span>')+'</div>'
      +'<div class="ami-assurance"><h4>What this does not establish</h4><p>'+safe(gap)+'</p></div>'
      +'<details class="ami-scope"><summary>Scope of this mapping</summary><p>'+safe(g.scope)+'</p>'
      +'<p>Article links: European Commission AI Act Service Desk. The connection to this block is an architectural interpretation, not an official assessment.</p></details></section>';
  }
  const eventLabel=(e,index)=>{
    const ref=(Array.isArray(e.refs)&&e.refs[0])?e.refs[0]:"Published synthetic fixture";
    return '<li class="ami-event"><button type="button" data-replay-seek="'+index+'" aria-label="Jump to recorded event '+safe(e.seq)+'">'
      +'<span class="ami-seq">#'+safe(e.seq)+'</span><span class="ami-event-copy"><b>'+safe(e.label)+'</b>'
      +(e.detail?'<span>'+safe(e.detail)+'</span>':'')
      +'<small>'+safe(model.eventInfo(e).category)+' · '+safe(e.kind)+'</small>'
      +'<small>Recorded owner: '+safe(e.node)+' · Producer: '+safe(model.eventInfo(e).producer)+'</small>'
      +'<small>'+safe(ref)+'</small></span><span aria-hidden="true">↗</span></button></li>';
  };
  function render(){
    const el=target();if(!el||!selected||!SPEC[selected])return;
    const same=el.dataset.selectedModule===selected;
    const scroll=same?(el.querySelector?.(".ami-content")?.scrollTop??0):0;
    const open=same?[...(el.querySelectorAll?.("details[open]")??[])].map(d=>d.className):[];
    const focused=el.contains?.(document.activeElement)?document.activeElement?.id:null;
    const [title,purpose,input,output,sources]=SPEC[selected];
    const module=model.moduleState(selected,all,cursor);
    const active=module.evidence;
    const first=active[0]?.i??-1;
    const relevant=sources.map(source=>{
      if(first<0)return null;
      return all.map((e,i)=>({e,i})).filter(({e,i})=>i<first&&norm(e.node)===source&&!String(e.kind).startsWith("audit.")).at(-1);
    }).filter(Boolean);
    const unique=[...new Map(relevant.map(v=>[v.i,v])).values()].sort((a,b)=>a.i-b.i);
    const loaded=all.length>0;
    const matched=active.length>0;
    const runState=!loaded?"Case events are loading":module.label+' · '+module.countText;
    const context=matched
      ?unique.length?'<ol class="ami-event-list">'+unique.slice(-3).map(({e,i})=>eventLabel(e,i)).join("")+'</ol>':
        '<p class="ami-empty">No relevant upstream event is documented before this block’s first recorded event.</p>'
      :'<p class="ami-empty">No scenario-specific module input is recorded for this block.</p>';
    const outputs=matched
      ?'<ol class="ami-event-list">'+active.slice(0,5).map(({e,i})=>eventLabel(e,i)).join("")+'</ol>'
        +(active.length>5?'<details class="ami-more"><summary>Show '+(active.length-5)+' more recorded events</summary><ol class="ami-event-list">'+active.slice(5).map(({e,i})=>eventLabel(e,i)).join("")+'</ol></details>':'')
      :'<p class="ami-empty">No module output is directly emitted in this selected synthetic case. This does not establish that a separate source component ran or failed.</p>';
    const special=selected==="process_semantics"
      ?'<p class="ami-provenance">Every displayed record comes from SupplierWorkflow.emit(). The supplier audit stream is not the separate generic DAiA ProcessEvent pool.</p>'
      :selected==="orchestrator"
      ?'<p class="ami-provenance">Every recorded scenario is coordinated by SupplierWorkflow. Its records carry the local step owner, so no dedicated orchestrator event is required. This is evidence of the workflow orchestration role, not a claim that LangGraph executed.</p>'
      :selected==="external"
      ?'<p class="ami-provenance">Approved contract details may appear inside contract cross-check events, not as events attributed to this reference-input block.</p>'
      :DESIGN_ONLY.has(selected)
      ?'<p class="ami-provenance">This source-architecture concept is not evidenced as executing in this supplier fixture.</p>':'';
    el.hidden=false;
    el.setAttribute?.("role","dialog");
    el.setAttribute?.("aria-modal","false");
    el.setAttribute?.("aria-labelledby","ami-title");
    el.removeAttribute?.("aria-live");
    el.innerHTML='<div class="ami-header"><span class="ami-eyebrow">SELECTED BLOCK · 20-MODULE ARCHITECTURE</span>'
      +'<button id="ami-close" type="button" class="ami-close" data-module-inspector-close aria-label="Close block details">×</button>'
      +'<h2 id="ami-title" tabindex="-1">'+safe(title)+'</h2><p>'+safe(purpose)+'</p>'
      +'<nav class="ami-nav" aria-label="Block detail sections"><button id="ami-nav-contract" type="button" data-module-section="ami-contract">01 · Input / output</button>'
      +'<button id="ami-nav-governance" type="button" data-module-section="ami-governance">02 · Governance</button>'
      +'<button id="ami-nav-trace" type="button" data-module-section="ami-trace">03 · Evidence</button></nav></div>'
      +'<div class="ami-content"><section id="ami-contract" class="ami-design" aria-label="Module contract">'
      +'<span class="ami-section-number">01 / MODULE CONTRACT</span><h3>What the block does</h3>'
      +'<dl><div><dt>Expected input · architecture</dt><dd>'+safe(input)+'</dd></div>'
      +'<div><dt>Expected output · architecture</dt><dd>'+safe(output)+'</dd></div></dl></section>'
      +governance()+'<section id="ami-trace" class="ami-trace" aria-label="Recorded input and output">'
      +'<span class="ami-section-number">03 / RECORDED EVIDENCE</span><h3>In the selected scenario</h3><p class="ami-case">'+safe(scenario||"Scenario loading")+'</p>'
      +'<span class="ami-status">'+safe(runState)+'</span>'
      +'<h4>Input context in the recorded trace</h4>'
      +'<p class="ami-explain">Upstream events that precede this block. These are <strong>not</strong> captured function-call arguments.</p>'
      +context+'<h4>Recorded output and control evidence</h4>'
      +'<p class="ami-explain">Original source records that evidence this block. Each shows its recorded owner and producer. Supporting controls can share an event; the source node and event count are unchanged.</p>'
      +'<p class="ami-provenance">'+safe(module.note)+'</p>'
      +outputs+special+'</section>'
      +'<p class="ami-footer">Read-only synthetic scenario · scripted AI-style roles · no live model invocation or payment action.</p></div>';
    el.dataset.selectedModule=selected;
    const content=el.querySelector?.(".ami-content");
    for(const d of el.querySelectorAll?.("details")??[])if(open.includes(d.className))d.open=true;
    if(content)content.scrollTop=scroll;
    if(focused)el.querySelector?.("#"+focused)?.focus({preventScroll:true});
    position();
  }
  function select(id){
    if(!Object.hasOwn(SPEC,id))return false;
    const active=document.activeElement;
    if(!target()?.contains?.(active)){
      returnFocus=active?.tagName==="IFRAME"?active.contentDocument?.activeElement:active;
    }
    selected=id;
    const canvas=target()?.closest?.(".architecture-main-canvas");
    if(canvas&&canvas.getBoundingClientRect().bottom<160)canvas.scrollIntoView({block:"start",behavior:"auto"});
    render();target()?.querySelector?.("#ami-title")?.focus({preventScroll:true});return true;
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
    if(returnFocus?.isConnected)returnFocus.focus?.({preventScroll:true});
    returnFocus=null;
  }
  document.addEventListener("click",ev=>{
    if(ev.target?.closest?.("[data-module-inspector-close]")){close();return;}
    const jump=ev.target?.closest?.("[data-module-section]");
    if(jump){
      const section=document.getElementById(jump.dataset.moduleSection),content=target()?.querySelector(".ami-content");
      if(section&&content)content.scrollTop+=section.getBoundingClientRect().top-content.getBoundingClientRect().top-8;
    }
  });
  document.addEventListener("keydown",ev=>{if(ev.key==="Escape"&&selected)close();});
  window.addEventListener?.("resize",position);
  window.addEventListener?.("scroll",position,{passive:true});
  window.ArchitectureModuleInspector={select,setScenario,close,definitions:SPEC};
})();
