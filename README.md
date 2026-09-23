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
  exception review, evidence verification, the reviewer gate, the correction
  loop and the archive. Three components open into their own internals, and a
  recorded run walks all of it, suspending at **every** human gate.
- **Compliance** — classification before compliance, then obligation →
  mechanism → evidence across the EU AI Act, ISO/IEC 42001 and NIST AI RMF.
  Every row states what it does *not* establish.
- **Assurance** — the control set, the threat-to-defence mapping, and executed
  control probes.
- **Evidence** — the complete ordered event record of any recorded run, with
  JSON download.

## Scope — what runs and what is a fixture

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
