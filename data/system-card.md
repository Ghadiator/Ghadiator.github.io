# Governance as Code — System card

## Intended purpose
A governed supplier-invoice and contract-validation workflow: deterministic checks, evidence-scoped AI advice for unresolved exceptions, and final human authority.

## Human authority
The reviewer remains responsible for the disposition. Agent recommendations are advisory, and the public site cannot approve or modify a case.

## Workflow
1. Typed invoice intake and source registration
2. Deterministic invoice and independent contract checks
3. Bounded AI advice and evidence verification for unresolved exceptions
4. Named human disposition and reconstructible process event

## Architecture decisions
The displayed sequence is consecutively numbered, while immutable source ADR identifiers are retained.

### 01. Deterministic verification — ADR-034

Group: Assurance

**Engineering problem.** Model agreement is not independent evidence.

**Decision.** Verify material claims with Python checks against declared sources.

**Residual limitation.** A true calculation can still be misleading when context is missing.

### 02. Workflow and reasoning have different jobs — ADR-036

Group: Architecture

**Engineering problem.** An LLM-driven process router would make routine state changes variable.

**Decision.** Use LangGraph for workflow control and PydanticAI for bounded reasoning.

**Residual limitation.** State transitions remain separate from advisory model outputs.

### 03. A reconstructible process ledger — ADR-040

Group: Accountability

**Engineering problem.** Retries after a human pause could duplicate audit records.

**Decision.** Append events with stable identifiers and idempotent writes.

**Residual limitation.** An audit event does not prove that someone examined the evidence.

### 04. Pause for a named human decision — ADR-042

Group: Accountability

**Engineering problem.** An exception cannot silently become a machine approval.

**Decision.** Interrupt the workflow; resume with a typed reviewer decision.

**Residual limitation.** Final approval remains outside model authority.

### 05. One observability interface — ADR-061

Group: Architecture

**Engineering problem.** Operational events and authoritative process history have different purposes.

**Decision.** Expose an integration boundary without conflating live views and audit evidence.

**Residual limitation.** A live dashboard is not the canonical ledger.

### 06. Lessons do not silently change policy — ADR-064

Group: Accountability

**Engineering problem.** Operational feedback can undermine reproducibility when fed back automatically.

**Decision.** Separate the lessons channel from the running engine and review policy changes explicitly.

**Residual limitation.** Recording a lesson is not deploying a new rule.

### 07. Evidence-aware context budgets — ADR-070

Group: Architecture

**Engineering problem.** Large prompts cost more and hide source selection.

**Decision.** Document context compaction and token budgets while preserving important evidence.

**Residual limitation.** Compression must not discard the basis for a verdict.

### 08. Regulatory roles and evidence — ADR-071

Group: Accountability

**Engineering problem.** Model and application responsibilities must not be conflated.

**Decision.** Maintain intended-purpose, oversight and technical documentation linked to controls.

**Residual limitation.** Technical documentation does not itself establish certification.

### 09. Orchestration framework trade-off — ADR-083

Group: Architecture

**Engineering problem.** Typed agent calls and stateful orchestration solve different problems.

**Decision.** Keep the bounded hybrid and document alternatives for production migration.

**Residual limitation.** A future migration route is not a shipped capability.

### 10. Golden samples from review — ADR-084

Group: Accountability

**Engineering problem.** Synthetic test examples are not a substitute for observed reviewer disagreements.

**Decision.** Curate reviewer feedback into a separate evaluation channel.

**Residual limitation.** An observation needs review before becoming a benchmark.

### 11. Verification before and after synthesis — ADR-091

Group: Assurance

**Engineering problem.** Filtering preliminary assertions does not protect the final Judge synthesis.

**Decision.** Use pre-Judge and post-Judge claim verification with a bounded retry path.

**Residual limitation.** Verification remains limited by source quality.

### 12. Static site, protected runtime — ADR-098

Group: Architecture

**Engineering problem.** A public reference page must not be mistaken for a live workflow.

**Decision.** Use a static Next.js export for presentation and a separate protected API for execution.

**Residual limitation.** Public navigation cannot confer runtime permission.

### 13. Case-level access controls — ADR-103

Group: Accountability

**Engineering problem.** Being signed in does not authorise access to every case.

**Decision.** Check permissions for each case and its related records.

**Residual limitation.** A hidden UI control is not server-side authorisation.

### 14. A single guarded verification path — ADR-104

Group: Assurance

**Engineering problem.** Separate verification entry points can enforce inconsistent budgets.

**Decision.** Use one guarded verifier with explicit results and shared limits.

**Residual limitation.** Unsupported or neutral claims must remain labelled.

### 15. Reasons and a second reviewer — ADR-107

Group: Accountability

**Engineering problem.** High-impact overrides need attribution and independent challenge.

**Decision.** Require rationale and classified reasons; use dual review for specified actions.

**Residual limitation.** Attribution alone cannot establish reviewer attention.

### 16. Untrusted content boundary — ADR-113

Group: Assurance

**Engineering problem.** External text can try to redirect the assistant's instructions.

**Decision.** Sanitise, delimit and scrub text at the relevant model boundaries.

**Residual limitation.** Filtering never replaces structural permissions.

### 17. Revisions grounded in evidence — ADR-117

Group: Assurance

**Engineering problem.** Repeating the original persuasive briefing can repeat its mistake.

**Decision.** Give the retry relevant verification evidence.

**Residual limitation.** Revised wording must still be checked.

### 18. Capacity reservations before model calls — ADR-119

Group: Architecture

**Engineering problem.** Rate limits can otherwise cause silent degradation during a run.

**Decision.** Reserve capacity and wait within configured provider limits.

**Residual limitation.** Capacity reservations cannot guarantee service availability.

### 19. Fail-closed shared capacity limits — ADR-120

Group: Architecture

**Engineering problem.** Local counters can miss concurrent workers or unknown models.

**Decision.** Govern token and request budgets with a shared backend and deny unknown configurations.

**Residual limitation.** Missing limit settings must not mean unlimited use.

### 20. One case per model context — ADR-141

Group: Assurance

**Engineering problem.** Case information may contaminate another case's reasoning.

**Decision.** Isolate each model context and lint reusable lessons for case data.

**Residual limitation.** Context separation is not a claim about pretrained model memory.

### 21. Narrow Judge output, deterministic assembly — ADR-142

Group: Assurance

**Engineering problem.** Complex nested generation contracts are fragile under model variation.

**Decision.** Return a narrow structured draft and assemble scored findings in code.

**Residual limitation.** Model prose carries no automatic decision weight.

### 22. Purpose-built read-only audit assistant — ADR-148

Group: Accountability

**Engineering problem.** An auditor needs evidence explanations rather than operational tools.

**Decision.** Keep the audit persona read-only and separate from decision actions.

**Residual limitation.** An assistant explanation is not an independent assessment.

### 23. Preserve the whole verification path — ADR-149

Group: Assurance

**Engineering problem.** A final answer can conceal rejected or revised claims.

**Decision.** Record pre- and post-Judge checking with explicit outcomes.

**Residual limitation.** Only recorded checks can be represented as executed.

### 24. One coherent design language — ADR-170

Group: Experience

**Engineering problem.** Separate styling copies drift across public and protected surfaces.

**Decision.** Share design tokens instead of copying ad-hoc presentation output.

**Residual limitation.** Visual unity must not conceal capability differences.

### 25. Attack wording beyond signatures — ADR-181

Group: Assurance

**Engineering problem.** Pattern matching misses paraphrased prompt injections.

**Decision.** Test against evolving adversarial language and record the guard's gaps.

**Residual limitation.** Passing known attacks does not prove complete resistance.

### 26. Optional semantic injection screening — ADR-182

Group: Assurance

**Engineering problem.** Deterministic signatures cannot capture every adversarial intent.

**Decision.** Allow an optional screen to add, but never remove, deterministic redactions.

**Residual limitation.** The screening model remains fallible and is off by default.

### 27. Exact-origin cross-origin policy — ADR-183

Group: Accountability

**Engineering problem.** The public site and protected API do not share an origin.

**Decision.** Permit only explicitly configured origins when cross-origin access is needed.

**Residual limitation.** Origin checks do not grant case access.

### 28. Named public API surfaces — ADR-185

Group: Accountability

**Engineering problem.** Permitted origins alone do not restrict endpoint authority.

**Decision.** Publish a deliberate allowlist of public routes.

**Residual limitation.** Protected actions must remain inaccessible from public mode.

### 29. Dual control uses distinct people — ADR-187

Group: Accountability

**Engineering problem.** An unauthenticated demo cannot assume session IDs distinguish reviewers.

**Decision.** Require distinct named reviewers for the relevant dual-control path.

**Residual limitation.** Names alone are not strong proof of identity.

### 30. Example workbook as a testable contract — ADR-188

Group: Experience

**Engineering problem.** The downloadable workbook must match what intake expects.

**Decision.** Check field coverage, workbook structure and browser preflight.

**Residual limitation.** A sample workbook is not evidence of external integration.

### 31. Business-value narrative with evidence — ADR-190

Group: Experience

**Engineering problem.** Repeated and reordered claims obscure what has been measured.

**Decision.** Show the KPI taxonomy once, separating observed measures from objectives.

**Residual limitation.** Desired productivity improvements are not measured outcomes.

### 32. Navigation by purpose — ADR-191

Group: Experience

**Engineering problem.** A scattered sidebar and anonymous blocks impede exploration.

**Decision.** Group pages by user task and show typed module inputs and outputs.

**Residual limitation.** A module contract does not demonstrate a particular execution.

### 33. Supplier-invoice intake — ADR-197

Group: Experience

**Engineering problem.** A sample is not usable when the intake accepts a different workbook.

**Decision.** Accept the published invoice structure at the intake boundary.

**Residual limitation.** Successful parsing is not contractual approval.

### 34. Figures derived from engineering mechanisms — ADR-200

Group: Experience

**Engineering problem.** Simplified diagrams can accidentally overstate safeguards.

**Decision.** Show the implemented control mechanisms and use only grounded KPI evidence.

**Residual limitation.** Explanatory figures are not live run measurements.

### 35. Invoice runs as KPI evidence — ADR-201

Group: Experience

**Engineering problem.** Reference simulations do not prove measured end-to-end business value.

**Decision.** Exercise invoice scenarios through available stages and report missing measures.

**Residual limitation.** Synthetic scenarios do not establish representative savings.
