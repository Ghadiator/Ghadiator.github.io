#!/usr/bin/env node
/* Public Context Engineering and Use Case Assessment: hermetic check of the
 * NATIVE static export (source 7.6.5+). The interactive lab is a React
 * component now; its required-source logic is asserted at build time by
 * review_frontend/scripts/check-public-static.mjs in the source repository.
 * This file guards what the published HTML must still carry.
 */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

// ── Use Case Assessment ──
const assessment = read("use-case-assessment/index.html");
for (const id of ["map", "measure", "manage"])
  assert(assessment.includes(`id="${id}"`), "Use case assessment must have distinct Map, Measure, Manage sections");
for (const id of ["policy-govern", "policy-map", "policy-measure", "policy-manage"])
  assert(assessment.includes(`id="${id}"`), "Policy questions must be grouped by RMF function: " + id);
const intake = (assessment.match(/class="rounded-xl border border-\[#d9e5e9\] bg-\[#f5f9fa\] p-4"/g) || []).length;
const policy = (assessment.match(/class="rounded-\[14px\] border border-\[#d3e4e4\] bg-\[#fcfefe\] p-5"/g) || []).length;
assert.equal(intake + policy, 25, "The public assessment must render all 12 answered intake + 13 policy questions");

// ── Context Engineering page ──
const page = read("context-engineering/index.html");
assert(page.includes('class="public-shell"'), "Use the native workbench shell");
assert(page.includes('class="public-sidebar'), "Native dark sidebar missing");
assert(page.includes('aria-label="Main navigation"'), "Shared navigation missing");
for (const id of ["main-content", "invoice-context-flow", "memory-map", "context-lab", "lifecycle", "operating", "assurance"])
  assert(page.includes(`id="${id}"`), "Missing page section/anchor: " + id);
for (const route of ["/architecture", "/ai-assurance", "/safety-origin"])
  assert(page.includes(`href="${route}"`), "Missing navigation: " + route);
assert(page.includes("synthetic"), "Must disclose synthetic examples");
assert(page.includes("AI-First Organization"), "Source attribution missing");

// ── Every public route keeps the same navigation entry ──
const active = JSON.parse(read(".site-release.json")).published_routes;
const canonical = active.includes("failure-lab") && active.includes("workspace/case");
const linked = canonical ? ["index.html", "workspace/index.html", "use-case-assessment/index.html"]
  : ["index.html", "introduction/index.html", "use-case-assessment/index.html"];
for (const route of linked)
  assert(read(route).includes('href="/context-engineering"'), route + ": Context Engineering navigation link missing");

console.log("Context Engineering and Use Case Assessment: native sections, 25 answered questions, attribution and navigation passed.");
