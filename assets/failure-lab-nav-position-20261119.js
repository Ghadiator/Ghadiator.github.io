/* Navigation parity with native PublicShell: Failure Lab belongs with
 * introductory engineering explorations, not buried at the rail's bottom.
 * Move after hydration to avoid mismatching the exported React tree. */
(function(){"use strict";
function promote(){
 const nav=document.querySelector(".public-sidebar nav.public-nav");
 if(!nav)return;
 const failure=nav.querySelector('a[href="/red-team"], a[href="/red-team/"]');
 const architecture=nav.querySelector('a[href="/architecture"], a[href="/architecture/"]');
 if(!failure||!architecture||failure.nextElementSibling===architecture)return;
 architecture.insertAdjacentElement("afterend",failure);
 if(failure.closest("section")===architecture.closest("section"))failure.dataset.promoted="1";
}
function start(){window.setTimeout(promote,2300)}
if(document.readyState==="complete")start();else window.addEventListener("load",start,{once:true});
})();
