# Frontend versions and rollback

## Current change — 23 October 2026

The public domain root `https://ghadiator.github.io/` now redirects to the **knowledge-sharing homepage** at `/perspective/` when opened with no query parameters.

This is deliberately a small, reversible presentation-only change:

- `perspective/index.html`: new knowledge-sharing narrative from a functional-safety engineer's perspective.
- `assets/knowledge-sharing.css`: styles isolated to the new page.
- `index.html`: a 294-character redirect snippet for *bare-root requests only*.
- **No changes** to `app.js`, architecture execution, reference data, evidence hashes, fixture records, or workflow tests.

Existing workbench routes are preserved, including:
- [Original introduction](https://ghadiator.github.io/?view=overview)
- [Architecture explorer](https://ghadiator.github.io/?view=architecture)
- [Recorded cases](https://ghadiator.github.io/?view=cases)
- [Evidence and learning](https://ghadiator.github.io/?view=evidence)
- [Governance controls](https://ghadiator.github.io/?view=governance)

## Immutable original state

**Before this change, the entire published repository was at commit:**

`a971020f599fbe8be7ca4c8da610ef0929fa1b33`

**Preserved rollback branch:**

[`archive/live-workbench-before-knowledge-home-2026-10-23`](https://github.com/Ghadiator/Ghadiator.github.io/tree/archive/live-workbench-before-knowledge-home-2026-10-23)

This branch points to that exact pre-change commit and contains the original frontend, published reference artifacts, and test scripts.

## Restore the former live homepage without rewriting history

The original workbench continues to exist at `/?view=overview` even after deployment. To restore it at the bare domain root using a new Git commit:

```bash
git fetch origin
git switch main
git pull --ff-only
git restore --source origin/archive/live-workbench-before-knowledge-home-2026-10-23 -- index.html
git add index.html
git commit -m "Rollback: restore original workbench homepage"
git push origin main
```

This restores the old entry behavior without touching any evidence and without a force-push. The new `perspective/` and stylesheet files may remain in Git unused; they do not affect the original workbench. For an exact full-tree historical snapshot, check out the preserved branch.

## Presentation and assurance boundaries

The homepage describes a conceptual connection from functional-safety engineering to AI governance. It is a knowledge-sharing exercise, **not** an employment pitch or a claim of professional AI governance delivery.

It distinguishes the executed supplier reference runner (15 synthetic scenarios, 14 deterministic checks, 0 live model calls) from production integrations, operational identity management, deployment-grade records, live-model validation and conformity assessment.

The new page's expandable examples are explanations of recorded controls; they do not execute new workflow checks. Source and evidence remain in the existing technical workbench.
