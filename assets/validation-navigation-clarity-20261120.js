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

  var workspaceHTML =
    '<section id="gac-workspace-guide" class="gac-clarity-hub" aria-labelledby="gac-workspace-title">' +
    '<p class="gac-clarity-eyebrow">VALIDATION WORKSPACE · WHERE TO GO</p>' +
    '<h1 id="gac-workspace-title">Follow one case, from source to human decision</h1>' +
    '<p class="gac-clarity-lead">These are <strong>different stages of the same workflow</strong>, not five alternative dashboards. ' +
    'Choose the action you want to understand. Each opens its own dedicated view.</p>' +
    '<div class="gac-clarity-feature">' +
      '<div><span class="gac-clarity-small">RECOMMENDED FIRST · RECORDED EXAMPLE</span>' +
      '<h2>Why did a €13,000 invoice need human review?</h2>' +
      '<p>Open the actual published 42-event synthetic case. See where its values came from, reproduce the 30% variance against a 20% limit, inspect recorded checks, and read the reviewer outcome.</p></div>' +
      '<a class="gac-clarity-action" href="/case/?id=supplier_variance_review#source-evidence">Walk through the evidence <span aria-hidden="true">→</span></a>' +
    '</div>' +
    '<h2 class="gac-clarity-section-title">What each part of the workspace actually does</h2>' +
    '<ol class="gac-clarity-route-grid">' +
      '<li><a href="/tickets/"><span class="gac-clarity-stage">01 · COLLECTION</span><strong>Document requests</strong>' +
      '<span>Which supplier evidence was requested and what is outstanding?</span><em>Open the request register →</em></a></li>' +
      '<li><a href="/inbound/"><span class="gac-clarity-stage">02 · RECEIPT</span><strong>Incoming correspondence</strong>' +
      '<span>What arrived, and how was a response associated with a request?</span><em>Inspect intake and matching →</em></a></li>' +
      '<li><a href="/architecture/"><span class="gac-clarity-stage">03 · REPLAY</span><strong>Workflow replay</strong>' +
      '<span>Step through a recorded scenario and see which module and event came next. This is what “Scenario Theater” was intended to explain.</span><em>Open the architecture replay →</em></a></li>' +
      '<li><a href="/cases/"><span class="gac-clarity-stage">04 · EVIDENCE</span><strong>Recorded cases</strong>' +
      '<span>Choose a recorded case, verify its source fields and checks, and inspect its human outcome.</span><em>Browse the 15 recorded cases →</em></a></li>' +
      '<li><a href="/audit/"><span class="gac-clarity-stage">05 · ACCOUNTABILITY</span><strong>Process audit</strong>' +
      '<span>Reconstruct event order and the transitions that led to a recorded disposition.</span><em>Inspect the audit evidence →</em></a></li>' +
    '</ol>' +
    '<div class="gac-clarity-secondary">' +
      '<div><strong>What about monitoring?</strong><p><a href="/monitor/">Monitor</a> is a separate operational-control view. It is not the scenario replay or a second Cases page.</p></div>' +
      '<div><strong>What about real cases?</strong><p>GitHub Pages is public and read-only. Original XLSX files, authenticated case access and live human decisions require the separately secured service.</p></div>' +
    '</div>' +
    '<p class="gac-clarity-caption">Public examples are recorded synthetic fixtures. The source view identifies recorded JSON fields, not a historical original Excel workbook. No live API, email or approval is operated here.</p>' +
    '</section>';

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
    update();
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () { scheduled = false; update(); });
    });
    // The compiled Next app streams content and uses same-document routes.
    // Restore the correct guide after hydration without mutating the source fixtures.
    observer.observe(document.body, { subtree: true, childList: true });
    window.addEventListener("popstate", update);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else init();
})();