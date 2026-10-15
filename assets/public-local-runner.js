(function makeRunner(){
"use strict";
const SAMPLE_CONTRACT={contract_id:"CTR-2026-014",supplier_id:"SUP-014",purchase_order:"PO-2026-082",currency:"EUR",valid_from:"2026-01-01",valid_to:"2026-12-31",spending_limit:"15000.00",rates:{"maintenance-hour":"100.00"},required_documents:["service-report"],prior_period_total:"10000.00",variance_threshold:"0.20"};
const SAMPLE_SUBMISSION={case_id:"CASE-LOCAL-001",invoice_id:"INV-LOCAL-001",version:1,supplier_id:"SUP-014",contract_id:"CTR-2026-014",purchase_order:"PO-2026-082",currency:"EUR",period_start:"2026-08-01",period_end:"2026-08-31",invoice_date:"2026-09-01",lines:[{service_code:"maintenance-hour",quantity:"100",unit_rate:"100.00",amount:"10000.00"}],total:"10000.00",documents:["service-report"],supplier_note:"Synthetic reference submission."};
const expected=["case_id","invoice_id","version","supplier_id","contract_id","purchase_order","currency","period_start","period_end","invoice_date","lines","total"], optional=["documents","supplier_note"];
const id=/^[A-Za-z0-9_.-]{1,80}$/, iso=/^\d{4}-\d{2}-\d{2}$/;
function validDate(v){if(typeof v!=="string"||!iso.test(v))return false;const d=new Date(v+"T00:00:00.000Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v}
function cents(n){if(typeof n!=="string"&&typeof n!=="number")return null;const m=/^(\d+)(?:\.(\d{1,2}))?$/.exec(String(n));return m?BigInt(m[1])*100n+BigInt((m[2]||"").padEnd(2,"0")):null}
function quantity(n){const m=/^(\d+)(?:\.(\d{1,6}))?$/.exec(String(n));return m?BigInt(m[1])*1000000n+BigInt((m[2]||"").padEnd(6,"0")):null}
function checkDateWindow(a,b){return validDate(a)&&validDate(b)&&a<=b}
function run(input,{sampleContract=false}={}){
 const validation=[],events=[];let seq=0;
 const log=(stage,kind,label,detail)=>events.push({seq:++seq,stage,kind,label,detail,actor:"browser-local",source:"public-local-runner.js"});
 const check=(group,title,passed,detail)=>{const item={group,title,passed:Boolean(passed),detail};validation.push(item);log(group,"local.check",`${title} — ${passed?"PASS":"FAIL"}`,detail||"");return item.passed};
 log("intake","local.received","Untrusted file entered browser preflight","No network submission; no private engine execution");
 if(!input||typeof input!=="object"||Array.isArray(input)){
  log("intake","local.rejected","Submission must be a JSON object","");
  return {status:"Schema_invalid",validation:[{group:"intake",title:"JSON object required",passed:false}],events,limitations:["Client-side checks only; no backend validation"],sampleContract};
 }
 let schemaValid=true;
 function fail(label){schemaValid=false;check("intake",label,false,"Contract schema requires a correction")}
 const keys=Object.keys(input);
 if(keys.some(k=>!expected.includes(k)&&!optional.includes(k)))fail("Unknown fields are forbidden");
 for(const key of expected)if(!(key in input))fail(`Missing required field: ${key}`);
 for(const key of ["case_id","invoice_id","supplier_id","contract_id","purchase_order"])if(!id.test(String(input[key]??"")))fail(`Invalid identifier: ${key}`);
 if(!Number.isInteger(input.version)||input.version<1)fail("Version must be a positive integer");
 if(!/^[A-Z]{3}$/.test(String(input.currency||"")))fail("Currency must be ISO 4217 style uppercase");
 for(const key of ["period_start","period_end","invoice_date"])if(!validDate(input[key]))fail(`Invalid ISO calendar date: ${key}`);
 if(cents(input.total)===null)fail("Invoice total must be nonnegative with up to two decimal places");
 if(!Array.isArray(input.lines)||input.lines.length===0)fail("At least one service line required");
 if(input.documents!==undefined&&(!Array.isArray(input.documents)||!input.documents.every(x=>id.test(String(x)))))fail("Document references must be identifiers");
 if(input.supplier_note!==undefined&&(typeof input.supplier_note!=="string"||input.supplier_note.length>4000))fail("Supplier note exceeds schema limit");
 if(Array.isArray(input.lines)){
  for(let i=0;i<input.lines.length;i++){
   const r=input.lines[i];
   if(!r||typeof r!=="object"||Array.isArray(r)){fail(`Line ${i+1} must be a record`);continue}
   if(Object.keys(r).some(k=>!["service_code","quantity","unit_rate","amount"].includes(k))||!id.test(String(r.service_code||"")))fail(`Line ${i+1} has unknown or invalid attributes`);
   if(quantity(r.quantity)===null||quantity(r.quantity)<=0n)fail(`Line ${i+1} quantity must be positive`);
   if(cents(r.unit_rate)===null||cents(r.amount)===null)fail(`Line ${i+1} money values must have 2 decimal places`);
  }
 }
 if(!schemaValid){log("intake","local.rejected","Schema preflight failed","No downstream stages evaluated");return {status:"Schema_invalid",validation,events,sampleContract,limitations:["Only browser-side schema approximation; run the Python/Pydantic engine for authoritative validation"]}}
 log("intake","local.accepted","Schema preflight complete","Untrusted supplier notes excluded from computations");
 const lines=input.lines,contract=sampleContract?SAMPLE_CONTRACT:null;
 const deterministic=[
 ["R1: Line amounts equal quantity × rate",lines.every(x=>cents(x.amount)===(quantity(x.quantity)*cents(x.unit_rate)+500000n)/1000000n)],
 ["R2: Invoice total equals line sum",cents(input.total)===lines.reduce((s,x)=>s+cents(x.amount),0n)],
 ["R3: Service period is ordered",checkDateWindow(input.period_start,input.period_end)],
 ["R4: Invoice date follows service period",input.invoice_date>=input.period_end],
 ["R5: Service codes are unique",new Set(lines.map(x=>x.service_code)).size===lines.length],
 ["R6: Required service reports are attached",contract?contract.required_documents.every(d=>(input.documents||[]).includes(d)):true]
 ];
 deterministic.forEach(([label,ok],i)=>check("rules",label,ok,i===5&&!contract?"No contract supplied; document completeness is NOT verified":undefined));
 if(contract){
  const matches=[
   ["C1: Supplier matches contract",input.supplier_id===contract.supplier_id],
   ["C2: Contract ID matches",input.contract_id===contract.contract_id],
   ["C3: Purchase order matches",input.purchase_order===contract.purchase_order],
   ["C4: Contract currency matches",input.currency===contract.currency],
   ["C5: Service period within contract",input.period_start>=contract.valid_from&&input.period_end<=contract.valid_to],
   ["C6: Rates match approved rate card",lines.every(r=>contract.rates[r.service_code]!==undefined&&cents(r.unit_rate)===cents(contract.rates[r.service_code]))],
   ["C7: Total within spending limit",cents(input.total)<=cents(contract.spending_limit)],
   ["C8: Invoice not previously approved",true]
  ];
  matches.forEach(([label,ok],i)=>check("contract",label,ok,i===7?"Demo has no authoritative approved-invoice register; duplicate status unverified":undefined));
  const prior=cents(contract.prior_period_total),cur=cents(input.total),pct=prior>0n?Number((cur-prior)*10000n/prior)/100:0;
  if(pct>20)log("advisory","local.variance","Service-volume exception candidate",`${pct.toFixed(1)}% compared with synthetic prior period; no AI persona called`);
 }else{log("contract","local.not_evaluated","No trusted contract snapshot connected","Contract/rates/limit/duplicate checks cannot be completed");}
 const failures=validation.filter(x=>!x.passed),unverified=validation.filter(x=>x.detail&&/not verified|NOT verified/.test(x.detail));
 log("review","local.awaiting_engine","Browser preflight completed; backend and human review still required",`${failures.length} failed local check(s), ${unverified.length} explicitly unverified`);
 return {status:failures.length?"Local_checks_failed":contract?"Local_checks_passed":"Local_checks_partial",validation,events,sampleContract,limitations:["Not an execution of the Python reference workflow","No live proposal personas, case state changes or reviewer authorization","Sample contract is synthetic and only used when expressly selected"]};
}
window.PublicLocalRunner={run,template:()=>JSON.parse(JSON.stringify(SAMPLE_SUBMISSION)),sampleContract:()=>JSON.parse(JSON.stringify(SAMPLE_CONTRACT))};
})();
