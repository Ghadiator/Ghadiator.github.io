# Native GovernanceAsCode public Pages deployment

This repository serves **only the compiled** Next.js static export from the
private GovernanceAsCode frontend. Pages does not host the private FastAPI,
case database, mail channels, LLM inference or reviewer authorisation.

The static-mode UI blocks /api requests and removes write-enabled navigation.
The recorded supplier example traces are synthetic reference data. Runtime
validation, human approval, live incident evidence and persistence require a
separately secured backend; they are **not** claimed to work on public Pages.

See .site-release.json for build provenance and the source commit. The older
site, its original CI, legacy resources and verified evidence are recoverable
from archive/live-site-2026-10-26-pre-restore, not lost.
