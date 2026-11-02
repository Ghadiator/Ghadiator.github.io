(function makeRunner(){
"use strict";
const SAMPLE_CONTRACT={contract_id:"CTR-2026-014",supplier_id:"SUP-014",purchase_order:"PO-2026-082",
 currency:"EUR",valid_from:"2026-01-01",valid_to:"2026-12-31",spending_limit:"25000.00",
 rates:{"maintenance-hour":"100.00","callout-visit":"180.00","parts-consumable":"90.00"},
 required_documents:["service-report","timesheet"],
 // ADR-188: the approved bank account. An invoice that changes it is the
 // classic redirected-payment edit, and C8 is the check that catches it.
 bank_account:"NL91ABNA0417164300",buyer_entity:"NW-DE-01",
 prior_period_total:"19000.00",variance_threshold:"0.20"};
// ADR-188: the reference submission carries what a real supplier invoice
// carries. The previous one had 17 attributes and five arithmetic rules, so
// the preflight demonstrated almost nothing a reviewer would recognise.
const SAMPLE_SUBMISSION={
 case_id:"CASE-LOCAL-001",invoice_id:"INV-LOCAL-001",version:1,
 supplier_id:"SUP-014",contract_id:"CTR-2026-014",purchase_order:"PO-2026-082",
 supplier_name:"Meridian Facilities BV",supplier_tax_id:"NL853201943B01",
 supplier_country:"NL",supplier_iban:"NL91ABNA0417164300",
 buyer_name:"Northwind Operations",buyer_entity:"NW-DE-01",buyer_country:"DE",
 buyer_cost_centre:"CC-4820",
 period_start:"2026-08-01",period_end:"2026-08-31",delivery_date:"2026-08-29",
 invoice_date:"2026-09-01",payment_terms_days:30,due_date:"2026-10-01",
 currency:"EUR",subtotal:"19000.00",discount_total:"0.00",
 tax_rate:"0.19",tax_amount:"3610.00",total:"22610.00",
 base_currency:"EUR",fx_rate:"1.0000",total_in_base:"22610.00",
 delivery_address:"Hafenstrasse 12, 20457 Hamburg",delivery_country:"DE",
 incoterms:"DAP",shipment_ref:"SHP-2026-08-3391",site_id:"SITE-HH-02",
 site_contact:"operations@northwind.example",delivery_note_ref:"DN-2026-08-7741",
 tax_scheme:"VAT",tax_jurisdiction:"DE",reverse_charge:"No",exemption_code:"",
 taxable_base:"19000.00",non_taxable_base:"0.00",
 payment_method:"SEPA credit transfer",bank_name:"ABN AMRO",bank_bic:"ABNANL2A",
 remittance_ref:"RF18 5390 0754 7034",early_payment_discount_pct:"0.02",late_fee_pct:"0.08",
 contract_line_ref:"CTR-2026-014-L3",po_line_ref:"PO-2026-082-010",
 framework_agreement:"FA-2024-NW-07",price_basis:"Rate card",
 rate_card_version:"RC-2026.2",renewal_flag:"No",
 submitted_by:"m.devries@meridian.example",submitted_at:"2026-09-01T09:14:00Z",
 prepared_by:"Meridian billing desk",reviewed_by_supplier:"Yes",
 revision_reason:"",source_system:"Meridian Billing 4.2",
 documents:["service-report","timesheet"],
 service_report_ref:"SR-2026-08-014",approval_ref:"AP-2026-08-221",
 supplier_note:"Synthetic reference submission.",
 lines:[
  {service_code:"maintenance-hour",description:"Scheduled plant maintenance",quantity:"100",unit:"hour",unit_rate:"100.00",discount_pct:"0.00",line_tax_rate:"0.19",amount:"10000.00"},
  {service_code:"callout-visit",description:"Unscheduled callout attendance",quantity:"25",unit:"visit",unit_rate:"180.00",discount_pct:"0.00",line_tax_rate:"0.19",amount:"4500.00"},
  {service_code:"parts-consumable",description:"Consumable parts, itemised",quantity:"50",unit:"item",unit_rate:"90.00",discount_pct:"0.00",line_tax_rate:"0.19",amount:"4500.00"}
 ]
};
const expected=["case_id","invoice_id","version","supplier_id","contract_id","purchase_order",
 "supplier_name","supplier_tax_id","supplier_country","supplier_iban",
 "buyer_name","buyer_entity","buyer_country","buyer_cost_centre",
 "period_start","period_end","delivery_date","invoice_date","payment_terms_days","due_date",
 "currency","subtotal","discount_total","tax_rate","tax_amount","total",
 "base_currency","fx_rate","total_in_base","taxable_base","non_taxable_base",
 "tax_scheme","payment_method","bank_bic","lines"],
 optional=["documents","supplier_note","service_report_ref","approval_ref",
 "delivery_address","delivery_country","incoterms","shipment_ref","site_id","site_contact","delivery_note_ref",
 "tax_jurisdiction","reverse_charge","exemption_code",
 "bank_name","remittance_ref","early_payment_discount_pct","late_fee_pct",
 "contract_line_ref","po_line_ref","framework_agreement","price_basis","rate_card_version","renewal_flag",
 "submitted_by","submitted_at","prepared_by","reviewed_by_supplier","revision_reason","source_system"];
const LINE_KEYS=["service_code","description","quantity","unit","unit_rate","discount_pct","line_tax_rate","amount"];
const id=/^[A-Za-z0-9_.-]{1,80}$/, iso=/^\d{4}-\d{2}-\d{2}$/;
function validDate(v){if(typeof v!=="string"||!iso.test(v))return false;const d=new Date(v+"T00:00:00.000Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v}
function cents(n){if(typeof n!=="string"&&typeof n!=="number")return null;const m=/^(\d+)(?:\.(\d{1,2}))?$/.exec(String(n));return m?BigInt(m[1])*100n+BigInt((m[2]||"").padEnd(2,"0")):null}
function quantity(n){const m=/^(\d+)(?:\.(\d{1,6}))?$/.exec(String(n));return m?BigInt(m[1])*1000000n+BigInt((m[2]||"").padEnd(6,"0")):null}
function ibanValid(value){
 const s=String(value||"").replace(/\s+/g,"").toUpperCase();
 if(!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s))return false;
 const moved=s.slice(4)+s.slice(0,4);
 let rem=0;
 for(const ch of moved){
  const part=/\d/.test(ch)?ch:String(ch.charCodeAt(0)-55);
  for(const digit of part)rem=(rem*10+Number(digit))%97;
 }
 return rem===1;
}
function checkDateWindow(a,b){return validDate(a)&&validDate(b)&&a<=b}
function run(input,{sampleContract=false}={}){
 const validation=[],events=[];let seq=0;
 const log=(stage,kind,label,detail)=>events.push({seq:++seq,stage,kind,label,detail,actor:"browser-local",source:"public-local-runner.js"});
 const check=(group,title,passed,detail)=>{const item={group,title,passed:Boolean(passed),detail};validation.push(item);log(group,"local.check",`${title} — ${passed?"PASS":"FAIL"}`,detail||"");return item.passed};
 const unchecked=(group,title,detail)=>{validation.push({group,title,passed:null,detail});log(group,"local.not_evaluated",`${title} — NOT EVALUATED`,detail);};
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
 for(const key of ["subtotal","discount_total","tax_amount","total","total_in_base"])if(cents(input[key])===null)fail(`Monetary field must have up to two decimals: ${key}`);
 for(const key of ["tax_rate"])if(!/^0?\.\d{1,4}$|^0$/.test(String(input[key]??"")))fail(`Rate must be a decimal fraction: ${key}`);
 for(const key of ["currency","base_currency"])if(!/^[A-Z]{3}$/.test(String(input[key]||"")))fail(`Currency must be ISO 4217 style uppercase: ${key}`);
 for(const key of ["supplier_country","buyer_country"])if(!/^[A-Z]{2}$/.test(String(input[key]||"")))fail(`Country must be an ISO 3166-1 alpha-2 code: ${key}`);
 if(!Number.isInteger(input.payment_terms_days)||input.payment_terms_days<0||input.payment_terms_days>365)fail("Payment terms must be a whole number of days within a year");
 for(const key of ["delivery_date","due_date"])if(!validDate(input[key]))fail(`Invalid ISO calendar date: ${key}`);
 if(!/^\d+\.\d{4}$/.test(String(input.fx_rate??"")))fail("FX rate must carry four decimal places");
 if(Array.isArray(input.lines)){
  for(let i=0;i<input.lines.length;i++){
   const r=input.lines[i];
   if(!r||typeof r!=="object"||Array.isArray(r)){fail(`Line ${i+1} must be a record`);continue}
   if(Object.keys(r).some(k=>!LINE_KEYS.includes(k))||!id.test(String(r.service_code||"")))fail(`Line ${i+1} has unknown or invalid attributes`);
   if(quantity(r.quantity)===null||quantity(r.quantity)<=0n)fail(`Line ${i+1} quantity must be positive`);
   if(cents(r.unit_rate)===null||cents(r.amount)===null)fail(`Line ${i+1} money values must have 2 decimal places`);
  }
 }
 if(!schemaValid){log("intake","local.rejected","Schema preflight failed","No downstream stages evaluated");return {status:"Schema_invalid",validation,events,sampleContract,limitations:["Only browser-side schema approximation; run the Python/Pydantic engine for authoritative validation"]}}
 log("intake","local.accepted","Schema preflight complete","Untrusted supplier notes excluded from computations");
 const lines=input.lines,contract=sampleContract?SAMPLE_CONTRACT:null;
 // ADR-188. The gross line value before its discount, in cents, so R1 and R3
 // agree on one definition rather than each recomputing it.
 const gross=x=>(quantity(x.quantity)*cents(x.unit_rate)+500000n)/1000000n;
 const pctOf=(amount,fraction)=>(amount*BigInt(Math.round(Number(fraction||0)*10000))+5000n)/10000n;
 const addDays=(iso,days)=>{const d=new Date(iso+"T00:00:00.000Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
 const subtotal=lines.reduce((s,x)=>s+cents(x.amount),0n);
 const discount=lines.reduce((s,x)=>s+(gross(x)-cents(x.amount)),0n);
 const deterministic=[
 ["R1: Line amounts equal quantity × rate less line discount",
  lines.every(x=>cents(x.amount)===gross(x)-pctOf(gross(x),x.discount_pct))],
 ["R2: Subtotal equals the sum of line amounts",cents(input.subtotal)===subtotal],
 ["R3: Discount total equals the sum of line discounts",cents(input.discount_total)===discount],
 ["R4: Tax amount equals subtotal × tax rate",
  cents(input.tax_amount)===pctOf(cents(input.subtotal),input.tax_rate)],
 ["R5: Invoice total equals subtotal plus tax",
  cents(input.total)===cents(input.subtotal)+cents(input.tax_amount)],
 ["R6: Service period is ordered",checkDateWindow(input.period_start,input.period_end)],
 ["R7: Invoice date follows the service period",input.invoice_date>=input.period_end],
 ["R8: Delivery falls inside the service period",
  input.delivery_date>=input.period_start&&input.delivery_date<=input.period_end],
 ["R9: Due date equals invoice date plus payment terms",
  input.due_date===addDays(input.invoice_date,input.payment_terms_days)],
 ["R10: Service codes are unique",new Set(lines.map(x=>x.service_code)).size===lines.length],
 ["R11: Supplier IBAN passes the mod-97 checksum",ibanValid(input.supplier_iban)],
 ["R12: Base-currency total equals total × FX rate",
  cents(input.total_in_base)===(cents(input.total)*BigInt(Math.round(Number(input.fx_rate||0)*10000))+5000n)/10000n],
 ["R13: A same-currency invoice carries an FX rate of one",
  input.currency!==input.base_currency||Number(input.fx_rate)===1],
 ["R14: Line tax rates agree with the invoice tax rate",
  lines.every(x=>Number(x.line_tax_rate)===Number(input.tax_rate))],
 ["R16: Taxable and non-taxable bases sum to the subtotal",
  cents(input.taxable_base)+cents(input.non_taxable_base)===cents(input.subtotal)],
 ["R17: Tax is charged on the taxable base only",
  cents(input.tax_amount)===pctOf(cents(input.taxable_base),input.tax_rate)],
 ["R18: A reverse-charge invoice carries no tax",
  String(input.reverse_charge||"No").toLowerCase()!=="yes"||cents(input.tax_amount)===0n],
 ["R19: Bank BIC is well formed",/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(String(input.bank_bic||""))],
 ["R20: The IBAN's country agrees with the BIC's",
  String(input.supplier_iban||"").slice(0,2).toUpperCase()===String(input.bank_bic||"").slice(4,6).toUpperCase()],
 ["R21: Incoterms is a recognised three-letter term",
  ["EXW","FCA","FAS","FOB","CFR","CIF","CPT","CIP","DAP","DPU","DDP"].includes(String(input.incoterms||"").toUpperCase())],
 ["R22: Discount and late-fee rates are within sane bounds",
  Number(input.early_payment_discount_pct||0)<=0.1&&Number(input.late_fee_pct||0)<=0.2],
 ["R23: Submission timestamp is not before the invoice date",
  String(input.submitted_at||"").slice(0,10)>=String(input.invoice_date||"")],
 ];
 deterministic.forEach(([label,ok])=>check("rules",label,ok));
 if(contract)check("rules","R15: Required service reports are attached",contract.required_documents.every(d=>(input.documents||[]).includes(d)));
 else unchecked("rules","R15: Required service reports are attached","No approved contract document requirements available");
 if(contract){
  const matches=[
   ["C1: Supplier matches contract",input.supplier_id===contract.supplier_id],
   ["C2: Contract ID matches",input.contract_id===contract.contract_id],
   ["C3: Purchase order matches",input.purchase_order===contract.purchase_order],
   ["C4: Contract currency matches",input.currency===contract.currency],
   ["C5: Service period within contract",input.period_start>=contract.valid_from&&input.period_end<=contract.valid_to],
   ["C6: Rates match approved rate card",lines.every(r=>contract.rates[r.service_code]!==undefined&&cents(r.unit_rate)===cents(contract.rates[r.service_code]))],
   ["C7: Total within spending limit",cents(input.total)<=cents(contract.spending_limit)],
   ["C9: Payment account matches the approved bank account",
    String(input.supplier_iban||"").replace(/\s+/g,"").toUpperCase()===String(contract.bank_account||"").toUpperCase()],
   ["C10: Buyer entity matches the contract",input.buyer_entity===contract.buyer_entity]
  ];
  matches.forEach(([label,ok])=>check("contract",label,ok));
  unchecked("contract","C8: Invoice not previously approved","No authoritative approved-invoice register available in this browser");
  const prior=cents(contract.prior_period_total),cur=cents(input.total),pct=prior>0n?Number((cur-prior)*10000n/prior)/100:0;
  if(pct>20)log("advisory","local.variance","Service-volume exception candidate",`${pct.toFixed(1)}% compared with synthetic prior period; no AI persona called`);
 }else{log("contract","local.not_evaluated","No trusted contract snapshot connected","Contract/rates/limit/duplicate checks cannot be completed");}
 const failures=validation.filter(x=>x.passed===false),unverified=validation.filter(x=>x.passed===null);
 log("review","local.awaiting_engine","Browser preflight completed; backend and human review still required",`${failures.length} failed local check(s), ${unverified.length} explicitly unverified`);
 return {status:failures.length?"Local_checks_failed":"Local_checks_partial",validation,events,sampleContract,limitations:["Not an execution of the Python reference workflow","No live proposal personas, case state changes or reviewer authorization","Sample contract is synthetic and only used when expressly selected"]};
}
window.PublicLocalRunner={run,template:()=>JSON.parse(JSON.stringify(SAMPLE_SUBMISSION)),sampleContract:()=>JSON.parse(JSON.stringify(SAMPLE_CONTRACT))};
})();

