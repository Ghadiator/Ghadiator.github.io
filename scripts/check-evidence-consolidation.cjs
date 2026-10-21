'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};for(const f of ['story-journey','generic-workbench'])vm.runInNewContext(fs.readFileSync('assets/'+f+'.js','utf8'),{window});
const source=fs.readFileSync('app.js','utf8');
const routing={URLSearchParams};vm.runInNewContext(source.slice(source.indexOf('function canonicalView('),source.indexOf('function readJourneyQuery(')),routing);
for(const [query,expected] of [['view=evidence&tab=trace','architecture'],['view=evidence&tab=reports','cases'],['view=evidence&tab=learning','evidence'],['view=evidence','evidence'],['view=case','case']])assert.equal(routing.canonicalView(new URLSearchParams(query)),expected);
const h=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rows=JSON.parse(fs.readFileSync('data/scenarios/index.json','utf8')).scenarios;
for(const row of rows){
 const d=JSON.parse(fs.readFileSync('data/scenarios/'+row.slug+'.json','utf8'));
 const ctx={state:{scenario:row.slug,index:{scenarios:rows},loaded:{rules:{rules:[]}},workbenchTab:'summary'},h,currentCase:()=>row,scenarioData:()=>d,events:()=>d.events};
 const page=window.StoryJourney.renderEvidence({...ctx,events(){throw Error('Learning page must not rebuild an event timeline');}});
 assert.ok(page.includes('Lessons learned')&&page.includes('Design decisions'));
 assert.ok(!page.includes('Decision trace')&&!page.includes('Previewing the first')&&!page.includes('data-evidence-tab'));
 assert.ok(page.includes('view=case&amp;scenario='+row.slug)&&page.includes('view=architecture&amp;scenario='+row.slug));
 const detail=window.GenericWorkbench.detail(ctx);
 assert.ok(detail.includes('Human decision evidence')&&detail.includes('Inspect workflow events'));
 assert.ok(!detail.includes('view=evidence')&&!detail.includes('Decision evidence →'));
 const decision=d.events.find(e=>e.kind==='hitl.resumed');
 if(decision)assert.ok(detail.includes(h(decision.detail)),'Preserve the actual human rationale: '+row.slug);
 else assert.ok(detail.includes('No reviewer decision recorded'),'Do not invent a decision for '+row.slug);
}
assert.ok(!source.includes('state.evidenceTab'));
console.log('Evidence consolidation: 15 case rationales preserved, one event-log destination, learning content and legacy-link routing passed.');
