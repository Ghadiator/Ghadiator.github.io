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
})();
