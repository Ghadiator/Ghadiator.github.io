# Public site release handover — 26 October 2026

**Status:** Restoration tracked; native app NOT YET deployed. The existing public site must remain untouched until the acceptance gates below pass.

## Immutable recovery anchors

1. Current public site before restoration: [archive/live-site-2026-10-26-pre-restore](https://github.com/Ghadiator/Ghadiator.github.io/tree/archive/live-site-2026-10-26-pre-restore), commit `fbb9a3302170ce594510e0fe86e64d5f163711c8`. This branch is a complete source snapshot of the current root workbench, old embedded architecture, data exports and checks. Never force-update or delete it.
2. The real newer app source: [private archive/workbench-source-2026-10-26-pre-release](https://github.com/Ghadiator/generic-agentic-validation/tree/archive/workbench-source-2026-10-26-pre-release), commit `ee0030320d32f0f64a737a688afeafe33a616ef8`.
3. Release candidate: [private PR #58](https://github.com/Ghadiator/generic-agentic-validation/pull/58), branch `release/target-workbench-2026-10-26`. No private repository history or unrelated files are to be published.

## Target experience

The baseline supplied on 26 October consists of `Target Workbench(1).md` and the 16 HTML-only screenshots packaged as `Target Workbench(2).zip`. They describe the visual target and navigation, NOT executable UI code and NOT the final architecture layout. Reconstruct from the *native React source*, not by publishing those files.

- Sidebar: **Start here** (Introduction, Dashboard), **Follow the system** (Upload a workbook, Architecture explorer, Run a scenario, Cases), **Cost & capacity** (Token Economics, Pool Analytics), **Assurance & evidence** (Hazards & controls, Governance channels, Red team, Process audit, AI roles & controls, Integration), **Behind the model** (Safety → AI governance).
- Root `/` is Introduction. Dashboard is `/dashboard`.
- Architecture Explorer: diagram **left**, selectable **Workflow event log right** on desktop, responsive stack on mobile. The two use one cursor for play, step, seek and selected-module evidence. Each run indicates whether it is a live §9 transition stream or a synthetic reference trace.
- Preserve source-bound safety governance language, functional-safety knowledge-sharing framing, human decision authority and a visible separation of synthetic examples from actual execution.
- Adapt domain vocabulary to generic supplier accounting using private `domain_vocabulary.md` and `frontend_vocabulary.md` (ADR-178). Representative mappings: Network Insurer → Supplier; claims_ratio → cost_ratio; premium → billed; premium_rate → unit_rate; insured_count → billable_units; claims_paid → costs_paid; claims_reserve → accrued_costs; ibnr_reserve → unbilled_accrual; broker_fee → service_fee; reinsurance_pct → subcontracted_share_pct; profit_share → rebate_arrangement. Display strings such as “Loss-making premium share” become “Loss-making billed share”. Also preserve legacy-workbook-header acceptance, dynamic history family field names, and synonyms for third-party contract language.

## Why the earlier publication did not match

The current [Pages deployment](https://github.com/Ghadiator/Ghadiator.github.io/actions/runs/39955699148) succeeded after uploading the repository root (`path: .`). The public repository contains a vanilla JS `index.html` and an older compiled Next.js `architecture/index.html`; it did not build the more recent private reviewer frontend. This is a source/deployment mismatch, not proof that the native application passed tests.

## Release gates — ALL required before changing main

1. Build/typecheck the **private** native source in CI and retain the exact `out/` artifact. Do not accept an empty/no-steps Actions run as a pass. The first candidate check failed before any steps executed: [run 40317399997](https://github.com/Ghadiator/generic-agentic-validation/actions/runs/40317399997).
2. Resolve the discrepancy between source `VERSION=6.4.1` and vocabulary documentation referring to staged 6.5.0 renames; verify Excel legacy headers, clause retrieval, history stems and migration tests.
3. Explicitly define **public read-only reference mode** or deploy a secured same-origin FastAPI backend. GitHub Pages has no `/api`, and the current native code contains an open reviewer principal (ADR-175). Never publish an apparently functional open-approval workflow that cannot enforce identity, decision authority or persistence. Never mistake `NEXT_PUBLIC_VALIDATION_MOCK=1` for real engine validation.
4. Visual and browser acceptance for the above 16 routes and their sidebar, layout, event rail and interaction at desktop/tablet/mobile sizes. No React hydration errors, broken static routes, unauthorised mutation or misleading “live” claims.
5. Publish **only** the signed-off built `out/` files to the public Pages repository using a narrow cross-repository release credential. Do not make the private engineering repository public, expose build secrets or copy its source history.
6. Record deployed artifact digest and source/release commit in this public repository, perform a fresh HTTP smoke test against `https://ghadiator.github.io/`, and keep the original backup branch for fast rollback.

## Rollback

The full pre-release public site is in `archive/live-site-2026-10-26-pre-restore`. Restore by creating a normal, reviewed commit whose tree matches that branch, rather than force-pushing shared history. Restoring only `index.html` is insufficient because the old site depends on its matching JS, CSS, assets and static evidence.

**Do not merge or deploy this handover as if it were a completed frontend implementation.** It records the release contract and exact recovery refs while the native source is reviewed and validated.
