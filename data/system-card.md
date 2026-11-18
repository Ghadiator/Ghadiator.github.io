# VC Validator — System Card (Annex IV / Art. 13 adaptation)

_Schema version: `1.0.0` — see ADR-071._

This card is **auto-derived** from the runtime topology (`validation_workflow.topology`), the active `Ruleset`, the ADRs in `architecture_decisions.md`, and the `ROADMAP.md` shipped-phase markers. Do not hand-edit — re-run `scripts/regenerate_system_card.py` after any topology / ADR / ROADMAP change. A drift test enforces this contract.

### 1(a) — Intended purpose

Validate insurance Validation Collection (VC) submissions received from Network Insurers (NIs) against contract baselines (CRM + Pricing) and known anomaly patterns. Produce an *advisory* verdict for an underwriting (reviewer) analyst to act on. The system is **advisory only** — under §11.2.1 of `process_semantics.md`, the machine never sets `VALIDATION_approved` / `VALIDATION_rejected` directly; only a human reviewer analyst, via `node_final_decision`, has that authority.

### 1(b) — Out-of-scope uses

- Approving or rejecting a VC autonomously — the system is advisory.
- Replacing the reviewer's domain judgement; the LLM committee is one input.
- Pricing decisions, broker negotiation, or contract drafting — those are upstream of the system.
- Use on AI-system categories outside the trained domain (mock-data corpus is Medical + Protection lines of business only).
- Use without a Title-III-compliant deployer organisation behind the reviewer — the system needs a human in the loop *with the authority + training* to act on its advisory output.

### 1(c) — Intended deployer

the underwriting team (insurance contract validation)

### 2 — Validation cascade (system architecture)

- Tier 1 — deterministic R1-R14 hard rules (pure Python; no LLM). Failure → Rules_failed.
- Tier 2 — cross-reference against CRM contract + Pricing actuarial baselines + FX (async). Failure → Crosscheck_failed; clean → Validation_passed; escalation triggers → Tier 3.
- Tier 3 — adversarial committee (Proponent + Opponent + Judge, LLM) with deterministic Python CoVe firewall (ADR-034) verifying every Judge claim. Output → Anomaly_flagged (with advisory AIRecommendationStatus) or Awaiting_NI_clarification (Phase L, ADR-062).

### 4 — Human oversight measures (Art. 14)

§11.2.1 authority invariant — the only code path that can set `VALIDATION_approved` / `VALIDATION_rejected` is `orchestrator.node_final_decision`, which exclusively consumes a typed `ReviewerDecisionEvent` from the HITL session (a human reviewer analyst). The LLM committee (Proponent + Opponent + Judge) is advisory; the deterministic Python firewall (CoVe, ADR-034) verifies LLM claims independently before the Judge can act on them. Phase L (ADR-062) extends this: the Judge can request reviewer consultation mid-run or adjourn for NI clarification, but cannot itself reach a terminal verdict. reviewer oversight is *effective* — the reviewer reads the structured `JudgeVerdict` with its advisory recommendation, anomaly tags, and CoVe trail; the reviewer is not asked to rubber-stamp a black-box decision (cf. Edwards & Veale 2017 on the 'right to explanation').

### 5 — Logging + post-market monitoring (Art. 12 + Art. 26)

- §9 ProcessEvent stream — scalar-only, append-only JSONL audit chain (Art. 12 automatic logging). Every machine state transition lands here with a UUIDv5 deterministic event_id.
- Live event sink — rich-narrative EventSink contextvar (ADR-061) the dashboard subscribes to. Not authoritative; the §9 stream is.
- Lessons-Learned Ledger — third write-only channel (ADR-064). Engine *never reads it back* — preserves ADR-064 reproducibility.
- IncidentEvent channel — fourth write-only channel (Phase O.7 / ADR-071). Typed surface for serious-incident reporting under Art. 26 post-market monitoring. Engine write-only.

### 6 — Active policy snapshot (ADR-065/066)

Ruleset version ID at card-build time: `(none)`. The policy snapshot binds the tier-3 knobs (CoVe-call cap, token budgets, consultation budgets) and is recorded on every `ValidationReport.global_metadata` so verdicts are replayable byte-exact against their policy.

### 7 — Shipped phases (ROADMAP)

- O.1
- O.2
- O.3
- O.4
- O.5
- O.6
- O.8
- O.9
- O.7

### 8 — Architecture Decision Records

- ADR-024 — Repository restructure into Use-Case-1 step layout
- ADR-025 — Spec-first development; `process_semantics.md` §11 is canonical
- ADR-026 — Pydantic-wrapped semantic state architecture (ban primitive `Enum`)
- ADR-027 — 19-state canonical `WorkflowStatusState` set
- ADR-028 — `Rules_failed` vs `VALIDATION_rejected` disambiguation
- ADR-029 — All-Optional + LOB-marker VC submission schema
- ADR-030 — Decimal-percent convention `[0.0, 1.0]`
- ADR-031 — Metric-family sub-model decomposition
- ADR-032 — v1 archive in `_archive_v1/`, frozen reference
- ADR-033 — Three-tier hybrid gateway (inherits v1 ADR-002)
- ADR-034 — Tooled deterministic CoVe — no LLM in verification (inherits v1 ADR-006)
- ADR-035 — CoVe + NLI applied to ALL text sources
- ADR-036 — LangGraph for cross-step orchestration, Pydantic-AI for in-step reasoning
- ADR-037 — Orchestrator at `validation_workflow/` root, not nested under Step 7-8
- ADR-038 — Every internal class is a Pydantic `BaseModel` (no `@dataclass`)
- ADR-039 — `frozen=True` Pydantic config on all read-only data classes
- ADR-040 — ProcessEvent stream — append-only JSONL, idempotent on `event_id`
- ADR-041 — Deterministic `session_id` + `event_id` for interrupt re-execution
- ADR-042 — LangGraph `interrupt/Command(resume=…)` for HITL pause/resume
- ADR-043 — `ReviewerDecisionEvent.reviewer_id` validator rejects synthetic actors
- ADR-044 — NI-facing remediation emails MUST NOT reference internal tier vocabulary
- ADR-045 — Hermetic tests via pydantic-ai `TestModel` / `FunctionModel`
- ADR-046 — `CaseContinuityMemory` carries slice history into Tier-3
- ADR-047 — Phase G — permissive defaults for new baseline fields (opt-in stricter checks)
- ADR-048 — Phase G — Tier-1 R7 uses relative tolerance (25%), not absolute headcount
- ADR-049 — Phase G — Tier-1 R8 only flags egregious FCL/MaxCoverage ratios
- ADR-050 — Phase G — `VCDepsCompact` for cheap agents; full `VCDeps` for Judge
- ADR-051 — Phase G — single `get_both_arguments` Judge tool with `asyncio.gather` fanout
- ADR-052 — Phase G — single-issue early exit on `geopolitical_risk_index`-only escalation
- ADR-053 — Phase G — `functools.lru_cache` on the CoVe verifier
- ADR-054 — Phase G — Tier-3 token-budget guardrails (soft 12 k / hard 25 k)
- ADR-055 — Phase G — `claims_ratio_current_snapshot` for historical immutability
- ADR-056 — the project conda environment is the interpreter, never system Python
- ADR-057 — Phase H — `claims_ratio_current_snapshot` persisted on the ProcessEvent stream, reconstructed into `CaseContinuityMemory` at `node_validate`
- ADR-058 — Phase I — five P0 defensive measures from the AI risk audit
- ADR-059 — `ReviewerDecisionEvent.reviewer_id` validator hardened against compound-identifier evasion
- ADR-060 — Live dashboard via FastAPI + SSE + contextvar event sink
- ADR-061 — Observability abstraction: `validation_workflow.observability` is the single integration point
- ADR-063 — CoVe transparency, token economics, and the committee-value demonstration (Phase M)
- ADR-062 — Interactive committee (Phase L)
- ADR-064 — Lessons-Learned Ledger (Phase O.1)
- ADR-065 — Champion–challenger shadow mode (Phase O.2)
- ADR-066 — Persistent policy registry (Phase O.4)
- ADR-067 — LLM-driven lesson synthesis (Phase O.3)
- ADR-068 — CRM + Pricing accessed via MCP; engine-side adapter stays a Pydantic-typed Protocol
- ADR-069 — Uniform `VCDeps` context across all three committee agents (supersedes ADR-050)
- ADR-070 — Context compaction & token economics: what we adopt, what we cite, what we deliberately do not do (Phase O.6)
- ADR-071 — EU AI Act positioning: what applies to us, what applies to Groq/Meta, what we ship to evidence Title III compliance (Phase O.7)
- ADR-072 — Tier-2 selector: agent reasons, Python executes, bounded primitive library
- ADR-073 — Tier-3 relational-consistency firewall: Judge invokes a typed tool; pure Python verifies multi-field invariants
- ADR-074 — Web ticket system with its own DB beside the §9 stream: division of truth (Steps 3-6)
- ADR-075 — Server-side shared state: one SQLite schema, dual executors (aiosqlite / Cloudflare D1 REST), dual blob stores (FS / R2)
- ADR-076 — Per-partner ascending ticket keys + central Pydantic TicketStatus catalog
- ADR-077 — Extended MailSender + per-reviewer SMTP accounts + ticket-time §9 emission
- ADR-078 — HITL intake-confirmation gate (extends §11.2.1 to Step 3-4)
- ADR-079 — Deadline-anchored reminders + §9.7 catalog extension
- ADR-080 — reviewer dashboard frontend: React + Vite + TypeScript SPA, corporate design tokens
- ADR-081 — Disposable-host durability: case-folder mirror + §9-stream backup + restore
- ADR-082 — Phase O.9 AGB-pipeline-review additions (R1+IBNR, reinsurance, LR threshold) + Step 3-4 hand-off for uncoded medical claims
- ADR-083 — Orchestration framework defensibility: LangGraph + Pydantic-AI hybrid today, Temporal-ready production migration path
- ADR-084 — Golden-test channel: fifth write-only observability sink, fed by real reviewer decisions
- ADR-085 — Universal Step 9 + opt-in STP auto-approval (Phase R)
- ADR-086 — Configuration & storage governance: every external interface via.env, durable state cloud-only
- ADR-087 — Deployment topology & high-availability roadmap
- ADR-088 — PostgreSQL as the third SQL backend (self-hosted / on-prem HA)
- ADR-090 — Multi-persona conversational surface in the dashboard (Phase W)
- ADR-096 — Changelog + version discipline: a reviewer-visible build version and a push-time documentation chain
- ADR-097 — `VALIDATION_OUTPUT_ROOT`: env-driven output root for developer-local isolation (keep the dual §9 switch)
- ADR-092 — Closing the Step 7-8 residual failure modes: implementation decisions + research-question positions
- ADR-089 — Pluggable §9 ProcessEvent stream backend (active-active)
- ADR-091 — Two-layer CoVe with retry (the Judge weighs, the verifier filters)
- ADR-094 — HITL-gated NI outbound: no agent emails the NI without a human
- ADR-093 — reviewer-test channels: workbook intake + reviewer responses via dashboard AND email
- ADR-095 — Live Step 7-8 views inside the reviewer product (not just the dev dashboard)
- ADR-098 — reviewer frontend stack: Next.js (static export) + Geist + Tailwind, served same-origin by FastAPI (supersedes ADR-080)
- ADR-099 — The developer validation dashboard, folded natively into the reviewer product
- ADR-100 — Step 9 email-thread summarisation is AI-assisted again (env-gated, HITL-safe)
- ADR-101 — Deployed app served via a shared host-wide Cloudflare gateway tunnel + `edge` network (no app-dedicated tunnel)
- ADR-102 — Stable reviewer-facing decision-flow projection over the ValidationReport
- ADR-103 — Case-level permission model for the reviewer API
- ADR-104 — One guarded CoVe verifier + labeled survivors
- ADR-105 — Persist the committee's raw arguments per run
- ADR-106 — The /cases transparency surface + whole-tool persona scope
- ADR-107 — HITL reason codes + four-eyes for high-risk decisions
- ADR-108 — Upload content sniffing + SHA-256 + additive-column idiom
- ADR-109 — Fairness-scan statistical rigour + idempotent persisted incidents
- ADR-110 — Live Judge token-streaming + completing whole-tool persona scope
- ADR-111 — case_id is a filesystem/object-key-safe token by construction
- ADR-112 — Case-level authorization on inbound-confirm + attachment download
- ADR-113 — Prompt-injection sanitisation at the LLM prompt boundary + output scrub
- ADR-114 — Pluggable shared backend for the incident channel + STP-gate fail-closed
- ADR-117 — The CoVe revision call carries EVIDENCE, not the argument briefing
- ADR-118 — Anchor-comparative Entailment: a data-grounded road through the CoVe firewall
- ADR-119 — Capacity-wait: the orchestrator waits on per-LLM limits instead of degrading
- ADR-120 — No model runs ungoverned: multi-dimension capacity-wait with a shared backend
- ADR-121 — The case IS the workbench: one decision surface, personas where the decision is taken, and a door into the engine
- ADR-122 — Task-shaped information architecture: one Dashboard, one Tickets page, "Processed Cases"
- ADR-123 — No empty governance tab: labelled demo seeding + demo-aware personas
- ADR-124 — Auth off by default for local dev/demo; a single flag re-locks it
- ADR-125 — Cross-provider LLM fallback: a Groq throttle degrades to Gemini, not a failed run
- ADR-126 — The whole Judge argument is persisted, not just its one-line summary
- ADR-127 — Frontend hardening: error boundaries, LLM-readiness visibility, persona-surface polish
- ADR-128 — In-workflow red-team attacker agent: continuous adversarial self-probe
- ADR-129 — Adaptive LLM red-team explorer: OWASP-grounded discovery half
- ADR-130 — Obfuscation-resistant NI sanitiser: multi-filler + normalised pass
- ADR-131 — Pool Analytics Expert agent: cross-NI cumulative-experience decision support
- ADR-132 — Chat topical scope guard: anti-misuse for the persona chat
- ADR-133 — The remediation loop is first-class: §9 rows for QUERY_NI, the HITL-gated Tier-3 clarification send, and the case-thread read surface
- ADR-134 — Token-free random demo cases with exact undo, and the reset split that protects organisational learning
- ADR-135 — Reliable multi-key token pool: round-robin instance rotation + aggregate-budget limiting
- ADR-136 — Live token-economics board: per-provider pool budget, per-key dispatch, session cost story
- ADR-137 — Env-gated semantic clause selection (Semantic-LTM retrieval)
- ADR-138 — Close the learning loop's propose half (shadow-only policy proposals)
- ADR-139 — Baseline realism extensions: per-LOB overrides, validity window, stop-loss attachment, per-slice cession tolerance
- ADR-140 — The selector was prompted blind: baseline-in-prompt fix + the baseline-comprehension stress test
- ADR-141 — Case-data containment for LLM contexts: one-case-per-context guard, generic-lesson lint, raw-committee harness
- ADR-142 — Flat Judge output contract: tool-free JudgeDraft + deterministic verdict assembly, few-shot exemplars, canonical tag catalog
- ADR-143 — Server-side token-economic story + zero-filled outcome catalog on the reviewer dashboard
- ADR-144 — Token-minimisation roadmap and least-loaded key routing: what's lossless, what's deferred, what's rejected
- ADR-145 — case_id distinguishes the line of business (`case-<policy>-<LOB>`)
- ADR-146 — Streaming persona chat over SSE (token-by-token wait feedback)
- ADR-147 — Codebase-grounded, live-streaming red-team explorer
- ADR-148 — Dedicated, read-only Audit assistant persona
- ADR-149 — Full two-layer CoVe trajectory persisted on the report and surfaced on the decision-flow projection
- ADR-150 — Optional context-carrying post-Judge reconsideration (continue the Judge's own conversation)
- ADR-151 — STP auto-approval is one knob; its safety preconditions are always-on
- ADR-152 — Rename the engine `Policy` vocabulary to `Ruleset` (disambiguate from the insurance policy)
- ADR-153 — Every architectural decision is a runnable scenario; the showcase closes its coverage gaps
- ADR-154 — Persona toolsets are curated by capability group, guarded by a tool budget, with leak-retry + fallback routing
- ADR-155 — Persona chat has conversation memory (transcript threaded as message_history)
- ADR-156 — The post-Judge reconsider may run on its own model (route to a stronger/cheaper-capacity model while the Judge stays put)
- ADR-157 — Deep-history column catalog: Claims `_Next`, unbounded `_Prev_N`, and the two history-depth checks (R15 + contract-age)
- ADR-158 — Inbound preview modal: judge the assignment BEFORE confirming (detail + match rationale + stored-attachment scan)
- ADR-159 — Tier-2/CRM coverage wave: benchmark checks, next-year (R16) + reporting-period continuity, profit-share, and honest FX
- ADR-160 — One NI catalog: the ticketing `partners` table is a projection of the CRM NI registry
- ADR-161 — Tier-1 R17: opt-in required-core-fields check (close the blank-field gap)
- ADR-162 — Validation runs off the request: fast ACCEPT, Tier 1-3 in the background
- ADR-163 — Step 9 produces a durable pre-decision advisory on the case page
- ADR-164 — The mock scenario showcase pins the `mock` baseline, independent of the deployment's `VALIDATION_BASELINE_SOURCE`
- ADR-165 — Return-integrity (sent-vs-returned workbook diff) is out of scope for v1; documented as a known limitation
- ADR-166 — Deployment artefacts are named for the project, not the course; mailbox addresses are the one exception
- ADR-167 — Mailbox addresses are placeholders in tracked files; the live accounts are a separate, staged migration
- ADR-168 — One switch turns the mail channels off; the scheduler and the §9 catalog stay
- ADR-169 — The reviewer workbench adopts the published assurance workspace's design language
- ADR-170 — One design system, held in `site/app/globals.css`; the workbench adopts it verbatim
- ADR-171 — The showcase's pages are ported into the workbench whole, namespaced, and pruned afterwards
- ADR-172 — The design source is the PUBLISHED workspace, not `site/`; `site/` is the build it replaced
- ADR-173
- ADR-174
- ADR-175
- ADR-176 — The ported prune: one front door, and the published site's fixture measurements stay off live surfaces
- ADR-177 — A violation's risk weight is banded in one place, and sorted heaviest first
- ADR-178 — One domain vocabulary: supplier accounting, with the workbook contract held back
- ADR-179 — Column renames get their own migration idiom, separate from additive ones
- ADR-180 — The service-line VALUES migrate too, and both spellings stay readable forever
- ADR-181 — The sanitiser's gaps close where mechanism ends and paraphrase begins
- ADR-182 — An LLM screen at the external-text boundary, with four rules that make it admissible
- ADR-183 — Cross-origin access is an env-named allowlist of exact origins, installed only when one is named
- ADR-184 — A generated workbook's number formats are derived from the domain models, not chosen at the call site
- ADR-185 — A published page gets a named route surface, not the API
- ADR-186 — A reviewer catalog authorises the signature; Access authorises the person
- ADR-187 — Four eyes are two NAMES when there is no login
- ADR-188 — The downloadable example is a published claim, so its breadth is asserted

---

_Build metadata (excluded from drift fingerprint):_ `built_at=2026-11-16T11:50:10.117275+00:00`
