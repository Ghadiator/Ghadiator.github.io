# Aegis frontend deployment

This repository publishes a **read-only Governance-as-Code reference UI** from `index.html`, `app.js`, and `styles.css`. Legacy URL folders now redirect to its query-routed views.

## Evidence and controls
- The existing `data/` JSON exports are preserved unchanged from source commit `da872d93b43fda10a6171f8c2c769fea656f0b0d`.
- `app.js` verifies each JSON export's *Git blob SHA-1* against pinned hashes before displaying it. Hash mismatch causes a fail-closed evidence load rather than silently treating altered records as reviewed evidence.
- The displayed traces are synthetic fixture executions, not evidence of live model behavior, certification or production deployment.
- The public repo also retains the prior compiled Next.js pages and assets in Git history for rollback. Its `_next` directory remains untouched.
- The new page uses no build step or new server dependency; GitHub Pages serves it from the `main` branch root.

## Recovery
Revert this deployment commit or restore root `index.html` and legacy route `index.html` files, then remove the Aegis frontend assets. Original static files remain in earlier Git commits.

## Assurance presentation

`assets/assurance-design.css` supplies shared colour, spacing and interaction
tokens for the surrounding workbench. The original modular architecture,
its diagram, connections, labels, player and block inspector remain intact.
The introduction leads into the existing recorded-case experience; design
choices and their remaining boundaries appear under Evidence & learning.

Run the frontend integrity workflow's checks before publishing. Recorded
evidence and its verification pins remain unchanged.

## Workflow
Change UI components without editing original JSON evidence. Update evidence pins only as part of a deliberate, separately reviewed provenance update.
