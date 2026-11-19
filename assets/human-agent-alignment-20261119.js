/* Static-export parity: revive the approved three-layer alignment without
 * discarding the newer, correctly bounded persona avatars. The source component
 * owns this arrangement after the next full frontend export. */
(()=>{"use strict";
const classes={
  section:"gac-aligned-collab", exec:"gac-execution-row", body:"gac-exec-body",
  main:"gac-main-steps", down:"gac-down-arrow", last:"gac-final-steps", support:"gac-support-row"
};
function restore(){
 const section=document.getElementById("human-agent-collaboration");
 if(!section||section.dataset.alignedCollaboration==="1")return;
 const figure=section.querySelector("figure");if(!figure)return;
 const rows=Array.from(figure.children).filter(n=>n.classList.contains("grid"));
 if(rows.length<3)return;
 const execRow=rows[2],exec=execRow.children[1];
 const main=exec?.querySelector(":scope > ol");
 const exception=exec?.querySelector('[data-lane="exception-path"]');
 const fast=exec?.querySelector('[data-lane="fast-path"]');
 if(!main||!exception||!fast)return;
 const final=exception.parentElement?.parentElement;
 const down=main.nextElementSibling;
 const support=final?.nextElementSibling;
 if(!final||!down||!support||support.tagName!=="DIV")return;

 section.classList.add(classes.section);
 execRow.classList.add(classes.exec);
 exec.classList.add(classes.body);main.classList.add(classes.main);
 down.classList.add(classes.down);final.classList.add(classes.last);
 support.classList.add(classes.support);

 const mode=document.createElement("div");mode.className="gac-mode";
 mode.innerHTML='<div><h3>AI collaboration mode</h3><div class="gac-mode-options"><span>Assisted</span><span class="selected">Augmented</span><span>Autonomous</span></div></div>'
  +'<div><h3>Target operating model</h3><div class="gac-mode-options"><span>Human assistant</span><span>Human–agent team</span><span class="selected">Human-led agent operations</span></div></div>'
  +'<p class="gac-mode-note"><span aria-hidden="true">✓</span> Bounded agents prepare evidence. A named human retains the final decision.</p>';
 figure.insertBefore(mode,rows[0]);

 const overlay=document.createElementNS("http://www.w3.org/2000/svg","svg");
 overlay.setAttribute("viewBox","0 0 530 64");overlay.setAttribute("preserveAspectRatio","none");
 overlay.setAttribute("role","img");overlay.setAttribute("aria-label","Fast path: step 4 goes directly to the human decision in step 6 when Tier 3 exception review is not needed");
 overlay.setAttribute("data-lane","fast-path-bypass");
 overlay.classList.add("gac-fast-overlay");
 overlay.innerHTML='<title>Fast path — step 4 to step 6, bypass step 5</title>'
  +'<defs><marker id="public-fast-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#008a66"/></marker></defs>'
  +'<path d="M16 62V41H512V62" fill="none" stroke="#009a70" stroke-width="3.5" stroke-dasharray="10 6" stroke-linejoin="round" stroke-linecap="round" marker-end="url(#public-fast-arrow)"/>'
  +'<rect x="126" y="4" width="293" height="29" rx="14" fill="#dff9e9" stroke="#54b88f" stroke-width="1.6"/>'
  +'<text x="272" y="23" text-anchor="middle" fill="#10644b" font-size="15" font-weight="800">FAST PATH · step 5 skipped</text>';
 exec.appendChild(overlay);

 const attacker=support.querySelector('a[href*="#attacker"]');
 if(attacker){
   const side=document.createElement("aside");side.className="gac-independent-assurance";
   const title=document.createElement("strong");title.textContent="Independent assurance";
   const note=document.createElement("p");note.textContent="Attacker probes the guards outside the active case path.";
   side.append(title,attacker,note);execRow.appendChild(side);
 }
 const hint=document.createElement("p");hint.className="gac-scroll-hint";hint.textContent="Swipe to inspect the aligned workflow →";
 figure.parentNode.insertBefore(hint,figure);
 section.dataset.alignedCollaboration="1";
}
// Never change React-owned DOM during Next.js hydration. Once the load
// event and hydration grace period have completed, install the compatibility
// view and watch only for subsequent client-side route changes.
let observer;
const start=()=>{
  window.setTimeout(()=>{
    restore();
    observer=new MutationObserver(()=>restore());
    observer.observe(document.body,{childList:true,subtree:true});
  },2200);
};
if(document.readyState==="complete")start();
else window.addEventListener("load",start,{once:true});
})();
