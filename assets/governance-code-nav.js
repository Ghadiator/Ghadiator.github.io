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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',ensure);
})();