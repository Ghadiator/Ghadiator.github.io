/**
 * Static acceptance for the public recorded-case source evidence module.
 * Verification does not claim a historical XLSX was retained.
 * No private API, production supplier data, or live reviewer authority.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const file = (path) => readFileSync(new URL("../" + path, import.meta.url));
const script = file("assets/recorded-case-source-evidence-20261120.js").toString("utf8");
const css = file("assets/recorded-case-source-evidence-20261120.css").toString("utf8");
const blob = (bytes) =>
  createHash("sha1").update("blob " + bytes.byteLength + "\0")
    .update(bytes).digest("hex");

for (const page of ["case/index.html", "cases/index.html"]) {
  const html = file(page).toString("utf8");
  const marker = '/assets/recorded-case-source-evidence-20261120.js';
  assert.equal(html.split(marker).length - 1, 1, "One enhancement script on " + page);
  assert.match(html, /id="main-content"/);
}
assert.match(css, /\.gac-src-grid/);
assert.match(script, /Read-only reference/);
assert.match(script, /not a preview of an original uploaded XLSX/i);
assert.doesNotMatch(script, /fetch\(["']https?:/);
assert.doesNotMatch(script, /\/api\//);
assert.match(script, /role="status"/);
assert.match(script, /aria-label/);
assert.match(script, /#source-evidence/);

const casesBytes = file("data/cases.json");
const actualCasesBlob = blob(casesBytes);
assert.equal(actualCasesBlob, "0a60ad3044c06d37e21fbef1a3bd6218044643c6");
assert.ok(script.includes(actualCasesBlob), "The browser must pin the actual case-file Git blob");
const data = JSON.parse(casesBytes.toString("utf8"));
assert.equal(data.cases.length, 15);

const scenarioPins = Object.fromEntries(
  [...script.matchAll(/\b(supplier_[a-z_]+): "([0-9a-f]{40})"/g)]
    .map((match) => [match[1], match[2]])
);
assert.equal(Object.keys(scenarioPins).length, 15, "Every recorded scenario must have an identity pin");

for (const c of data.cases) {
  const path = "data/scenarios/" + c.slug + ".json";
  const bytes = file(path);
  assert.equal(blob(bytes), scenarioPins[c.slug], "Source hash drift: " + c.slug);
  const trace = JSON.parse(bytes.toString("utf8"));
  assert.equal(c.slug, trace.slug);
  assert.equal(trace.events.length, c.event_count);
  assert.equal(trace.provenance.exported_event_count, c.event_count);
  assert.deepEqual(trace.events.map((x) => x.seq), trace.events.map((_, i) => i + 1));
  assert.ok((c.findings ?? []).every((finding) =>
    !finding.source_id || finding.source_id === c.submission?.invoice_id));
}

const variance = data.cases.find((c) => c.slug === "supplier_variance_review");
assert.ok(variance?.submission && variance.contract);
assert.equal(variance.event_count, 42);
assert.equal(variance.state, "Approved");
assert.equal(variance.gates[0].decision, "APPROVE");
assert.equal(variance.submission.lines[0].amount, "13000.00");

const qty = Number(variance.submission.lines[0].quantity);
const rate = Number(variance.submission.lines[0].unit_rate);
const lineTotal = Number(variance.submission.lines[0].amount);
const invoiceTotal = Number(variance.submission.total);
const previous = Number(variance.contract.prior_period_total);
const threshold = Number(variance.contract.variance_threshold);
const observed = Number(variance.findings.find((f) => f.code === "volume_variance").observed);
assert.equal(qty * rate, lineTotal, "R1 arithmetic must reconcile");
assert.equal(lineTotal, invoiceTotal, "R2 arithmetic must reconcile");
assert.ok(Math.abs((invoiceTotal - previous) / previous - observed) < 1e-10);
assert.ok(observed > threshold);
assert.match(file("cases/index.html").toString("utf8"), /\/case\/\?id=supplier_variance_review/);
assert.equal(JSON.parse(file("data/backend-config.json")).liveWorkspaceUrl, null);

console.log("Recorded source evidence PASS: 15 pinned fixture traces, " +
  "42-event reference case, R1/R2 arithmetic, 30% vs 20% threshold, " +
  "human outcome, source-route hooks and public-only boundary.");