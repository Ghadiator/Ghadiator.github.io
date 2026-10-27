/* Offline XLSX interchange for synthetic supplier submissions.
 * Template and parser are intentionally narrow: Invoice + LineItems with
 * fixed headers. Never execute formulas, macros, or untrusted workbook code.
 * All validation continues through PublicLocalRunner (browser preflight only).
 */
(function installSupplierWorkbook(){
"use strict";
const MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const enc=new TextEncoder(), dec=new TextDecoder();
const fields=["case_id","invoice_id","version","supplier_id","contract_id","purchase_order","currency","period_start","period_end","invoice_date","total","documents","supplier_note"];
const variants=[
 {id:"clean",label:"Matching invoice · baseline checks pass"},
 {id:"total",label:"Total mismatch · arithmetic check fails"},
 {id:"rate",label:"Unapproved rate · contract check fails"},
 {id:"missing",label:"Missing service report · evidence check fails"},
 {id:"limit",label:"Above spending limit · contract check fails"},
 {id:"currency",label:"Wrong currency · contract check fails"}
];
const xesc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
function sample(kind){
 if(!variants.some(x=>x.id===kind))throw Error("Unknown sample scenario");
 const r=window.PublicLocalRunner.template();
 const serial=String(Date.now())+"-"+String(Math.floor(Math.random()*1000)).padStart(3,"0");
 r.case_id="CASE-DEMO-"+serial;r.invoice_id="INV-DEMO-"+serial;
 r.supplier_note="Synthetic downloadable workbook. Scenario: "+kind+". Not a live invoice.";
 if(kind==="total")r.total="9800.00";
 if(kind==="rate"){r.lines[0].unit_rate="150.00";r.lines[0].amount="15000.00";r.total="15000.00";}
 if(kind==="missing")r.documents=[];
 if(kind==="limit"){r.lines[0].quantity="200";r.lines[0].amount="20000.00";r.total="20000.00";}
 if(kind==="currency")r.currency="USD";
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
function sheet(rows){
 const lines=rows.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((value,j)=>'<c r="'+col(j)+(i+1)+'" t="inlineStr"><is><t xml:space="preserve">'+xesc(value)+'</t></is></c>').join("")+'</row>').join("");
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+lines+'</sheetData></worksheet>';
}
function build(input){
 const invoice=[["Field","Value"],...fields.map(k=>[k,k==="documents"?(input.documents||[]).join(", "):String(input[k]??"")])];
 const lines=[["service_code","quantity","unit_rate","amount"],...input.lines.map(x=>[x.service_code,x.quantity,x.unit_rate,x.amount])];
 const instructions=[["Synthetic supplier invoice — local reference"],["Edit fields on Invoice and LineItems, save as XLSX, then upload under Document collection."],["The SUP-014 contract used for checking is expressly synthetic and optional."],["Workbook parsing and rules run in your browser only; no provider AI, reviewer decision, or payment."],["Do not upload confidential real supplier material to this public demonstration."]];
 const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 return zip({
  "[Content_Types].xml":xml+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
  "_rels/.rels":xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  "xl/workbook.xml":xml+'<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><sheets><sheet name="Invoice" sheetId="1" r:id="rId1"/><sheet name="LineItems" sheetId="2" r:id="rId2"/><sheet name="Instructions" sheetId="3" r:id="rId3"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels":xml+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+[1,2,3].map(i=>'<Relationship Id="rId'+i+'" Type="'+rel+'/worksheet" Target="worksheets/sheet'+i+'.xml"/>').join("")+'</Relationships>',
  "xl/worksheets/sheet1.xml":sheet(invoice),
  "xl/worksheets/sheet2.xml":sheet(lines),
  "xl/worksheets/sheet3.xml":sheet(instructions)
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
window.PublicSupplierWorkbook={variants,sample,random,build,download,downloadInvoice,read:open};
})();

