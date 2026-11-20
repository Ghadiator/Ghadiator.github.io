/* GovernanceAsCode recorded-case source evidence.
 * Public GitHub Pages is a STATIC reference. The historical supplier
 * run recorded JSON, but retained NO original uploaded workbook. This
 * Excel-style grid is reconstructed from the exact recorded fixture fields
 * and never claims to be the original XLSX or a live reviewer console.
 *
 * Integrity: fail closed unless BOTH immutable Git blob identities match.
 * No external scripts, writes, cookies, authentication or approvals.
 */
(function () {
  "use strict";

  var CASES_BLOB = "0a60ad3044c06d37e21fbef1a3bd6218044643c6";
  var SCENARIO_BLOBS = {
    supplier_adapter_failure: "35281ccd9855db73fee5f2aba7d3502c5018610d",
    supplier_clean: "6898f0fcd7d234577b06b7c02f9c96c4e98e39e1",
    supplier_currency_mismatch: "67756a646e3cbe76f75a2dafc08268554ebc1306",
    supplier_duplicate: "cd67de9db948938fb169fb0305371cd985a587e4",
    supplier_injection: "142c871266dc6671448b297068f64ddbf14ca9c4",
    supplier_invalid: "bd667672471b19a2c81f7618db00edbca5fb93a7",
    supplier_invented_narrative: "911ae9693d830a096bbacc80af534886f4edaace",
    supplier_missing_document: "231eab04f35ec1d3c3a111450400801dc6a3426b",
    supplier_over_limit: "955aa7e5a3f8acfb72e735f97686e82d3726d853",
    supplier_pending: "7f68938869948e9e2ca11445de1db1b4c1174cb1",
    supplier_proposal_budget: "dfd075084e3e62a20f6321206f07f27cb502ba17",
    supplier_rate_correction: "851de7ec963172c5095d2c4d75b30a16db83bed8",
    supplier_total_mismatch: "cb78b09830a46b5a22e9bc87643813f1d6a28485",
    supplier_unsupported_claim: "b4d3771dd96b1fa40d02e358572a2474d320770b",
    supplier_variance_review: "a8453e2181da74e5cad94809f7e89d815a8b41fa"
  };
  var css = "/assets/recorded-case-source-evidence-20261120.css";
  var prefix = "gac-src-";
  var app = null;
  var selected = null;
  var selectedSheet = "Submission";
  var active = [];
  var pinned = [];
  var sheets = [];
  var lookup = {};
  var renderReady = false;

  function esc(input) {
    return String(input == null ? "" : input)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function asText(value) {
    if (value === null) return "null";
    if (value === undefined) return "(not recorded)";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }
  function letter(column) {
    var out = "";
    for (var i = column; i > 0; i = Math.floor((i - 1) / 26)) {
      out = String.fromCharCode(65 + (i - 1) % 26) + out;
    }
    return out;
  }
  function dataKey(sheet, address) { return sheet + "!" + address; }

  async function verifyJSON(url, expected) {
    var response = await fetch(url, { cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error("Published reference file unavailable (" + response.status + ").");
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Browser cannot verify recorded fixture identity; evidence is withheld.");
    }
    var bytes = new Uint8Array(await response.arrayBuffer());
    var header = new TextEncoder().encode("blob " + bytes.byteLength + "\u0000");
    var payload = new Uint8Array(header.length + bytes.length);
    payload.set(header);
    payload.set(bytes, header.length);
    var digest = await window.crypto.subtle.digest("SHA-1", payload);
    var sha = Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    if (sha !== expected) {
      throw new Error("Recorded source Git blob differs from pinned identity. Evidence withheld.");
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function addFieldRows(name, object, keys, root) {
    var rows = [["Attribute", "Recorded value", "Typed JSON path"]];
    keys.forEach(function (spec) {
      var field = spec[0], label = spec[1];
      if (!object || !Object.prototype.hasOwnProperty.call(object, field)) return;
      var path = root + "." + field;
      var number = rows.length + 1;
      rows.push([label, asText(object[field]), path]);
      lookup[path] = { sheet: name, address: "B" + number, value: object[field] };
    });
    return { name: name, rows: rows };
  }

  function buildWorkbook(record) {
    lookup = {};
    var sub = record.submission || {};
    var contract = record.contract || {};
    var submissionFields = [
      ["invoice_id", "Invoice ID"], ["supplier_id", "Supplier ID"],
      ["purchase_order", "Purchase order"], ["currency", "Currency"],
      ["invoice_date", "Invoice date"], ["period_start", "Period start"],
      ["period_end", "Period end"], ["total", "Invoice total"],
      ["version", "Submission version"], ["documents", "Documents"],
      ["missing_documents", "Missing documents"]
    ];
    var contractFields = [
      ["contract_id", "Contract ID"], ["supplier_id", "Approved supplier"],
      ["purchase_order", "Approved PO"], ["currency", "Approved currency"],
      ["prior_period_total", "Previous period total"],
      ["spending_limit", "Spending limit"],
      ["variance_threshold", "Volume variance threshold"],
      ["valid_from", "Contract valid from"], ["valid_to", "Contract valid to"],
      ["version", "Reference version"],
      ["required_documents", "Required documents"]
    ];
    var output = [
      addFieldRows("Submission", sub, submissionFields, "submission")
    ];
    var lines = [["Service code", "Quantity", "Unit rate", "Amount"]];
    (Array.isArray(sub.lines) ? sub.lines : []).forEach(function (item, index) {
      var rowNo = lines.length + 1;
      lines.push(["service_code", "quantity", "unit_rate", "amount"].map(
        function (k) {
          var path = "submission.lines[" + index + "]." + k;
          if (!Object.prototype.hasOwnProperty.call(item, k)) return "";
          lookup[path] = { sheet: "LineItems", address: letter(["service_code", "quantity", "unit_rate", "amount"].indexOf(k) + 1) + rowNo, value: item[k] };
          return asText(item[k]);
        }
      ));
    });
    output.push({ name: "LineItems", rows: lines });
    output.push(addFieldRows("Contract reference", contract, contractFields, "contract"));
    return output;
  }

  function refs(paths) {
    var result = [];
    paths.forEach(function (path) {
      if (lookup[path]) result.push(lookup[path]);
    });
    return result;
  }
  function checkIntegrity(record, scenario) {
    if (record.slug !== scenario.slug ||
        !Array.isArray(scenario.events) ||
        !scenario.provenance ||
        scenario.provenance.exported_event_count !== scenario.events.length ||
        record.event_count !== scenario.events.length) {
      throw new Error("Case details and recorded run events disagree; evidence withheld.");
    }
    var last = 0;
    scenario.events.forEach(function (event) {
      if (!Number.isInteger(event.seq) || event.seq <= last) {
        throw new Error("Recorded event sequence is inconsistent.");
      }
      last = event.seq;
    });
    if (record.findings && record.submission &&
        record.findings.some(function (f) {
          return f.source_id && f.source_id !== record.submission.invoice_id;
        })) {
      throw new Error("Recorded finding refers to a different invoice.");
    }
  }

  function amount(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function provenanceForFinding(record, finding) {
    if (finding.code !== "volume_variance") return null;
    var s = record.submission || {}, c = record.contract || {};
    var total = amount(s.total), previous = amount(c.prior_period_total);
    var cap = amount(c.variance_threshold), recorded = amount(finding.observed);
    if (total === null || previous === null || previous <= 0 ||
        cap === null || recorded === null) return null;
    var ratio = (total - previous) / previous;
    // This is a CHECK of the published fixture, not the original engine run.
    if (Math.abs(ratio - recorded) > 0.0000001 || ratio <= cap) return null;
    return {
      paths: ["submission.total", "contract.prior_period_total", "contract.variance_threshold"],
      explanation: "(" + s.total + " − " + c.prior_period_total + ") ÷ " +
        c.prior_period_total + " = " + (ratio * 100).toFixed(1) +
        "%; agreed threshold = " + (cap * 100).toFixed(1) +
        "%. Independent arithmetic replay agrees with the recorded observation.",
      verified: true
    };
  }

  // These are input references for explicitly named, implemented supplier
  // fixture rules, NOT source coordinates from an uploaded Excel workbook.
  var CHECK_INPUTS = {
    R1: ["submission.lines[0].quantity", "submission.lines[0].unit_rate", "submission.lines[0].amount"],
    R2: ["submission.total", "submission.lines[0].amount"],
    R3: ["submission.period_start", "submission.period_end"],
    R4: ["submission.invoice_date", "submission.period_end"],
    R5: ["submission.lines[0].service_code"],
    R6: ["submission.documents", "contract.required_documents", "submission.missing_documents"]
  };

  var CONTRACT_INPUTS = {
    "Supplier matches contract registry": ["submission.supplier_id", "contract.supplier_id"],
    "Contract identifier matches": ["contract.contract_id"],
    "Purchase order matches": ["submission.purchase_order", "contract.purchase_order"],
    "Currency matches contract": ["submission.currency", "contract.currency"],
    "Service period is covered by contract": [
      "submission.period_start", "submission.period_end",
      "contract.valid_from", "contract.valid_to"
    ],
    "Rates match approved rate card": ["submission.lines[0].unit_rate"],
    "Invoice total stays within spending limit": ["submission.total", "contract.spending_limit"],
    "Invoice is not already approved": ["submission.invoice_id"]
  };

  function contractCheckEvent(scenario, check, attempt) {
    var matching = scenario.events.filter(function (ev) {
      return ev.kind === "contract.check" && ev.label &&
        ev.label.startsWith(check + " — ");
    });
    return matching[attempt - 1] || null;
  }

  function contractCheckExplanation(record, check) {
    var s = record.submission || {}, c = record.contract || {};
    if (check === "Currency matches contract" && s.currency != null && c.currency != null) {
      return "Submitted currency " + s.currency + " vs approved contract currency " +
        c.currency + (s.currency === c.currency ? " — matches." : " — mismatch.");
    }
    if (check === "Purchase order matches" && s.purchase_order && c.purchase_order) {
      return "Submitted PO " + s.purchase_order + " vs recorded approved PO " +
        c.purchase_order + (s.purchase_order === c.purchase_order ? " — matches." : " — mismatch.");
    }
    if (check === "Supplier matches contract registry" && s.supplier_id && c.supplier_id) {
      return "Submitted supplier ID " + s.supplier_id + " vs recorded reference " +
        c.supplier_id + (s.supplier_id === c.supplier_id ? " — matches." : " — mismatch.");
    }
    if (check === "Invoice total stays within spending limit" &&
        amount(s.total) !== null && amount(c.spending_limit) !== null) {
      return "Submitted invoice " + s.total + " vs documented limit " + c.spending_limit +
        (amount(s.total) <= amount(c.spending_limit) ? " — within limit." : " — exceeds limit.");
    }
    if (check === "Rates match approved rate card") {
      return "Only the submitted unit rate is in this public snapshot. The approved rate card is not retained here; inspect the numbered recorded check event, not a fabricated reference cell.";
    }
    if (check === "Invoice is not already approved") {
      return "The durable approved-invoice register is not part of the historical public fixture; no duplicate-check reference cell is asserted.";
    }
    if (check === "Contract identifier matches") {
      return "Only the approved contract identifier is present in the published case object. The full input-to-reference comparison is not independently replayable.";
    }
    return "Recorded check verdict from the numbered fixture event. No claim of an independent source-value replay for this check.";
  }

  function recordedCheckEvent(scenario, id, attempt) {
    var matching = scenario.events.filter(function (e) {
      return e.kind === "checks.rule" && e.label &&
        new RegExp("^" + id + " (PASS|FAIL)").test(e.label);
    });
    // Multiple submission attempts execute the same rule again. Never
    // substitute attempt 1's event as evidence for attempt 2.
    return matching[attempt - 1] || null;
  }

  function ruleFieldPaths(record, id) {
    var lines = (record.submission && record.submission.lines) || [];
    if (id === "R1") return lines.flatMap(function (line, n) {
      return ["quantity", "unit_rate", "amount"].filter(function (key) {
        return Object.prototype.hasOwnProperty.call(line, key);
      }).map(function (key) { return "submission.lines[" + n + "]." + key; });
    });
    if (id === "R2") return ["submission.total"].concat(
      lines.map(function (_, n) { return "submission.lines[" + n + "].amount"; })
    );
    if (id === "R5") return lines.map(function (_, n) {
      return "submission.lines[" + n + "].service_code";
    });
    return CHECK_INPUTS[id] || [];
  }

  function replayRule(record, id) {
    var sub = record.submission || {}, lines = sub.lines || [];
    if (id === "R1" && lines.length) {
      var parts = lines.map(function (line, n) {
        var q = amount(line.quantity), rate = amount(line.unit_rate), a = amount(line.amount);
        if (q === null || rate === null || a === null) return null;
        return "Line " + (n + 1) + ": " + q + " × " + rate + " = " +
          (q * rate).toFixed(2) + "; recorded " + line.amount +
          (Math.abs(q * rate - a) <= 0.0000001 ? " (agrees)" : " (disagrees)");
      });
      if (parts.every(function (part) { return part !== null; })) {
        return parts.join("; ") + ".";
      }
    }
    if (id === "R2" && lines.length) {
      var amounts = lines.map(function (l) { return amount(l.amount); });
      var sum = amounts.every(function (x) { return x !== null; })
        ? amounts.reduce(function (a, b) { return a + b; }, 0) : null;
      var total = amount(sub.total);
      if (sum !== null && total !== null) {
        return "Line sum " + sum.toFixed(2) + "; recorded invoice total " + sub.total +
          ((Math.abs(sum - total) <= 0.0000001) ? " — arithmetic agrees." : " — arithmetic disagrees.");
      }
    }
    return "See the recorded rule event. No independent arithmetic replay asserted for this check.";
  }

  function sourceButton(reference, label) {
    return '<button type="button" class="gac-src-ref" data-gac-ref="' +
      esc(dataKey(reference.sheet, reference.address)) + '">' + esc(label || (reference.sheet + "!" + reference.address)) + "</button>";
  }

  function showSheet() {
    if (!app) return;
    var target = app.querySelector("[data-gac-grid]");
    var sheet = sheets.find(function (item) { return item.name === selectedSheet; });
    if (!sheet || !target) return;
    var max = Math.max.apply(null, sheet.rows.map(function (row) { return row.length; }));
    var html = '<table class="gac-src-grid"><thead><tr><th scope="col">#</th>';
    for (var c = 1; c <= max; c++) html += "<th scope=\"col\">" + letter(c) + "</th>";
    html += "</tr></thead><tbody>";
    sheet.rows.forEach(function (row, idx) {
      html += "<tr><th scope=\"row\">" + (idx + 1) + "</th>";
      for (var j = 0; j < max; j++) {
        var address = letter(j + 1) + (idx + 1), key = dataKey(sheet.name, address);
        var mapped = Object.entries(lookup).find(function (pair) {
          return dataKey(pair[1].sheet, pair[1].address) === key;
        });
        var value = row[j] === undefined ? "" : asText(row[j]);
        html += '<td><button type="button" class="gac-src-cell' +
          (mapped ? " is-mapped" : "") +
          '" data-gac-ref="' + esc(key) + '" aria-label="' +
          esc(sheet.name + " " + address + " " + value) + '" title="' +
          esc((mapped ? mapped[0] + " · " : "") + value) + '">' +
          esc(value || "\u00a0") + "</button></td>";
      }
      html += "</tr>";
    });
    target.innerHTML = html + "</tbody></table>";
    app.querySelectorAll("[data-gac-sheet]").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.dataset.gacSheet === selectedSheet));
    });
    highlight();
  }

  function highlight() {
    if (!app) return;
    var chosen = active.length ? active : pinned;
    var keys = new Set(chosen.map(function (r) { return dataKey(r.sheet, r.address); }));
    app.querySelectorAll("[data-gac-ref]").forEach(function (el) {
      el.classList.toggle("is-selected", keys.has(el.dataset.gacRef));
    });
    var status = app.querySelector("[data-gac-current-cell]");
    if (!status) return;
    if (!chosen.length) {
      status.textContent = "Hover a finding or click a recorded-value cell to inspect its typed path.";
      return;
    }
    var first = chosen[0];
    var found = Object.entries(lookup).find(function (pair) {
      return dataKey(pair[1].sheet, pair[1].address) === dataKey(first.sheet, first.address);
    });
    status.textContent = chosen.map(function (r) {
      return r.sheet + "!" + r.address;
    }).join(", ") + (found ? " · " + found[0] + " = " + asText(found[1].value) : " · display coordinate only");
  }

  function selectPaths(paths, permanent) {
    var items = refs(paths);
    if (!items.length) return;
    if (permanent) { pinned = items; active = []; }
    else active = items;
    if (!items.some(function (r) { return r.sheet === selectedSheet; })) {
      selectedSheet = items[0].sheet;
      showSheet();
    } else highlight();
  }

  function renderCase(record, scenario) {
    selected = record;
    sheets = buildWorkbook(record);
    selectedSheet = "Submission";
    active = [];
    pinned = [];
    var findingCards = (record.findings || []).map(function (f, i) {
      var p = provenanceForFinding(record, f);
      var actualRefs = p ? refs(p.paths) : [];
      return '<article class="gac-src-finding" data-gac-paths="' +
        esc(p ? p.paths.join("|") : "") + '" tabindex="0">' +
        '<div class="gac-src-line"><strong>' + esc(f.code || "Recorded finding") +
        '</strong><span class="gac-src-chip">Recorded finding</span></div>' +
        '<p>' + esc(f.text || "") + '</p>' +
        (p ? '<p class="gac-src-compute">' + esc(p.explanation) + '</p>' : "") +
        '<div class="gac-src-paths">' +
        (actualRefs.length ? actualRefs.map(function (r) {
          return sourceButton(r);
        }).join("") : '<span class="gac-src-quiet">No uniquely justified field mapping from this historical fixture.</span>') +
        '</div></article>';
    }).join("");

    var rules = (record.checks || []).filter(function (c) { return c.attempt === record.attempts; })
      .map(function (c) {
        var event = recordedCheckEvent(scenario, c.id, c.attempt);
        var paths = ruleFieldPaths(record, c.id);
        var evGood = event && event.label.indexOf(c.ok ? " PASS " : " FAIL ") > 0;
        return '<details class="gac-src-rule" data-gac-paths="' + esc(paths.join("|")) + '">' +
          '<summary>' + esc(c.id) + ' · ' + esc(c.name) +
          ' <strong>' + (c.ok ? "PASS" : "FAIL") + '</strong>' +
          (evGood ? '<span class="gac-src-event">event #' + event.seq + '</span>' : "") +
          '</summary><p>' + esc(replayRule(record, c.id)) + '</p>' +
          '<div class="gac-src-paths">' + refs(paths).map(function (r) { return sourceButton(r); }).join("") + '</div>' +
          (!evGood ? '<p class="gac-src-quiet">No exactly matching recorded event; check identity not independently confirmed.</p>' : '') +
          '</details>';
      }).join("");

    var contractRules = (record.contract_checks || []).map(function (c) {
      var event = contractCheckEvent(scenario, c.name, c.attempt);
      var recordedVerdict = event && event.label.endsWith(c.ok ? " — PASS" : " — FAIL");
      var paths = CONTRACT_INPUTS[c.name] || [];
      var cellRefs = refs(paths);
      return '<details class="gac-src-rule" data-gac-paths="' + esc(paths.join("|")) + '">' +
        '<summary>Attempt ' + c.attempt + ' · ' + esc(c.name) +
        ' <strong>' + (c.ok ? "PASS" : "FAIL") + '</strong>' +
        (recordedVerdict ? '<span class="gac-src-event">event #' + event.seq + '</span>' : "") +
        '</summary><p>' + esc(contractCheckExplanation(record, c.name)) + '</p>' +
        '<div class="gac-src-paths">' +
        (cellRefs.length ? cellRefs.map(function (ref) { return sourceButton(ref); }).join("") :
          '<span class="gac-src-quiet">No recorded source fields uniquely justify a cell link.</span>') +
        '</div>' +
        (!recordedVerdict ? '<p class="gac-src-quiet">An exact recorded check event for this attempt could not be verified.</p>' : '') +
        '</details>';
    }).join("");

    var failedChecks = (record.checks || []).filter(function (c) { return !c.ok; });
    var failedContractChecks = (record.contract_checks || []).filter(function (c) { return !c.ok; });
    var selectedEvidencePaths = (record.findings || []).map(function (finding) {
      var mapped = provenanceForFinding(record, finding);
      return mapped ? mapped.paths : [];
    }).flat();
    if (!selectedEvidencePaths.length && failedContractChecks.length) {
      selectedEvidencePaths = CONTRACT_INPUTS[failedContractChecks[0].name] || [];
    }
    if (!selectedEvidencePaths.length && failedChecks.length) {
      selectedEvidencePaths = ruleFieldPaths(record, failedChecks[0].id);
    }
    var defaultRefs = refs(selectedEvidencePaths);
    if (defaultRefs.length) pinned = defaultRefs;

    var eventProof = scenario.events.filter(function (event) {
      return ["committee.opponent.argument", "verification.result", "committee.judge.argument"].includes(event.kind);
    });
    var evidenceStory = "";
    if ((record.findings || []).some(function (f) { return f.code === "volume_variance"; })) {
      var finding = record.findings.find(function (f) { return f.code === "volume_variance"; });
      var proof = provenanceForFinding(record, finding);
      var cve = eventProof.find(function (e) { return e.kind === "verification.result" && String(e.detail).startsWith("volume_variance:"); });
      var proposal = eventProof.find(function (e) { return e.kind === "committee.opponent.argument"; });
      var judge = eventProof.find(function (e) { return e.kind === "committee.judge.argument"; });
      evidenceStory =
        '<div class="gac-src-story" aria-label="Reconstructed calculation and recorded checkpoints">' +
        '<div class="gac-src-story-step"><strong>1 · Source values</strong><p>Invoice total ' +
        sourceButton(lookup["submission.total"], asText(record.submission.total)) +
        ' and earlier period ' +
        sourceButton(lookup["contract.prior_period_total"], asText(record.contract.prior_period_total)) +
        '. The threshold ' +
        sourceButton(lookup["contract.variance_threshold"], asText(Number(record.contract.variance_threshold) * 100) + "%") +
        ' is on the <em>contract reference</em>, not the submission.</p></div>' +
        '<div class="gac-src-story-step"><strong>2 · Reproduce the check</strong><p>' +
        esc(proof ? proof.explanation : "No independently reconcilable numeric evidence.") +
        '</p></div>' +
        '<div class="gac-src-story-step"><strong>3 · Recorded challenge and verification</strong><p>' +
        (proposal ? "Opponent proposed the exception in recorded event #" + proposal.seq + ". " : "No recorded opponent proposal. ") +
        (cve ? "A structured claim was checked in event #" + cve.seq + ". " : "No structured verification event. ") +
        (judge ? "The scripted Judge packaged it in event #" + judge.seq + "." : "") +
        ' <span class="gac-src-quiet">Scripted reference roles; no live LLM inference or independently verified Proponent argument.</span></p></div>' +
        '</div>';
    } else if (failedChecks.length || failedContractChecks.length) {
      var failure = failedContractChecks[0];
      var first = failure
        ? contractCheckEvent(scenario, failure.name, failure.attempt)
        : recordedCheckEvent(scenario, failedChecks[0].id, failedChecks[0].attempt);
      evidenceStory =
        '<div class="gac-src-story" aria-label="Failed check and recorded decision">' +
        '<div class="gac-src-story-step"><strong>1 · Recorded failed check</strong><p>' +
        esc(failure ? failure.name : failedChecks[0].name) +
        (first ? ' · event #' + first.seq : " · event identity unavailable") +
        '</p></div>' +
        '<div class="gac-src-story-step"><strong>2 · Inputs and method</strong><p>' +
        esc(failure ? contractCheckExplanation(record, failure.name) : replayRule(record, failedChecks[0].id)) +
        '</p></div>' +
        '<div class="gac-src-story-step"><strong>3 · Recorded follow-up</strong><p>' +
        esc(record.attempts > 1 ? "The fixture includes a later submission attempt; inspect the attempt-specific rule events below." :
            "The failure is retained in the recorded case, and a human decision or correction gate follows.") +
        '</p></div></div>';
    }
    var actor = (record.gates || [])[0];
    var worksheets = sheets.map(function (sheet) {
      return '<button class="gac-src-tab" type="button" role="tab" data-gac-sheet="' + esc(sheet.name) +
        '" aria-selected="' + (sheet.name === selectedSheet) + '">' + esc(sheet.name) + "</button>";
    }).join("");

    app.innerHTML =
      '<div class="gac-src-top">' +
        '<div><p class="gac-src-kicker">Recorded case · source evidence</p>' +
        '<h2>Show me where you found it</h2>' +
        '<p class="gac-src-intro">' + esc(record.title || record.slug) +
        ' · ' + esc(record.case_id || "Recorded scenario") +
        ' · <strong>' + scenario.events.length + ' verified event records</strong></p></div>' +
        '<span class="gac-src-chip">Read-only reference</span></div>' +
      '<ol class="gac-src-walkthrough" aria-label="How to inspect this case">' +
        '<li><strong>1 · Start with the finding</strong><span>Which comparison or rule raised it?</span></li>' +
        '<li><strong>2 · Locate the source</strong><span>Click a value to jump to its recorded field.</span></li>' +
        '<li><strong>3 · Inspect the check</strong><span>Reproduce arithmetic or open the recorded event.</span></li>' +
        '<li><strong>4 · See human accountability</strong><span>Read the archived reviewer action and reason.</span></li>' +
      '</ol>' +
      '<p class="gac-src-truth"><strong>Evidence boundary:</strong> this is an Excel-style projection of the ' +
        '<em>recorded synthetic supplier fixture</em>, not a preview of an original uploaded XLSX. ' +
        'The historical public run did not retain an original workbook. Every displayed input comes ' +
        'from the pinned recorded case JSON; neither an upload nor a human approval is performed here.</p>' +
      evidenceStory +
      '<div class="gac-src-layout">' +
        '<div class="gac-src-workbook">' +
          '<div class="gac-src-bar"><strong>Recorded fields · spreadsheet view</strong>' +
            '<div class="gac-src-tabs" role="tablist" aria-label="Recorded source sections">' + worksheets + '</div></div>' +
          '<div data-gac-grid class="gac-src-scroll" role="region" aria-label="Recorded fixture values in spreadsheet layout" tabindex="0"></div>' +
          '<p data-gac-current-cell class="gac-src-selected" role="status" aria-live="polite"></p>' +
          '<p class="gac-src-quiet">Coordinates refer to this generated display grid only, not to a historical XLSX. ' +
            'The typed JSON path identifies the actual recorded source field.</p>' +
        '</div>' +
        '<div class="gac-src-reasoning">' +
          '<h3>Show me how you did it</h3>' +
          '<p class="gac-src-quiet">Select a finding to locate its known input fields; arithmetic is replayed independently. ' +
            'The check verdict, human decision and numbered event sequence come from the recorded run.</p>' +
          (findingCards || '<p class="gac-src-quiet">No recorded machine finding on this case.</p>') +
          (contractRules ? '<details class="gac-src-rules gac-src-contract"><summary>Tier 2 · Recorded contract checks (' +
            (record.contract_checks || []).length + ')</summary>' + contractRules + '</details>' : '') +
          '<details class="gac-src-rules"><summary>Recorded deterministic rule checks (' +
            (record.checks || []).length + ')</summary>' + rules + '</details>' +
          '<div class="gac-src-decision"><strong>Recorded human outcome</strong>' +
            '<p>' + esc((record.state || scenario.outcome.terminal_state)) +
            (actor ? ' · ' + esc(actor.reviewer) + ' · audit #' + actor.seq : '') + '</p>' +
            (actor ? '<p class="gac-src-quiet">' + esc(actor.rationale) + '</p>' : '') +
            '<p class="gac-src-quiet">Historical recorded action; no decision control on public Pages.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="gac-src-provenance"><strong>Recorded source:</strong> ' +
        '<a href="/data/cases.json" target="_blank" rel="noopener">cases.json</a> · Git blob ' +
        esc(CASES_BLOB.substring(0, 14)) + '… &nbsp;|&nbsp; ' +
        '<a href="/data/scenarios/' + encodeURIComponent(record.slug) +
        '.json" target="_blank" rel="noopener">event trace</a> · Git blob ' +
        esc(SCENARIO_BLOBS[record.slug].substring(0, 14)) + '… &nbsp;|&nbsp; ' +
        'Scripted recorded fixture, not live models or private client data.</p>';

    showSheet();
    if (pinned.length) highlight();
    renderReady = true;
    app.addEventListener("click", function (ev) {
      var tab = ev.target.closest("[data-gac-sheet]");
      if (tab) { selectedSheet = tab.dataset.gacSheet; showSheet(); return; }
      var item = ev.target.closest("[data-gac-ref]");
      if (item) {
        var parts = item.dataset.gacRef.split("!");
        pinned = [{ sheet: parts[0], address: parts[1] }];
        active = [];
        selectedSheet = parts[0];
        showSheet();
        return;
      }
      var finding = ev.target.closest("[data-gac-paths]");
      if (finding && finding.dataset.gacPaths) {
        selectPaths(finding.dataset.gacPaths.split("|"), true);
      }
    });
    app.addEventListener("mouseover", function (ev) {
      var source = ev.target.closest("[data-gac-paths]");
      if (source && source.dataset.gacPaths) selectPaths(source.dataset.gacPaths.split("|"), false);
    });
    app.addEventListener("mouseout", function (ev) {
      var source = ev.target.closest("[data-gac-paths]");
      if (source && !source.contains(ev.relatedTarget)) {
        active = [];
        highlight();
      }
    });
    app.addEventListener("focusin", function (ev) {
      var source = ev.target.closest("[data-gac-paths]");
      if (source && source.dataset.gacPaths) selectPaths(source.dataset.gacPaths.split("|"), false);
    });
    app.addEventListener("focusout", function (ev) {
      var source = ev.target.closest("[data-gac-paths]");
      if (source && !source.contains(ev.relatedTarget)) { active = []; highlight(); }
    });
    if (window.location.hash === "#source-evidence") {
      setTimeout(function () { if (app && app.isConnected) app.scrollIntoView({ behavior: "smooth", block: "start" }); }, 250);
    }
  }

  function ensureMounted() {
    var main = document.getElementById("main-content");
    if (!main) return;
    if (!app) {
      app = document.createElement("section");
      app.id = "source-evidence";
      app.className = "gac-src-panel";
      app.setAttribute("aria-label", "Recorded source evidence");
      app.innerHTML = '<p class="gac-src-quiet">Verifying recorded source and event identities…</p>';
    }
    if (!app.isConnected) {
      var intro = main.querySelector(".page-lead");
      if (intro) intro.after(app);
      else main.appendChild(app);
    }
  }

  var activeRouteKey = null;

  async function caseMode(slug, key) {
    if (!slug || !Object.prototype.hasOwnProperty.call(SCENARIO_BLOBS, slug)) return;
    ensureMounted();
    try {
      var records = await verifyJSON("/data/cases.json", CASES_BLOB);
      var scenario = await verifyJSON("/data/scenarios/" + slug + ".json", SCENARIO_BLOBS[slug]);
      // A Next.js navigation may have changed the route during a fetch.
      // Never display another case's data in this case's evidence panel.
      if (activeRouteKey !== key) return;
      var record = (records.cases || []).find(function (c) { return c.slug === slug; });
      if (!record) throw new Error("No verified recorded case for this route.");
      checkIntegrity(record, scenario);
      ensureMounted();
      renderCase(record, scenario);
    } catch (error) {
      if (activeRouteKey !== key) return;
      ensureMounted();
      if (!app) return;
      app.innerHTML = '<p class="gac-src-error" role="alert"><strong>Source evidence withheld.</strong> ' +
        esc(error.message || String(error)) + '</p>';
    }
  }

  function casesMode() {
    var main = document.getElementById("main-content");
    if (!main) return;
    main.querySelectorAll('a[href^="/case/?id="]').forEach(function (link) {
      var parsed = new URL(link.href, window.location.origin);
      var slug = parsed.searchParams.get("id");
      if (!Object.prototype.hasOwnProperty.call(SCENARIO_BLOBS, slug)) return;
      if (parsed.hash !== "#source-evidence") {
        parsed.hash = "source-evidence";
        link.href = parsed.pathname + parsed.search + parsed.hash;
        link.title = "Recorded case: inspect source fields, validation methods and event evidence";
      }
    });
  }

  function updateRoute() {
    var path = window.location.pathname.replace(/\/+$/, "");
    var slug = new URLSearchParams(window.location.search).get("id");
    var key = path === "/case" ? path + "?id=" + slug : path;
    if (path !== "/cases" && path !== "/case") {
      activeRouteKey = null;
      if (app && app.isConnected) app.remove();
      app = null;
      return;
    }
    if (activeRouteKey !== key) {
      if (app && app.isConnected) app.remove();
      app = null;
      activeRouteKey = key;
      if (path === "/case") caseMode(slug, key);
    }
    if (path === "/cases") casesMode();
    else if (app && !app.isConnected) ensureMounted();
  }

  function init() {
    if (!document.querySelector('link[href="' + css + '"]')) {
      var style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = css;
      document.head.appendChild(style);
    }
    // The static export streams a React Server Component payload. Inserting
    // a source panel into the React-owned <main> while initial hydration is
    // still attaching can create #418 mismatches. Attach only after the
    // compiled client has had its hydration window; SPA transitions after
    // this point are already client-rendered and can update immediately.
    var ready = false;
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (!ready || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        updateRoute();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      ready = true;
      updateRoute();
    }, 2400);
    window.addEventListener("popstate", function () {
      if (ready) window.requestAnimationFrame(updateRoute);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();