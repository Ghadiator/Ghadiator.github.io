/* Replace the unstable two-row compatibility reflow with the recovered
 * original horizontal SVG, after the exported React tree has hydrated.
 * Subsequent Next exports render the SAME SVG natively from source. */
(function(){
  "use strict";
  function restore(){
    const old=document.getElementById("human-agent-collaboration");
    if(!old||document.getElementById("gac-horizontal-figure-20261119"))return;
    const section=document.createElement("section");
    section.id="gac-horizontal-figure-20261119";
    section.setAttribute("aria-labelledby","gac-horizontal-figure-heading");
    section.setAttribute("data-horizontal-restored","original-8-step-svg");
    const heading=document.createElement("h2");
    heading.id="gac-horizontal-figure-heading";heading.className="sr-only";
    heading.textContent="Governed human–agent collaboration";
    const scroller=document.createElement("div");scroller.className="gac-horizontal-scroll";
    scroller.setAttribute("aria-label","Eight execution stages in one horizontal row; scroll to explore");
    const img=document.createElement("img");
    img.src="/assets/human-agent-horizontal-fastpath-20261119.svg";
    img.width=1800;img.height=1140;img.loading="eager";img.decoding="async";
    img.alt="Recovered horizontal three-layer human-agent collaboration: eight consecutive workflow stages. A visible green fast-path bypass skips stage 5 (conditional exception review) to the decision pack at stage 6, then continues to human decision at stage 7. Proponent, Opponent, CoVe and Judge remain inside the exception stage; Attacker is separate.";
    scroller.appendChild(img);
    const hint=document.createElement("p");hint.className="gac-horizontal-hint";
    hint.textContent="Scroll horizontally to follow all eight steps and the highlighted fast path →";
    const caption=document.createElement("div");caption.className="gac-horizontal-caption";
    const detail=document.createElement("p");
    detail.textContent="The eight detailed activities expand the shorter overview above. The highlighted bypass skips the optional committee, never human sign-off.";
    const a=document.createElement("a");a.href="/ai-roles/";a.textContent="Explore the agent roles";
    caption.append(detail,a);
    section.append(heading,scroller,hint,caption);
    old.replaceWith(section);
  }
  function start(){
    window.setTimeout(restore,2200);
  }
  if(document.readyState==="complete")start();
  else window.addEventListener("load",start,{once:true});
})();
