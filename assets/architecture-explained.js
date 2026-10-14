/* Architecture companion: explanations, recorded outcomes and reference EU AI Act mappings.
   Adds content AFTER the original modular canvas. Does not modify recorded evidence. */
(function(){
"use strict";
var SOURCE="/data/";
var meta={
request:["Collection request","A buyer-authorised starting point.","Opens a named supplier case and sets the deadline.","Makes responsibility clear before documents arrive.","Only the allowlisted buyer can initiate a case; this is not an invoice approval.",["Art. 14"]],
reminders:["Deadline reminders","A scheduled follow-up step.","Prepares reminders before the supplier's deadline.","Makes late or missing documents visible.","Repeatable checkpoints; no live email delivery is demonstrated.",["Art. 12"]],
intake:["Supplier intake","The entry point for invoice data.","Checks that submitted information follows a defined structure.","Catches malformed or unwanted data before other checks run.","Typed fields only; the truth of submitted figures is not guaranteed.",["Art. 10","Art. 15"]],
memory:["Case history","A history of invoice versions.","Links corrections to the same supplier and case.","Keeps earlier information available when a supplier sends a new version.","Version history exists in the example runner, not permanent storage.",["Art. 12"]],
rules:["Invoice checks","An automatic, rule-based checker.","Recalculates amounts and checks totals, periods and attachments.","Uses repeatable rules for facts that do not require subjective judgment.","Limited to implemented checks; an unimplemented rule cannot fail.",["Art. 9","Art. 15"]],
crosscheck:["Contract cross-check","A comparison with approved business terms.","Checks rates, purchase orders, contract scope and spending limits.","Bases review on contract evidence rather than an AI opinion.","Assumes the supplied contract and rate card are correct and current.",["Art. 10","Art. 15"]],
sanitiser:["Input sanitiser","A boundary between supplier text and the review personas.","Removes untrusted free-text notes from their inputs.","Prevents supplier instructions from becoming review instructions.","Structural exclusion, not a complete injection detection system.",["Art. 15"]],
proponent:["Proponent","An AI-style persona that argues for acceptance.","States the contract checks that passed using structured case facts.","Adds a positive perspective to balance a review focused on possible problems.","It cannot decide or approve a case and does not receive the final verdict.",["Art. 14"]],
opponent:["Opponent","An independent AI-style persona that challenges the submission.","Suggests a bounded number of findings that may deserve attention.","Tests a favourable assessment from a different perspective.","Proposals are not facts: they must pass the evidence check.",["Art. 9","Art. 14"]],
firewall:["CoVe firewall","A chain-of-verification evidence checkpoint.","Rebuilds proposed findings from invoice and contract evidence.","Blocks persuasive claims that cannot be verified.","Only supported finding types can pass; others are discarded.",["Art. 14(4)","Art. 15"]],
judge:["Judge","An AI-style persona that prepares a review summary.","Packages findings that survived independent verification.","Makes the human review clearer without giving a model approval power.","It cannot create new verified facts or approve or reject a case.",["Art. 14","Art. 14(4)"]],
advisory:["Review package","The structured handover to a human reviewer.","Combines failed rules and verified findings into one package.","Allows decisions to be based on explicit checks and evidence.","A recommendation is not a decision.",["Art. 12","Art. 14(4)"]],
remediation:["Supplier correction","A controlled way to request more information.","Prepares a clarification or starts rechecking a corrected invoice.","Gives a safer option than accepting doubtful submissions.","Drafts do not mean emails were sent; corrected documents must be checked again.",["Art. 12","Art. 14"]],
orchestrator:["Workflow state machine","The controller of allowed process steps.","Checks when a submission can move from one state to another.","Prevents a review step being silently skipped.","Covers this reference workflow, not organisational deployment.",["Art. 12","Art. 14"]],
disposition:["Human-in-the-loop (HITL)","An explicit human decision gate.","Suspends the workflow until an authorised reviewer approves, rejects or asks for correction.","Keeps final authority with a person, even after all automated checks pass.","Only configured reviewers may resume; hard-check failures cannot be approved. No payment is executed.",["Art. 12","Art. 14","Art. 26"]],
token_economics:["Token economics","A usage-accounting boundary for AI-style reviewers, not a decision engine.","When a live proposal adapter is enabled, it can report input and output token counts per call; an operator can apply provider prices separately.","Makes resource use transparent and separates cost controls from safety checks.","These recorded roles are scripted, so no live-model tokens or measured provider charges exist. The limit of four proposed findings is NOT a token budget.",[]],
process_semantics:["Process semantics","The defined meaning of each workflow state and permitted transition.","Supplies the canonical 12-state transition rules to the workflow state machine.","Makes invalid jumps, premature archive and skipped human review detectable and preventable.","Defined in the reference workflow; production identity, persistence and operational policy remain separate responsibilities.",["Art. 12","Art. 14"]],
archive:["Evidence archive","A record of the reviewed case and its outcome.","Collects the decision and prior workflow events.","Supports later reconstruction and investigation.","Records are in memory; production retention and custody are not demonstrated.",["Art. 12"]],
external:["Approved contract","Reference information against which checks are made.","Supplies contract, rate card, PO and prior-invoice register inputs.","Makes comparisons measurable.","The example does not validate whether this reference data is current.",["Art. 10"]]
};
var scope={
"Art. 9":["Risk management","Failure cases and automatic checks illustrate technical risk reduction.","Not an ongoing lifecycle risk-management system."],
"Art. 10":["Data governance","Typed inputs and stated reference sources support input traceability.","Not a training-data or representativeness assessment."],
"Art. 12":["Record-keeping","Ordered events retain actors, checks and outcomes for this run.","No permanent, tamper-evident logging or retention service."],
"Art. 14":["Human oversight","Advice is separate from approval; a named reviewer retains the decision.","Real-world identity assurance, training and oversight procedures are not shown."],
"Art. 14(4)":["Interpreting AI output","Structured checked findings help a reviewer understand the reason for a proposed concern.","Does not explain a live AI model's internal behaviour."],
"Art. 15":["Robustness and security","Input boundaries, reliable arithmetic and verification help bound selected failures.","No full model-accuracy benchmark or cybersecurity certification."],
"Art. 26":["Deployer obligations","Recorded named decisions illustrate controlled operation.","Actual deployer obligations depend on intended use and risk classification."],
"Annex IV":["Technical documentation","Workflow descriptions and source references aid inspection.","Not a conformity dossier."]
};
var root=null, chosen="proponent",scenario="",record=null,loading=false,cache={},catalog=null,catalogRequested=false;
var connected={token_economics:["proponent","opponent","judge"],process_semantics:["orchestrator","disposition","remediation","memory","archive"],disposition:["advisory","orchestrator","remediation","archive"],judge:["token_economics","firewall","advisory"],proponent:["token_economics","firewall"],opponent:["token_economics","firewall"],orchestrator:["process_semantics","disposition","remediation"],remediation:["process_semantics","disposition","intake"],memory:["process_semantics","rules"]};
function loadCatalog(){if(catalogRequested)return;catalogRequested=true;fetch(SOURCE+"workflow_states.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw Error(r.status);return r.json();}).then(function(d){if(Array.isArray(d.states)){catalog=d;draw();}}).catch(function(){/* Record events remain visible when the catalog cannot be loaded. */});}
function el(tag,cls,text){var node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function fill(parent,node){parent.appendChild(node);return node;}
function card(parent,caption,copy){var box=fill(parent,el("article","ax-explain-card"));fill(box,el("h4","",caption));fill(box,el("p","",copy));}
function currentSlug(){var x=new URLSearchParams(location.search).get("case");return /^[a-z0-9_]+$/.test(x||"")?x:"supplier_variance_review";}
function load(){
 var slug=currentSlug();if(slug===scenario&&record)return;scenario=slug;record=cache[slug]||null;
 if(record){draw();return;}
 if(loading)return;loading=true;fetch(SOURCE+"scenarios/"+encodeURIComponent(slug)+".json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();}).then(function(d){cache[slug]=d;if(scenario===slug)record=d;}).catch(function(){record=null;}).finally(function(){loading=false;draw();});}
function draw(){
 if(!root)return;
 root.replaceChildren();
 var m=meta[chosen]||meta.proponent, title=m[0];
 var s1=fill(root,el("section","ax-section"));
 fill(s1,el("div","ax-kicker","02 / UNDERSTAND THE COMPONENT"));
 fill(s1,el("h2","","What is this component, and why is it here?"));
 fill(s1,el("p","ax-lead","Select a block in the modular architecture above. Its purpose, safeguards and recorded output appear here."));
 var focus=fill(s1,el("div","ax-focus"));fill(focus,el("span","ax-chip","SELECTED MODULE"));fill(focus,el("h3","",title));
 var grid=fill(s1,el("div","ax-grid"));card(grid,"What is it?",m[1]);card(grid,"What does it do?",m[2]);card(grid,"Why is it included?",m[3]);card(grid,"What does it cover and what are its limits?",m[4]);
 var links=connected[chosen]||[];
 if(links.length){var rel=fill(s1,el("div","ax-related"));fill(rel,el("strong","","LINKED ARCHITECTURE BLOCKS"));
 links.forEach(function(id){if(!meta[id])return;var link=fill(rel,el("button","ax-related-link",meta[id][0]+" ↗"));link.type="button";link.addEventListener("click",function(){chosen=id;draw();var n=document.querySelector(".deck [data-node=\u0027"+id+"\u0027]");if(n)n.click();});});}
 var row=fill(s1,el("div","ax-roles"));fill(row,el("strong","","REVIEW COMMITTEE"));
 ["proponent","opponent","firewall","judge"].forEach(function(id){var b=fill(row,el("button",id===chosen?"ax-role active":"ax-role",meta[id][0]));b.type="button";b.addEventListener("click",function(){chosen=id;draw();var n=document.querySelector(".deck [data-node='"+id+"']");if(n)n.click();});});
 var s2=fill(root,el("section","ax-section"));fill(s2,el("div","ax-kicker","03 / RECORDED WORKFLOW RESULT"));fill(s2,el("h2","","What actually happened?"));
 if(record&&Array.isArray(record.events)){
   fill(s2,el("p","ax-lead",(record.title||"Selected scenario")+" · Recorded outcome: "+(record.outcome&&record.outcome.terminal_state||"Not specified")+" · "+record.events.length+" total events."));
   var items=record.events.filter(function(event){
     if(chosen==="process_semantics")return event.kind==="audit.row_appended"||event.kind==="hitl.opened"||event.kind==="hitl.resumed";
     if(chosen==="token_economics")return event.kind.indexOf("committee.")===0;
     if(chosen==="orchestrator")return event.kind==="audit.row_appended";
     if(chosen==="disposition")return event.node==="disposition"||event.node==="gate";
     return event.node===chosen;
   });
   fill(s2,el("div","ax-count",items.length+" relevant recorded "+(items.length===1?"event":"events")+" for "+title));
   if(chosen==="token_economics")fill(s2,el("p","ax-economics","Usage and cost: scripted AI personas, 0 live model calls. No measured input/output token usage or actual API charges are available. In a live adapter, cost can be estimated from measured input/output tokens and the provider's applicable rates. The maximum FOUR proposed findings limits proposal volume, not tokens."));
   if(chosen==="process_semantics"&&catalog&&Array.isArray(catalog.states)){var table=fill(s2,el("div","ax-transitions"));fill(table,el("h3","","Allowed transitions · "+catalog.states.length+" recorded states"));catalog.states.forEach(function(st){var x=fill(table,el("div","ax-transition"));fill(x,el("strong","",st.state));fill(x,el("span","",st.next&&st.next.length?"→ "+st.next.join(" · "):"Terminal state");});}
   var ol=fill(s2,el("ol","ax-events"));
   if(!items.length)fill(ol,el("li","ax-no-event","No separate event was emitted for this supporting control in the selected run."));
   items.slice(0,10).forEach(function(event){var li=fill(ol,el("li","ax-event"));fill(li,el("span","ax-seq",String(event.seq).padStart(2,"0")));var info=fill(li,el("div",""));fill(info,el("strong","",event.label));if(event.detail)fill(info,el("p","",event.detail));fill(info,el("small","",event.actor+" · "+event.kind));});
   fill(s2,el("p","ax-note",chosen==="token_economics"?"The role events shown above are NOT token-metering events. The published example does not record provider token consumption.": "These are records exported from the completed example, not a new model run. Use the replay above to follow the sequence."));
 }else fill(s2,el("p","ax-lead",loading?"Loading recorded events…":"The recorded case could not be loaded. The architecture remains available."));
 var s3=fill(root,el("section","ax-section"));fill(s3,el("div","ax-kicker","04 / EU AI ACT GOVERNANCE VIEW"));fill(s3,el("h2","","Which governance principles does this support?"));
 fill(s3,el("p","ax-lead","The controls below are linked to selected EU AI Act provisions. Each explains the demonstrated mechanism and the remaining limitation."));
 var laws=fill(s3,el("div","ax-law-grid"));
 if(!m[5].length)fill(laws,el("p","ax-no-event","This accounting mechanism is an operational transparency control. No direct EU AI Act article is asserted for token costs alone."));
 m[5].forEach(function(article){if(!scope[article])return;var d=scope[article];var c=fill(laws,el("article","ax-law"));fill(c,el("strong","",article+" · "+d[0]));fill(c,el("p","",d[1]));fill(c,el("p","ax-gap","Still missing: "+d[2]));var a=fill(c,el("a","","Official text ↗"));a.href="https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-"+(article.match(/\d+/)||["14"])[0];a.target="_blank";a.rel="noopener noreferrer";});
 fill(s3,el("p","ax-caution","This is a conceptual mapping, not a claim of EU AI Act compliance or high-risk classification. Whether specific legal duties apply depends on the system's intended purpose and deployment. This reference uses scripted AI-style personas, not a live AI model."));
}
function attach(){
 var deck=document.querySelector("main .deck");if(!deck)return false;
 // The interactive modular Architecture MUST remain first, before all companion sections.
 var firstMount=!root;
 if(!root){root=el("div","ax-story");root.id="architecture-explained";}
 if(root.parentElement!==deck.parentElement||root.previousElementSibling!==deck){
   deck.insertAdjacentElement("afterend",root);
 }
 if(firstMount)draw();
 var selected=deck.querySelector('[data-node][aria-pressed="true"]');if(selected&&meta[selected.dataset.node]&&chosen!==selected.dataset.node){chosen=selected.dataset.node;draw();}
 if(chosen==="process_semantics")loadCatalog();
 load();return true;
}
var frame=0;function schedule(){if(frame)return;frame=requestAnimationFrame(function(){frame=0;attach();});}
document.addEventListener("click",function(e){var node=e.target.closest&&e.target.closest("[data-node]");if(node&&meta[node.dataset.node]){chosen=node.dataset.node;if(chosen==="process_semantics")loadCatalog();setTimeout(draw,0);}setTimeout(schedule,70);},true);
document.addEventListener("change",function(){setTimeout(schedule,80);setTimeout(load,180);},true);
window.addEventListener("popstate",schedule);
var watch=new MutationObserver(schedule);
function begin(){watch.observe(document.body,{childList:true,subtree:true});schedule();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",begin,{once:true});else begin();
})();