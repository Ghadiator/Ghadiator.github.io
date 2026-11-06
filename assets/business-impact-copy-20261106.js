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
  function afterHydration() {
    update();
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
