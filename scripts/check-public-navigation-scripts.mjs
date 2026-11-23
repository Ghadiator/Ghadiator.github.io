/**
 * Check public static navigation enhancements and the canonical sidebar.
 * A former Failure Lab compatibility shim moved the link from Governance to
 * Overview after a timeout; that made the sidebar visibly jump on navigation.
 * Every exported shell must retain one stable, native Failure Lab link.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const source = "/assets/recorded-case-source-evidence-20261120.js";
const clarity = "/assets/validation-navigation-clarity-20261120.js";
const manifest = JSON.parse(read(".site-release.json"));
const routes = new Set(manifest.published_routes);
routes.add("404");
let inspectedShells = 0;
for (const route of routes) {
  const path = route === "." ? "index.html" : route + "/index.html";
  const page = read(path);
  for (const script of [source, clarity]) {
    assert.equal(page.split(script).length - 1, 1,
      path + " must include the global route enhancement exactly once: " + script);
  }

  // Some legacy destinations do not contain the public shell. Validate all
  // native sidebars that do, rather than relying only on the home page.
  const nav = page.match(/<nav\b[^>]*class="public-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  if (!nav) continue;
  inspectedShells++;
  const sections = [...nav.matchAll(/<section>([\s\S]*?)<\/section>/g)].map(m => m[1]);
  const failures = sections.filter(s => /href="\/red-team\/?"/.test(s));
  assert.equal(failures.length, 1,
    path + ": Failure Lab must appear exactly once in the sidebar");
  assert.match(failures[0], /<h3>Run-time controls<\/h3>/,
    path + ": Failure Lab must remain in the native Governance > Run-time controls group");
  assert.match(failures[0], /href="\/context-engineering"/,
    path + ": Failure Lab should remain beside Context Engineering");
  assert.match(nav, /href="\/"/, path + ": Introduction link missing");
  assert.match(nav, /href="\/governance"/, path + ": Framework Explorer link missing");
  assert.match(nav, /href="\/red-team"/, path + ": Failure Lab route missing");
  assert.equal((nav.match(/href="\/red-team\/?"/g) || []).length, 1,
    path + ": duplicate Failure Lab links");

  if (route === "red-team") {
    assert.match(nav, /href="\/red-team" aria-current="page"/,
      "Failure Lab must be marked active on its own route");
  }
  if (route === "." || route === "introduction") {
    assert.match(nav, /href="\/" aria-current="page"/,
      "Introduction must remain active on the overview route");
  }
}
assert.ok(inspectedShells >= 10,
  "Too few public native shells verified: " + inspectedShells);

// Compatibility HTML retains this script tag for old cached exports; its
// contents must never reparent a React-owned navigation item on a timer.
const shim = read("assets/failure-lab-nav-position-20261119.js");
assert.doesNotMatch(shim, /(?:setTimeout|insertAdjacentElement|appendChild|replaceChildren)\s*\(/,
  "Failure Lab must not be moved after page load");
assert.ok(read("red-team/index.html").includes("<title>Failure Lab"),
  "Failure Lab route must render its own page");
assert.ok(read("governance/index.html").includes("<title>Governance channels"),
  "Framework Explorer route must render its own page");

assert.ok(read("workspace/index.html")
  .includes("/assets/validation-navigation-clarity-20261120.css"));
assert.ok(read("cases/index.html")
  .includes("/assets/recorded-case-source-evidence-20261120.js"));
console.log("PASS: all " + routes.size + " entry points include route enhancements; " +
  inspectedShells + " native sidebars keep Failure Lab in a stable Governance group.");
