# Governance as Code — Automated Supplier Submission Review

The built output of a working reference implementation, published as a static
site.

Live at: **https://ghadiator.github.io/**

## What this is

The built output of a working system, not a description of one. The page
replays traces emitted by the implementation executing its own synthetic
fixtures — no event was written by hand — and every mechanism it claims points
at the file that enforces it.

The demonstrated use case is **reviewing recurring service-provider billing
submissions** against an approved contract, rate card, purchase order,
supporting documents and spending limit. Classification follows intended
purpose: this is not presented as an Annex III high-risk use case, and nothing
here is a conformity assessment or certification.

## What it shows

- **Architecture** — the connected workflow from collection request through
  reminders, intake, deterministic checks, contract cross-check, bounded
  adversarial review, evidence verification, the reviewer gate, the correction
  loop and the archive. A recorded run walks all of it, suspending at **every**
  human gate.

  The diagram distinguishes the published supplier-invoice fixture from a broader
  validation-workflow source architecture. In that broader source,
  **Proponent and Opponent** both pass through **pre-Judge CoVe**;
  the Judge then sends its newly synthesized claims through **post-Judge CoVe**.
  Token/call budgets and configured fallbacks support bounded recovery without
  bypassing verification or the human decision gate. The main orchestration
  mechanism there is a **LangGraph StateGraph**. It emits process transitions
  and other typed events to a **ProcessEvent pool**, which supports audit and
  case continuity.

  The supplier fixture replay is deliberately smaller: scripted personas,
  one recorded Opponent-finding verifier, a Python SupplierWorkflow state
  machine, and in-memory audit events. The additional source-architecture
  stages are marked as such and are not presented as executed supplier events.
  Reminders remain implemented but the canvas uses plain-language labels.

- **Compliance** — classification before compliance, then obligation →
  mechanism → evidence across the EU AI Act, ISO/IEC 42001 and NIST AI RMF.
  Every row states what it does *not* establish.
- **Assurance** — eight hazards, each shown with the control it required, the
  file implementing it, the test exercising it and **the residual risk it does
  not cover**; then the control set, the threat-to-defence mapping, and
  executed control probes. The derivation comes first: a control list says what
  the system does, not what the controls were derived from.
- **Evidence** — the complete ordered event record of any recorded run, with
  JSON download.

## Scope — what runs and what is a fixture

### Reading the Architecture Explorer

Every recorded case is coordinated by `SupplierWorkflow`. The explorer shows
this workflow-wide role as coordinating, paused for a reviewer, waiting for a
supplier, or complete. The broader design uses LangGraph; the supplier traces
do not claim to execute that framework.

Each row in **Workflow event log** is one original `Event` appended by
`SupplierWorkflow.emit()`. `kind` describes the action, `node` is the recorded
local owner, and `seq` orders the trace. `ts_rel` is an ordinal index, not elapsed
time. `audit.row_appended` is specifically an allowed state transition; other
records describe checks, proposals, verification, human decisions and archives.

The shared `assets/architecture-run-model.js` maps those source records to the
graph, module cards and inspector. Supporting control evidence is explicit:
`security.input` is owned by Case history but also evidences the input boundary;
`contract.snapshot_loaded` evidences the reference input; guarded adapter results
evidence bounded participation without inventing an Opponent argument. Evidence
counts can overlap. The underlying event list and source owners remain unchanged.
Post-Judge CoVe, live token metering and model fallback remain broader design
features. The recorded event log is `SupplierWorkflow.events`, distinct from the
broader generic `ProcessEvent` pool.

Correction-case status follows the latest validation pass while preserving all
earlier failure records. The end of a replay does not imply a completed case:
unresolved reviewer and supplier waits remain visible.

`node scripts/check-architecture-run-model.cjs` checks all 15 cases at every
playback position. With the engineering source and its Python dependencies
available, `python3 scripts/check-supplier-source.py /path/to/generic-agentic-validation`
reruns each source scenario and compares its entire export, outcome and
provenance with the published JSON.

Everything on the critical path executes: the state machine, Decimal
arithmetic, contract cross-checks, the evidence verifier, the reviewer gate
and the correction loop.

These are fixtures, not integrations:

- The proponent, opponent and Judge roles are **scripted stand-ins**. No live
  model is called, so nothing here measures model behaviour.
- Contract snapshots, the duplicate-invoice register, the reminder outbox and
  the archive are **in-memory**. There is no ERP, mailbox, authentication or
  durable storage integration, and no Excel file is parsed.
- A decision approves or rejects a submission for downstream processing. **No
  payment is executed.**
- Counts shown on the site measure this reference runner only.

Repository paths shown on the site identify which file implements a control.
They are references, not public source links; the engineering source is a
separate private repository.

## Deploying

Plain static files, no backend and no build step. The site makes no external
network request.

Serve it at the **domain root** — routes and downloads are root-relative, so
`file://` viewing and subdirectory hosting will not work.

- **Cloudflare Pages** — direct upload of this directory, or connect the repo
  with an empty build command and `/` as the output directory.
- **GitHub Pages** — serve from the default branch root. `.nojekyll` is
  present because Jekyll would otherwise drop `_next/`. This repository is
  `Ghadiator.github.io`, so Pages serves it at the domain root, which is
  required: the build contains 55 root-absolute URLs and sets no `basePath`,
  so hosting it under a subdirectory would 404 every asset.
- **Anything else** — `python3 -m http.server 8000` from this directory.
