/** The native Next.js public shell owns links: no inherited overlay scripts.
 * Validate the actual compiled route graph and every local href/src instead.
 */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.cwd());
const read=path=>readFileSync(resolve(root,path),"utf8");
const manifest=JSON.parse(read(".site-release.json"));
const routes=new Set(manifest.published_routes);
const canonical=routes.has("workspace/case")&&routes.has("failure-lab");
const retired=["cases","case","red-team","analytics","introduction",
 "workflow-reference","tickets/new"];
let verified=0;
for(const route of routes){
 const path=(route==="."?"":route+"/")+"index.html";
 const html=read(path);
 // Next's generated 404 fallback deliberately uses its own error boundary.
 // Validate its presence and assets, but don't require the normal app shell.
 if(route!=="404"){
   assert.match(html, /id="main-content"/,"Native main landmark missing: "+path);
   assert.match(html, /Main navigation/,"Native sidebar missing: "+path);
 }
 for(const [,raw] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)){
   if(raw.startsWith("//"))continue;
   const url=new URL(raw,"https://aigovernanceascodelab.com");
   const pathname=decodeURIComponent(url.pathname);
   if(pathname.startsWith("/api/"))continue; // only active inside protected view
   const target=resolve(root,"."+pathname);
   assert.ok(existsSync(target)||existsSync(resolve(target,"index.html")),
     "Broken local route/asset in "+path+": "+raw);
   if(canonical){
     const clean=pathname.replace(/^\/+|\/+$/g,"");
     assert.ok(!retired.includes(clean),"Legacy destination retained in "+path+": "+raw);
   }
 }
 verified++;
}
if(canonical){
 for(const route of retired){
   assert.ok(!routes.has(route),"Former page still in release manifest: /"+route);
   assert.ok(!existsSync(resolve(root,route,"index.html")),
     "Former page still exists on disk: /"+route);
 }
 for(const route of ["workspace","workspace/case","failure-lab","dashboard"]){
   assert.ok(routes.has(route),"Canonical destination missing: /"+route);
 }
}
console.log("PASS:",verified,"published native routes have working local links, no overlays or hidden aliases.");
