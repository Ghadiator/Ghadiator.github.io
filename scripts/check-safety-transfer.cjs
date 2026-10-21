'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('assets/safety-to-governance.js','utf8'),{window});
const api=window.SafetyToGovernance;
const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const html=api.render({h:escape,icon:()=>'',state:{scenario:'supplier_rate_correction'}});
assert.equal(api.skillGroups.length,4);
const skills=api.skillGroups.flatMap(g=>g.items);
assert.equal(skills.length,19);assert.equal(new Set(skills.map(s=>s.name)).size,19);
assert.equal((html.match(/class="so-choice"/g)||[]).length,6,'Keep the six personal design decisions');
assert.equal((html.match(/class="so-skill"/g)||[]).length,19);
for(const s of skills){
 assert.ok(s.source.length>20&&s.transfer.length>50&&s.scope&&s.view,'Every skill needs grounded experience, application, scope and a destination');
 assert.ok(html.includes(escape(s.name)));assert.ok(html.includes('view='+s.view+'&amp;scenario=supplier_rate_correction'));
}
for(const phrase of ['monitoring software','deterministic checks','edge cases','Tool qualification','OEM','DOORS','ISO 21434','Ongoing TUM','Oxford','live deployment'])assert.ok(html.toLowerCase().includes(phrase.toLowerCase()),'Missing relevant capability or boundary: '+phrase);
assert.ok(html.includes('not a claim of ISO/IEC 42001 certification'));
assert.ok(html.includes('not equivalence between standards'));
assert.ok(html.includes('need a connected backend'),'Do not imply persistent incident response is deployed');
console.log('Safety transfer: 19 CV-grounded capabilities, four groups, six design decisions, scope boundaries and scenario-preserving links passed.');
