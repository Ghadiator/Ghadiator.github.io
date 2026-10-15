(function setupPersonas(){
"use strict";
const list=[
 {id:"integrator",name:"Integrator",subtitle:"Code & external interfaces"},
 {id:"audit",name:"Audit",subtitle:"Evidence and transitions"},
 {id:"reports",name:"Reports",subtitle:"Case summaries"},
 {id:"benchmark",name:"Analytics",subtitle:"Fixture comparisons"},
 {id:"red_team",name:"Red Team",subtitle:"Attack surface & guards"},
 {id:"hitl",name:"Human Reviewer",subtitle:"Case-bound read-only evidence"}
];
const safe=(c,x)=>c.h(x??"");
function active(c){return c.state.personaName||"integrator"}
function chat(c,{only=null}={}){
 const id=only||active(c),who=list.find(p=>p.id===id)||list[0],sessions=c.state.personaSessions||{},turns=sessions[id]||[];
 return `<div class="wb-agent-layout">${only?"":`<div class="wb-agent-list">${list.map(p=>`<button class="wb-agent-select ${id===p.id?"selected":""}" type="button" data-persona-select="${p.id}"><strong>${p.name}</strong><small>${p.subtitle}</small></button>`).join("")}</div>`}
 <div class="wb-chat-card"><div class="wb-chat-head"><strong>${who.name} · source-grounded evidence explorer</strong><small>This is retrieval over published supplier source references; not live model inference or an autonomous agent.</small></div>
 <div class="wb-chat-log" aria-live="polite">${turns.length?turns.map(t=>`<article class="wb-chat-bubble ${t.role==="user"?"user":""}"><small>${t.role==="user"?"You":who.name}</small><p>${safe(c,t.message)}</p>${t.source?`<small>Source: ${safe(c,t.source)}</small>`:""}</article>`).join(""):`<article class="wb-chat-bubble"><small>${who.name}</small><p>Ask me a question about the published generic supplier validation code, workflow events and controls. I can quote relevant evidence, but cannot execute the private DAiA engine.</p></article>`}</div>
 <div class="wb-agent-shortcuts">${({integrator:["What are the integration seams?","Where is the code for validation?"],audit:["What are the recorded events?","What supports the human gate?"],reports:["Summarize this case","What was the recorded outcome?"],benchmark:["How many scenarios were executed?","How many are Approved?"],red_team:["Which attack controls were tested?","How did the supplier injection behave?"],hitl:["Who can approve?","Can you approve a case?"]}[id]||[]).map(q=>`<button type="button" data-persona-question="${safe(c,q)}">${safe(c,q)}</button>`).join("")}</div>
 <form id="public-persona-chat" class="wb-chat-compose"><input name="question" maxlength="500" required placeholder="Ask about workflow, source code or evidence…" aria-label="Message ${who.name}"><button type="submit" class="wb-primary">Ask</button></form></div></div>`;
}
function render(c){return `<div class="wb-page"><div class="wb-head"><div><span class="wb-kicker">GENERIC VALIDATION · PERSONA WORKBENCH</span><h1>Chat with the code</h1><p>Browse DAiA-inspired specialist persona tabs for integration, audit, reporting, analytics, adversarial assurance and human oversight. Responses are extracted from published source-grounded records.</p></div><a data-view="attacker" class="wb-button" href="?view=attacker">Red Team theater ↗</a></div>
 ${chat(c)}<div class="wb-notice"><strong>Bounded public capability.</strong> Questions are matched to verified JSON fixture exports and cited source paths. This is not the DAiA multi-persona LLM backend, and the Human Reviewer cannot make or resume decisions.</div></div>`;}
function answer(c,question,persona){
 const text=String(question).toLowerCase(),s=c.currentCase(),events=c.events(),scenarios=c.state.index?.scenarios||[];
 const probes=c.state.loaded.redteam?.scenarios||[],rules=c.state.loaded.rules?.rules||[],integration=c.state.loaded.integration?.seams||[],cross=c.state.loaded.crosswalk?.rows||[];
 if(persona==="hitl"&&/(approve|reject|decid|resume|authorize|authorise)/.test(text))return{message:`This website cannot exercise human decision authority. The selected recorded case outcome is ${s.terminal_state}; human gate reached: ${s.reached_human_gate?"yes":"no"}. Only the reference workflow can record a new reviewer decision.`,source:"data/scenarios/index.json"};
 if(persona==="benchmark")return{message:`The published index lists ${scenarios.length} intentionally selected synthetic supplier scenarios, including ${scenarios.filter(x=>x.terminal_state==="Approved").length} marked Approved and ${scenarios.filter(x=>x.terminal_state==="Rejected").length} marked Rejected. These are not real-world performance measurements.`,source:"data/scenarios/index.json"};
 if(persona==="reports"||persona==="hitl"&&text.includes("case"))return{message:`Selected scenario: ${s.title}. ${s.one_liner} The exported terminal state is ${s.terminal_state}, with ${s.event_count} events and human gate reached: ${s.reached_human_gate?"yes":"no"}.`,source:`data/scenarios/${s.slug}.json`};
 if(persona==="red_team"&&/(how many|which attack|control|technique)/.test(text))return{message:`${probes.length} deterministic attack/control scenarios are published. ${probes.filter(p=>p.outcome==="CONTROL_TRIGGERED").length} are marked CONTROL_TRIGGERED by the supplier reference exporter. That does not establish robustness against untested payloads or live adaptive attacks.`,source:"data/red_team.json"};
 const terms=text.split(/[^a-z0-9_]+/).filter(w=>w.length>3);
 let pool=[];
 if(["audit","reports","hitl"].includes(persona))pool=pool.concat(events.filter(e=>e.detail).map(e=>({content:`Event ${e.seq} · ${e.label}. ${e.detail}`,source:`data/scenarios/${s.slug}.json · ${e.kind}`})));
 if(["integrator","audit","red_team"].includes(persona))pool=pool.concat(rules.map(r=>({content:`${r.title}: ${r.principle} ${r.enforced_by}`,source:r.evidence_ref})));
 if(["integrator","audit"].includes(persona))pool=pool.concat(integration.map(r=>({content:`${r.name}: ${r.detail}. Integration status: ${r.status}.`,source:r.ref})),cross.map(r=>({content:`${r.article}: ${r.mechanism}. Boundary: ${r.honest_scope}.`,source:r.evidence_ref})));
 if(["red_team","audit"].includes(persona))pool=pool.concat(probes.map(p=>({content:`${p.threat_model} Target: ${p.target_seam}; expected control: ${p.expected_control}; outcome: ${p.outcome}. Evidence: ${p.evidence}`,source:`data/red_team.json · ${p.scenario_id}`})));
 const ranking=pool.map(x=>({...x,score:terms.reduce((n,w)=>n+(x.content.toLowerCase().includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score);
 if(ranking[0]?.score>0)return{message:ranking[0].content,source:ranking[0].source};
 return{message:"I cannot establish a source-backed answer from the currently loaded public evidence. Try a suggested question or inspect the codebase. This interface does not invent missing code or generate new model responses.",source:null};
}
async function send(c,id,question){
 const q=String(question||"").trim();if(!q)return;
 if(!c.state.personaSessions)c.state.personaSessions={};
 const history=(c.state.personaSessions[id]||[]).slice(-22);
 const api=window.PublicBackend?.state();
 let result;
 if(api?.mode==="backend"){
  if(api.status!=="online")throw Error("The backend is offline; this message was not delivered.");
  const response=await window.PublicBackend.askPersona({persona:id,message:q,
   caseId:id==="hitl"?c.currentCase().slug:null,conversationId:c.state.personaConversations?.[id]||null});
  if(!response||typeof response.reply!=="string"||!response.reply.trim())throw Error("Backend returned no persona reply");
  result={message:response.reply,source:response.source||"Authenticated generic validation API"};
  if(response.conversation_id){
   if(!c.state.personaConversations)c.state.personaConversations={};
   c.state.personaConversations[id]=response.conversation_id;
  }
 }else result=answer(c,q,id);
 history.push({role:"user",message:q});
 history.push({role:"assistant",...result});
 c.state.personaSessions[id]=history;
 return result;
}
window.PublicPersonas={render,chat,send,answer};
})();
