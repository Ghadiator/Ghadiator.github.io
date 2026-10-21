'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
let draws=[],savedBlob,savedName;
const math=Object.create(Math);
math.random=()=>draws.shift()??0.5;
const sandbox={window:{},Math:math,TextEncoder,TextDecoder,Blob,
 URL:{createObjectURL(blob){savedBlob=blob;return 'blob:local-example';},revokeObjectURL(){}},
 document:{createElement(){return {click(){savedName=this.download;}};}},setTimeout(fn){fn();}};
vm.runInNewContext(fs.readFileSync('assets/public-local-runner.js','utf8'),sandbox);
vm.runInNewContext(fs.readFileSync('assets/supplier-workbook.js','utf8'),sandbox);
const api=sandbox.window.PublicSupplierWorkbook;
const expected={total:'R2',rate:'C6',missing:'R6',limit:'C7',currency:'C4'};
for(const [i,variant] of api.variants.entries()){
 draws=[(i+0.25)/api.variants.length,0.1,0.5,0.25];
 const generated=api.random();
 assert.equal(generated.kind,variant.id);
 const invoice=generated.invoice,snapshot=JSON.stringify(invoice);
 const report=sandbox.window.PublicLocalRunner.run(invoice,{sampleContract:true});
 assert.notEqual(report.status,'Schema_invalid');
 const failed=report.validation.filter(x=>x.passed===false);
 if(variant.id==='clean')assert.equal(failed.length,0);
 else assert.ok(failed.some(x=>x.title.startsWith(expected[variant.id])),variant.id+' must demonstrate its intended rule failure');
 assert.equal(api.downloadInvoice(invoice,variant.id),invoice,'Download must use the generated record, not sample another case');
 assert.ok(savedBlob.size>1000);
 assert.ok(savedName.includes(invoice.invoice_id)&&savedName.endsWith('.xlsx'));
 assert.equal(JSON.stringify(invoice),snapshot,'Workbook export must not mutate the case');
}
console.log('Random Excel cases: six valid variants, intended rule outcomes and exact generated-record export passed.');
