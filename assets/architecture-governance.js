/* Editorial control mappings, not executable policy or a conformity assessment.
 * Article links are official Commission references; module relevance is an
 * interpretation of this architecture, separate from recorded fixture evidence. */
(function(){
  "use strict";
  const articles={
    12:"Record-keeping",
    13:"Transparency for deployers",
    14:"Human oversight",
    15:"Accuracy, robustness and cybersecurity"
  };
  // [control intention, architectural contribution, remaining assurance, articles]
  const modules={
    orchestrator:["Controlled coordination","SupplierWorkflow coordinates every recorded case through allowed states, deterministic routing and explicit reviewer pauses.","The traces evidence this synthetic state machine, not LangGraph execution, durable recovery or production coordination.",[14]],
    request:["Clear review scope","A defined evidence request makes the case purpose and required material visible before review.","A request template does not establish complete deployer instructions or system transparency.",[13]],
    reminders:["Traceable follow-up","Recorded reminders show which collection actions were prepared for the case.","Fixture outbox records do not demonstrate delivery, reliable production logging or retention.",[12]],
    intake:["Validated input boundary","Rejecting malformed submissions keeps structurally invalid material out of downstream review.","Schema validation does not establish model accuracy or training-data governance. Operational invoice fields are not a training dataset.",[15]],
    memory:["Version-aware context","Submission history helps a reviewer distinguish corrected evidence from earlier case versions.","Version context alone does not prove complete lifetime logs, access controls or retention safeguards.",[12]],
    rules:["Repeatable factual checks","Explicit arithmetic and completeness checks give review a testable factual baseline.","Invoice-rule results do not measure AI accuracy; production thresholds, failure tests and monitoring remain necessary.",[15]],
    crosscheck:["Grounding in approved facts","Comparison with approved commercial terms constrains which invoice claims can be supported.","The reference baseline must itself be current and authorised. Contract matching does not validate overall AI performance.",[15]],
    external:["Authoritative reference boundary","Approved terms provide an independent reference for downstream verification.","Indirect support only: a contract document is not an AI control by itself and does not establish Article 10 training-data compliance.",[15]],
    sanitiser:["Separation of data and instructions","A trust boundary prevents supplier narrative from becoming decision authority.","A scripted injection fixture illustrates the boundary; live-model attack coverage and security testing remain unproven.",[15]],
    proponent:["Inspectable supporting rationale","The supportive perspective makes the proposed case for an exception available for review.","An AI-style argument is neither verified evidence nor a decision. A second persona alone does not establish effective oversight.",[14]],
    opponent:["Visible challenge","A separate challenge surfaces claims for verification before the reviewer receives a recommendation.","Scripted disagreement does not prove independence, bias mitigation or comprehensive error detection.",[14]],
    firewall:["Evidence before recommendation","Checking proposed claims against case facts reduces the path for unsupported findings to reach the Judge.","Verification is bounded by available evidence and checker coverage. It cannot guarantee that every claim is correct.",[15,14]],
    judge:["Advisory authority only","A summary of verified findings helps the reviewer interpret the result while reserving final authority for a person.","A summary is not oversight by itself; people still need competence, context and the ability to disregard it.",[14,13]],
    post_cove:["Verification after synthesis","The broader design places another checking boundary after the Judge summary.","Architecture reference only here. No supplier-fixture event demonstrates that this additional layer ran.",[15]],
    token_economics:["Bounded resource use","The scripted proposal path limits adapter contributions to four and discards failed or over-budget output before the review package.","No direct token-budget obligation is identified in these articles. Live token metering, cost control and model fallback are not demonstrated.",[]],
    advisory:["Decision-ready evidence","A consolidated review package keeps factual failures and verified findings available to the human gate.","The package supports review; it does not prove that a reviewer understood the limits or avoided automation bias.",[14,13]],
    remediation:["Correctable review path","A correction request gives the supplier a documented route to address missing or inconsistent evidence.","An invoice correction loop is a workflow safeguard, not evidence of every legally required remedy or intervention mechanism.",[14]],
    disposition:["Final human authority","The human gate separates advisory findings from an authorised reviewer's disposition.","Historical fixture decisions do not demonstrate real reviewer training, independent judgment or a production stop mechanism.",[14]],
    archive:["Inspectable decision record","The recorded outcome and event history provide material for tracing how the case ended.","Fixture memory is not a durable audit repository. Production log coverage, custody and retention remain to be demonstrated.",[12]],
    process_semantics:["Consistent event meaning","Typed supplier Event records distinguish state transitions, check results, claims and human decisions in the recorded workflow.","The in-memory supplier log does not demonstrate the separate generic ProcessEvent emitter, durable retention or lifetime production logging.",[12]]
  };
  window.ArchitectureGovernance={articles,modules,
    scope:"These are architectural support mappings to high-risk AI requirements, not a determination that this supplier-review use case is high-risk or that the system complies. Applicability depends on intended purpose, classification and operator role.",
    source:"https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-"
  };
})();
