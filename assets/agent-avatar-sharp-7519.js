/* Temporary public Pages visual override for the precompiled 7.5.19 export.
   The authoritative TypeScript components are corrected on the source feature
   branch. Eight fictional SVG faces, no raster upscaling or provider calls. */
(() => {
 "use strict";
 const roles={
  Proponent:{skin:"#a9674e",hair:"#25222a",coat:"#17505a",style:"curls",glasses:false},
  Opponent:{skin:"#c38c69",hair:"#272a2c",coat:"#27394f",style:"wavy",glasses:true},
  Judge:{skin:"#dbab8e",hair:"#292d3a",coat:"#253d56",style:"bob",glasses:true},
  Attacker:{skin:"#edc6a8",hair:"#b35a39",coat:"#4a5660",style:"ginger",glasses:false},
  Analytics:{skin:"#cd997b",hair:"#16636b",coat:"#0d636c",style:"hijab",glasses:false},
  Integrator:{skin:"#c49472",hair:"#222d35",coat:"#275367",style:"side",glasses:false},
  Audit:{skin:"#e2b18d",hair:"#202c37",coat:"#253c53",style:"short",glasses:false},
  Reporter:{skin:"#a7624c",hair:"#272532",coat:"#125966",style:"braids",glasses:true}
 };
 const css=`
  [aria-labelledby="overview-agent-strip"]{height:auto!important;justify-content:flex-start!important;gap:16px!important;padding:24px!important}
  [aria-labelledby="overview-agent-strip"]>div{margin-block:10px!important}
  [aria-labelledby="overview-agent-strip"] ul{gap:12px!important}
  [aria-labelledby="overview-agent-strip"] li{min-width:0;min-height:158px!important;padding:14px!important}
  [aria-labelledby="overview-agent-strip"] li a{height:100%;display:flex!important;justify-content:center!important;align-items:center!important;gap:8px!important}
  [aria-labelledby="overview-agent-strip"] li strong{font-size:14px!important;line-height:1.35!important;color:#183d4f!important}
  [aria-labelledby="overview-agent-strip"] li a>span:last-child{font-size:12px!important;line-height:1.45!important;color:#496b79!important;display:block!important}
  [aria-labelledby="overview-agent-strip"] [role="img"]{height:100px!important;width:100px!important;max-width:100%!important;display:inline-flex!important;align-self:center!important;background:none!important;border:1px solid #badadf!important;border-radius:12px!important;overflow:hidden!important;image-rendering:auto!important}
  [aria-labelledby="overview-agent-strip"] [role="img"] svg{display:block;width:100%;height:100%}
  [aria-labelledby="overview-agent-strip"]{max-width:none!important;width:100%!important}
  @media(max-width:1199px){[aria-labelledby="overview-agent-strip"] ul.grid-cols-5{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
  @media(max-width:720px){[aria-labelledby="overview-agent-strip"] ul.grid-cols-5{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media(max-width:450px){[aria-labelledby="overview-agent-strip"] ul.grid-cols-3{grid-template-columns:1fr!important}[aria-labelledby="overview-agent-strip"] ul.grid-cols-5{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  .gac-patched-intro-grid{display:block!important;grid-template-columns:minmax(0,1fr)!important}
  .gac-patched-avatar svg{display:block;width:100%;height:100%}
 `;
 const style=document.createElement("style");style.textContent=css;style.setAttribute("data-agent-patch","7519-sharp");document.head.appendChild(style);
 function portrait(name){
  const p=roles[name];if(!p)return "";
  const id="p-"+name.toLowerCase();
  const hijab=p.style==="hijab";
  const curls=(p.style==="curls"||p.style==="ginger")?Array.from({length:13},(_,i)=>{
   const a=(i/12)*Math.PI*1.2+Math.PI*.95;
   return '<circle cx="'+(117+65*Math.cos(a))+'" cy="'+(95+65*Math.sin(a))+'" r="13"/>';
  }).join(""):'';
  const hair={
   curls:'<g fill="'+p.hair+'">'+curls+'<circle cx="98" cy="54" r="19"/><circle cx="126" cy="54" r="21"/></g>',
   ginger:'<g fill="'+p.hair+'">'+curls+'<circle cx="98" cy="54" r="19"/><circle cx="126" cy="54" r="21"/></g>',
   wavy:'<path fill="'+p.hair+'" d="M64 98q-7-40 19-53q20-12 36 0q15-21 37-6q29 22 14 61q-5-21-17-23q-14 7-27-4q-26 18-43 11Z"/>',
   bob:'<path fill="'+p.hair+'" d="M63 98Q52 30 116 29q57-4 63 62l12 92-43 6-9-66-58 8-7 54-30-6Z"/>',
   side:'<path fill="'+p.hair+'" d="M65 97q2-48 48-53q43-8 57 37q-28-23-38-16q-12 17-51 18Z"/>',
   short:'<path fill="'+p.hair+'" d="M66 96q-4-48 32-53q54-17 71 37q-23-18-49-15q-28-4-54 31Z"/>',
   braids:'<g fill="none" stroke="'+p.hair+'" stroke-width="9" stroke-linecap="round"><path d="M60 82q-18 65-4 140M69 84q-7 81 3 145M167 88q24 71 22 130M176 83q25 54 26 121"/></g>',
   hijab:'<path fill="'+p.hair+'" d="M43 111Q37 33 112 24q69 0 88 72l3 125-44-8-20-50H82L61 218l-33-20Z"/>'
  }[p.style];
  const wrap=hijab?'<path fill="#1c787b" d="M66 83q25-42 62-36q47 4 54 55l-14 53-11-13-2-52q-37-39-77 1Z"/><path fill="#1b6970" d="M85 165q-6 33-35 50l30 19 40-36 49 36 32-18q-34-33-41-52l-17 25q-29 15-58-24Z"/>':'';
  const glasses=p.glasses?'<g stroke="#253b49" stroke-width="3" fill="none"><rect x="84" y="110" width="33" height="24" rx="7"/><rect x="123" y="110" width="33" height="24" rx="7"/><path d="M117 119h6M84 116l-8-3M156 116l10-3"/></g>':'';
  return '<svg role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet"><defs>'+
   '<linearGradient id="'+id+'-bg"><stop stop-color="#eef9f8"/><stop offset="1" stop-color="#cce6eb"/></linearGradient>'+
   '<linearGradient id="'+id+'-f"><stop stop-color="'+p.skin+'"/><stop offset="1" stop-color="#925b4d"/></linearGradient></defs>'+
   '<rect width="240" height="240" rx="15" fill="url(#'+id+'-bg)"/>'+
   '<rect x="174" y="46" width="50" height="108" rx="11" fill="#198b91" opacity=".8"/>'+
   '<path d="M182 70h32M182 82h22M182 120l10-12 10 5 12-19" fill="none" stroke="#e7fffb" stroke-width="5" stroke-linecap="round"/>'+
   '<path d="M-14 247Q6 192 82 184l33-11 30 11q76 8 110 63Z" fill="'+p.coat+'"/>'+
   '<path d="M88 187l31 42 27-42-23-13-16 0Z" fill="#f8f7f3"/>'+
   (hijab?'': '<path d="M60 95Q59 30 119 30q61 1 61 65l-5 70q-16 30-56 29q-47-1-57-38Z" fill="'+p.hair+'"/>')+
   hair+
   '<path d="M79 83Q95 56 119 58q42 0 44 37l-5 53q-9 29-39 39-33-8-42-39Z" fill="'+p.skin+'"/>'+
   '<path d="M88 108q12-11 26-5M129 103q12-8 26 4" stroke="'+p.hair+'" stroke-width="4" stroke-linecap="round" fill="none"/>'+
   '<circle cx="103" cy="120" r="3.7" fill="#21333a"/><circle cx="142" cy="120" r="3.7" fill="#21333a"/>'+
   '<path d="M123 125l-4 15q6 4 12 0" stroke="#a16c56" stroke-width="2.4" stroke-linecap="round" fill="none"/>'+
   '<path d="M104 153q16 9 30 0" stroke="#8c4d4d" stroke-width="3.5" stroke-linecap="round" fill="none"/>'+wrap+glasses+
   '<rect x="1" y="1" width="238" height="238" rx="14" stroke="#a8cbd1" stroke-width="2" fill="none"/></svg>';
 }
 function fix(){
  document.querySelectorAll('[role="img"][aria-label$="illustrated avatar"]').forEach(el=>{
   if(el.getAttribute('data-sharp')==='1')return;
   const name=(el.getAttribute("aria-label")||"").replace(" illustrated avatar","").trim();
   if(!roles[name])return;
   el.innerHTML=portrait(name);el.setAttribute('data-sharp','1');el.classList.add('gac-patched-avatar');
   el.style.backgroundImage="none";el.style.backgroundSize="auto";
  });
  const panel=document.querySelector('[aria-labelledby="overview-agent-strip"]');
  const hero=document.getElementById("introduction-title")?.closest('section');
  const kpi=document.querySelector('[aria-labelledby="overview-kpis"]');
  if(panel&&hero&&kpi&&!panel.classList.contains("gac-patched-agents")){
    const grid=hero.parentElement;
    if(grid){grid.classList.add("gac-patched-intro-grid");grid.after(kpi,panel);}
    panel.classList.add('gac-patched-agents');
    const why=Array.from(hero.querySelectorAll('div')).find(d=>d.textContent?.includes('Why it matters:'));
    if(why){why.innerHTML='<strong style="color:#a7f3de">Why it matters:</strong> Repetitive invoice checks, independent contract evidence, disputed claims and the human decision are different kinds of work. The six KPI improvement pathways are shown directly below.';}
  }
 }
 const boot=()=>{fix();const root=document.body;if(!root)return;let pending=false;const ob=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fix()})});ob.observe(root,{childList:true,subtree:true});};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
