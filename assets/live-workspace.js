/* Persistent supplier workspace. All evidence is returned by the authenticated service. */
(() => {
  'use strict';
  const root=document.querySelector('#workspace'), notice=document.querySelector('#notice');
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let session=null, contracts=[], cases=[], selected=null, events=[], busy=false;
  function message(text,error=false){notice.textContent=text;notice.classList.toggle('error',error);}
  async function api(path,{method='GET',body}={}){
    const headers={};
    if(session)headers['X-CSRF-Token']=session.csrf_token;
    if(body && !(body instanceof FormData)){headers['Content-Type']='application/json';body=JSON.stringify(body);}
    const r=await fetch('/api/v1/'+path,{method,headers,body,credentials:'same-origin',signal:AbortSignal.timeout(45000)});
    if(r.status===204)return null;
    const data=await r.json().catch(()=>({detail:'The supplier service returned an unreadable response'}));
    if(!r.ok){if(r.status===401){session=null;render();}throw new Error(typeof data.detail==='string'?data.detail:'Check the invoice format and required fields.');}
    return data;
  }
  async function refresh(){
    const [a,b]=await Promise.all([api('contracts'),api('cases')]);contracts=a.contracts;cases=b.cases;
    if(selected){selected=await api('cases/'+encodeURIComponent(selected.case_id));events=(await api('cases/'+encodeURIComponent(selected.case_id)+'/events')).events;}
    render();
  }
  function render(){
    document.querySelector('#logout').hidden=!session;
    if(!session){root.innerHTML=`<section class="panel login"><h2>Sign in to your workspace</h2><p class="meta">Use an operator-provisioned reviewer account. Cases are visible to their owner.</p><form data-action="login"><label for="username">Reviewer ID</label><input id="username" name="username" autocomplete="username" required maxlength="80"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="200"><button type="submit">Sign in securely</button></form></section>`;return;}
    root.innerHTML=`<div class="grid"><aside><section class="panel"><h2>Request an invoice</h2><p class="meta">Signed in as ${escape(session.username)}</p><form data-action="create"><label for="contract">Approved contract</label><select id="contract" name="contract_id">${contracts.map(c=>`<option value="${escape(c.contract_id)}">${escape(c.supplier_id)} · ${escape(c.contract_id)}</option>`).join('')}</select><label for="due">Due date</label><input id="due" name="due_date" type="date" required><button type="submit">Create request</button></form></section><section class="panel"><h2>Your cases</h2><button type="button" data-action="refresh">Refresh cases</button><p class="meta">Latest 100 cases</p>${cases.map(c=>`<button type="button" class="case ${selected?.case_id===c.case_id?'active':''}" data-case="${escape(c.case_id)}"><strong>${escape(c.supplier_id)} · ${escape(c.status.replaceAll('_',' '))}</strong><small>${escape(c.case_id)}</small></button>`).join('')||'<p class="meta">Create a request to begin.</p>'}</section></aside><section class="panel">${detail()}</section></div>`;
  }
  function detail(){
    if(!selected)return '<h2>A clear path to a decision</h2><p>Select a case to inspect its invoice, checks, findings, and ordered event history.</p><p class="meta">Start with an approved contract. Submit structured JSON or XLSX, review the evidence, and record your decision.</p>';
    const c=selected, canUpload=['Requested','Awaiting_supplier'].includes(c.status);
    return `<p class="eyebrow">PERSISTENT CASE · REVISION ${c.revision}</p><h2>${escape(c.supplier_id)} / ${escape(c.status.replaceAll('_',' '))}</h2><p class="meta">${escape(c.case_id)}<br>Contract ${escape(c.contract_id)}</p><div class="facts"><div class="fact"><span class="meta">Hard failures</span><strong>${c.failed_rules.length}</strong></div><div class="fact"><span class="meta">Verified findings</span><strong>${c.verified_findings.length}</strong></div><div class="fact"><span class="meta">Proposal mode</span><strong>${escape(c.model_execution)}</strong></div></div><p class="meta">${c.model_execution==='live'?'Model assistance is limited to exception proposals; supporting and summary roles are scripted.':'Scripted review roles. No external model calls.'} Human approval is required.</p>${canUpload?`<h3>Submit invoice ${c.submission?'correction':''}</h3><p class="meta">Use this case ID and approved contract. JSON or Invoice / LineItems XLSX, up to 15 MB. Supporting document IDs are declarations; this version does not validate their contents.</p><button type="button" data-action="template">Download JSON starting template</button><form data-action="upload"><label for="invoice">Supplier invoice</label><input id="invoice" name="file" type="file" accept=".json,.xlsx" required><button type="submit">Upload and validate</button></form>`:''}${c.submission?`<details open><summary>Invoice and validation evidence</summary><pre>${escape(JSON.stringify({invoice:c.submission,failed_rules:c.failed_rules,verified_findings:c.verified_findings},null,2))}</pre><a class="button" href="/api/v1/cases/${encodeURIComponent(c.case_id)}/documents/${c.submission.version}">Download submitted invoice</a></details>`:''}${c.hitl_pending?`<h3>Your decision</h3><form data-action="review"><label for="decision">Disposition</label><select id="decision" name="action"><option value="request_changes">Request correction</option><option value="reject">Reject invoice</option><option value="approve" ${c.failed_rules.length?'disabled':''}>Approve invoice</option></select><label for="rationale">Evidence-based rationale</label><textarea id="rationale" name="rationale" minlength="8" maxlength="1000" required></textarea><button type="submit">Record decision</button></form>`:''}<details><summary>Ordered event history · ${events.length} events</summary><ol>${events.map(e=>`<li><strong>${escape(e.label)}</strong><small>${escape(e.recorded_at)} · ${escape(e.kind)}</small>${escape(e.detail)}</li>`).join('')}</ol></details><details><summary>Model usage</summary><pre>${escape(JSON.stringify(c.model_usage,null,2))}</pre></details>`;
  }
  async function run(fn){if(busy)return;busy=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){message(e.message,true);}finally{busy=false;root.querySelectorAll('button').forEach(b=>b.disabled=false);}}
  root.addEventListener('submit',event=>{const form=event.target.closest('form[data-action]');if(!form)return;event.preventDefault();const data=new FormData(form);run(async()=>{
    switch(form.dataset.action){
      case 'login':session=await api('session',{method:'POST',body:Object.fromEntries(data)});await refresh();message('Signed in. Your cases are stored by the supplier service.');break;
      case 'create':selected=await api('requests',{method:'POST',body:Object.fromEntries(data)});await refresh();message('Request created. Prepare the invoice with the assigned case ID.');break;
      case 'upload':if(data.get('file').size>15000000)throw new Error('Maximum invoice size is 15 MB.');data.set('revision',selected.revision);selected=await api('cases/'+selected.case_id+'/submissions',{method:'POST',body:data});await refresh();message('Invoice validated. Inspect the evidence before deciding.');break;
      case 'review':selected=await api('cases/'+selected.case_id+'/review',{method:'POST',body:{...Object.fromEntries(data),revision:selected.revision}});await refresh();message('Decision recorded with its rationale.');break;
    }
  });});
  root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.type==='submit')return;run(async()=>{
    if(button.dataset.case){selected=await api('cases/'+encodeURIComponent(button.dataset.case));await refresh();message('Case evidence loaded.');}
    if(button.dataset.action==='refresh'){await refresh();message('Cases refreshed.');}
    if(button.dataset.action==='template'){
      const c=contracts.find(x=>x.contract_id===selected.contract_id), previous=selected.submission;
      const invoice=previous?{...previous,version:previous.version+1}:{case_id:selected.case_id,invoice_id:'REPLACE-INVOICE-ID',version:1,supplier_id:c.supplier_id,contract_id:c.contract_id,purchase_order:c.purchase_order,currency:c.currency,period_start:c.valid_from,period_end:c.valid_from,invoice_date:c.valid_from,lines:[],total:'0',documents:[],supplier_note:''};
      const url=URL.createObjectURL(new Blob([JSON.stringify(invoice,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='invoice-template.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Starting template downloaded. Fill actual dates, service lines, amounts, and document IDs before uploading.');
    }
  });});
  document.querySelector('#logout').addEventListener('click',()=>run(async()=>{await api('session',{method:'DELETE'});session=null;selected=null;cases=[];events=[];render();message('Signed out.');}));
  (async()=>{try{const cap=await api('capabilities');if(cap.mode!=='live')throw new Error('Live workspace is not enabled on this host. Open the local or Oracle service URL provided by your operator.');try{session=await api('session');}catch(e){if(!e.message.includes('Sign in'))throw e;}if(session)await refresh();else render();message('Connected to the persistent supplier service.');}catch(e){root.innerHTML='<section class="panel"><h2>Service connection required</h2><p>This page runs on the same host as the supplier API.</p><a href="./">Return to the reference workspace</a></section>';message(e.message,true);}})();
})();
