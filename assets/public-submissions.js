(function setupSubmissions(){
"use strict";
const KEY="supplier-demo-submissions-v1",esc=(ctx,v)=>ctx.h(v??"");
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(x)?x.slice(0,100):[]}catch{return []}}
function save(items){try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,100)));return true}catch{return false}}
function render(ctx){
 const records=read(),mode=ctx.state.submissionMode||"request",tab=ctx.state.submissionTab||"compose";
 const history=records.length?records.map(x=>`<div class="wb-local-row"><span><strong>${esc(ctx,x.supplier)} · ${esc(ctx,x.reference)}</strong><small>${esc(ctx,x.kind)} · ${esc(ctx,x.fileName||"No attachment")} · ${esc(ctx,x.status)}</small><small>${esc(ctx,x.id)}</small></span><div class="wb-inline-actions"><button type="button" data-submission-action="export:${esc(ctx,x.id)}">Export</button><button type="button" data-submission-action="delete:${esc(ctx,x.id)}">Delete</button></div></div>`).join(""):`<div class="wb-empty"><strong>No local entries</strong><p>Create a document request or upload a submission below.</p></div>`;
 const upload=mode==="upload"?`<label class="wide">Document file<input type="file" name="attachment" required accept=".json,.csv,.xlsx,.pdf"></label>
 <div class="wb-file-hint">JSON/CSV receive only basic client-side structure checks. PDF/XLSX are accepted as local metadata, not parsed or sent to a server. No claim is made of full validation.</div>`:
 `<label class="wide">Requested evidence<select name="document"><option>Invoice and supporting service report</option><option>Corrected invoice</option><option>Contract or approved rate card</option><option>Supplier clarification</option></select></label>`;
 return `<div class="wb-page"><div class="wb-head"><div><span class="wb-kicker">DOCUMENT COLLECTION · SUBMISSION WORKBENCH</span><h1>Supplier submissions</h1><p>Submit new supplier documents into this browser, track requests, download records and inspect basic local preflight status. DAiA-inspired, with generic validation terminology.</p></div><a class="wb-button" href="?view=cases" data-view="cases">Recorded reference cases ↗</a></div>
 <div class="wb-metrics"><div class="wb-metric"><span class="wb-metric-label">Local submissions</span><strong>${records.length}</strong><small>This device only</small></div><div class="wb-metric"><span class="wb-metric-label">Local upload receipts</span><strong>${records.filter(r=>r.kind==="upload").length}</strong><small>No network transfer</small></div><div class="wb-metric"><span class="wb-metric-label">Server workflow executions</span><strong>0</strong><small>No backend connected</small></div><div class="wb-metric"><span class="wb-metric-label">Reviewer approvals</span><strong>0</strong><small>Cannot authorize through static UI</small></div></div>
 <div class="wb-tabs"><button class="wb-tab ${tab==="compose"?"selected":""}" data-submission-tab="compose">Create or submit</button><button class="wb-tab ${tab==="history"?"selected":""}" data-submission-tab="history">Local register</button></div>
 ${tab==="history"?`<div class="wb-panel"><div class="wb-panel-head"><h2>Locally retained entries</h2></div><div class="wb-panel-body wb-local-rows">${history}</div></div>`:
 `<div class="wb-panel"><div class="wb-panel-head"><h2>New supplier request / direct upload</h2></div><div class="wb-panel-body wb-submit-section"><div class="wb-submission-modes"><button type="button" class="wb-tab ${mode==="request"?"selected":""}" data-submission-mode="request">01 · Request documents</button><button type="button" class="wb-tab ${mode==="upload"?"selected":""}" data-submission-mode="upload">02 · Direct submission</button></div>
 <form id="public-submission-form" class="wb-submit-section"><div class="wb-submit-grid"><label>Supplier<input name="supplier" required maxlength="120" placeholder="Supplier name"></label><label>Invoice / request reference<input name="reference" required maxlength="120" placeholder="INV-2026-001"></label><label>Reviewer contact (not notified)<input name="reviewer" maxlength="120" placeholder="Buyer / reviewer"></label><label>Due date (planning only)<input type="date" name="due"></label>${upload}
 <label class="wide">Review context / supporting instructions<textarea name="notes" rows="4" maxlength="650" placeholder="Explain the requested evidence or checks"></textarea></label></div><div class="wb-inline-actions"><button type="submit" class="wb-primary">${mode==="upload"?"Submit locally":"Save local request"}</button><small>No network call, email or engine execution</small></div></form><div id="submission-result" class="wb-result" hidden role="status" aria-live="polite"></div></div></div>`}
 <div class="wb-notice"><strong>Local experience, not the private DAiA service.</strong> The public website has no upload API or authoritative reviewer workflow. Submitted metadata is stored in this browser only; attachment bytes are not uploaded or retained. You can export or delete your entries.</div></div>`;
}
async function submit(form,mode){
 const d=new FormData(form),supplier=String(d.get("supplier")||"").trim(),reference=String(d.get("reference")||"").trim();
 if(!supplier||!reference)throw Error("Supplier and reference are required.");
 const records=read();if(records.some(x=>x.supplier===supplier&&x.reference===reference))throw Error("This supplier and reference already exist in the local register.");
 const file=d.get("attachment"),entry={id:"LOCAL-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),supplier,reference,reviewer:String(d.get("reviewer")||""),due:String(d.get("due")||""),notes:String(d.get("notes")||""),kind:mode==="upload"?"upload":"document request",document:String(d.get("document")||""),status:"Local draft · not sent",fileName:"",size:0,preflight:"Not evaluated"};
 if(mode==="upload"){
  if(!file||!file.name)throw Error("Choose a file to submit.");
  if(file.size>15*1024*1024)throw Error("Maximum file size for this local preview is 15 MB.");
  if(!/\.(json|csv|xlsx|pdf)$/i.test(file.name))throw Error("Use JSON, CSV, XLSX or PDF.");
  entry.fileName=file.name;entry.size=file.size;
  if(/\.(json|csv)$/i.test(file.name)){
   const content=await file.text();
   if(/\.json$/i.test(file.name)){
    try{const data=JSON.parse(content);entry.preflight=data&&typeof data==="object"&&!Array.isArray(data)?"JSON object structure parsed locally":"JSON parsed; expected an object at the top level";}catch{entry.preflight="JSON syntax invalid; requires correction";}
   }else{entry.preflight=content.trim().split(/\r?\n/).filter(Boolean).length>=2?"CSV has header and at least one row (local text check)":"CSV missing data rows or header";}
  }else{entry.preflight="File name and size recorded only. Workbook or PDF contents not examined.";}
 }
 records.unshift(entry);
 if(!save(records))throw Error("Browser storage unavailable: the entry has not been saved.");
 return entry;
}
function download(id){const item=read().find(x=>x.id===id);if(!item)return false;const blob=new Blob([JSON.stringify(item,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=id+".json";a.click();URL.revokeObjectURL(u);return true;}
function remove(id){return save(read().filter(x=>x.id!==id))}
window.PublicSubmissions={render,read,submit,download,remove};
})();
