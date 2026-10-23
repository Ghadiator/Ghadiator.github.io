# Frontend baseline, narrative update and rollback

## Original frontend — 23 October 2026

The complete **original published frontend** is preserved at:

- Branch: [`archive/live-workbench-before-knowledge-home-2026-10-23`](https://github.com/Ghadiator/Ghadiator.github.io/tree/archive/live-workbench-before-knowledge-home-2026-10-23)
- Exact pre-change commit: `a971020f599fbe8be7ca4c8da610ef0929fa1b33`
- Original live entry point: `https://ghadiator.github.io/` (the existing Introduction workbench)

This backup branch was created **before** the narrative edits. It contains the complete site, CSS, JavaScript, published evidence, controls, recorded scenarios and integrity tests. Do not delete or rebase this archive branch.

## Current change: knowledge-sharing wording only

**This is not a visual redesign.** The site's original layout, colors, side navigation, original manual and six-stage automated flows, interactive architecture, governance views, cases, and evidence remain the public experience.

Changes are limited to:
- `app.js` — a brief, engineering-led introduction to the existing supplier-reference workflow.
- `assets/safety-to-governance.js` — knowledge-sharing language in the existing safety → AI governance view, replacing hiring/CV-like wording with the engineering lessons and boundaries.
- `index.html` — descriptive metadata and cache-busting version parameters for the two changed JavaScript files. No redirect or replacement landing page.
- This rollback document.

**Unchanged:** all CSS, diagram geometry, route names, markup structure, architecture behavior, event replay, simulated inputs, evidence JSON, pinned blob hashes, scenario semantics and tests.

The perspective is grounded in professional functional safety work. The AI governance connections are explanatory interpretations and academic/technical exploration, **not** claims of professional AI governance delivery, certification or live-model assurance.

## Roll back the copy to the exact original frontend

If the narrative update has reached `main`, create a **new revert commit** restoring the three changed files from the saved original (no force push, no history rewrite):

```bash
git fetch origin
git switch main
git pull --ff-only
git restore --source origin/archive/live-workbench-before-knowledge-home-2026-10-23 -- app.js assets/safety-to-governance.js index.html
git add app.js assets/safety-to-governance.js index.html
git commit -m "Restore original frontend wording (2026-10-23 baseline)"
git push origin main
```

Then confirm GitHub Pages has published the restored versions. For a full historical reference, use the archive branch directly instead of reconstructing old files.

## Verification before publishing

- Review the PR diff; it must not introduce a new homepage or change CSS.
- Run the existing `Frontend and evidence integrity`, `Architecture UI integrity`, and `Modular architecture browser smoke` workflows.
- Check mobile and desktop presentation and the `/?view=background` narrative.
- Confirm `https://ghadiator.github.io/` still opens the original Introduction and all navigation behaves normally.

Counts/claims in the demonstration remain scoped to 15 synthetic supplier scenarios, 14 deterministic checks and 0 live model calls in those recorded fixtures.
