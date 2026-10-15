/* Aegis · Governance as Code visual redesign.
 * Read-only presentation of original exported evidence, with no generated verdicts.
 * Source pinned for reference: Ghadiator/Ghadiator.github.io @ da872d93b43fda10a6171f8c2c769fea656f0b0d
 */
'use strict';
const REFERENCE = 'https://ghadiator.github.io';
const SOURCE_COMMIT = 'da872d93b43fda10a6171f8c2c769fea656f0b0d';
const PINNED_RAW = `https://raw.githubusercontent.com/Ghadiator/Ghadiator.github.io/${SOURCE_COMMIT}/data`;
const EVIDENCE_BASE = './data';
const PINNED_BLOBS = Object.freeze({
 'assurance_case.json':'68395ff40e7247fbd5e8079f082f159aa4bc0143',
 'crosswalk.json':'93c895d4557269574e20c0831eab2d28a8b0a59a',
 'facts.json':'15987cfbcb97c404fe71865881da5457adc5546d',
 'hazards.json':'4420138c544bd6b5eb7a7eab512dc7550c6937a5',
 'integration.json':'0aa037a681ba72a5feac84b260c0a88b18cb71df',
 'principles.json':'37a5076f1e08f122b5086cb19e358bc1205b8fe2',
 'red_team.json':'54b06a9ca50e400a42a5c9b990f5e64cb6a1e6f8',
 'rules.json':'aa0bde138b24854375e4c449e561c4efff6275dc',
 'scenarios/index.json':'f384fc608e6c38bc0df9257cd4af7842f7ca7476',
 'scenarios/supplier_adapter_failure.json':'35281ccd9855db73fee5f2aba7d3502c5018610d',
 'scenarios/supplier_clean.json':'6898f0fcd7d234577b06b7c02f9c96c4e98e39e1',
 'scenarios/supplier_currency_mismatch.json':'67756a646e3cbe76f75a2dafc08268554ebc1306',
 'scenarios/supplier_duplicate.json':'cd67de9db948938fb169fb0305371cd985a587e4',
 'scenarios/supplier_injection.json':'142c871266dc6671448b297068f64ddbf14ca9c4',
 'scenarios/supplier_invalid.json':'bd667672471b19a2c81f7618db00edbca5fb93a7',
 'scenarios/supplier_invented_narrative.json':'911ae9693d830a096bbacc80af534886f4edaace',
 'scenarios/supplier_missing_document.json':'231eab04f35ec1d3c3a111450400801dc6a3426b',
 'scenarios/supplier_over_limit.json':'955aa7e5a3f8acfb72e735f97686e82d3726d853',
 'scenarios/supplier_pending.json':'7f68938869948e9e2ca11445de1db1b4c1174cb1',
 'scenarios/supplier_proposal_budget.json':'dfd075084e3e62a20f6321206f07f27cb502ba17',
 'scenarios/supplier_rate_correction.json':'851de7ec963172c5095d2c4d75b30a16db83bed8',
 'scenarios/supplier_total_mismatch.json':'cb78b09830a46b5a22e9bc87643813f1d6a28485',
 'scenarios/supplier_unsupported_claim.json':'b4d3771dd96b1fa40d02e358572a2474d320770b',
 'scenarios/supplier_variance_review.json':'a8453e2181da74e5cad94809f7e89d815a8b41fa',
 'threats.json':'2c520b782b3b9478e17d6ea53714a29efa2c33b6',
 'workflow_states.json':'4760a510201a9ddfc5ce5e6a42b3ee91c27589c0'
});
async function verifiedBytes(path,bytes){
 const expected=PINNED_BLOBS[path];
 if(!expected)throw new Error(`No reviewed blob hash for ${path}`);
 if(!globalThis.crypto?.subtle)throw new Error('This page requires a secure context for evidence verification (HTTPS or localhost)');
 const prefix=new TextEncoder().encode(`blob ${bytes.byteLength}\0`);
 const joined=new Uint8Array(prefix.length+bytes.byteLength);
 joined.set(prefix,0);joined.set(bytes,prefix.length);
 const sum=new Uint8Array(await crypto.subtle.digest('SHA-1',joined));
 const actual=Array.from(sum,x=>x.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw new Error(`Evidence hash mismatch for ${path}; this export is not the pinned reviewed version`);
 return true;
}

const ICONS = {
  'layout-dashboard':'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
  workflow:'<rect x="2" y="3" width="7" height="6" rx="1.5"/><rect x="15" y="3" width="7" height="6" rx="1.5"/><rect x="8.5" y="15" width="7" height="6" rx="1.5"/><path d="M9 6h6M18.5 9v3h-6v3M5.5 9v3h6v3"/>',
  layers:'<path d="m12 2 9.5 5-9.5 5L2.5 7 12 2ZM2.5 12l9.5 5 9.5-5M2.5 17l9.5 5 9.5-5"/>',
  'list-tree':'<path d="M8 4h13M8 12h13M8 20h13M3 4h1M3 12h1M3 20h1"/>',
  scale:'<path d="M12 3v18M4 7h16M5 7l-3 7h6L5 7ZM19 7l-3 7h6l-3-7ZM7 21h10"/>',
  'shield-check':'<path d="m12 2 8 4v6c0 5-3.2 8.5-8 10-4.8-1.5-8-5-8-10V6l8-4Z"/><path d="m8 12 2.8 2.8L16.5 9"/>',
  plug:'<path d="M8 4v5M16 4v5M6 9h12v3c0 4-2.5 6-6 6s-6-2-6-6V9ZM12 18v4"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  github:'<path d="M9 19c-5 2-5-2-7-2M15 22v-4a3.5 3.5 0 0 0-1-2.7c3.2-.35 6.5-1.5 6.5-7a5.5 5.5 0 0 0-1.5-3.8c.15-.45.65-2-.15-3.5 0 0-1.2-.4-3.9 1.5a13 13 0 0 0-7 0C5.25.6 4.05 1 4.05 1c-.8 1.5-.3 3.05-.15 3.5A5.5 5.5 0 0 0 2.4 8.3c0 5.5 3.3 6.65 6.5 7A3.5 3.5 0 0 0 8 18v4"/>',
  'arrow-up-right':'<path d="M7 17 17 7M8 7h9v9"/>',
  'circle-help':'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 0 1 5 1c0 2-2.5 2-2.5 4M12 17h.01"/>',
  'play':'<path d="m8 5 11 7-11 7V5Z"/>',pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  'skip-forward':'<path d="m4 5 10 7-10 7V5ZM18 5v14"/>','skip-back':'<path d="m20 5-10 7 10 7V5ZM6 5v14"/>',
  'chevron-left':'<path d="m14 5-7 7 7 7"/>','chevron-right':'<path d="m10 5 7 7-7 7"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  'external-link':'<path d="M14 3h7v7M21 3l-9 9M20 13v7H4V4h7"/>',
  'download':'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  copy:'<rect x="7" y="7" width="14" height="14" rx="2"/><path d="M17 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  file:'<path d="M5 3h10l4 4v14H5V3ZM15 3v5h4M8 12h8M8 16h8"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2c0-5 16-5 16 0v2"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  alert:'<path d="m12 2 10 18H2L12 2ZM12 8v5M12 17h.01"/>',
  activity:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  code:'<path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 4l-4 16"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/>',
  filter:'<path d="M4 5h16l-6.5 7v6l-3 2v-8L4 5Z"/>',
  'book-open':'<path d="M12 5C7 2 3 4 2 5v14c4-2 8-2 10 0 2-2 6-2 10 0V5c-1-1-5-3-10 0ZM12 5v14"/>',
  'upload-cloud':'<path d="M12 16V7m-4 4 4-4 4 4M4 16a5 5 0 0 1 2-9.6A7 7 0 0 1 19 9a4.5 4.5 0 0 1 1 8"/><path d="M7 21h10"/>',
  'swords':'<path d="m14.5 7.5 5-5 2 2-5 5M9.5 16.5l-5 5-2-2 5-5M12 12l7 7M17 22l5-5M2 7l5-5 7 7M3 11l8 8"/>',
  'messages-square':'<path d="M15 5h6v12h-4l-3 3v-4M3 3h14v10H8l-5 4V3Z"/><path d="M6 7h8M6 10h5"/>'
};
function icon(name, extra=''){return `<svg class="${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.info}</svg>`;}
function h(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function fmtStatus(raw){let s=String(raw||'Unknown').replaceAll('_',' ');const cls=/^approved$/i.test(s)?'green':/rejected/i.test(s)?'red':/awaiting/i.test(s)?'amber':'blue';return `<span class="status ${cls}">${h(s)}</span>`;}
function sourceUrl(path){const safe=String(path||'').replace(/^\/+/, '');return `https://github.com/Ghadiator/Ghadiator.github.io/blob/${SOURCE_COMMIT}/${safe}`;}
const SCENARIOS = [
 ['supplier_variance_review','Unusual service volume → reviewer approval','Exception review','Approved',42,true,'Approved rates and a valid contract, but a 30% increase in service volume triggers evidence review.'],
 ['supplier_clean','Matching invoice → reviewer approval','Standard review','Approved',35,true,'Invoice arithmetic, documents and contract checks pass; a named reviewer approves the submission.'],
 ['supplier_rate_correction','Incorrect rate → correction → approval','Correction loop','Approved',64,true,'A rate-card mismatch prompts a correction; version 2 is revalidated before approval.'],
 ['supplier_missing_document','Missing service report → correction','Correction loop','Approved',54,true,'The reviewer requests the missing service report, then approves the corrected submission.'],
 ['supplier_unsupported_claim','Unsupported AI finding removed','Adversarial controls','Approved',41,true,'A scripted proposal cites a charge the evidence does not support; the firewall removes it before review.'],
 ['supplier_invented_narrative','Invented narrative replaced by evidence','Adversarial controls','Approved',42,true,'A proposal carries correct figures but fabricated prose; the verifier keeps the checked numbers and restates the finding.'],
 ['supplier_injection','Supplier instruction excluded','Adversarial controls','Approved',42,true,'A malicious instruction in a supplier note never enters the proposal inputs or gains decision authority.'],
 ['supplier_duplicate','Duplicate invoice → rejection','Contract checks','Rejected',36,true,'The approved-invoice register already contains this supplier and invoice identity.'],
 ['supplier_over_limit','Spending limit exceeded → rejection','Contract checks','Rejected',36,true,'A numerically valid invoice exceeds the approved contract limit and cannot be approved.'],
 ['supplier_total_mismatch','Invoice total mismatch → correction request','Invoice checks','Awaiting_supplier',24,true,'The declared invoice total differs from the sum of its service lines; the case waits for the supplier.'],
 ['supplier_currency_mismatch','Currency mismatch → rejection','Contract checks','Rejected',36,true,'The invoice currency differs from the approved contract currency.'],
 ['supplier_invalid','Malformed submission rejected at intake','Invoice checks','Intake_rejected',9,false,'An unexpected field fails the typed boundary before any validation tier runs.'],
 ['supplier_pending','Review gate holds an unresolved case','Human oversight','Awaiting_reviewer',30,true,'The workflow remains suspended with no recorded reviewer decision and no archive action.'],
 ['supplier_adapter_failure','Proposal adapter fails → opponent contributes nothing','Committee limits','Approved',40,true,'The adapter raises mid-review; every proposal is forfeited and the case still reaches a reviewer.'],
 ['supplier_proposal_budget','Too many proposals → all discarded','Committee limits','Approved',40,true,'The adapter returns more findings than the budget allows; none enter verification.']
].map(([slug,title,group,terminal_state,event_count,reached_human_gate,one_liner])=>({slug,title,group,terminal_state,event_count,reached_human_gate,one_liner}));
const FACTS = [
 {id:'supplier_scenarios',label:'Executed scenarios',value:15,note:'Synthetic supplier fixtures'},
 {id:'deterministic_checks',label:'Deterministic checks',value:14,note:'Invoice and contract checks'},
 {id:'control_probes',label:'Control probes',value:7,note:'Deterministic, not live-model tests'},
 {id:'workflow_states',label:'Workflow states',value:12,note:'Explicit state definitions'}
];
const DEFAULT_STAGES = ['request','reminders','ingest','memory','checks','contract','exception','advisory','remediation','review','disposition','archive'];
const DISPLAY_STAGES={request:'Request',reminders:'Reminders',ingest:'Intake',memory:'History',checks:'Rule checks',contract:'Contract',exception:'Exception',advisory:'Advisory + CoVe',remediation:'Remediation',review:'Human gate',disposition:'Decision',archive:'Archive'};
const STAGE_ICONS={request:'file',reminders:'clock',ingest:'download',memory:'database',checks:'check',contract:'book-open',exception:'alert',advisory:'shield-check',remediation:'workflow',review:'user',disposition:'scale',archive:'lock'};
const VIEW_NAMES={overview:'Introduction',architecture:'Architecture',evidence:'Evidence & learning',dashboard:'Dashboard',tickets:'Document requests',submissions:'New submissions',newticket:'New submission',ticket:'Request detail',inbound:'Supplier intake',cases:'Processed cases',case:'Case detail',monitor:'Architecture scenarios',tokens:'Token economics',governance:'Governance',attacker:'Red Team attacker',redteam:'Control probes',personas:'Chat with the code',integration:'Integration',audit:'Process audit',assurance:'Hazards & controls',analytics:'Detection analytics',login:'Access & scope'};
const state={view:'overview',architectureTab:'diagram',personaMode:'chat',evidenceTab:'reports',submissionTab:'compose',submissionMode:'request',attackerTab:'campaign',attackerRevealed:0,attackerNotes:[],personaName:'integrator',personaSessions:{},workbenchTab:'summary',scenario:'supplier_variance_review',index:{scenarios:SCENARIOS},facts:{facts:FACTS},loaded:{},raw:{},eventIndex:0,playing:false,speed:1150,search:'',filter:'all',selectedObligation:0,selectedHazard:0,loading:{},errors:{},help:false};
let playTimer=null,toastTimer=null,loadToken=0;
const $=x=>document.querySelector(x);
const MAIN=$('#main');
const DATA_FILES={index:'scenarios/index.json',facts:'facts.json',crosswalk:'crosswalk.json',hazards:'hazards.json',assurance:'assurance_case.json',integration:'integration.json',rules:'rules.json',redteam:'red_team.json',threats:'threats.json'};
function assetFile(path){return `${EVIDENCE_BASE}/${path}`;}
async function readOriginal(path,key,{silently=false}={}){
  if(state.loaded[key])return state.loaded[key];
  if(state.loading[key])return state.loading[key];
  const promise=(async()=>{
    const candidates=[assetFile(path),`${PINNED_RAW}/${path}`];
    let error;
    for(const url of candidates){try{
      const response=await fetch(url,{cache:'no-cache',mode:'cors'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const bytes=new Uint8Array(await response.arrayBuffer());
      await verifiedBytes(path,bytes);
      const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);const obj=JSON.parse(raw);
      state.loaded[key]=obj;state.raw[key]=bytes;delete state.errors[key];
      return obj;
    }catch(e){error=e;}}
    state.errors[key]=`Cannot load verified ${path}: ${error?.message||'network unavailable'}. The full records remain available at ${PINNED_RAW}/${path}`;
    if(!silently)notify('Pinned evidence unavailable. Connect to the internet or run sync_data.py.');
    return null;
  })();
  state.loading[key]=promise;
  try{return await promise;}finally{delete state.loading[key];}
}
async function ensureData(key){const file=DATA_FILES[key];if(!file)return null;const v=await readOriginal(file,key,{silently:true});if(v&&key==='index')state.index=v;if(v&&key==='facts')state.facts=v;return v;}
async function ensureScenario(slug){return readOriginal(`scenarios/${slug}.json`,`scenario:${slug}`,{silently:true});}
function currentCase(){return state.index.scenarios.find(x=>x.slug===state.scenario)||SCENARIOS[0];}
function scenarioData(){return state.loaded[`scenario:${state.scenario}`]||null;}
function events(){return scenarioData()?.events||[];}
function activeEvent(){return events()[state.eventIndex]||null;}
function encodeScenario(slug){return encodeURIComponent(slug||state.scenario);}
function linkView(view,scenario){return `?view=${encodeURIComponent(view)}&scenario=${encodeScenario(scenario)}`;}
// The existing architecture artifact remains authoritative and unmodified.
// Mount only its interactive content in the current workbench; never navigate
// the parent page to its old Next.js shell.
function embeddedArchitectureUrl(slug){return `/architecture/?embedded=1&case=${encodeScenario(slug)}`;}
function renderArchitectureContracts(){return `<div class="wb-page"><div class="wb-head"><div><span class="wb-kicker">SOURCE CONTRACTS · VALIDATION ENGINE</span><h1>Inputs, transformations & outputs</h1><p>These boundaries explain the data consumed and emitted by the generic supplier-validation pipeline.</p></div></div><div class="wb-two"><section class="wb-panel"><div class="wb-panel-head"><h2>Input evidence</h2></div><div class="wb-panel-body"><p><strong>Supplier document:</strong> invoice ID, supplier, contract and PO references, currency, service period, service lines, quantities, rates, amounts, attachments and supplier notes.</p><p><strong>Authoritative references:</strong> approved contract, rate card, spending limit, reviewer rights and historical disposition register.</p><p>Supplier narrative is untrusted and never overrides a verified contract.</p></div></section><section class="wb-panel"><div class="wb-panel-head"><h2>Output and decisions</h2></div><div class="wb-panel-body"><p>Typed intake, arithmetic results, contract findings, evidence-supported exceptions, committee and CoVe outputs, reviewer decision state and immutable event references.</p><p>No model proposal approves a case: an authorized human reviews the evidence before disposition.</p></div></section></div><div class="wb-notice"><strong>Source flow:</strong> intake → deterministic validation → contract checks → bounded persona proposals → CoVe verification → human review → ProcessEvent trail. Public replay is scripted, not a live engine.</div></div>`;}

function renderWorkflowResults(){
 // The execution dashboard already shows individual checks and committee
 // outputs; the side rail is the only event navigator. Do not recreate the
 // monitor's "Current evidence", "Trace navigator", or "Scripted adversarial
 // committee" panels here. Only reveal the final recorded outcome.
 const all=events();
 const position=Number.isInteger(state.architectureCursor)?state.architectureCursor:-1;
 if(position<0||!all.length||position<all.length-1)return '';
 return `<section class="wb-page workflow-results" aria-label="Recorded workflow outcome">
  <section class="wb-panel"><div class="wb-panel-head"><h2>Recorded workflow result</h2></div>
  <div class="wb-panel-body"><div class="wb-inline-actions">${fmtStatus(currentCase().terminal_state)}
  <span class="count-chip">${all.length} recorded events</span></div>
  <p class="wb-foot">This is the outcome of an executed synthetic reference fixture. Replay did not run a new review or issue a human decision.</p>
  </div></section></section>`;
}
function refreshWorkflowResults(){
 const target=document.getElementById('workflow-results');
 if(target)target.innerHTML=renderWorkflowResults();
 const execution=window.ArchitectureExecution;
 if(!execution)return;
 const timeline=events();
 const cursor=Number.isInteger(state.architectureCursor)?state.architectureCursor:-1;
 const dashboard=document.getElementById('architecture-execution-dashboard');
 if(dashboard)dashboard.innerHTML=execution.renderDashboard(timeline,cursor);
 const rail=document.getElementById('architecture-event-rail');
 if(rail){
  const previous=rail.querySelector('.ax-rail-list')?.scrollTop??0;
  rail.innerHTML=execution.renderRail(timeline,cursor);
  const list=rail.querySelector('.ax-rail-list');
  if(list){
   list.scrollTop=previous;
   const active=list.querySelector('.is-current');
   if(active&&cursor>=0){
    const bounds=list.getBoundingClientRect(),rect=active.getBoundingClientRect();
    if(rect.bottom>bounds.bottom-40||rect.top<bounds.top+20)active.scrollIntoView({block:'nearest',behavior:'auto'});
   }
  }
 }
}
function renderEmbeddedArchitecture(){
 return `<div class="page-entrance unified-architecture-view">
  <div class="unified-architecture-context"><span class="section-overline">ARCHITECTURE · SELECT A SCENARIO, THEN RUN</span><span>Modular dataflow · verified handoffs · human decision gate</span></div>
  <div class="architecture-live-layout">
   <div class="architecture-main-canvas">
    <div class="architecture-canvas-hint"><strong>Module execution replay</strong><span>Blocks highlight as their recorded work runs. Executed blocks retain markers; routes animate in the original React canvas.</span></div>
    <iframe id="modularArchitectureFrame" class="unified-architecture-frame" title="Interactive modular validation workflow and scenario player" src="${embeddedArchitectureUrl(state.scenario)}" loading="eager" referrerpolicy="same-origin"></iframe>
   </div>
   <aside id="architecture-event-rail" class="architecture-event-rail" aria-label="Emitted workflow events">${window.ArchitectureExecution?.renderRail(events(),Number.isInteger(state.architectureCursor)?state.architectureCursor:-1)||''}</aside>
  </div>
  <section id="architecture-execution-dashboard" class="architecture-execution-dashboard" aria-label="Execution checks and AI committee results">${window.ArchitectureExecution?.renderDashboard(events(),Number.isInteger(state.architectureCursor)?state.architectureCursor:-1)||''}</section>
  <section id="architecture-detail" class="architecture-detail-below" aria-label="Architecture explanations and controls"></section>
  <div id="workflow-results" class="architecture-workflow-results">${renderWorkflowResults()}</div>
  <p class="unified-architecture-note">The architecture player and the results below read the same recorded synthetic case. AI roles are scripted and human approvals shown are historical fixture records, not live actions.</p>
 </div>`;
}
function recoverArchitectureFrame(frame){
 if(frame.dataset.recoveryTried==='1'){
  frame.style.visibility='visible';
  frame.replaceWith(Object.assign(document.createElement('div'),{
   className:'wb-notice',textContent:'The archived modular diagram could not be embedded. The original architecture remains available at /architecture/.'
  }));
  return;
 }
 frame.dataset.recoveryTried='1';
 fetch('/architecture/',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Unable to load published architecture');return r.text();}).then(html=>{
  const fallbackHead='<base href="/architecture/"><style>body > div.flex.min-h-screen > aside,body > div.flex.min-h-screen > div > nav[aria-label="Primary"],body > div.flex.min-h-screen > div > header,body > div.flex.min-h-screen > div > footer{display:none!important}</style>';
  frame.srcdoc=html.replace('</head>',fallbackHead+'</head>');
 }).catch(()=>{frame.style.visibility='visible';frame.replaceWith(Object.assign(document.createElement('div'),{className:'wb-notice',textContent:'The published modular architecture could not be loaded inside the workbench.'}));});
}
let disposeArchitectureEmbed=()=>{};
function mountEmbeddedArchitecture(){
 const frame=document.getElementById('modularArchitectureFrame');
 if(!frame)return;
 // The original Next.js page hydrates after its iframe load event. During that
 // hydration React can replace <main>. Never measure a detached old <main>:
 // scrollHeight becomes 0 and previously collapsed the entire diagram to 12px.
 const MIN_HEIGHT=1060,MAX_HEIGHT=12000;
 frame.style.minHeight=MIN_HEIGHT+'px';
 let disposed=false,raf=0,currentMain=null,mainResizeObserver=null,bodyMutationObserver=null,observedDoc=null,lastExplanation="";
 const clean=()=>{
  disposed=true;
  if(raf)cancelAnimationFrame(raf);
  mainResizeObserver?.disconnect();
  bodyMutationObserver?.disconnect();
  observedDoc?.removeEventListener('input',onPlayerControl);
  observedDoc?.removeEventListener('change',onPlayerControl);
  frame.removeEventListener('load',onLoad);
 };
 disposeArchitectureEmbed=clean;
 const measure=()=>{
  if(disposed||!frame.isConnected)return;
  let doc;
  try{doc=frame.contentDocument;}catch{return;}
  const main=doc?.querySelector('body > div.flex.min-h-screen > div > main');
  // React may briefly detach a whole subtree: keep the previous size rather
  // than measuring a stale element or an empty document.
  if(!main||!main.isConnected||!doc.body?.contains(main))return;
  if(currentMain!==main){
   currentMain=main;
   mainResizeObserver?.disconnect();
   if(typeof ResizeObserver!=='undefined'){
    mainResizeObserver=new ResizeObserver(schedule);
    mainResizeObserver.observe(main);
   }
  }
  const height=Math.max(main.scrollHeight,main.getBoundingClientRect().height);
  if(!Number.isFinite(height)||height<100)return;
  const next=Math.min(MAX_HEIGHT,Math.max(MIN_HEIGHT,Math.ceil(height+36)));
  if(frame.style.height!==next+'px')frame.style.height=next+'px';
  frame.style.visibility='visible';
 };


 // Reuse the exact explanatory text and controls produced by the embedded
 // React deck. Only their presentation moves outside the graph; onClick is
 // forwarded back to the React-owned source button.
 const sourcePanels=doc=>{
  const deck=doc.querySelector('.deck');
  const scrub=deck?.querySelector('input[aria-label="Position in the recorded run"]');
  const nodes=deck?Array.from(deck.children):[];
  const stepPanel=scrub?.parentElement?.nextElementSibling;
  const looks=nodes.find(el=>Array.from(el.querySelectorAll('span')).some(span=>span.textContent.trim()==='Look inside'));
  const humanGate=nodes.find(el=>Array.from(el.querySelectorAll('button')).some(b=>/^(Resume|Continue)\s*[—–-]/.test(b.textContent.trim())));
  const inspector=nodes.find(el=>el.querySelector('section')&&el.textContent.includes('audit ledger'));
  const breadcrumb=nodes.find(el=>Array.from(el.querySelectorAll('button')).some(b=>b.textContent.trim()==='Architecture'));
  return {deck,scrub,stepPanel,looks,humanGate,inspector,breadcrumb};
 };
 const renderExplanation=doc=>{
  const target=document.getElementById('architecture-detail');
  if(!target)return;
  const {deck,scrub,stepPanel,looks,humanGate,inspector,breadcrumb}=sourcePanels(doc);
  if(!deck||!scrub||!stepPanel)return;
  const running=Number(scrub.value)>=0;
  const paragraphs=Array.from(stepPanel.querySelectorAll('p')).map(p=>p.textContent.trim()).filter(Boolean);
  const title=running?'Current workflow step':'Pick a case and step through it';
  const lines=paragraphs.map((line,i)=>`<p class="architecture-detail-line ${i===0?'architecture-detail-lead':''}">${h(line)}</p>`).join('');
  const explanation=`<section class="wb-panel architecture-detail-panel"><div class="wb-panel-head"><h2>${title}</h2></div><div class="wb-panel-body">${lines}${!running?'<button type="button" class="wb-button architecture-deck-control" data-deck-action="start">Step through this run →</button>':''}</div></section>`;
  const drillButtons=looks?Array.from(looks.querySelectorAll('button')).map((b,i)=>`<button class="wb-button architecture-deck-control" type="button" data-deck-action="drill" data-deck-index="${i}">${h(b.textContent.trim())} ↗</button>`).join(''):'';
  const back=breadcrumb?'<button class="wb-button architecture-deck-control" type="button" data-deck-action="back">← Back to main architecture</button>':'';
  const drill=drillButtons||back?`<section class="wb-panel architecture-detail-panel"><div class="wb-panel-head"><h2>Look inside · modular components</h2></div><div class="wb-panel-body"><div class="wb-inline-actions">${back}${drillButtons}</div></div></section>`:'';
  const gateButton=humanGate?.querySelector('button');
  const gate=gateButton?`<section class="wb-panel architecture-detail-panel" aria-label="Human reviewer pause"><div class="wb-panel-head"><h2>Human review · recorded decision gate</h2></div><div class="wb-panel-body"><p class="architecture-detail-line">${h(humanGate.querySelector('p')?.textContent.trim()||'Workflow suspended for reviewer')}</p><button type="button" class="wb-button architecture-deck-control" data-deck-action="resume">${h(gateButton.textContent.trim())}</button></div></section>`:'';
  const inspectorSection=inspector?.querySelector('section');
  const moduleName=inspectorSection?.querySelector('h4')?.textContent.trim();
  const inspectorText=inspectorSection?.textContent?.replace(/\s+/g,' ').trim()||'';
  const inspect=moduleName&&inspectorText?`<details class="wb-panel architecture-module-inspector"><summary>Selected module · ${h(moduleName)}</summary><div class="wb-panel-body"><p class="architecture-detail-source">${h(inspectorText)}</p></div></details>`:'';
  const html=`<div class="wb-page">${explanation}${drill}${gate}${running?inspect:''}</div>`;
  if(html!==lastExplanation){lastExplanation=html;target.innerHTML=html;}
 };
 document.getElementById('architecture-detail')?.addEventListener('click',event=>{
  const pressed=event.target.closest('[data-deck-action]');
  if(!pressed)return;
  event.preventDefault();
  let doc;
  try{doc=frame.contentDocument;}catch{return;}
  if(!doc)return;
  const {stepPanel,looks,humanGate,breadcrumb}=sourcePanels(doc);
  const action=pressed.dataset.deckAction;
  if(action==='start')stepPanel?.querySelector('button')?.click();
  if(action==='resume')humanGate?.querySelector('button')?.click();
  if(action==='back')Array.from(breadcrumb?.querySelectorAll('button')||[]).find(b=>b.textContent.trim()==='Architecture')?.click();
  if(action==='drill'){
   const index=Number(pressed.dataset.deckIndex);
   if(Number.isInteger(index)&&index>=0)looks?.querySelectorAll('button')[index]?.click();
  }
 });
 const syncFromFrame=()=>{
  if(disposed||!frame.isConnected)return;
  let doc;
  try{doc=frame.contentDocument;}catch{return;}
  const picker=doc?.querySelector('select[aria-label="Recorded scenario"]');
  const scrub=doc?.querySelector('input[aria-label="Position in the recorded run"]');
  if(!picker||!scrub)return;
  const slug=picker.value;
  const next=Math.max(-1,Number(scrub.value));
  // The same React cursor drives in-graph highlights, event stream and results.
  renderExplanation(doc);
  window.ArchitectureExecution?.decorateGraph(doc,events(),Number.isInteger(state.architectureCursor)?state.architectureCursor:-1);
  const known=SCENARIOS.some(s=>s.slug===slug)||state.index.scenarios.some(s=>s.slug===slug);
  if(known&&slug!==state.scenario){
   stopPlay();
   state.scenario=slug;
   state.architectureCursor=-1;
   state.eventIndex=0;
   history.replaceState(null,'',linkView('architecture',slug));
   refreshWorkflowResults();
   if(!state.loaded['scenario:'+slug])ensureScenario(slug).then(()=>{if(state.view==='architecture'&&state.scenario===slug)refreshWorkflowResults();});
  }
  if(Number.isFinite(next)&&next!==state.architectureCursor){
   state.architectureCursor=next;
   state.eventIndex=Math.max(0,next);
   refreshWorkflowResults();
   window.ArchitectureExecution?.decorateGraph(doc,events(),next);
  }
 };
 const onPlayerControl=()=>schedule();
 const schedule=()=>{
  if(disposed||raf)return;
  raf=requestAnimationFrame(()=>{raf=0;measure();syncFromFrame();});
 };
 function onLoad(){
  if(disposed||!frame.isConnected)return;
  let doc;
  try{doc=frame.contentDocument;}catch{recoverArchitectureFrame(frame);return;}
  if(!doc?.head||!doc.body){recoverArchitectureFrame(frame);return;}
  if(!doc.getElementById('unified-workbench-embed-style')){
   const style=doc.createElement('style');
   style.id='unified-workbench-embed-style';
   style.textContent=`/* Hide only the old navigation; the original interactive
      20-node diagram and its explanation remain unmodified. */
     html,body{margin:0!important;overflow-x:hidden!important;background:#fff!important}
     body > div.flex.min-h-screen > aside{display:none!important}
     body > div.flex.min-h-screen > div > nav[aria-label="Primary"],
     body > div.flex.min-h-screen > div > header,
     body > div.flex.min-h-screen > div > footer{display:none!important}
     body > div.flex.min-h-screen{min-height:0!important;display:block!important}
     body > div.flex.min-h-screen > div{min-width:0!important;width:100%!important;display:block!important}
     body > div.flex.min-h-screen > div > main{padding:0!important;width:100%!important}
     body > div.flex.min-h-screen > div > main > div{max-width:none!important}
     /* The embedded panel is only scenario transport plus the original graph.
        Live step explanations and drill buttons live BELOW the iframe. */
     .deck{display:flex!important;flex-direction:column!important}
     .deck > *{display:none!important}
     .deck > div:has(select[aria-label="Recorded scenario"]){display:flex!important;order:1}
     .deck > div:has(input[aria-label="Position in the recorded run"]){display:flex!important;order:2}
     .deck > div:has(> .deck-canvas){display:block!important;order:3}
     /* Trace-derived markers supplement React's native edge animations. */
     .deck [data-node].ax-node-executed{box-shadow:inset 0 -3px 0 #16866b55!important}
     .deck [data-node].ax-node-current{outline:3px solid #1479d2!important;outline-offset:2px!important;z-index:12!important;animation:ax-current-pulse 1.4s ease-in-out infinite}
     .deck [data-node].ax-node-failure{box-shadow:inset 0 -4px 0 #c25050!important}
     .deck [data-node][data-trace-count]::after{content:attr(data-trace-count) " events";position:absolute;right:3px;bottom:2px;font:700 8px/1.2 monospace;color:#126c60;background:#e5f7f0;padding:2px 4px;border-radius:4px;pointer-events:none}
     @keyframes ax-current-pulse{50%{outline-color:#2ea5e17a}}
     @media(prefers-reduced-motion:reduce){.deck [data-node].ax-node-current{animation:none}}
     /* Those sections are already represented by the shared workbench below
        this iframe. In embedded mode they obscure the run's evidence and
        show the completed outcome before replay has begun. Standalone
        architecture keeps the full companion guide unchanged. */
     .ax-story{display:none!important}

   `;
   doc.head.appendChild(style);
  }
  if(observedDoc!==doc){
   observedDoc?.removeEventListener('input',onPlayerControl);
   observedDoc?.removeEventListener('change',onPlayerControl);
   observedDoc=doc;
   doc.addEventListener('input',onPlayerControl);
   doc.addEventListener('change',onPlayerControl);
  }
  bodyMutationObserver?.disconnect();
  if(typeof MutationObserver!=='undefined'){
   // Observe the stable BODY, not Next.js' replaceable <main> reference.
   // This detects hydration tree replacement, scenario changes and
   // dynamically inserted explanations.
   bodyMutationObserver=new MutationObserver(schedule);
   bodyMutationObserver.observe(doc.body,{childList:true,subtree:true,characterData:true});
  }
  frame.style.visibility='visible';
  measure();
  syncFromFrame();
  doc.fonts?.ready.then(schedule).catch(()=>{});
  schedule();
 }
 frame.addEventListener('load',onLoad);
 // A cached iframe can finish loading before a callback is attached.
 try{if(frame.contentDocument?.readyState==='complete')onLoad();}catch{}
}

function refreshLinkState(){document.querySelectorAll('[data-view]').forEach(el=>{const selected=el.dataset.view===state.view;el.classList.toggle('active',selected);if(el.closest('nav')){if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}});$('#currentCrumb').textContent=VIEW_NAMES[state.view]||'Architecture';}
function route(view,slug,{push=true}={}){if(view==='monitor'){view='architecture';state.architectureTab='replay';}else if(view==='pool'){view='dashboard';}else if(view==='tickets'){view='submissions';state.submissionTab='history';}else if(view==='newticket'){view='submissions';state.submissionTab='compose';state.submissionMode='request';}else if(view==='redteam'||view==='attacker'){view='personas';state.personaMode='attacker';state.attackerTab='campaign';}else if(view==='architecture'&&state.view!=='architecture'){state.architectureTab='diagram';state.architectureCursor=-1;}if(!(view in VIEW_NAMES))view='overview';stopPlay();state.animateNext=true;state.view=view;state.workbenchTab=({case:'summary',inbound:'pending',governance:'system'})[view]||'summary';if(slug&&SCENARIOS.some(x=>x.slug===slug)||slug&&state.index.scenarios.some(x=>x.slug===slug)){if(slug!==state.scenario){state.scenario=slug;state.eventIndex=0;}}state.search='';state.filter='all';if(push)history.pushState(null,'',linkView(view,state.scenario));refreshLinkState();render();$('#sidebar').classList.remove('open');$('#mobileOverlay').classList.remove('visible');window.scrollTo({top:0,behavior:'auto'});}
function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
function button(label,action,{kind='',glyph='',disabled=false}={}){return `<button type="button" class="button ${kind}" data-action="${h(action)}" ${disabled?'disabled':''}>${glyph?icon(glyph):''}${h(label)}</button>`;}
function pageHeader(eyebrow,title,desc,right=''){return `<div class="page-header"><div><div class="eyebrow"><span class="eyebrow-line"></span>${h(eyebrow)}</div><h1 class="page-title">${h(title)}</h1><p class="page-desc">${h(desc)}</p></div>${right?`<div class="page-toolbar">${right}</div>`:''}</div>`;}
function strip(text){return `<div class="info-strip">${icon('info')}<span>${text}</span></div>`;}
function metrics(){const facts=state.facts?.facts||FACTS;const wanted=['supplier_scenarios','deterministic_checks','control_probes','workflow_states'];const defaults={supplier_scenarios:['Example invoice reviews','layers','Run with made-up documents, not real supplier data'],deterministic_checks:['Automatic checks','check','Check totals, dates, prices and contract details'],control_probes:['Safety-control tests','shield-check','Check whether important safeguards work in this example'],workflow_states:['Internal workflow statuses','workflow','Technical steps that track what happens next']};return `<div class="top-kpis">${wanted.map(id=>{const fact=facts.find(f=>f.id===id);const [fallback,glyph,note]=defaults[id];return `<div class="kpi"><div class="kpi-top"><span>${h(fallback)}</span><span class="kpi-icon">${icon(glyph)}</span></div><div class="kpi-number">${h(fact?.display??fact?.value??'—')}</div><div class="kpi-foot">${h(note)}</div></div>`;}).join('')}</div>`;}
function outcomeMeta(s){return `<div class="minimetric"><span>Case status</span>${fmtStatus(s.terminal_state)}</div><div class="minimetric"><span>Recorded events</span><strong>${Number(s.event_count)||0}</strong></div><div class="minimetric"><span>Human gate reached</span><strong>${s.reached_human_gate?'Yes':'No'}</strong></div>`;}
function renderOverview(){return `<div class="page-entrance overview-page">
<section class="overview-hero" aria-labelledby="overview-title">
  <div class="eyebrow"><span class="eyebrow-line"></span>AI GOVERNANCE · INTERACTIVE SHOWCASE</div>
  <h1 id="overview-title">Clear rules for facts.<br><em>AI for unusual cases.</em><br>People make the decisions.</h1>
  <p>An interactive AI governance showcase that combines predictable, rule-based checks with AI-style personas who examine difficult cases from different angles. Evidence stays visible, decisions can be traced, and people keep final authority.</p>
  <div class="overview-cta">
    <a class="button light-primary" data-view="architecture" href="?view=architecture">See the full workflow <span data-icon="arrow"></span></a>
    <a class="button dark" data-view="cases" href="?view=cases">Explore example cases <span data-icon="layers"></span></a>
  </div>
  <div class="overview-benefits" aria-label="Key values"><span><span data-icon="check"></span> Consistent checks</span><span><span data-icon="layers"></span> AI perspectives</span><span><span data-icon="list-tree"></span> Traceable decisions</span><span><span data-icon="user"></span> Human oversight</span></div>
</section>
<section class="problem-pitch" aria-labelledby="challenge-title">
 <div class="overview-section-heading"><div><span class="section-overline">THE BUSINESS CHALLENGE</span><h2 id="challenge-title">From manual reconciliation to evidence-led review</h2><p>A recurring service invoice starts with a supplier, a purchase order, contractual rates and supporting reports. Someone must reconcile all of them before any payment decision.</p></div></div>
 <div class="wb-grid">
  <article class="wb-small-card"><small>ORIGINAL WORKFLOW</small><h3>Chase and reconcile</h3><p>Collect the invoice and supporting records, check totals and approved rates, investigate anomalies, request corrections and preserve a review history.</p></article>
  <article class="wb-small-card"><small>BUSINESS CHALLENGE</small><h3>Consistency and evidence</h3><p>A mathematically correct invoice can still contain an unapproved rate or missing evidence. Fragmented manual reviews make explanation and traceability harder.</p></article>
  <article class="wb-small-card"><small>PROPOSED SOLUTION</small><h3>Rules first, AI-assisted exceptions</h3><p>Use repeatable deterministic checks, bounded AI-style perspectives, independent claim verification and a named human decision.</p></article>
 </div>
 <p class="wb-file-hint">All public examples are synthetic supplier reference cases, not verified production results or claimed cost savings.</p>
</section>
<section class="promise-section" aria-labelledby="promise-title">
 <div class="overview-section-heading"><div><span class="section-overline">WHAT THIS AI GOVERNANCE SHOWCASE DEMONSTRATES</span><h2 id="promise-title">Useful automation. Decisions you can explain.</h2><p>Four ideas help make automated reviews clear, accountable and easier to trust.</p></div></div>
 <div class="promise-grid">
  <article class="promise-card"><span class="promise-icon"><span data-icon="check"></span></span><h3>Consistent checks</h3><p>Fixed rules check the same facts the same way every time. These are called <strong>deterministic checks</strong>.</p></article>
  <article class="promise-card"><span class="promise-icon"><span data-icon="layers"></span></span><h3>Different AI perspectives</h3><p>Several AI-style personas look at unusual cases from different angles. They raise questions, not final decisions.</p></article>
  <article class="promise-card"><span class="promise-icon"><span data-icon="list-tree"></span></span><h3>Transparent and auditable</h3><p>See what was checked, what evidence was used, and how the final decision was reached.</p></article>
  <article class="promise-card"><span class="promise-icon"><span data-icon="user"></span></span><h3>Human oversight</h3><p>A named person must approve, reject or ask for corrections. Automated advice cannot approve a case on its own.</p></article>
 </div>
</section>
<section class="journey-section" aria-labelledby="journey-title">
 <div class="overview-section-heading"><div><span class="section-overline">THE WORKFLOW · SIX SIMPLE STEPS</span><h2 id="journey-title">From an invoice to a decision</h2><p>See the whole process first. Open the detailed architecture when you want to look inside.</p></div><a class="text-arrow" href="?view=architecture" data-view="architecture">View all system blocks <span data-icon="arrow"></span></a></div>
 <div class="journey-grid">
  <article class="journey-step"><div class="journey-step-top"><span class="step-num">01</span><span class="journey-icon" data-icon="file"></span></div><h3>Ask for documents</h3><p>Request an invoice and supporting reports. Send reminders if they are missing.</p></article>
  <article class="journey-step"><div class="journey-step-top"><span class="step-num">02</span><span class="journey-icon" data-icon="database"></span></div><h3>Receive the invoice</h3><p>Collect the information and check that the required details are present.</p></article>
  <article class="journey-step step-rules"><div class="journey-step-top"><span class="step-num">03</span><span class="journey-icon" data-icon="check"></span></div><h3>Check the facts</h3><p>Use fixed rules for totals, dates, approved prices and contract limits.</p></article>
  <article class="journey-step step-ai"><div class="journey-step-top"><span class="step-num">04</span><span class="journey-icon" data-icon="shield-check"></span></div><h3>Review unusual cases</h3><p>AI-style reviewers raise questions about unusual cases. Only evidence-backed findings reach the person deciding.</p></article>
  <article class="journey-step step-human"><div class="journey-step-top"><span class="step-num">05</span><span class="journey-icon" data-icon="user"></span></div><h3>A person decides</h3><p>A named reviewer approves, rejects or asks the supplier to correct the invoice.</p></article>
  <article class="journey-step"><div class="journey-step-top"><span class="step-num">06</span><span class="journey-icon" data-icon="lock"></span></div><h3>Keep the record</h3><p>Keep a step-by-step record of the checks, changes and final decision.</p></article>
 </div>
</section>
<section class="balance-banner" aria-label="The best of both approaches"><div class="balance-icon"><span data-icon="workflow"></span></div><div><span class="section-overline">THE BEST OF BOTH WORLDS</span><h2>As rule-driven as possible. As AI-assisted as useful.</h2><p>Use fixed checks for what can be verified, different review perspectives to find what needs attention, and a clear record and human review to keep decisions accountable.</p></div></section>
</div>`;}
function renderCaseSelector(){const entries=state.index.scenarios;const opt=entries.map(s=>`<option value="${h(s.slug)}" ${s.slug===state.scenario?'selected':''}>${h(s.title)}</option>`).join('');return `<div class="scenario-switcher"><label for="scenarioSelect">RECORDED SCENARIO</label><select class="select" id="scenarioSelect" aria-label="Select recorded scenario">${opt}</select>${fmtStatus(currentCase().terminal_state)}<span class="count-chip">${currentCase().event_count} events</span></div>`;}
function renderFlowNodes(){const list=scenarioData()?.stages||DEFAULT_STAGES;const ev=events();const selected=activeEvent()?.stage;const completed=selected?list.indexOf(selected):-1;return `<div class="flow-lanes">${list.map((st,i)=>{const count=ev.filter(e=>e.stage===st).length;const cls=st===selected?'active':completed>i?'complete':'';return `<button type="button" class="flow-node ${cls}" data-stage="${h(st)}" aria-pressed="${st===selected}"><div class="node-num"><span>${String(i+1).padStart(2,'0')}</span><span class="node-icon">${icon(STAGE_ICONS[st]||'workflow')}</span></div><span class="node-label">${h(DISPLAY_STAGES[st]||st)}</span><span class="node-count">${ev.length?`${count} event${count===1?'':'s'}`:'Recorded stage'}</span></button>`;}).join('')}</div>`;}
function currentInspector(){const e=activeEvent();const d=scenarioData();const s=currentCase();if(!d){return `<div class="inspector-head"><div class="inspector-kicker">${icon('file')} EVIDENCE INSPECTOR</div><h3>${h(s.title)}</h3>${fmtStatus(s.terminal_state)}</div><div class="inspector-content"><p class="inspector-intro">${h(s.one_liner)}</p><div class="info-label">Evidence source</div><div class="source-ref">data/scenarios/${h(s.slug)}.json</div><div class="group-divider"></div><div class="empty-state">${icon('database')}<strong>Full event trace not cached locally</strong><p>The design uses the original exported JSON. Run <code>python sync_data.py</code> to include all evidence in a local copy, or view the published record.</p><a class="button" href="${PINNED_RAW}/scenarios/${encodeScenario(s.slug)}.json" target="_blank" rel="noopener">Open original JSON ${icon('external-link')}</a></div></div>`;}
if(!e)return `<div class="empty-state">${icon('file')}<strong>No event selected</strong></div>`;
const refs=(e.refs||[]).map(x=>`<div class="source-ref">${h(x)}</div>`).join('');
return `<div class="inspector-head"><div class="inspector-kicker">${icon('file')} EVIDENCE INSPECTOR <span class="count-chip">EVENT ${h(e.seq)}</span></div><h3>${h(e.label)}</h3><span class="status ${e.actor==='human'?'amber':e.actor==='system'?'blue':'gray'}">${h(e.actor)}</span></div><div class="inspector-content"><p class="inspector-intro">Directly from the published synthetic-run evidence export. The inspector never modifies its event contents.</p><div class="info-label">Event type</div><div class="info-value mono">${h(e.kind)}</div><div class="info-label">Recorded detail</div><div class="info-value">${e.detail?h(e.detail):'<span style="color:#a9b3c1">No detail recorded</span>'}</div><div class="info-label">Source reference${(e.refs||[]).length!==1?'s':''}</div>${refs||'<div class="info-value">No source reference provided</div>'}<div class="inspector-separator"></div><div class="info-label">Original event payload</div><pre class="codebox">${h(JSON.stringify(e,null,2))}</pre><div class="inspector-actions">${button('Copy event','copy-event',{glyph:'copy'})}${button('Download trace','download-trace',{glyph:'download'})}</div></div>`;}
function renderTimeline(){const ev=events();if(!ev.length)return `<div class="empty-state">${icon('clock')}<strong>Replay the recorded trace</strong><p>Connect to the published evidence endpoint or sync the original JSON locally to enable step-by-step replay.</p></div>`;const i=state.eventIndex;return `<div class="event-list">${ev.map((e,j)=>`<button type="button" class="event-row ${j===i?'active':''}" data-event="${j}" aria-pressed="${j===i}"><span class="event-seq">${String(e.seq).padStart(2,'0')}</span><span class="event-bullet ${e.actor==='human'?'human':e.actor==='system'?'':'scripted'}"></span><span><strong>${h(e.label)}</strong><small>${h(e.kind)} · ${h(e.actor)}</small></span></button>`).join('')}</div>`;}
function renderArchitecture(){const es=events(),i=state.eventIndex,s=currentCase(),d=scenarioData();const completion=es.length?((i+1)/es.length*100):0;return `<div class="page-entrance">${pageHeader('SYSTEM ARCHITECTURE','Architecture explorer','An inspectable path from supplier submission to human decision. Step through actual recorded workflow events—not a simulated execution.',`${button('Inspect audit trail','goto:audit',{glyph:'list-tree'})}${button('View GitHub','source-repo',{glyph:'github'})}`)}${strip('<strong>Evidence boundary:</strong> The replay is a read-only visualization of pre-executed synthetic fixture events. “AI” committee participants are scripted adapters; no live LLM is invoked.')}${metrics()}${renderCaseSelector()}<div class="content-grid"><section class="panel"><div class="panel-header"><div><div class="panel-title">Workflow execution map</div><div class="panel-sub">Recorded stages · select any node to inspect evidence</div></div><div class="panel-heading-actions"><span class="mini-pill active"><span class="tiny-indicator"></span> Read-only trace</span></div></div><div class="panel-inner"><div class="hero-board ${state.playing?'is-playing':''}"><div class="board-overline"><span>CONTROLLED SUPPLIER REVIEW</span><b>${d?'TRACE LOADED':'TRACE READY'}</b></div>${renderFlowNodes()}<div class="board-footer"><span>Proponent → Opponent → Evidence firewall (CoVe) → Judge</span><strong>Human retains decision authority</strong></div></div><div class="rule-caption">Sequence follows exported <code>stages</code>. Click a stage to jump to its first recorded event. The advisory sequence is an internal subflow, not four extra workflow states.</div></div><div class="playback"><div class="playback-controls"><button class="button" data-action="reset" aria-label="Reset replay" ${!es.length?'disabled':''}>${icon('skip-back')}</button><button class="button" data-action="prev" aria-label="Previous event" ${!es.length||i===0?'disabled':''}>${icon('chevron-left')}</button><button class="button primary" data-action="toggle-play" aria-label="${state.playing?'Pause':'Play'} replay" ${!es.length?'disabled':''}>${icon(state.playing?'pause':'play')} ${state.playing?'Pause':'Play'}</button><button class="button" data-action="next" aria-label="Next event" ${!es.length||i===es.length-1?'disabled':''}>${icon('chevron-right')}</button></div><span class="playhead">${es.length?`${String(i+1).padStart(2,'0')} / ${es.length} EVENTS`:'AWAITING TRACE'}</span><select class="speed-select" id="speedSelect" aria-label="Playback speed"><option value="1650" ${state.speed===1650?'selected':''}>0.7×</option><option value="1150" ${state.speed===1150?'selected':''}>1×</option><option value="550" ${state.speed===550?'selected':''}>2×</option></select><div class="playback-timeline" aria-label="Replay progress"><span style="width:${completion.toFixed(2)}%"></span></div></div></section><aside class="panel inspector" id="inspectorPanel">${currentInspector()}</aside></div><div class="below-grid"><section class="panel"><div class="panel-header"><div><div class="panel-title">Event trace</div><div class="panel-sub">Ordered emitted events · select a row to inspect its original record</div></div><span class="count-chip">${es.length?es.length:'—'} events</span></div>${renderTimeline()}</section><section class="panel"><div class="panel-header"><div><div class="panel-title">Run provenance</div><div class="panel-sub">Precise reference boundaries</div></div>${icon('shield-check')}</div><div class="minimetrics">${outcomeMeta(s)}<div class="minimetric"><span>Live model calls</span><strong>0 (scripted adapters)</strong></div><div class="minimetric"><span>Relative time</span><strong>Ordinal event position</strong></div><div class="outcome-note"><strong>${d?'Source-derived scenario':'Published source of truth'}</strong>${h(d?.provenance?.ts_rel_note||'Fixture evidence emitted by the supplier reference runner. No simulated timestamps or judgments are introduced by this UI.')}</div></div></section></div></div>`;}
function renderCases(){const scenarios=state.index.scenarios;const search=state.search.toLowerCase(),filter=state.filter;const items=scenarios.filter(s=>(filter==='all'||s.terminal_state===filter)&&`${s.title} ${s.slug} ${s.group} ${s.one_liner}`.toLowerCase().includes(search));const statuses=[['all','All scenarios'],['Approved','Approved'],['Rejected','Rejected'],['Awaiting_reviewer','Awaiting reviewer'],['Awaiting_supplier','Awaiting supplier'],['Intake_rejected','Intake rejected']];return `<div class="page-entrance">${pageHeader('RECORDED RUNS','Case explorer','Fifteen executed supplier fixtures. Explore approvals, rejected submissions, human-review pauses and adversarial controls without conflating them with production outcomes.',button('Explore architecture','goto:architecture',{glyph:'workflow'}))}${strip('These are <strong>executed synthetic scenarios</strong>. Statuses and event counts come from the reference runner, not real supplier cases.')}${metrics()}<div class="case-toolbar"><label class="searchbox">${icon('search')}<input type="search" id="caseSearch" placeholder="Search scenarios, controls, outcomes…" value="${h(state.search)}" aria-label="Search scenarios" /></label><select id="caseFilter" class="select" aria-label="Filter by status">${statuses.map(([key,label])=>`<option value="${h(key)}" ${key===filter?'selected':''}>${h(label)}</option>`).join('')}</select></div><section class="panel"><table class="case-table"><thead><tr><th style="width:46%">SCENARIO</th><th>GROUP</th><th>OUTCOME</th><th>EVENTS</th><th>TRACE</th></tr></thead><tbody>${items.map(s=>`<tr><td><strong class="case-name">${h(s.title)}</strong><span class="case-desc">${h(s.one_liner)}</span></td><td>${h(s.group)}</td><td>${fmtStatus(s.terminal_state)}</td><td class="mono">${h(s.event_count)}</td><td><a href="${linkView('architecture',s.slug)}" class="link-inline" data-open-case="${h(s.slug)}">Explore →</a></td></tr>`).join('')}</tbody></table>${items.length?'':`<div class="empty-state">${icon('search')}<strong>No matching scenario</strong><p>Try a different term or status filter.</p></div>`}</section></div>`;}
function renderAudit(){const es=events(),e=activeEvent(),s=currentCase(),filtered=es.map((x,i)=>({...x,idx:i})).filter(x=>(state.filter==='all'||x.actor===state.filter)&&(`${x.label} ${x.kind} ${x.detail} ${x.stage}`.toLowerCase().includes(state.search.toLowerCase())));return `<div class="page-entrance">${pageHeader('AUDIT TRAIL','Evidence explorer','Inspect the original event ledger, trace a scenario to its source and download the unmodified exported evidence.',`${button('Download original trace','download-trace',{glyph:'download',disabled:!scenarioData()})}`)}${strip('Original event payloads are shown verbatim. <strong>Event time</strong> is an ordinal position in a fixture run, not a real-world timestamp or a cryptographically secured audit trail.')}${renderCaseSelector()}<div class="case-toolbar"><label class="searchbox">${icon('search')}<input id="auditSearch" type="search" placeholder="Search labels, stages, event kinds…" aria-label="Search audit events" value="${h(state.search)}" /></label><select id="actorFilter" class="select" aria-label="Filter by actor"><option value="all">All actors</option><option value="system" ${state.filter==='system'?'selected':''}>System</option><option value="human" ${state.filter==='human'?'selected':''}>Human</option><option value="ai" ${state.filter==='ai'?'selected':''}>Scripted role</option></select></div><div class="audit-layout"><section class="panel"><div class="panel-header"><div><div class="panel-title">Chronological event ledger</div><div class="panel-sub">${es.length?`${filtered.length} of ${es.length} events`:'Original scenario JSON required'}</div></div><span class="count-chip">${h(s.slug)}</span></div>${!es.length?renderTimeline():`<div class="event-list">${filtered.map(x=>`<button type="button" class="event-row ${x.idx===state.eventIndex?'active':''}" data-event="${x.idx}"><span class="event-seq">${String(x.seq).padStart(2,'0')}</span><span class="event-bullet ${x.actor==='human'?'human':x.actor==='system'?'':'scripted'}"></span><span><strong>${h(x.label)}</strong><small>${h(x.kind)} · ${h(x.actor)} · ${h(x.stage)}</small></span></button>`).join('')}</div>`}</section><section class="panel audit-details">${currentInspector()}</section></div></div>`;}
function renderGovernance(){const cross=state.loaded.crosswalk;const rows=cross?.rows||[];return `<div class="page-entrance">${pageHeader('CONTROL TRACEABILITY','Compliance mapping','Reference control mappings across the EU AI Act, ISO/IEC 42001 and NIST AI RMF, with explicit limits to each assertion.',button('Explore hazards','goto:assurance',{glyph:'shield-check'}))}<div class="scope-disclaimer"><strong>Classification precedes compliance.</strong> This reference is scoped to recurring supplier billing submissions. These mappings are conceptual, not a determination of Annex III applicability, conformity, certification or fulfillment of deployment obligations.</div><div class="graph-steps"><div class="graph-step"><b>01 · Applicable obligation</b><p>Assessed against intended purpose and deployment context.</p></div><div class="graph-arrow">→</div><div class="graph-step"><b>02 · Control mechanism</b><p>Specific implemented technical behavior, not a marketing claim.</p></div><div class="graph-arrow">→</div><div class="graph-step"><b>03 · Source evidence</b><p>Code and executed fixture tests supporting the bounded mechanism.</p></div><div class="graph-arrow">→</div><div class="graph-step"><b>04 · Honest boundary</b><p>What the mechanism does not establish or guarantee.</p></div></div>${rows.length?`<div class="card-grid">${rows.map((r,i)=>`<article class="panel cross-card"><span class="pill-label">${h(r.regulation)} · REFERENCE MAPPING ${String(i+1).padStart(2,'0')}</span><h3>${h(r.article)}</h3><p>${h(r.mechanism)}</p><div class="info-label">Supporting implementation</div><div class="source-ref">${h(r.evidence_ref)}</div><div class="detail-panel"><strong>What this does not establish</strong><div>${h(r.honest_scope)}</div></div><div class="rule-caption">ISO/IEC 42001: ${h(r.iso_42001)}<br/>NIST AI RMF: ${h((r.nist_ai_rmf||[]).join(' · '))}</div></article>`).join('')}</div>`:emptyFor('Compliance mappings','crosswalk')} </div>`;}
function renderAssurance(){const raw=state.loaded.hazards;const hazards=raw?.hazards||[];const ac=state.loaded.assurance;return `<div class="page-entrance">${pageHeader('ASSURANCE ENGINEERING','Hazards & controls','Examine what can go wrong, what the reference runner actually prevents, and which residual risks remain open.',button('View compliance','goto:governance',{glyph:'scale'}))}${strip('These are <strong>reference-workflow hazards</strong>, not an ISO 26262 functional-safety claim. Control grades are authored for this runner and must not be presented as universal safety or compliance scores.')}<div class="data-grid"><div class="data-card"><span class="pill-label">REGISTERED HAZARDS</span><div class="metric">${hazards.length||'—'}</div><small>Implementation-derived reference hazard log</small></div><div class="data-card"><span class="pill-label">ASSURANCE ARGUMENT NODES</span><div class="metric">${ac?.nodes?.length??'—'}</div><small>Goals, solutions, defeaters and contexts</small></div><div class="data-card"><span class="pill-label">EVIDENCE TYPE</span><div class="metric" style="font-size:17px;margin-top:18px">Fixture tests</div><small>No live-model robustness assurance</small></div></div><div style="height:17px"></div>${hazards.length?`<div class="card-grid">${hazards.map(r=>`<article class="panel hazard-card"><div class="hazard-head"><span class="pill-label">HAZARD ${h(r.id)}</span><span class="mini-pill">${h(r.control_class)} control</span></div><h3>${h(r.hazard)}</h3><p>${h(r.control)}</p><div class="hazard-badges"><span class="status ${Number(r.achieved)>=Number(r.required)?'green':'amber'}">Recorded grade ${h(r.achieved)} / required ${h(r.required)}</span></div><details><summary>Inspect residual risk and test</summary><p><strong>Remaining limitation:</strong> ${h(r.residual)}</p><p><strong>Test:</strong> <span class="mono">${h(r.test)}</span></p><p><strong>Source:</strong> <span class="mono">${h(r.evidence_ref)}</span></p></details></article>`).join('')}</div>`:emptyFor('Hazard register','hazards')}<section class="panel" style="margin-top:18px"><div class="panel-header"><div><div class="panel-title">Assurance argument</div><div class="panel-sub">Reference goal structuring, including counter-arguments and defeaters</div></div><span class="count-chip">${ac?.nodes?.length??'—'} nodes</span></div><div class="panel-inner">${ac?`<div class="info-strip">${icon('shield-check')} ${h(ac.note||'')}</div><div class="card-grid">${ac.nodes.filter(x=>['goal','defeater'].includes(x.kind)).slice(0,8).map(x=>`<div class="detail-panel"><strong>${h(x.kind.toUpperCase())} · ${h(x.id)}</strong><p>${h(x.text)}</p>${x.status?fmtStatus(x.status):''}</div>`).join('')}</div>`:emptyFor('Assurance argument','assurance')}</div></section></div>`;}
function renderRedTeam(){const set=state.loaded.redteam;const probes=set?.scenarios||[];return `<div class="page-entrance">${pageHeader('ADVERSARIAL ASSURANCE','Control probes','Inspect deterministic attack simulations, the control each one exercised, and the recorded observation.',button('Inspect evidence','goto:audit',{glyph:'list-tree'}))}${strip('<strong>Scope of these results:</strong> Seven executed deterministic control probes—not a live-model red-team campaign. “Control triggered” means the reference control behaved as recorded for this fixture, not that the system is secure against all attacks.')}<div class="data-grid"><div class="data-card"><span class="pill-label">EXECUTED PROBES</span><div class="metric">${set?.summary?.scenarios??'—'}</div><small>Deterministic supplier controls</small></div><div class="data-card"><span class="pill-label">CONTROL TRIGGERED</span><div class="metric">${set?.summary?.control_triggered??'—'}</div><small>Cases exercising reference controls</small></div><div class="data-card"><span class="pill-label">LIVE MODEL CALLS</span><div class="metric">0</div><small>Scripted proposal fixtures only</small></div></div><div style="height:17px"></div>${probes.length?`<div class="card-grid">${probes.map((p,i)=>`<article class="panel cross-card"><div class="hazard-head"><span class="pill-label">PROBE ${String(i+1).padStart(2,'0')} · ${h(p.area).toUpperCase()}</span><span class="status green">${h(p.outcome).replaceAll('_',' ')}</span></div><h3>${h(p.threat_model)}</h3><div class="info-label">Input / target</div><div class="source-ref">${h(p.payload_as_filtered)}</div><div class="info-label">Expected control</div><p>${h(p.expected_control)}</p><div class="detail-panel"><strong>Observed evidence</strong><div>${h(p.evidence)}</div></div><div class="rule-caption">Seam: ${h(p.target_seam)} · Reference: ${h(p.scenario_id)}</div></article>`).join('')}</div>`:emptyFor('Executed probes','redteam')}</div>`;}
function renderIntegration(){const obj=state.loaded.integration;const seams=obj?.seams||[],api=window.PublicBackend?.state()||{mode:'reference',status:'unconfigured',message:'Connector not loaded'};
const connectPanel=`<section class="wb-panel backend-status-panel"><div class="wb-panel-head"><h2>Generic validation backend · Oracle-ready</h2></div><div class="wb-panel-body">
<div class="wb-backend-state"><span class="wb-status">${h(api.mode==='backend'?api.status:'Reference mode')}</span><p>${h(api.message)}</p></div>
<div class="wb-inline-actions"><button type="button" data-backend-refresh="true">Check backend connection</button><a href="https://github.com/Ghadiator/Ghadiator.github.io/blob/main/docs/GENERIC_BACKEND_ORACLE.md" target="_blank" rel="noopener">API and Oracle deployment contract ↗</a></div>
<p class="wb-file-hint">The public configuration is loaded from data/backend-config.json. It contains no credentials. Server authentication, CORS, upload limits, model keys, stateful storage, and human authorization belong behind the reverse proxy and backend image.</p></div></section>`;
return `<div class="page-entrance">${connectPanel}${pageHeader('ENGINEERING CONTEXT','Integration scope','Technical integration boundaries, configuration modes and requirements for turning a deterministic reference into a deployed system.',button('Explore architecture','goto:architecture',{glyph:'workflow'}))}${strip('<strong>Environment transparency:</strong> Provider configuration does not mean production integration. Credentials, durable records, identity and operational controls must be verified in their actual deployment context.')}<div class="top-kpis"><div class="kpi"><span class="kpi-top">Integration interfaces</span><div class="kpi-number">${obj?.counts?.total??'8'}</div><div class="kpi-foot">Defined environmental seams</div></div><div class="kpi"><span class="kpi-top">Model calls in recorded fixtures</span><div class="kpi-number">0</div><div class="kpi-foot">Scripted proposal adapters</div></div><div class="kpi"><span class="kpi-top">Reference deployment</span><div class="kpi-number" style="font-size:22px">Static</div><div class="kpi-foot">GitHub Pages evidence presentation</div></div><div class="kpi"><span class="kpi-top">Payment execution</span><div class="kpi-number">0</div><div class="kpi-foot">No payments processed</div></div></div><div class="card-grid">${seams.length?seams.map(s=>`<article class="panel cross-card"><div class="hazard-head"><h3>${h(s.name)}</h3><span class="mini-pill">${h(s.status)}</span></div><p>${h(s.detail)}</p><div class="info-label">Configuration</div><div class="source-ref">${h(s.env)}</div><div class="info-label">Implementation reference</div><div class="source-ref">${h(s.ref)}</div></article>`).join(''):emptyFor('Integration scopes','integration')}</div></div>`;}
function emptyFor(title,key){return `<div class="empty-state">${icon('database')}<strong>${h(title)} needs original evidence</strong><p>Run <code>python sync_data.py</code> to retrieve the exact published JSON into the local data folder. No placeholder governance records will be fabricated.</p><a class="button" href="${PINNED_RAW}/${h(DATA_FILES[key]||'') }" target="_blank" rel="noopener">Read source export ${icon('external-link')}</a></div>`;}
function workbenchContext(){return {state,h,icon,currentCase,scenarioData,events,activeEvent,renderTimeline,currentInspector,renderCaseSelector,metrics,fmtStatus,DISPLAY_STAGES};}
function render(){refreshLinkState();
 const mode=window.PublicBackend?.state()||{mode:'reference',status:'unconfigured'};
 const statusChip=document.querySelector('.environment-chip');
 if(statusChip)statusChip.textContent=mode.mode==='backend'?(mode.status==='online'?'Backend connected · capability-gated':'Backend '+mode.status+' · no live actions'):'Reference data · no live AI';
 const wb=window.GenericWorkbench,ctx=workbenchContext();const fn={
 overview:renderOverview,
 dashboard:()=>wb.overview(ctx),
 tickets:()=>window.PublicSubmissions.render(ctx),
 newticket:()=>window.PublicSubmissions.render(ctx),
 submissions:()=>window.PublicSubmissions.render(ctx),
 ticket:()=>wb.ticket(ctx),
 inbound:()=>wb.inbound(ctx),
 cases:()=>wb.cases(ctx),
 case:()=>wb.detail(ctx),
 monitor:()=>renderEmbeddedArchitecture(),
 tokens:()=>wb.economics(ctx),
 attacker:()=>window.PublicAttacker.render(ctx),
 personas:()=>`<div class="wb-tabs narrative-subtabs" role="group" aria-label="Persona capabilities"><button class="wb-tab ${state.personaMode==='chat'?'selected':''}" data-persona-mode="chat">Talk to personas</button><button class="wb-tab ${state.personaMode==='attacker'?'selected':''}" data-persona-mode="attacker">Red Team attacker</button></div>`+(state.personaMode==='attacker'?window.PublicAttacker.render(ctx):window.PublicPersonas.render(ctx)),
 evidence:()=>window.StoryJourney.renderEvidence(ctx),
 governance:()=>wb.governanceHub(ctx,renderGovernance),
 architecture:renderEmbeddedArchitecture,
 integration:renderIntegration,
 audit:renderAudit,
 assurance:renderAssurance,
 redteam:()=>window.PublicAttacker.render(ctx),
 analytics:()=>wb.analytics(ctx),
 login:()=>wb.login(ctx)
 };if(!wb){MAIN.innerHTML='<p class="wb-error">The generic workbench module is unavailable.</p>';return;}
 let markup=fn[state.view]();if(state.animateNext){markup=markup.replace('class="wb-page"','class="wb-page enter-animated"').replace('class="page-entrance"','class="page-entrance enter-animated"');state.animateNext=false;}
 disposeArchitectureEmbed();disposeArchitectureEmbed=()=>{};
 MAIN.innerHTML=markup;MAIN.classList.toggle('architecture-active',state.view==='architecture');hydrateIcons();if(state.view==='architecture')mountEmbeddedArchitecture();
 if(['architecture','case','ticket','inbound','audit','personas','attacker'].includes(state.view)&&!state.loaded[`scenario:${state.scenario}`]&&!state.errors[`scenario:${state.scenario}`]){const wanted=state.scenario;ensureScenario(wanted).then(d=>{if(d&&wanted===state.scenario)renderIfNeeded();});}
 if(['governance','evidence'].includes(state.view)&&!state.loaded.rules&&!state.errors.rules)ensureData('rules').then(d=>d&&['governance','evidence'].includes(state.view)&&renderIfNeeded());
 if(state.view==='evidence'&&!state.loaded[`scenario:${state.scenario}`]&&!state.errors[`scenario:${state.scenario}`])ensureScenario(state.scenario).then(d=>d&&state.view==='evidence'&&renderIfNeeded());
 if(state.view==='governance'&&!state.loaded.crosswalk&&!state.errors.crosswalk)ensureData('crosswalk').then(d=>d&&state.view==='governance'&&renderIfNeeded());
 if(state.view==='governance'&&!state.loaded.rules&&!state.errors.rules)ensureData('rules').then(d=>d&&state.view==='governance'&&renderIfNeeded());
 if(state.view==='assurance'&&(!state.loaded.hazards&&!state.errors.hazards||!state.loaded.assurance&&!state.errors.assurance)){Promise.all([ensureData('hazards'),ensureData('assurance')]).then(()=>state.view==='assurance'&&renderIfNeeded());}
 if(['redteam','attacker','personas'].includes(state.view)&&!state.loaded.redteam&&!state.errors.redteam)ensureData('redteam').then(d=>d&&['redteam','attacker','personas'].includes(state.view)&&renderIfNeeded());
 if(['personas'].includes(state.view)){
  for(const k of ['rules','integration','crosswalk'])if(!state.loaded[k]&&!state.loading[k]&&!state.errors[k])ensureData(k).then(d=>d&&state.view==='personas'&&renderIfNeeded());
 }
 if(state.view==='integration'&&!state.loaded.integration&&!state.errors.integration)ensureData('integration').then(d=>d&&state.view==='integration'&&renderIfNeeded());
}
function renderIfNeeded(){if(state.view==='architecture'&&document.getElementById('workflow-results')){refreshWorkflowResults();return;}if(!state._renderFrame){state._renderFrame=requestAnimationFrame(()=>{state._renderFrame=0;render();});}}
function hydrateIcons(){document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)});}
function setEvent(idx){const es=events();if(!es.length)return;state.eventIndex=Math.max(0,Math.min(idx,es.length-1));const before=document.querySelector('.event-list');const previousScroll=before?.scrollTop||0;render();const list=document.querySelector('.event-list');if(list){list.scrollTop=previousScroll;const item=list.querySelector('.event-row.active');if(item){const rect=item.getBoundingClientRect(),bounds=list.getBoundingClientRect();if(rect.top<bounds.top||rect.bottom>bounds.bottom)item.scrollIntoView({block:'nearest',behavior:'auto'});}}}
function stopPlay(){if(playTimer)clearInterval(playTimer);playTimer=null;state.playing=false;}
function togglePlay(){if(!events().length){notify('Sync published evidence to replay events.');return;}if(state.playing){stopPlay();render();return;}if(state.eventIndex>=events().length-1)state.eventIndex=0;state.playing=true;playTimer=setInterval(()=>{if(state.eventIndex<events().length-1)setEvent(state.eventIndex+1);else{stopPlay();render();}},state.speed);render();}
function downloadRaw(){const key=`scenario:${state.scenario}`;const raw=state.raw[key];if(!raw){notify('Original JSON is not loaded.');return;}const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${state.scenario}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function copyEvent(){const e=activeEvent();if(!e)return;try{await navigator.clipboard.writeText(JSON.stringify(e,null,2));notify('Exact event JSON copied.');}catch{notify('Copy blocked by browser permissions.');}}
function clickAction(action){if(action.startsWith('goto:'))return route(action.slice(5),state.scenario);switch(action){case 'toggle-play':togglePlay();break;case 'next':stopPlay();setEvent(state.eventIndex+1);break;case 'prev':stopPlay();setEvent(state.eventIndex-1);break;case 'reset':stopPlay();setEvent(0);break;case 'copy-event':copyEvent();break;case 'download-trace':downloadRaw();break;case 'source-repo':window.open('https://github.com/Ghadiator/Ghadiator.github.io','_blank','noopener');break;}}
MAIN.addEventListener('click',event=>{
const architectureSeek=event.target.closest('[data-replay-seek]');
if(architectureSeek){
 event.preventDefault();
 const frame=document.getElementById('modularArchitectureFrame');
 if(frame)window.ArchitectureExecution?.seek(frame.contentDocument,Number(architectureSeek.dataset.replaySeek));
 return;
}
const archtab=event.target.closest('[data-architecture-tab]');if(archtab){event.preventDefault();stopPlay();state.architectureTab=archtab.dataset.architectureTab;render();return;}
const subtab=event.target.closest('[data-submission-tab]');if(subtab){state.submissionTab=subtab.dataset.submissionTab;render();return;}
const submode=event.target.closest('[data-submission-mode]');if(submode){state.submissionMode=submode.dataset.submissionMode;render();return;}
const refreshButton=event.target.closest('[data-backend-refresh]');if(refreshButton){
 event.preventDefault();refreshButton.disabled=true;
 window.PublicBackend.refresh().then(()=>{render();notify(window.PublicBackend.state().message)}).catch(e=>{refreshButton.disabled=false;notify(e.message);});return;
}
const subaction=event.target.closest('[data-submission-action]');if(subaction){const [cmd,...idParts]=subaction.dataset.submissionAction.split(':');const id=idParts.join(':');if(cmd==='export')window.PublicSubmissions.download(id);if(cmd==='template')window.PublicSubmissions.template();if(cmd==='delete'&&confirm('Delete this local submission record?')){window.PublicSubmissions.remove(id);render();}return;}
const personaMode=event.target.closest('[data-persona-mode]');if(personaMode){state.personaMode=personaMode.dataset.personaMode;render();return;}
const evidenceTab=event.target.closest('[data-evidence-tab]');if(evidenceTab){state.evidenceTab=evidenceTab.dataset.evidenceTab;render();return;}
const per=event.target.closest('[data-persona-select]');if(per){state.personaName=per.dataset.personaSelect;render();return;}
const perq=event.target.closest('[data-persona-question]');if(perq){const target=document.querySelector('#public-persona-chat input[name="question"]');if(target){target.value=perq.dataset.personaQuestion;target.focus();}return;}
const attacktab=event.target.closest('[data-attacker-tab]');if(attacktab){state.attackerTab=attacktab.dataset.attackerTab;render();return;}
const attack=event.target.closest('[data-attacker-action]');if(attack){const cmd=attack.dataset.attackerAction,n=state.loaded.redteam?.scenarios?.length||0;if(cmd==='live'){
 const btn=attack;btn.disabled=true;
 window.PublicBackend.redTeam({techniques:[]}).then(result=>{
  if(!result||!result.campaign_id)throw Error('Backend did not confirm a campaign identifier');
  state.liveCampaign={id:result.campaign_id,status:result.status||'Queued'};
  render();notify('Backend attack campaign accepted: '+result.campaign_id);
 }).catch(e=>{btn.disabled=false;notify('Attack not started: '+e.message);});return;
}
if(cmd==='all')state.attackerRevealed=n;else if(cmd==='next')state.attackerRevealed=Math.min(n,(state.attackerRevealed||0)+1);else if(cmd==='reset')state.attackerRevealed=0;else if(cmd==='hypothesis'){const seam=document.getElementById('attacker-seam')?.value;const payload=document.getElementById('attacker-payload')?.value.trim();if(!payload){notify('Enter a candidate attack first.');return;}state.attackerNotes=(state.attackerNotes||[]).concat({seam,payload}).slice(-30);}render();return;}
const wbtab=event.target.closest('[data-wb-tab]');if(wbtab){event.preventDefault();state.workbenchTab=wbtab.dataset.wbTab.split(':')[1];render();return;}const viewlink=event.target.closest('[data-view]');if(viewlink){event.preventDefault();route(viewlink.dataset.view,viewlink.dataset.scenario||state.scenario);return;}const openCase=event.target.closest('[data-open-case]');if(openCase){event.preventDefault();state.architectureTab='replay';route('architecture',openCase.dataset.openCase);return;}const action=event.target.closest('[data-action]');if(action){event.preventDefault();clickAction(action.dataset.action);return;}const stage=event.target.closest('[data-stage]');if(stage){stopPlay();const idx=events().findIndex(e=>e.stage===stage.dataset.stage);if(idx>=0)setEvent(idx);else notify('No emitted events in this stage for the selected scenario.');return;}const eventNode=event.target.closest('[data-event]');if(eventNode){stopPlay();setEvent(Number(eventNode.dataset.event));}});
MAIN.addEventListener('change',event=>{if(event.target.id==='scenarioSelect'){stopPlay();state.scenario=event.target.value;state.eventIndex=0;history.replaceState(null,'',linkView(state.view,state.scenario));render();}if(event.target.id==='caseFilter'||event.target.id==='actorFilter'){state.filter=event.target.value;render();}if(event.target.id==='speedSelect'){state.speed=Number(event.target.value);if(state.playing){stopPlay();togglePlay();}else render();}});
MAIN.addEventListener('input',event=>{if(event.target.id==='caseSearch'||event.target.id==='auditSearch'){const id=event.target.id;const caret=event.target.selectionStart;state.search=event.target.value;render();const focusEl=document.getElementById(id);if(focusEl){focusEl.focus();try{focusEl.setSelectionRange(caret,caret);}catch{}}}});
document.body.addEventListener('click',event=>{const viewlink=event.target.closest('.sidebar [data-view]');if(viewlink){event.preventDefault();route(viewlink.dataset.view,state.scenario);}});
$('#mobileMenu').addEventListener('click',()=>{$('#sidebar').classList.add('open');$('#mobileOverlay').classList.add('visible');});
$('#mobileClose').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#mobileOverlay').classList.remove('visible');});
$('#mobileOverlay').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#mobileOverlay').classList.remove('visible');});
MAIN.addEventListener('submit',async event=>{
 if(event.target.id==='public-submission-form'){
  event.preventDefault();const form=event.target,mode=state.submissionMode;
  const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=true;
  try{const entry=await window.PublicSubmissions.submit(form,mode);
    state.submissionTab='history';render();notify(entry.remoteId?'Backend acknowledged: '+entry.remoteId:'Saved local receipt: '+entry.id+'. No server submission was made.');
  }catch(e){if(submit)submit.disabled=false;const out=document.getElementById('submission-result');if(out){out.hidden=false;out.classList.add('error');out.textContent=String(e.message||e);}else notify('Local submission failed.');}
  return;
 }
 if(event.target.id==='public-persona-chat'){
  event.preventDefault();const input=event.target.querySelector('input[name="question"]');
  const question=input?.value?.trim();if(!question)return;
  const persona=state.view==='attacker'?'red_team':state.personaName;
  const sender=event.target.querySelector('button[type="submit"]');if(sender)sender.disabled=true;
 try{await window.PublicPersonas.send(workbenchContext(),persona,question);render();}
 catch(e){if(sender)sender.disabled=false;notify('Persona request failed: '+e.message);}

  return;
 }
 if(event.target.id==='wb-draft-form'){event.preventDefault();route('submissions',state.scenario);return;}
});
$('#helpButton').addEventListener('click',()=>notify('Read-only evidence viewer · synthetic fixtures · no live-model testing or certification.'));
window.addEventListener('popstate',()=>{const params=new URLSearchParams(location.search);const s=params.get('scenario');route(params.get('view')||'overview',s,{push:false});});
window.addEventListener('keydown',ev=>{if(ev.target.closest('input,textarea,select')||ev.altKey||ev.ctrlKey||ev.metaKey)return;if(ev.key==='ArrowRight'&&['architecture','audit'].includes(state.view)){stopPlay();setEvent(state.eventIndex+1);}else if(ev.key==='ArrowLeft'&&['architecture','audit'].includes(state.view)){stopPlay();setEvent(state.eventIndex-1);}else if(ev.key==='Escape'){$('#sidebar').classList.remove('open');$('#mobileOverlay').classList.remove('visible');}});
(async()=>{window.PublicBackend?.init().then(()=>{renderIfNeeded();}).catch(()=>{});const params=new URLSearchParams(location.search);state.scenario=SCENARIOS.some(s=>s.slug===params.get('scenario'))?params.get('scenario'):'supplier_variance_review';const requestedView=params.get('view');if(requestedView==='monitor')state.architectureTab='replay';if(requestedView==='tickets')state.submissionTab='history';if(requestedView==='newticket'){state.submissionTab='compose';state.submissionMode='request';}if(['redteam','attacker'].includes(requestedView)){state.attackerTab='campaign';state.personaMode='attacker';}state.view=requestedView==='monitor'?'architecture':requestedView==='pool'?'dashboard':['tickets','newticket'].includes(requestedView)?'submissions':['redteam','attacker'].includes(requestedView)?'personas':VIEW_NAMES[requestedView]?requestedView:'overview';hydrateIcons();render();const available=await Promise.all([ensureData('index'),ensureData('facts')]);if(available.some(Boolean))renderIfNeeded();})();
