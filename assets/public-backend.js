(function installBackend(){
"use strict";
let config=null,capabilities={},state={mode:"reference",status:"unconfigured",message:"Static reference mode; no validation backend is configured.",checkedAt:null,capabilities:{}};
const copy=()=>({...state,capabilities:{...state.capabilities}});
const allowed=new Set(["cases","requests","submissions","personas","red_team","events","review","health"]);
const enc=s=>encodeURIComponent(String(s));
function normalize(c){
 if(!c||c.enabled!==true)return {enabled:false};
 if(typeof c.apiOrigin!=="string"||!c.apiOrigin.trim())throw Error("An explicit HTTPS API origin is required to enable backend mode");
 let origin;
 try{origin=new URL(c.apiOrigin||"",location.href);if(origin.protocol!=="https:"&&!(origin.hostname==="localhost"||origin.hostname==="127.0.0.1")&&origin.protocol==="http:")throw Error("HTTPS required");if(!["https:","http:"].includes(origin.protocol)||origin.username||origin.password||origin.search||origin.hash)throw Error("Invalid API origin");}catch(e){throw Error("Invalid public API origin: "+e.message)}
 if(!/^\/[A-Za-z0-9/_-]*$/.test(c.apiPrefix||"/api/v1")||(c.apiPrefix||"").includes(".."))throw Error("Invalid API prefix");
 const prefix=(c.apiPrefix||"/api/v1").replace(/\/$/,"");
 return {enabled:true,base:origin.origin+prefix,auth:c.authentication==="same-origin-cookie"?"same-origin":"include",maxFileBytes:Math.min(Number(c.maxUploadBytes)||15000000,20000000),timeoutMs:Math.min(Number(c.timeoutMs)||12000,30000)};
}
async function init(){
 try{
  const response=await fetch("./data/backend-config.json",{cache:"no-store"});
  if(!response.ok)throw Error("API settings not published");
  const file=await response.json();config=normalize(file);
  if(!config.enabled){state={...state,mode:"reference",status:"unconfigured",message:"Reference mode: public fixtures and local browser submissions. Backend connector is installed but disabled.",checkedAt:new Date().toISOString()};return copy();}
  state={...state,mode:"backend",status:"checking",message:"Checking generic validation API…"};
  return await refresh();
 }catch(e){state={...state,mode:"reference",status:"invalid",message:String(e.message),checkedAt:new Date().toISOString()};return copy();}
}
async function request(route,{method="GET",body=null,timeoutMs,signal}={}){
 if(!config?.enabled)throw Error("Backend not configured. Use local mode until an API origin is deployed.");
 if(!route.startsWith("/")||route.startsWith("//")||route.includes("..")||/[?#]/.test(route))throw Error("Invalid API route");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs||config.timeoutMs);
 if(signal)signal.addEventListener("abort",()=>controller.abort(),{once:true});
 const headers={Accept:"application/json"};
 if(body&&!((typeof FormData!=="undefined")&&body instanceof FormData))headers["Content-Type"]="application/json";
 const init={method,credentials:config.auth,mode:"cors",signal:controller.signal,headers};
 if(body)init.body=((typeof FormData!=="undefined")&&body instanceof FormData)?body:JSON.stringify(body);
 try{
  const response=await fetch(config.base+route,init);
  const mime=response.headers.get("content-type")||"";
  if(!response.ok){
   let detail=`HTTP ${response.status}`;
   if(mime.includes("application/json")){try{const j=await response.json();if(typeof j.detail==="string")detail=j.detail;}catch{}}
   if(response.status===401)detail="Authentication required; log in through the deployed backend.";
   if(response.status===403)detail="You do not have permission for that backend operation.";
   throw Error(detail);
  }
  if(!mime.includes("application/json"))throw Error("API returned non-JSON content, possible reverse-proxy misconfiguration");
  return await response.json();
 }finally{clearTimeout(timer);}
}
async function refresh(){
 if(!config?.enabled)return copy();
 state={...state,status:"checking",message:"Checking generic validation API…"};
 try{
  const r=await request("/capabilities");
  if(!r||!Array.isArray(r.features)||r.service!=="generic-validation")throw Error("Incompatible generic validation capabilities contract");
  capabilities=Object.fromEntries(r.features.filter(x=>allowed.has(x)).map(x=>[x,true]));
  state={mode:"backend",status:"online",message:`Connected to ${String(r.display_name||"generic validation backend")}; features exposed by API.`,checkedAt:new Date().toISOString(),capabilities,serviceVersion:String(r.version||"unknown")};
 }catch(e){capabilities={};state={mode:"backend",status:"offline",message:`Backend configured but unavailable: ${e.message}`,checkedAt:new Date().toISOString(),capabilities:{}};}
 return copy();
}
const enabled=feature=>state.status==="online"&&Boolean(capabilities[feature]);
const ensure=feature=>{if(!enabled(feature))throw Error(`Backend feature ${feature} is unavailable. No remote action was taken.`);};
async function submit({fields,file}){
 ensure("submissions");
 if(file&&file.size>config.maxFileBytes)throw Error(`Document exceeds ${config.maxFileBytes} byte limit`);
 const form=new FormData();
 for(const [key,value] of Object.entries(fields||{}))if(value!==undefined&&value!==null)form.append(key,String(value));
 if(file)form.append("file",file,file.name);
 const result=await request("/submissions",{method:"POST",body:form,timeoutMs:30000});
 if(!result?.submission_id)throw Error("API did not confirm a submission ID.");
 return result;
}
async function createRequest(fields){
 ensure("requests");
 const r=await request("/requests",{method:"POST",body:fields});
 if(!r?.request_id)throw Error("API did not confirm a request ID");
 return r;
}
async function askPersona({persona,message,caseId=null,conversationId=null}){
 ensure("personas");
 if(!/^[a-z_]{2,30}$/.test(persona))throw Error("Invalid persona");
 if(!message||message.length>2000)throw Error("Question must be 1–2000 characters");
 return request(`/personas/${enc(persona)}/chat`,{method:"POST",body:{message,case_id:caseId,conversation_id:conversationId}});
}
async function redTeam({techniques=[],caseId=null}={}){
 ensure("red_team");
 return request("/red-team/campaigns",{method:"POST",body:{techniques,case_id:caseId},timeoutMs:30000});
}
async function listCases(){ensure("cases");return request("/cases");}
window.PublicBackend={init,refresh,state:copy,enabled,request,submit,createRequest,askPersona,redTeam,listCases};
})();
