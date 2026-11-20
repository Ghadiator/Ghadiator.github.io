/*
 * Public validation workspace clarity.
 * One navigation hub, one recorded-cases list and one source-evidence case view.
 * No duplicate embedded workbenches, no private API, no simulated approvals.
 * The public fixture and its source hashes remain owned by their existing files.
 */
(function () {
  "use strict";
  var ROOT = "gac-clarity";
  function currentRoute() { return location.pathname.replace(/\/+$/, ""); }

  // Each stage is a real architectural responsibility, not a tab that embeds
  // the same Cases page. The public site explains controls; it never pretends
  // to run the operational API or approve real documents.
  var VALIDATION_STAGES = [
    {
      title: "Intake & evidence",
      short: "Register and parse",
      kind: "INPUT",
      receives: "Supplier message, attachment and case identity; approved file type and documented submission format.",
      performs: "Bind the original attachment to its ticket, email, submission version and validation run. Parse workbook fields into the typed input schema. Record source identity and checksums.",
      produces: "Version-bound structured submission and immutable source reference for the reviewer.",
      boundary: "Missing, malformed or ambiguous evidence must be flagged. A guessed file, row or value is not reliable provenance.",
      inspect: "/inbound/", inspectText: "Open intake view"
    },
    {
      title: "Tier 1 · hard rules",
      short: "Deterministic checks",
      kind: "CODE",
      receives: "Parsed field values from the recorded submission.",
      performs: "Execute exact arithmetic, structural and hard contractual-format rules in code. Report rule IDs, operands and violated conditions.",
      produces: "Either a passed Tier-1 result or Rules_failed with specific violations.",
      boundary: "A Tier-1 failure short-circuits Tier 2 and Tier 3. The engine cannot quietly convert that failure into approval.",
      inspect: "/architecture/", inspectText: "Inspect validation architecture"
    },
    {
      title: "Tier 2 · cross-check",
      short: "Authoritative references",
      kind: "CODE + REFERENCE",
      receives: "Tier-1-passed submission plus the authoritative CRM/Pricing or contract baseline applicable to this run.",
      performs: "Compare submitted values against permitted rates, contract scope, reference constraints and historical continuity. Preserve which baseline and typed values were used.",
      produces: "Either Crosscheck_failed on mismatch, a recorded escalation signal, or a clean cross-check.",
      boundary: "Missing authoritative context does not become a fabricated match. A failed optional AI check selector falls back to canonical checks; the selector itself is not the decision.",
      inspect: "/architecture/", inspectText: "Inspect reference checks"
    },
    {
      title: "Tier 3 · bounded AI",
      short: "Conditional investigation",
      kind: "OPTIONAL AI",
      receives: "A Tier-2 escalation and a constrained evidence package; Tier 3 is not called for every submission.",
      performs: "Run bounded Proponent/Opponent/Judge reasoning where invoked. Challenge claims through Chain-of-Verification before presenting surviving anomalies.",
      produces: "Anomaly_flagged with tagged, reviewable advisory observations and verification trace.",
      boundary: "Generated explanations are not original source records, and Tier-2 trigger fields do not prove the model's internal reasoning. The AI does not issue the terminal decision.",
      inspect: "/architecture/", inspectText: "Inspect AI controls and CoVe"
    },
    {
      title: "Human oversight",
      short: "Review and authorize",
      kind: "HUMAN AUTHORITY",
      receives: "Machine result, original evidence where available, executed checks, any verified anomalies and the case's current version/run.",
      performs: "A reviewer inspects the evidence, challenges or queries the supplier, and chooses an available decision with a required reason code, rationale and confirmation.",
      produces: "An attributable human disposition or an unresolved request for clarification. High-risk overrides/dismissals are parked pending a different reviewer's authorization.",
      boundary: "Rules_failed, Crosscheck_failed and Anomaly_flagged require human attention. Machine Validation_passed is not itself a human approval. Past runs must not authorize the latest submission.",
      inspect: "/cases/", inspectText: "Open case review"
    },
    {
      title: "Audit & accountability",
      short: "Reconstruct the run",
      kind: "CONTINUOUS TRACE",
      receives: "Case/version/run identity, source provenance, check events, escalation, reviewer actions and decision metadata.",
      performs: "Retain ordered transitions and evidence references so the outcome can be reconstructed and challenged. The audit log spans the workflow; it is not merely a final step.",
      produces: "Traceable links from submitted evidence through check results to the authorized human disposition.",
      boundary: "A final state without its evidence, actor and ordered history is not a sufficient audit record.",
      inspect: "/audit/", inspectText: "Inspect process audit"
    }
  ];

  function stageButtons() {
    return VALIDATION_STAGES.map(function (step, index) {
      return '<li><button type="button" class="gac-ops-stage' +
        (index === 0 ? ' is-active' : '') +
        '" data-gac-ops-stage="' + index + '" aria-pressed="' +
        (index === 0 ? 'true' : 'false') + '">' +
        '<span class="gac-ops-stage-number">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<strong>' + step.title + '</strong>' +
        '<small>' + step.short + '</small></button></li>';
    }).join("");
  }

  var workspaceHTML =
    '<section id="gac-workspace-guide" class="gac-clarity-hub gac-ops-workspace" aria-labelledby="gac-workspace-title">' +
      '<div class="gac-ops-header">' +
        '<p class="gac-clarity-eyebrow">VALIDATION WORKSPACE · CONTROL FLOW & HUMAN OVERSIGHT</p>' +
        '<h1 id="gac-workspace-title">How the validation system works</h1>' +
        '<p class="gac-clarity-lead">Follow the generic control path from submitted evidence through deterministic checks, authoritative comparisons and conditional AI investigation to accountable human review. This is the <strong>operational design</strong>—not a walkthrough of one chosen case.</p>' +
        '<p class="gac-ops-mode"><strong>Public reference mode:</strong> the flow below describes implemented controls. GitHub Pages does not process private uploads, run the backend or authorize live decisions.</p>' +
      '</div>' +
      '<section class="gac-ops-process" aria-label="Validation sequence and controls">' +
        '<div class="gac-ops-section-top"><div><p class="gac-clarity-eyebrow">HOW THE SYSTEM HANDLES A SUBMISSION</p>' +
          '<h2>Validation and oversight, end to end</h2></div>' +
          '<span class="gac-ops-explain">Select any stage to inspect its inputs, checks, outputs and safeguards</span></div>' +
        '<ol class="gac-ops-stages" aria-label="Workflow stages">' + stageButtons() + '</ol>' +
        '<div id="gac-ops-detail" class="gac-ops-detail" aria-live="polite" aria-atomic="true"></div>' +
      '</section>' +
      '<section class="gac-ops-routing" aria-labelledby="gac-ops-routes-title">' +
        '<div class="gac-ops-section-top"><div><p class="gac-clarity-eyebrow">DECISION BOUNDARIES</p>' +
        '<h2 id="gac-ops-routes-title">What happens at each validation outcome?</h2></div></div>' +
        '<div class="gac-ops-table-scroll"><table class="gac-ops-table">' +
          '<thead><tr><th scope="col">Observed result</th><th scope="col">Machine exit state</th><th scope="col">Permitted next action</th></tr></thead>' +
          '<tbody>' +
            '<tr><td>Tier 1 hard rule fails</td><td><code>Rules_failed</code></td><td>Stop further tier evaluation. Retain violations for correction and human review.</td></tr>' +
            '<tr><td>Tier 1 passes; Tier 2 comparison fails</td><td><code>Crosscheck_failed</code></td><td>Stop before Tier 3. Expose the actual comparison and reference source for review.</td></tr>' +
            '<tr><td>Tier 2 escalates an unresolved signal</td><td><code>Anomaly_flagged</code></td><td>Run optional Tier 3 and its verification controls, then present advisory findings to a human.</td></tr>' +
            '<tr><td>Required checks complete without a blocking issue</td><td><code>Validation_passed</code></td><td>Record the machine assessment. Do not mislabel this state as human authorization.</td></tr>' +
          '</tbody></table></div>' +
      '</section>' +
      '<section class="gac-ops-controls" aria-labelledby="gac-ops-controls-title">' +
        '<div class="gac-ops-section-top"><div><p class="gac-clarity-eyebrow">HUMAN CONTROL · NOT JUST A MODEL RECOMMENDATION</p>' +
        '<h2 id="gac-ops-controls-title">How human oversight is actually made possible</h2></div></div>' +
        '<ol class="gac-ops-control-grid">' +
          '<li><span>01 · INSPECT</span><strong>See the underlying evidence</strong><p>Read the original workbook where retained and authorized; inspect exact typed inputs, rule operands and check-time reference values. Missing source coordinates must remain visibly unverified.</p></li>' +
          '<li><span>02 · CHALLENGE</span><strong>Question an exception</strong><p>Separate hard-rule failures, failed contract comparisons and AI-generated advisory tags. Open the recorded validation method and request clarification instead of accepting an unsupported explanation.</p></li>' +
          '<li><span>03 · DECIDE</span><strong>Record a reasoned action</strong><p>The responsible reviewer chooses an available decision, supplies a reason code and written rationale, and confirms the action. The machine does not set a terminal human verdict.</p></li>' +
          '<li><span>04 · INDEPENDENT APPROVAL</span><strong>Enforce four-eyes control</strong><p>When a reviewer proposes a high-risk override or anomaly dismissal, the proposal remains pending until a different reviewer authorizes it. The initiator cannot serve as the second approver.</p></li>' +
        '</ol>' +
      '</section>' +
      '<section class="gac-ops-evidence" aria-labelledby="gac-ops-evidence-title">' +
        '<div class="gac-ops-section-top"><div><p class="gac-clarity-eyebrow">EXPLAINABILITY CONTRACT</p>' +
        '<h2 id="gac-ops-evidence-title">What “where” and “how” must mean</h2></div></div>' +
        '<div class="gac-ops-evidence-grid">' +
          '<div><h3>Show me where you found it</h3><p>Source attachment, sheet and cell when verifiable; otherwise the exact recorded JSON field, version and original value. Keep submission fields separate from the approved contract or CRM/Pricing reference.</p></div>' +
          '<div><h3>Show me how you did it</h3><p>Rule/check ID, actual parsed operands, executed comparison and reference snapshot. Reproduce deterministic arithmetic. For Tier 3, show verified claims, escalation triggers and uncertainty—not fabricated cell-level AI causality.</p></div>' +
          '<div><h3>Show me who decided</h3><p>Reviewer identity, permitted action, reason code, rationale, required second authorization and ordered audit evidence, bound to the correct case run and version.</p></div>' +
        '</div>' +
      '</section>' +
      '<nav class="gac-ops-destinations" aria-label="Open existing operational views">' +
        '<strong>Open the underlying views</strong>' +
        '<a href="/tickets/">Requests</a>' +
        '<a href="/inbound/">Intake</a>' +
        '<a href="/architecture/">Pipeline & replay</a>' +
        '<a href="/cases/">Case review</a>' +
        '<a href="/audit/">Audit trail</a>' +
        '<a href="/monitor/">Monitor</a>' +
      '</nav>' +
      '<p class="gac-clarity-caption">The Cases register contains inspectable recorded synthetic runs. They are examples of this general workflow, not the definition of Validation Workspace. The public reference uses pinned fixture JSON and cannot claim to show a historical original XLSX or execute a live human approval.</p>' +
    '</section>';

  function showOperationalStage(index, host) {
    var stage = VALIDATION_STAGES[index];
    if (!stage || !host) return;
    host.querySelectorAll("[data-gac-ops-stage]").forEach(function (button) {
      var selected = button.getAttribute("data-gac-ops-stage") === String(index);
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    var detail = host.querySelector("#gac-ops-detail");
    if (!detail) return;
    function escapeHTML(value) {
      return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    detail.innerHTML =
      '<div class="gac-ops-detail-heading"><span>' + escapeHTML(stage.kind) +
      '</span><h3>' + escapeHTML(stage.title) + '</h3></div>' +
      '<dl class="gac-ops-detail-grid">' +
        '<div><dt>Input / evidence received</dt><dd>' + escapeHTML(stage.receives) + '</dd></div>' +
        '<div><dt>Validation or human control</dt><dd>' + escapeHTML(stage.performs) + '</dd></div>' +
        '<div><dt>Recorded output</dt><dd>' + escapeHTML(stage.produces) + '</dd></div>' +
        '<div><dt>Guardrail / escalation</dt><dd>' + escapeHTML(stage.boundary) + '</dd></div>' +
      '</dl>' +
      '<a class="gac-ops-inspect-link" href="' + escapeHTML(stage.inspect) + '">' +
      escapeHTML(stage.inspectText) + ' →</a>';
  }

  var casesHTML =
    '<section id="gac-cases-guide" class="gac-clarity-cases-start" aria-labelledby="gac-cases-start-title">' +
      '<p class="gac-clarity-eyebrow">START HERE · EVIDENCE FIRST</p>' +
      '<h2 id="gac-cases-start-title">Choose a case. Follow the evidence—not another dashboard.</h2>' +
      '<p>Every item below is an <strong>already recorded synthetic test run</strong>. Open a case to see exactly which JSON field contains each displayed value, ' +
      'which check or exception used it, and which human decision was recorded.</p>' +
      '<div class="gac-clarity-case-grid">' +
        '<a href="/case/?id=supplier_variance_review#source-evidence"><span>FEATURED WALKTHROUGH</span><strong>Why did the 30% increase trigger review?</strong>' +
        '<small>€13,000 vs €10,000 · 20% contract threshold · 42 recorded events</small><em>Show source → calculation → recorded decision</em></a>' +
        '<a href="/case/?id=supplier_currency_mismatch#source-evidence"><span>DETERMINISTIC CONTRACT CHECK</span><strong>Why was a currency mismatch rejected?</strong>' +
        '<small>Submission field compared with the contract reference</small><em>Show recorded fields and check →</em></a>' +
        '<a href="/case/?id=supplier_rate_correction#source-evidence"><span>CORRECTION AND RECHECK</span><strong>What changes after a second submission?</strong>' +
        '<small>Two attempts · version-aware rule events</small><em>Inspect the recorded attempt →</em></a>' +
      '</div>' +
      '<div class="gac-clarity-small-note"><strong>Evidence boundary:</strong> the original Excel bytes of these historical fixture cases were not retained. ' +
      'Their public spreadsheet-style view is a clearly labelled projection of pinned recorded JSON; it cannot prove an original XLSX cell address.</div>' +
      '<p class="gac-clarity-list-link"><a href="#recorded-case-list">Or choose from all 15 recorded cases ↓</a> · ' +
      '<a href="/workspace/">What do the other workspace sections mean?</a></p>' +
    '</section>';

  function workspaceMode(main) {
    main.classList.add("gac-clarity-workspace");
    main.classList.remove("gac-clarity-cases");
    if (!main.querySelector("#gac-workspace-guide")) {
      main.insertAdjacentHTML("beforeend", workspaceHTML);
    }
    var host = main.querySelector("#gac-workspace-guide");
    if (host && host.getAttribute("data-gac-ops-ready") !== "true") {
      host.setAttribute("data-gac-ops-ready", "true");
      showOperationalStage(0, host);
      host.addEventListener("click", function (event) {
        var button = event.target.closest("[data-gac-ops-stage]");
        if (!button || !host.contains(button)) return;
        var index = Number(button.getAttribute("data-gac-ops-stage"));
        showOperationalStage(index, host);
      });
    }
  }
  function casesMode(main) {
    main.classList.add("gac-clarity-cases");
    main.classList.remove("gac-clarity-workspace");
    var lead = main.querySelector(".page-lead");
    if (lead && !main.querySelector("#gac-cases-guide")) {
      lead.insertAdjacentHTML("afterend", casesHTML);
    }
    var list = main.querySelector(".evidence-panel");
    if (list && list.id !== "recorded-case-list") {
      list.id = "recorded-case-list";
      list.setAttribute("aria-label", "All 15 recorded case runs");
      list.setAttribute("tabindex", "-1");
    }
  }
  function update() {
    var route = currentRoute();
    var main = document.querySelector("main#main-content");
    if (!main) return;
    // Load the style only on the two target routes and only when the
    // enhanced content is mounted after hydration.
    if ((route === "/workspace" || route === "/cases") &&
        !document.querySelector('link[href="/assets/validation-navigation-clarity-20261120.css"]')) {
      var stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "/assets/validation-navigation-clarity-20261120.css";
      document.head.appendChild(stylesheet);
    }
    // Next.js may navigate without a full reload. Never leave a guide
    // from the previous route attached to the next page.
    if (route !== "/workspace") main.querySelector("#gac-workspace-guide")?.remove();
    if (route !== "/cases") main.querySelector("#gac-cases-guide")?.remove();
    if (route === "/workspace") workspaceMode(main);
    else if (route === "/cases") casesMode(main);
    else {
      main.classList.remove("gac-clarity-workspace", "gac-clarity-cases");
    }
  }
  function init() {
    // The exported Next.js document may stream server markup AFTER
    // DOMContentLoaded. Mutating its React-owned elements before hydration
    // triggers #418 mismatches and can drop event handlers. Wait for the
    // client bundle to attach, then mount only once; observe later route
    // changes and reapply idempotently.
    var hydrated = false;
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (!hydrated || scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () { scheduled = false; update(); });
    });
    observer.observe(document.body, { subtree: true, childList: true });
    function mountAfterHydration() {
      hydrated = true;
      update();
    }
    // Conservative grace window for the already-compiled public export.
    // The initial route's React shell is static once hydrated; this
    // enhancement must not replace React's own children during attach.
    setTimeout(mountAfterHydration, 2200);
    window.addEventListener("popstate", function () {
      if (hydrated) requestAnimationFrame(update);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();
})();