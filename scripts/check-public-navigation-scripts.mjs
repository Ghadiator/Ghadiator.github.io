/**
 * Every statically exported entry point must load navigation enhancement
 * handlers. Otherwise an intra-Next navigation can silently hide the
 * recorded case source panel or reintroduce duplicate workspace tabs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = "/assets/recorded-case-source-evidence-20261120.js";
const clarity = "/assets/validation-navigation-clarity-20261120.js";
const manifest = JSON.parse(readFileSync(new URL("../.site-release.json", import.meta.url)));
const routes = new Set(manifest.published_routes);
routes.add("404");
for (const route of routes) {
  const path = route === "." ? "index.html" : route + "/index.html";
  const page = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  for (const script of [source, clarity]) {
    assert.equal(page.split(script).length - 1, 1,
      path + " must include the global route enhancement exactly once: " + script);
  }
}
assert.ok(readFileSync(new URL("../workspace/index.html", import.meta.url), "utf8")
  .includes("/assets/validation-navigation-clarity-20261120.css"));
assert.ok(readFileSync(new URL("../cases/index.html", import.meta.url), "utf8")
  .includes("/assets/recorded-case-source-evidence-20261120.js"));
console.log("PASS: source-evidence and workspace guidance loaded exactly once in all " +
  routes.size + " statically exported entry points.");