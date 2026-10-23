# Frontend state and safe rollback

## Preserve the original design

The **original site as published before any 23 October 2026 narrative edits** is pinned at:

- Branch: [`archive/live-workbench-before-knowledge-home-2026-10-23`](https://github.com/Ghadiator/Ghadiator.github.io/tree/archive/live-workbench-before-knowledge-home-2026-10-23)
- Commit: `a971020f599fbe8be7ca4c8da610ef0929fa1b33`

This is a complete source snapshot—not a screenshot—including the original layout, styles, interactions, evidence, fixtures, and tests. **Keep the archive branch untouched.**

## Narrative-only evolution

- Commit `db69b96a9f698a5ae5f550fcdd53090f262406a8` on main introduced knowledge-sharing language in the existing Safety → AI governance view.
- The `feat/knowledge-sharing-copy-only-2026-10-23` branch builds on that main commit and changes only the **Introduction text** in `app.js`, the page description in `index.html`, and cache-busting metadata.
- The original header, sidebar, colors, typographic system, seven-stage manual workflow, six-stage automation diagram, architecture explorer, recorded cases, human gate, evidence view, and all underlying reference data remain as they were.
- There is **no separate homepage**, `/perspective/` redirect, styling replacement, new framework or backend feature.

**Editorial purpose:** Share how a functional safety engineer thinks about risk, verifiable controls, evidence, accountability, and the limits of translating those methods to AI governance—not an employment pitch. Professional safety experience is distinct from exploration of AI governance. Fixture scenarios are not live-model performance evidence, compliance certification or production integration.

## Restore only the latest Introduction wording

After the copy-only change is merged, the preceding live baseline is commit `db69b96a9f698a5ae5f550fcdd53090f262406a8`. Restore only the updated Introduction and metadata without undoing the earlier safety narrative:

```bash
git fetch origin
git switch main
git pull --ff-only
git restore --source db69b96a9f698a5ae5f550fcdd53090f262406a8 -- app.js index.html
git add app.js index.html
git commit -m "Restore prior Introduction wording"
git push origin main
```

## Restore the entire original frontend narrative

To restore *all* wording to the exact pre-23-October snapshot, but without changing unrelated evidence or history:

```bash
git fetch origin
git switch main
git pull --ff-only
git restore --source origin/archive/live-workbench-before-knowledge-home-2026-10-23 -- app.js assets/safety-to-governance.js index.html
git add app.js assets/safety-to-governance.js index.html
git commit -m "Restore original 2026-10-23 frontend wording"
git push origin main
```

No force push is required. The full original tree remains inspectable through the archive branch even if the live branch later evolves. If later updates to those files contain other valuable work, inspect the diff before restoring.

## Release checks

Review the GitHub PR diff and verify it contains no CSS, architecture, evidence or workflow modifications. Run the existing frontend integrity and browser smoke workflows, and visually check `/`, `/?view=background`, `/?view=architecture` and mobile layout. The site continues to serve the exact original experience with its wording reframed as knowledge sharing.
