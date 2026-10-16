(function setup(){
"use strict";
const KEY="supplier-demo-submissions-v1",esc=(c,v)=>c.h(v??"");
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v.filter(x=>x?.id).slice(0,100):[]}catch{return []}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a.slice(0,100)));return true}catch{return false}}
function mode(){return window.PublicBackend?.state()||{mode:"reference",status:"unconfigured"}}
function history(c,rows){
 if(!rows.length)return '<div class="wb-empty"><strong>No submissions</strong><p>Create a request or upload a document in the other tab.</p></div>';
 return rows.map(x=>{
  const checks=x.clientCheck?.validation||[];
  return `<article class="wb-local-row wb-receipt-card"><div><strong>${esc(c,x.supplier)} · ${esc(c,x.reference)}</strong><small>${esc(c,x.kind)} · ${esc(c,x.fileName||x.document||"No file")} · ${esc(c,x.status)}</small><small>Receipt ${esc(c,x.id)}${x.remoteId?" · Backend ID "+esc(c,x.remoteId):""}</small><p class="wb-file-hint">${esc(c,x.preflight||"Awaiting checks")}</p>${checks.length?`<details class="wb-preflight-details"><summary>See ${checks.length} client-side checks (${checks.filter(a=>a.passed===false).length} failed, ${checks.filter(a=>a.passed===null).length} not evaluated)</summary><div class="wb-check-grid">${checks.map(a=>`<div class="wb-check ${a.passed===null?"unchecked":a.passed?"passed":"failed"}"><span>${a.passed===null?"–":a.passed?"✓":"×"}</span><span>${esc(c,a.title)}${a.detail?`<small>${esc(c,a.detail)}</small>`:""}</span></div>`).join("")}</div><small>These browser checks are not a Python validation run.</small></details>`:""}</div><div class="wb-inline-actions"><button type="button" data-submission-action="export:${esc(c,x.id)}">Export</button><button type="button" data-submission-action="delete:${esc(c,x.id)}">Delete copy</button></div></article>`;
 }).join("");
}
function render(c){
 const rows=read(),sm=c.state.submissionMode||"request",tab=c.state.submissionTab||"compose",api=mode();
 const desc=api.mode==="backend"?(api.status==="online"?"Backend connected: submissions require the authenticated API's capability and validation authority.":"Backend configured but unavailable. New submissions are blocked rather than silently stored as if sent."):"Reference mode: requests and file metadata remain in your own browser. JSON invoice files can undergo a deterministic local schema/rule check. No server-side submission or review occurs.";
 const formFile=sm==="upload"?`<label class="wide">Upload workbook or invoice<input name="attachment" type="file" accept=".json,.csv,.pdf,.xlsx" required></label>
 <label class="wide wb-checkbox-row"><input name="demoContract" type="checkbox"> Compare against the expressly synthetic SUP-014 / EUR example contract (additional rate, document and spending-limit checks)</label>
 <div class="wb-inline-actions"><button type="button" data-submission-action="template">Download synthetic JSON template</button></div>
 <p class="wb-file-hint">XLSX workbooks matching the generated Invoice / LineItems template are parsed and checked locally. JSON invoices also support local checks; CSV/PDF remain structure/metadata only. No spreadsheet is sent to a server in reference mode.</p>`:
 `<label class="wide">Document requested<select name="document"><option>Invoice and service report</option><option>Corrected invoice</option><option>Contract / rate card</option><option>Supplier clarification</option></select></label>`;
 return `<div class="wb-page"><div class="wb-head"><div><span class="wb-kicker">OPERATIONS · DOCUMENT COLLECTION</span><h1>Supplier submissions</h1><p>Create supplier document requests and submit new documents. Source-faithful validation controls are represented separately from local preview checks.</p></div><a data-view="integration" href="?view=integration" class="wb-button">Backend readiness ↗</a></div>
 <div class="wb-metrics"><div class="wb-metric"><span class="wb-metric-label">Browser receipts</span><strong>${rows.length}</strong><small>Stored on this device</small></div><div class="wb-metric"><span class="wb-metric-label">JSON preflight reports</span><strong>${rows.filter(x=>x.clientCheck).length}</strong><small>Browser checks only</small></div><div class="wb-metric"><span class="wb-metric-label">Backend-acknowledged submissions</span><strong>${rows.filter(x=>x.remoteId).length}</strong><small>Returned by live API</small></div><div class="wb-metric"><span class="wb-metric-label">Connection mode</span><strong style="font-size:15px">${api.mode==="backend"?esc(c,api.status):"Reference"}</strong><small>Never assume server processing</small></div></div>
 <div class="wb-notice"><strong>${api.mode==="backend"?"Backend connection":"Local reference"}:</strong> ${esc(c,desc)} Use synthetic data only; do not upload private supplier records to this public demonstration.</div>
 <section class="wb-panel wb-generator" aria-labelledby="wb-generator-title">
  <div class="wb-panel-head"><h2 id="wb-generator-title">Generate a synthetic Excel case</h2><span class="wb-generator-tag">EDITABLE .XLSX · NO SERVER</span></div>
  <div class="wb-panel-body"><p>Create an example supplier invoice workbook, edit values in Excel if desired, then upload it here to inspect deterministic browser checks. Based on the public supplier fixture schema; this is not the insurer VC generator from DAiA or a Python workflow run.</p>
   <div class="wb-generator-controls"><label for="supplierCaseType">Choose a scenario
    <select id="supplierCaseType">${window.PublicSupplierWorkbook.variants.map(v=>`<option value="${esc(c,v.id)}">${esc(c,v.label)}</option>`).join("")}</select>
   </label><button type="button" class="wb-primary" data-submission-action="generate">Download Excel case ↓</button></div>
   <div class="wb-generator-steps"><span><strong>01</strong> Generate workbook</span><span aria-hidden="true">→</span><span><strong>02</strong> Upload under File submission</span><span aria-hidden="true">→</span><span><strong>03</strong> Inspect local checks</span></div>
   <p class="wb-file-hint">The example contract is optional. Select it on upload to exercise contract, rate and document checks. Final decisions remain human-led and require a real backend.</p>
  </div>
 </section>
 <div class="wb-tabs"><button class="wb-tab ${tab==="compose"?"selected":""}" data-submission-tab="compose">New request / upload</button><button class="wb-tab ${tab==="history"?"selected":""}" data-submission-tab="history">Submission register</button></div>
 ${tab==="history"?`<section class="wb-panel"><div class="wb-panel-head"><h2>Receipts & verification</h2></div><div class="wb-panel-body wb-local-rows">${history(c,rows)}</div></section>`:
 `<section class="wb-panel"><div class="wb-panel-head"><h2>Create a request or upload</h2></div><div class="wb-panel-body wb-submit-section"><div class="wb-submission-modes"><button type="button" class="wb-tab ${sm==="request"?"selected":""}" data-submission-mode="request">01 · Document request</button><button type="button" class="wb-tab ${sm==="upload"?"selected":""}" data-submission-mode="upload">02 · File submission</button></div>
 <form id="public-submission-form" class="wb-submit-section"><div class="wb-submit-grid"><label>Supplier ID ${sm==="upload"?"(read from workbook if blank)":""}<input name="supplier" maxlength="120" ${sm==="upload"?"":"required"} placeholder="SUP-014"></label><label>Invoice / reference ID ${sm==="upload"?"(read from workbook if blank)":""}<input name="reference" maxlength="120" ${sm==="upload"?"":"required"} placeholder="INV-2026-082"></label><label>Reviewer contact<input name="reviewer" maxlength="120" placeholder="Procurement reviewer"></label><label>Due date<input name="due" type="date"></label>${formFile}<label class="wide">Review context<textarea name="notes" rows="4" maxlength="600" placeholder="Context only, not trusted instructions"></textarea></label></div><div class="wb-inline-actions"><button type="submit" class="wb-primary">${api.mode==="backend"?"Send to configured backend":sm==="upload"?"Perform local preflight and save":"Save request in browser"}</button><small>${api.mode==="backend"?"Requires server capability and authentication":"No email or network processing"}</small></div></form><div id="submission-result" class="wb-result" hidden role="status"></div></div></section>`}
 <div class="wb-notice"><strong>Decision boundary:</strong> Neither a passing browser check nor a remote intake receipt constitutes approval. Full generic validation, case evidence, independent review and archive must be delivered by the backend.</div></div>`;
}
async function submit(form,kind){
 const d=new FormData(form);let supplier=String(d.get("supplier")||"").trim(),reference=String(d.get("reference")||"").trim();const api=mode();
 const file=d.get("attachment"),existing=read();
 let parsed=null;
 if(kind==="upload"&&api.mode!=="backend"&&file&&/\.xlsx$/i.test(file.name)){
   parsed=await window.PublicSupplierWorkbook.read(file);
   if(supplier&&supplier!==parsed.supplier_id)throw Error("Supplier ID differs from the Excel file. Correct the form or leave it blank.");
   if(reference&&reference!==parsed.invoice_id)throw Error("Invoice reference differs from the Excel file. Correct the form or leave it blank.");
   supplier=supplier||parsed.supplier_id;reference=reference||parsed.invoice_id;
 }
 if(!supplier||!reference)throw Error("Supplier and invoice identifiers are mandatory (or supply them in a supported Excel workbook)");
 const entry={id:"LOCAL-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),supplier,reference,kind:kind==="upload"?"upload":"request",status:"Local draft",reviewer:String(d.get("reviewer")||""),due:String(d.get("due")||""),document:String(d.get("document")||""),fileName:file?.name||"",size:kind==="upload"?file.size:0,createdAt:new Date().toISOString(),preflight:"Not run"};
 if(kind==="upload"){
  if(!file||!file.name)throw Error("Select a document");
  if(file.size>15000000)throw Error("Maximum file size is 15 MB");
  if(!/\.(json|csv|pdf|xlsx)$/i.test(file.name))throw Error("Only JSON, CSV, XLSX or PDF accepted");
 }
 if(api.mode==="backend"){
  if(api.status!=="online")throw Error(api.message||"Configured backend is offline: no submission sent");
  if(kind==="request"){
   const r=await window.PublicBackend.createRequest({supplier_id:supplier,reference,document_type:entry.document,reviewer_contact:entry.reviewer,due_date:entry.due,review_note:String(d.get("notes")||"")});
   entry.remoteId=r.request_id;entry.status=String(r.status||"Request accepted");
  }else{
   const r=await window.PublicBackend.submit({fields:{supplier_id:supplier,invoice_id:reference,reviewer_contact:entry.reviewer,due_date:entry.due,review_note:String(d.get("notes")||"")},file});
   entry.remoteId=r.submission_id;entry.status=String(r.status||"Received by backend");
  }
  entry.preflight="Remote receipt only; validation state is authoritative on backend";
 }else{
  if(existing.some(x=>x.supplier===supplier&&x.reference===reference))throw Error("Duplicate browser receipt: inspect the existing entry first");
  if(kind==="upload"&&/\.json$/i.test(file.name)){
   let record;try{record=JSON.parse(await file.text())}catch{throw Error("JSON syntax invalid. No receipt created");}
   entry.clientCheck=window.PublicLocalRunner.run(record,{sampleContract:d.has("demoContract")});
   entry.preflight=entry.clientCheck.status+" · local deterministic preflight only";
   entry.status=entry.clientCheck.status;
  }else if(kind==="upload"&&/\.xlsx$/i.test(file.name)){
   entry.clientCheck=window.PublicLocalRunner.run(parsed,{sampleContract:d.has("demoContract")});
   entry.preflight=entry.clientCheck.status+" · parsed Invoice / LineItems XLSX, local deterministic preflight only";
   entry.status=entry.clientCheck.status;
  }else if(kind==="upload"&&/\.csv$/i.test(file.name)){
   const rows=(await file.text()).trim().split(/\r?\n/).filter(Boolean);entry.preflight=rows.length>=2?`CSV rows: ${rows.length-1} (header detected; invoice schema not evaluated)`:"CSV requires a header and a data row";entry.status="Structure-only preview";
  }else if(kind==="upload"){entry.preflight="Binary content not parsed locally; file name and size recorded";entry.status="Metadata-only local receipt";}
  else entry.status="Request draft · not emailed";
 }
 existing.unshift(entry);
 if(!save(existing))throw Error("The action completed but the browser receipt could not be persisted. Retain the returned server identifier if applicable.");
 return entry;
}
function download(id){
 const e=read().find(x=>x.id===id);if(!e)return false;
 const blob=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=e.id+".json";a.click();URL.revokeObjectURL(u);return true;
}
function template(){
 const b=new Blob([JSON.stringify(window.PublicLocalRunner.template(),null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="synthetic-supplier-invoice.json";a.click();URL.revokeObjectURL(u);
}
const remove=id=>save(read().filter(x=>x.id!==id));
window.PublicSubmissions={render,submit,read,download,remove,template};
})();
