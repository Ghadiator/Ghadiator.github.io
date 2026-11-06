/* Public-static bridge until the next verified native frontend build.
 * Inserts a single link without modifying compiled React bundles or evidence.
 * This script has no network calls and never changes record data.
 */
(function(){"use strict";
const target='/governance-code/';
const icon='<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/><path d="m14.5 4-5 16"/></svg>';
let scheduled=false;
function ensure(){scheduled=false;const nav=document.querySelector("nav.public-nav");if(!nav||nav.querySelector('a[href="'+target+'"]'))return;
const after=nav.querySelector('a[href="/governance/"]');if(!after)return;
const link=document.createElement('a');link.setAttribute('href',target);link.innerHTML=icon+'<span>Governance Code</span>';
if(location.pathname.replace(/\/$/,"")===target.slice(0,-1))link.setAttribute('aria-current','page');
after.insertAdjacentElement('afterend',link);
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(ensure)}}
// Next.js hydrates the published shell after DOMContentLoaded. Inserting
// nodes before hydration caused React #418 recoveries across the site.
// Wait until window.load and a post-load settling interval; only then
// watch for later React navigation replacing the sidebar.
let started=false;
function start(){
  if(started)return;started=true;
  window.setTimeout(()=>{
    ensure();
    const nav=document.querySelector("nav.public-nav");
    if(nav)new MutationObserver(schedule).observe(nav,{childList:true,subtree:true});
  },2000);
}
if(document.readyState==='complete')start();
else window.addEventListener('load',start,{once:true});
window.addEventListener('pageshow',()=>{if(started)window.setTimeout(ensure,2000)});
})();