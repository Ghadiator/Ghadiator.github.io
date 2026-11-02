/* Offline XLSX interchange for synthetic supplier submissions.
 * Template and parser are intentionally narrow: Invoice + LineItems with
 * fixed headers. Never execute formulas, macros, or untrusted workbook code.
 * All validation continues through PublicLocalRunner (browser preflight only).
 */
(function installSupplierWorkbook(){
"use strict";
const MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const enc=new TextEncoder(), dec=new TextDecoder();
// ADR-188. Each entry is [key, kind]; GROUPS carry the sheet's section bands.
// `kind` drives BOTH the cell format and the reader's coercion, so a field
// cannot be formatted as money here and parsed as text there.
const GROUPS=[
 ["Identification",[["case_id","text"],["invoice_id","text"],["version","int"],["supplier_id","text"],["contract_id","text"],["purchase_order","text"]]],
 ["Parties",[["supplier_name","text"],["supplier_tax_id","text"],["supplier_country","text"],["supplier_iban","text"],["buyer_name","text"],["buyer_entity","text"],["buyer_country","text"],["buyer_cost_centre","text"]]],
 ["Dates and terms",[["period_start","text"],["period_end","text"],["delivery_date","text"],["invoice_date","text"],["payment_terms_days","int"],["due_date","text"]]],
 ["Amounts",[["currency","text"],["subtotal","money"],["discount_total","money"],["tax_rate","pct"],["tax_amount","money"],["total","money"],["base_currency","text"],["fx_rate","rate"],["total_in_base","money"]]],
 ["Delivery and logistics",[["delivery_address","text"],["delivery_country","text"],["incoterms","text"],["shipment_ref","text"],["site_id","text"],["site_contact","text"],["delivery_note_ref","text"]]],
 ["Tax detail",[["tax_scheme","text"],["tax_jurisdiction","text"],["reverse_charge","text"],["exemption_code","text"],["taxable_base","money"],["non_taxable_base","money"]]],
 ["Payment",[["payment_method","text"],["bank_name","text"],["bank_bic","text"],["remittance_ref","text"],["early_payment_discount_pct","pct"],["late_fee_pct","pct"]]],
 ["Commercial terms",[["contract_line_ref","text"],["po_line_ref","text"],["framework_agreement","text"],["price_basis","text"],["rate_card_version","text"],["renewal_flag","text"]]],
 ["Controls and audit",[["submitted_by","text"],["submitted_at","text"],["prepared_by","text"],["reviewed_by_supplier","text"],["revision_reason","text"],["source_system","text"]]],
 ["Evidence",[["documents","text"],["service_report_ref","text"],["approval_ref","text"],["supplier_note","text"]]]
];
const FIELD_KIND=new Map(GROUPS.flatMap(([,fs])=>fs));
const fields=[...FIELD_KIND.keys()];
// LineItems columns, same contract: name + kind.
const LINE_COLUMNS=[["service_code","text"],["description","text"],["quantity","int"],["unit","text"],["unit_rate","rate"],["discount_pct","pct"],["line_tax_rate","pct"],["amount","money"]];
const LINE_FIELDS=LINE_COLUMNS.map(c=>c[0]);
const variants=[
 {id:"clean",label:"Matching invoice · baseline checks pass"},
 {id:"total",label:"Total mismatch · arithmetic check fails"},
 {id:"rate",label:"Unapproved rate · contract check fails"},
 {id:"missing",label:"Missing service report · evidence check fails"},
 {id:"limit",label:"Above spending limit · contract check fails"},
 {id:"currency",label:"Wrong currency · contract check fails"},
 {id:"account",label:"Redirected payment account · approved-account check fails"},
 {id:"delivery",label:"Delivery outside the service period · evidence check fails"},
 {id:"terms",label:"Due date disagrees with payment terms · arithmetic check fails"}
];
const xesc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
function sample(kind){
 if(!variants.some(x=>x.id===kind))throw Error("Unknown sample scenario");
 const r=window.PublicLocalRunner.template();
 const serial=String(Date.now())+"-"+String(Math.floor(Math.random()*1000)).padStart(3,"0");
 r.case_id="CASE-DEMO-"+serial;r.invoice_id="INV-DEMO-"+serial;
 r.supplier_note="Synthetic downloadable workbook. Scenario: "+kind+". Not a live invoice.";
 // Recompute the dependent totals so each scenario breaks ONE thing. A
 // sample that fails six rules at once teaches a reviewer nothing about
 // which rule found what.
 const money=n=>n.toFixed(2);
 const rebalance=()=>{
  const sub=r.lines.reduce((s,x)=>s+Number(x.amount),0);
  r.subtotal=money(sub);
  // The taxable base follows the subtotal, or R16/R17 break in every
  // scenario that changes a line and the sample stops isolating one rule.
  r.taxable_base=money(sub-Number(r.non_taxable_base||0));
  r.discount_total=money(r.lines.reduce((s,x)=>s+(Number(x.quantity)*Number(x.unit_rate)-Number(x.amount)),0));
  r.tax_amount=money(sub*Number(r.tax_rate));
  r.total=money(sub+Number(r.tax_amount));
  r.total_in_base=money(Number(r.total)*Number(r.fx_rate));
 };
 // Adjust the base-currency total alongside, so only R5 breaks: leaving it
 // stale would also fail R12 and the sample would no longer isolate one rule.
 if(kind==="total"){rebalance();r.total=money(Number(r.total)-250);r.total_in_base=money(Number(r.total)*Number(r.fx_rate));}
 // 110.00 is off the rate card but keeps the total under the spending
 // limit, so this sample isolates C6 instead of also tripping C7.
 if(kind==="rate"){r.lines[0].unit_rate="110.00";r.lines[0].amount="11000.00";rebalance();}
 if(kind==="missing")r.documents=["service-report"];                            // timesheet absent
 if(kind==="limit"){r.lines[0].quantity="200";r.lines[0].amount="20000.00";rebalance();}    // over limit
 if(kind==="currency"){r.currency="USD";rebalance();}                           // wrong currency
 if(kind==="account"){rebalance();r.supplier_iban="NL02ABNA0123456789";}        // redirected payment
 if(kind==="delivery"){rebalance();r.delivery_date="2026-09-15";}               // outside the period
 if(kind==="terms"){rebalance();r.due_date="2026-11-30";}                       // terms mismatch
 return r;
}
function random(){
 const variant=variants[Math.floor(Math.random()*variants.length)];
 const invoice=sample(variant.id),line=invoice.lines[0];
 const quantity=variant.id==='limit'?160+Math.floor(Math.random()*61):80+Math.floor(Math.random()*41);
 const rate=variant.id==='rate'?[110,120,125][Math.floor(Math.random()*3)]:100;
 line.quantity=String(quantity);line.unit_rate=rate.toFixed(2);line.amount=(quantity*rate).toFixed(2);
 invoice.total=(quantity*rate+(variant.id==='total'?250:0)).toFixed(2);
 return {kind:variant.id,label:variant.label,invoice};
}
const put16=(v,o,n)=>v.setUint16(o,n,true),put32=(v,o,n)=>v.setUint32(o,n>>>0,true);
const crcTable=(()=>{const a=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;a[n]=c>>>0;}return a;})();
function crc32(b){let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function zip(entries){
 const local=[],central=[];let offset=0,dirSize=0;
 for(const [name,text] of Object.entries(entries)){
  const path=enc.encode(name),body=enc.encode(text),crc=crc32(body);
  const h=new Uint8Array(30+path.length),v=new DataView(h.buffer);
  put32(v,0,0x04034b50);put16(v,4,20);put16(v,6,0x0800);put16(v,8,0);
  put32(v,14,crc);put32(v,18,body.length);put32(v,22,body.length);put16(v,26,path.length);h.set(path,30);
  local.push(h,body);
  const ch=new Uint8Array(46+path.length),w=new DataView(ch.buffer);
  put32(w,0,0x02014b50);put16(w,4,20);put16(w,6,20);put16(w,8,0x0800);
  put32(w,16,crc);put32(w,20,body.length);put32(w,24,body.length);put16(w,28,path.length);
  put32(w,42,offset);ch.set(path,46);central.push(ch);dirSize+=ch.length;offset+=h.length+body.length;
 }
 const e=new Uint8Array(22),v=new DataView(e.buffer);
 put32(v,0,0x06054b50);put16(v,8,central.length);put16(v,10,central.length);
 put32(v,12,dirSize);put32(v,16,offset);
 return new Blob([...local,...central,e],{type:MIME});
}
const col=n=>{let s="";for(let x=n+1;x;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s;};

// ── Cell styles (ADR-188) ───────────────────────────────────────────────
// Indices into cellXfs below. A number written WITHOUT one of these reaches
// Excel as `General`, which is how the previous template rendered money,
// rates and percentages identically.
const S={plain:0,header:1,group:2,money:3,rate:4,pct:5,int:6,text:7};
const KIND_STYLE={text:S.text,money:S.money,rate:S.rate,pct:S.pct,int:S.int};
const NUMERIC=new Set(["money","rate","pct","int"]);

function styles(){
 const nf='<numFmts count="2">'
  +'<numFmt numFmtId="164" formatCode="#,##0.0000"/>'   // a unit rate to 4 dp
  +'<numFmt numFmtId="165" formatCode="0.0%"/>'         // a fraction as a percentage
  +'</numFmts>';
 const fonts='<fonts count="3">'
  +'<font><sz val="11"/><name val="Calibri"/></font>'
  +'<font><b/><sz val="11"/><name val="Calibri"/></font>'
  +'<font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font>'
  +'</fonts>';
 // Index 1 MUST be gray125: Excel treats the first two fills as reserved and
 // renders every later fill one position out if they are missing.
 const fills='<fills count="4">'
  +'<fill><patternFill patternType="none"/></fill>'
  +'<fill><patternFill patternType="gray125"/></fill>'
  +'<fill><patternFill patternType="solid"><fgColor rgb="FF1F3A4D"/><bgColor indexed="64"/></patternFill></fill>'
  +'<fill><patternFill patternType="solid"><fgColor rgb="FFEAF0F4"/><bgColor indexed="64"/></patternFill></fill>'
  +'</fills>';
 const borders='<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>';
 // `children` rather than raw-string surgery: an <alignment> child has its
 // own self-closing tag, so patching the parent's "/>" by string replace
 // mangles the child instead of opening the parent.
 const xf=(numFmtId,fontId,fillId,children)=>{
  const head='<xf numFmtId="'+numFmtId+'" fontId="'+fontId+'" fillId="'+fillId+'" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"';
  return children?head+' applyAlignment="1">'+children+'</xf>':head+'/>';
 };
 const centred='<alignment horizontal="center" vertical="center" wrapText="1"/>';
 const cellXfs='<cellXfs count="8">'
  +xf(0,0,0)                                            // 0 plain
  +xf(0,2,2,centred)                                    // 1 header
  +xf(0,1,3)                                            // 2 group band
  +xf(4,0,0)                                            // 3 money   #,##0.00
  +xf(164,0,0)                                          // 4 rate    #,##0.0000
  +xf(165,0,0)                                          // 5 percent 0.0%
  +xf(3,0,0)                                            // 6 integer #,##0
  +xf(49,0,0)                                           // 7 text    @
  +'</cellXfs>';
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  +nf+fonts+fills+borders
  +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  +cellXfs
  +'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
  +'</styleSheet>';
}

// A cell is either a bare value (inline string, plain style) or
// {v, s, n} — value, style index, numeric.
const cell=(value,style,numeric)=>({v:value,s:style,n:!!numeric});

function sheet(rows,opts){
 const o=opts||{};
 const body=rows.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((raw,j)=>{
  const c=(raw&&typeof raw==="object"&&"v" in raw)?raw:cell(raw,S.plain,false);
  const ref=col(j)+(i+1);
  const st=c.s?' s="'+c.s+'"':"";
  if(c.n){
   const num=Number(c.v);
   // A value that is not finite must not be written as a number: Excel
   // rejects the file outright rather than showing an empty cell.
   if(Number.isFinite(num))return '<c r="'+ref+'"'+st+'><v>'+num+'</v></c>';
  }
  const s=String(c.v??"");
  if(!s)return '<c r="'+ref+'"'+st+'/>';
  return '<c r="'+ref+'"'+st+' t="inlineStr"><is><t xml:space="preserve">'+xesc(s)+'</t></is></c>';
 }).join("")+'</row>').join("");
 const cols=(o.widths||[]).map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join("");
 // Freeze the header row so a 40-row sheet stays navigable.
 const pane=o.freeze?'<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>':"";
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  +'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  +pane+(cols?'<cols>'+cols+'</cols>':"")
  +'<sheetData>'+body+'</sheetData></worksheet>';
}
function build(input){
 // Invoice sheet: a header row, then one band per group followed by its
 // fields. A band is a label in column A with an EMPTY column B, which is
 // exactly how the reader tells a section header from a field (a key it does
 // not know, carrying a value, is still an error).
 const invoice=[[cell("Field",S.header),cell("Value",S.header)]];
 for(const [label,groupFields] of GROUPS){
  invoice.push([cell(label,S.group),cell("",S.group)]);
  for(const [key,kind] of groupFields){
   const raw=key==="documents"?(input.documents||[]).join(", "):input[key];
   const numeric=NUMERIC.has(kind)&&raw!==undefined&&raw!==null&&raw!=="";
   invoice.push([cell(key,S.text),cell(raw??"",KIND_STYLE[kind]??S.text,numeric)]);
  }
 }
 const lines=[LINE_COLUMNS.map(([name])=>cell(name,S.header)),
  ...input.lines.map(x=>LINE_COLUMNS.map(([name,kind])=>{
   const raw=x[name];
   return cell(raw??"",KIND_STYLE[kind]??S.text,NUMERIC.has(kind)&&raw!==undefined&&raw!==null&&raw!=="");
  }))];
 const instructions=[["Synthetic supplier invoice — local reference"],["Edit fields on Invoice and LineItems, save as XLSX, then upload under Document collection."],["The SUP-014 contract used for checking is expressly synthetic and optional."],["Workbook parsing and rules run in your browser only; no provider AI, reviewer decision, or payment."],["Do not upload confidential real supplier material to this public demonstration."]];
 const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 return zip({
  "[Content_Types].xml":xml+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
  "_rels/.rels":xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  "xl/workbook.xml":xml+'<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><sheets><sheet name="Invoice" sheetId="1" r:id="rId1"/><sheet name="LineItems" sheetId="2" r:id="rId2"/><sheet name="Instructions" sheetId="3" r:id="rId3"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels":xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+[1,2,3].map(i=>'<Relationship Id="rId'+i+'" Type="'+rel+'/worksheet" Target="worksheets/sheet'+i+'.xml"/>').join("")+'<Relationship Id="rId4" Type="'+rel+'/styles" Target="styles.xml"/></Relationships>',
  "xl/styles.xml":styles(),
  "xl/worksheets/sheet1.xml":sheet(invoice,{widths:[24,46],freeze:true}),
  "xl/worksheets/sheet2.xml":sheet(lines,{widths:[18,34,11,9,13,13,13,14],freeze:true}),
  "xl/worksheets/sheet3.xml":sheet(instructions,{widths:[104]})
 });
}
function downloadInvoice(r,kind='generated'){
 const blob=build(r),u=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=u;a.download="synthetic-supplier-"+kind+"-"+r.invoice_id+".xlsx";a.click();
 setTimeout(()=>URL.revokeObjectURL(u),5000);
 return r;
}
function download(kind){return downloadInvoice(sample(kind),kind);}
function parseXml(bytes,label){
 const text=dec.decode(bytes);
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error("Workbook XML entities are not supported");
 const xml=new DOMParser().parseFromString(text,"application/xml");
 if(xml.querySelector("parsererror"))throw Error("Invalid XML in "+label);
 return xml;
}
function elements(el,name){return Array.from(el.getElementsByTagNameNS("*",name));}
function textFrom(el){return elements(el,"t").map(n=>n.textContent||"").join("");}
async function open(file){
 if(!file||file.size>6000000)throw Error("XLSX file exceeds the 6 MB local processing limit");
 const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const u16=i=>view.getUint16(i,true),u32=i=>view.getUint32(i,true);
 let end=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(u32(p)===0x06054b50){end=p;break;}
 if(end<0)throw Error("Not a valid XLSX ZIP archive");
 const count=u16(end+10),size=u32(end+12),offset=u32(end+16);
 if(count>200||offset+size>bytes.length)throw Error("Workbook archive is too large or malformed");
 const entries=new Map();let p=offset;
 for(let n=0;n<count;n++){
  if(p+46>bytes.length||u32(p)!==0x02014b50)throw Error("Invalid ZIP directory");
  const flag=u16(p+8),method=u16(p+10),compressed=u32(p+20),plain=u32(p+24),len=u16(p+28),extra=u16(p+30),comment=u16(p+32),loc=u32(p+42);
  const name=dec.decode(bytes.subarray(p+46,p+46+len));p+=46+len+extra+comment;
  if(!name||name.includes("..")||name.startsWith("/")||entries.has(name))throw Error("Unsafe or repeated XLSX ZIP entry");
  if((flag&1)!==0||![0,8].includes(method)||plain>2000000||compressed>6000000)throw Error("Encrypted or oversized workbook entry");
  if(loc+30>bytes.length||u32(loc)!==0x04034b50)throw Error("Malformed ZIP entry");
  const start=loc+30+u16(loc+26)+u16(loc+28);
  if(start+compressed>bytes.length)throw Error("Truncated workbook entry");
  entries.set(name,{data:bytes.slice(start,start+compressed),method,plain});
 }
 async function get(name,optional=false){
  const entry=entries.get(name);if(!entry){if(optional)return null;throw Error("Missing XLSX component: "+name);}
  if(entry.method===0)return entry.data;
  if(typeof DecompressionStream!=="function")throw Error("Compressed XLSX parsing needs a modern browser");
  let data;
  try{data=new Uint8Array(await new Response(new Blob([entry.data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());}
  catch{throw Error("Could not decompress XLSX worksheet");}
  if(data.length!==entry.plain||data.length>2000000)throw Error("Workbook entry has invalid decompressed length");
  return data;
 }
 const workbook=parseXml(await get("xl/workbook.xml"),"workbook");
 const rels=parseXml(await get("xl/_rels/workbook.xml.rels"),"relationships");
 const mapping=new Map(elements(rels,"Relationship").map(n=>[n.getAttribute("Id"),n.getAttribute("Target")]));
 const sheets=new Map();
 for(const node of elements(workbook,"sheet")){
  const id=node.getAttribute("r:id")||node.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id");
  const target=mapping.get(id)||"";
  const path=target.startsWith("/")?target.slice(1):"xl/"+target.replace(/^\.?\//,"");
  if(!/^xl\/worksheets\/[A-Za-z0-9_.-]+\.xml$/.test(path))continue;
  sheets.set(node.getAttribute("name"),path);
 }
 if(!sheets.has("Invoice")||!sheets.has("LineItems"))throw Error("This workbook must contain Invoice and LineItems sheets from the downloaded template");
 const sharedBytes=await get("xl/sharedStrings.xml",true),shared=sharedBytes?elements(parseXml(sharedBytes,"shared strings"),"si").map(textFrom):[];
 async function rows(name){
  const xml=parseXml(await get(sheets.get(name)),name);
  const out=[];
  for(const row of elements(xml,"row")){
   const cells=[];
   for(const cell of elements(row,"c")){
    if(elements(cell,"f").length)throw Error("Formula cells are not supported; replace formulas with fixed values");
    const m=/^([A-Z]+)\d+$/.exec(cell.getAttribute("r")||"");
    if(!m)continue;
    let idx=0;for(const ch of m[1])idx=idx*26+ch.charCodeAt(0)-64;idx--;
    if(idx>30)throw Error("Unsupported workbook column");
    const kind=cell.getAttribute("t");
    const v=elements(cell,"v")[0]?.textContent||"";
    cells[idx]=kind==="inlineStr"?textFrom(cell):kind==="s"?shared[Number(v)]??"":v;
   }
   out.push(cells);
   if(out.length>100)throw Error("Too many rows in workbook");
  }
  return out;
 }
 const header=await rows("Invoice"),items=await rows("LineItems");
 if(header[0]?.[0]!=="Field"||header[0]?.[1]!=="Value")throw Error("Invoice sheet must start with Field and Value headers");
 if(["service_code","quantity","unit_rate","amount"].some((x,i)=>items[0]?.[i]!==x))throw Error("LineItems headers do not match the supplier template");
 const obj={};
 for(const row of header.slice(1)){
  const key=String(row[0]||"").trim();
  if(!key)continue;
  if(!fields.includes(key)||Object.hasOwn(obj,key))throw Error("Unknown or duplicated invoice field: "+key);
  obj[key]=String(row[1]??"");
 }
 obj.version=Number(obj.version);obj.documents=String(obj.documents||"").split(/[,;|]/).map(x=>x.trim()).filter(Boolean);
 obj.lines=items.slice(1).filter(r=>r.some(x=>String(x??"").trim())).map(row=>({
  service_code:String(row[0]??""),quantity:String(row[1]??""),unit_rate:String(row[2]??""),amount:String(row[3]??"")
 }));
 if(!obj.lines.length)throw Error("No service lines found in LineItems");
 return obj;
}
// `fields` and `lineFields` are the sheet's own catalog. Exported so a release
// check can assert what the workbook WRITES rather than what the sample
// happens to carry: the two can diverge, and only the first is published.
window.PublicSupplierWorkbook={variants,sample,random,build,download,downloadInvoice,read:open,
 fields,lineFields:LINE_FIELDS,groups:GROUPS.map(([label,fs])=>({label,fields:fs.map(f=>f[0])}))};
})();

