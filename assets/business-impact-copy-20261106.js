/* Static-release bridge until a native Next.js rebuild can ship the revised
   BusinessImpact component. Do not modify server-rendered text before React
   hydration; that would cause a text mismatch in the pinned 7.5.19 bundle. */
(function () {
  "use strict";
  const intro = "Supplier invoice validation combines routine calculations with evidence checks, exception handling and accountable decisions. The governed workflow automates exact checks, verifies claims against independent sources and uses bounded AI reasoning only when an exception needs further analysis. A named human reviewer retains decision authority.";
  const boundary = "The workflow illustrates <strong>where business value may arise</strong>, not measured productivity gains or return on investment. Claims about time, quality or cost improvements require comparable manual and AI-assisted cases; the public examples are synthetic.";
  function update() {
    const heading = Array.from(document.querySelectorAll("h1")).find(n => n.textContent.includes("Business value"));
    const header = heading && heading.closest("header");
    if (!header) return false;
    const paragraphs = header.querySelectorAll("p");
    const value = Array.from(paragraphs).find(n => n.textContent.includes("How does governed agentic AI change invoice review?"));
    const caveat = Array.from(paragraphs).find(n => n.textContent.includes("business-impact hypothesis supported by workflow evidence"));
    if (value) value.textContent = intro;
    if (caveat) {
      caveat.replaceChildren();
      const prefix = document.createTextNode("The workflow illustrates ");
      const strong = document.createElement("strong");
      strong.textContent = "where business value may arise";
      const suffix = document.createTextNode(", not measured productivity gains or return on investment. Claims about time, quality or cost improvements require comparable manual and AI-assisted cases; the public examples are synthetic.");
      caveat.append(prefix, strong, suffix);
    }
    return !!(value || caveat);
  }
  function compactKpiLayout() {
    const taxonomy = document.querySelector(".gac-kpi-business-taxonomy");
    if (!taxonomy) return;
    const cards = taxonomy.querySelectorAll(".gac-kpi-business-groups article");
    if (cards.length === 2) {
      cards[0].id = "gac-business-kpis";
      cards[1].id = "gac-ai-kpis";
      const links = taxonomy.querySelectorAll("a[href^='/#']");
      if (links[0]) links[0].href = "/business-impact/#gac-business-kpis";
      if (links[1]) links[1].href = "/business-impact/#gac-ai-kpis";
    }
    // Preserve the six mechanism explanations, but do not repeat them as a
    // giant always-expanded block after the compact KPI family catalogues.
    const detailed = document.querySelector('section[aria-label="KPI scorecard and measurement method"]');
    if (detailed && !detailed.closest("details")) {
      const panel = document.createElement("details");
      panel.className = "gac-kpi-method-details";
      const summary = document.createElement("summary");
      summary.textContent = "Explore manual-versus-governed mechanisms and measurement methods";
      detailed.parentNode.insertBefore(panel,detailed);
      panel.append(summary,detailed);
    }
    if (!taxonomy.querySelector(".gac-kpi-fixture-summary")) {
      const reference = document.querySelector('section[aria-label="Supplier business profile"] article:nth-child(2)');
      const values = reference && Array.from(reference.querySelectorAll("strong.font-mono")).map(n=>n.textContent.trim());
      if (values && values.length >= 4) {
        const container = document.createElement("div");
        container.className = "gac-kpi-fixture-summary";
        const labels = ["Recorded synthetic cases","Cases avoiding committee","Executed validation checks","Recorded events"];
        values.slice(0,4).forEach((value,i)=>{
          const card=document.createElement("div");
          const num=document.createElement("strong"); num.textContent=value;
          const label=document.createElement("span"); label.textContent=labels[i];
          card.append(num,label);container.appendChild(card);
        });
        const note=document.createElement("p");
        note.className="gac-kpi-fixture-note";
        note.textContent="Observed reference-run counts, not measured manual-versus-AI gains; event count does not prove trace completeness.";
        taxonomy.append(container,note);
      }
    }
  }
  function afterHydration() {
    update();
    compactKpiLayout();
    // Re-apply if the router remounts the page later, with bounded observation.
    const main = document.querySelector("main.public-main");
    if (!main) return;
    let remaining = 12;
    const observer = new MutationObserver(() => {
      if (remaining-- <= 0) { observer.disconnect(); return; }
      update();
    });
    observer.observe(main, {childList:true, subtree:true});
    setTimeout(() => observer.disconnect(), 15000);
  }
  if (document.readyState === "complete") setTimeout(afterHydration, 1000);
  else window.addEventListener("load", () => setTimeout(afterHydration, 1000), {once:true});
})();
