# Governance as Code

A reference implementation of governed AI in a regulated decision workflow,
published as a static site.

Live at: _(set once deployed)_

## What this is

The built output of a working system, not a description of one. The page
replays traces recorded from the implementation's own hermetic fixtures —
no event was written by hand — and every mechanism it claims points at the
file that enforces it.

The architecture is domain-neutral; the demonstrated slice is individual
health cover risk assessment, which is named in Annex III point 5(c) of the
EU AI Act.

## What it shows

- **Architecture** — fourteen components, the obligation each discharges, the
  data that crosses between them, and a recorded run that walks all of it and
  suspends at the human gate. Three components open into their own internals.
- **Compliance** — classification before compliance, then obligation →
  mechanism → evidence across the EU AI Act, ISO/IEC 42001 and NIST AI RMF.
  Every row states what it does *not* establish.
- **Assurance** — the ruleset, the threat-to-defence mapping, and red-team
  findings.
- **Evidence** — the complete event trail of any recorded run.

## Deploying

Plain static files. No backend, no build step, no external requests — it works
from `file://`.

- **Cloudflare Pages** — direct upload of this directory, or connect the repo
  with an empty build command and `/` as the output directory.
- **GitHub Pages** — serve from the default branch root. `.nojekyll` is
  present because Jekyll would otherwise drop `_next/`.
- **Anything else** — `python3 -m http.server 8000` and open it.

## Scope

A demonstration system, not a certified compliance claim. Regulatory
classification depends on a system's intended purpose and deployment context.

The engineering source is a separate private repository.
