#!/usr/bin/env node
/* Public website context lab: dependency-free, hermetic compatibility check.
 * Synthetic data only; do not read private backend sources or protected data.
 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname,"..");
const read = relative => fs.readFileSync(path.join(root,relative),"utf8");
const page=read("context-engineering/index.html");
const css=read("assets/context-engineering-20261115.css");
const script=read("assets/context-engineering-20261115.js");
const nav=read("assets/navigation-consolidation-20261106.js");
const intro=read("introduction/index.html");
const navCss=read("assets/navigation-consolidation-20261106.css");
assert(page.includes('class="public-shell"'),"Use the original workbench shell");
assert(page.includes('class="public-sidebar"'),"Native dark sidebar missing");
assert(page.includes('class="public-topbar"'),"Native topbar missing");
assert(page.includes('class="public-nav"'),"Shared navigation mount missing");
assert(!page.includes('class="side"'),"Standalone white navigation returned");
assert(!page.includes('class="page-shell"'),"Legacy white shell returned");
assert(page.includes('data-gac-static-shell="true"'),"Static shell mode missing");
assert(page.includes('/_next/static/css/0cd0e3fdebdcc732.css'),"Native sidebar styles not included");
assert(page.includes('/assets/navigation-consolidation-20261106.js'),"Shared sidebar script missing");
assert(page.includes('/assets/navigation-consolidation-20261106.css'),"Shared sidebar CSS missing");
assert(intro.includes('/assets/navigation-consolidation-20261106.js'),"Introduction missing nav script");
assert(intro.includes('/assets/navigation-consolidation-20261106.css'),"Introduction missing nav styles");
assert(navCss.includes("gac-legacy-nav-fallback"),"Legacy sidebar flash prevention missing");
assert(nav.includes('gacStaticShell==="true"'),"Shared script must initialize static sidebar");
assert(nav.includes('ensureStaticIcons(root)'),"Canonical icon fallback missing");


const requiredIds=[
 "main-content","page-title","memory-title","lab","lab-task","lab-case",
 "lab-role","lab-budget","lab-withdraw","lab-reset","lab-admitted",
 "lab-excluded","lab-coverage","lab-candidates","lab-window","lab-reasons",
 "lifecycle","operating-model","assurance"
];
for(const id of requiredIds)
  assert(page.includes('id="'+id+'"'),"Missing page interaction/anchor: "+id);
for(const route of ["/architecture/","/ai-assurance/","/safety-origin/"])
  assert(page.includes('href="'+route+'"'),"Missing navigation: "+route);
assert(page.includes("synthetic browser simulation"),"Must disclose static simulation");
assert(page.includes("AI-First Organization"),"Source attribution missing");
assert(nav.includes('["/context-engineering/","Context Engineering"]'),"Visible consolidated sidebar link missing");
assert(nav.includes('ensureContextIcon(root)'),"Context sidebar icon missing");
assert(nav.includes('if(!hydrated||queued)return;'),"Nav link must not patch before React hydration");
assert(css.includes("@media(max-width:750px)"),"Responsive small screen missing");
assert(!/\bfetch\s*\(/.test(script),"Public lab may not fetch protected resources");
assert(!/localStorage|sessionStorage|document\.cookie|XMLHttpRequest/.test(script),
  "Public lab must not persist private data");

// Minimal test DOM exercises actual lab script without browser or dependencies.
class FakeElement {
  constructor(tag="div") {
    this.tagName=tag;
    this.children=[];
    this.listeners={};
    this.textContent="";
    this.className="";
    this.value="";
    this.checked=false;
    this.attrs={};
  }
  append(...nodes){this.children.push(...nodes);}
  appendChild(node){this.children.push(node);}
  replaceChildren(...nodes){this.children=[...nodes];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  setAttribute(key,value){this.attrs[key]=value;}
  fire(type="change"){assert(this.listeners[type],type+" listener missing");this.listeners[type]();}
}
function strings(node) {
  if(!node) return "";
  return [String(node.textContent||""),...(node.children||[]).map(strings)].join(" ");
}
const ids=["lab-task","lab-case","lab-role","lab-budget","lab-withdraw",
 "lab-reset","lab-candidates","lab-admitted","lab-excluded","lab-coverage",
 "lab-window","lab-reasons"];
const controls=Object.fromEntries(ids.map(id=>[id,new FakeElement()]));
controls["lab-task"].value="fee";
controls["lab-case"].value="A";
controls["lab-role"].value="reviewer";
controls["lab-budget"].value="3";
const document={
 getElementById:(id)=>controls[id]||null,
 createElement:(tag)=>new FakeElement(tag)
};
vm.runInNewContext(script,{document,console,Element:FakeElement});
const control=id=>controls[id];
const change=(id,value)=>{control(id).value=value;control(id).fire();};
assert.equal(control("lab-admitted").textContent,"3");
assert.equal(control("lab-coverage").textContent,"Required kinds present");
assert(strings(control("lab-window")).includes("Approved fee ceiling"));
assert(!strings(control("lab-candidates")).includes("Previous decision from Case B"),
  "Cross-case details leaked into candidate list");
assert(!strings(control("lab-reasons")).includes("Previous decision from Case B"),
  "Cross-case details leaked into rejection manifest");

control("lab-withdraw").checked=true;
control("lab-withdraw").fire();
assert.equal(control("lab-coverage").textContent,"Gap → human");
assert(strings(control("lab-window")).includes("Evidence gap: semantic"),
  "Removing authoritative knowledge must trigger a missing memory warning");

control("lab-withdraw").checked=false;
control("lab-withdraw").fire();
change("lab-task","audit");
assert(strings(control("lab-window")).includes("Audit trail procedure"));
assert(strings(control("lab-window")).includes("Prior reviewer correction"),
  "Correct case history must be available for an audit task");
change("lab-case","B");
assert(!strings(control("lab-window")).includes("Prior reviewer correction"),
  "Previous case's episode must be removed when case changes");
assert(strings(control("lab-window")).includes("Previous decision from Case B"));

change("lab-role","reviewer");
change("lab-task","fee");
change("lab-budget","2");
assert.equal(control("lab-admitted").textContent,"2");
control("lab-reset").fire("click");
assert.equal(control("lab-coverage").textContent,"Required kinds present");
assert.equal(control("lab-admitted").textContent,"3");

console.log("Context Engineering: static routes, attribution, role/case isolation, source withdrawal, budget and controls passed.");
