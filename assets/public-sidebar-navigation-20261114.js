/* GovernanceAsCode public static navigation compatibility.
 * Published HTML/CSS received independent corrections after the original
 * Next.js bundle. Force a document load when changing shell navigation
 * sections, so cached client-side Flight state cannot restore an old layout.
 * Do not intercept keyboard modifiers, external links, downloads, new tabs,
 * or same-document anchors. Remove after an atomic rebuild is deployed.
 */
(() => {
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const origin = event.target;
    if (!(origin instanceof Element)) return;
    const link = origin.closest("a[href]");
    if (!link || !link.closest(".public-sidebar, .mobile-topbar, .public-topbar") ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")) return;
    const destination = new URL(link.href, window.location.href);
    if (!["http:", "https:"].includes(destination.protocol) ||
        destination.origin !== window.location.origin) return;
    const current = new URL(window.location.href);
    if (destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash && destination.hash !== current.hash) return;
    if (destination.href === current.href) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(destination.href);
  }, true);

  // Static compatibility link, added only after React has hydrated.
  // Avoid patching compiled Next.js chunks or the server-rendered RSC payload.
  const contextTarget = "/context-engineering/";
  let contextScheduled = false;
  function ensureContextLink() {
    contextScheduled = false;
    const nav = document.querySelector("nav.public-nav");
    if (!nav || nav.querySelector('a[href="' + contextTarget + '"]')) return;
    const after = nav.querySelector('a[href="/ai-roles/"]');
    if (!after) return;
    const link = document.createElement("a");
    link.href = contextTarget;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width","17");
    svg.setAttribute("height","17");
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("fill","none");
    svg.setAttribute("stroke","currentColor");
    svg.setAttribute("stroke-width","2");
    svg.setAttribute("aria-hidden","true");
    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d","M12 7v14M3 18V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13");
    svg.appendChild(path);
    const label = document.createElement("span");
    label.textContent = "Context engineering";
    link.append(svg,label);
    after.insertAdjacentElement("afterend",link);
  }
  function scheduleContextLink() {
    if (contextScheduled) return;
    contextScheduled = true;
    requestAnimationFrame(ensureContextLink);
  }
  function startContextNav() {
    window.setTimeout(() => {
      ensureContextLink();
      const nav = document.querySelector("nav.public-nav");
      if (nav) new MutationObserver(scheduleContextLink).observe(nav, {childList:true,subtree:true});
    }, 2000);
  }
  if (document.readyState === "complete") startContextNav();
  else window.addEventListener("load",startContextNav,{once:true});

})();
