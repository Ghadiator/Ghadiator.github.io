# Generic Validation Workbench — backend & Oracle deployment contract

This website currently operates as a static GitHub Pages frontend. Its **new backend adapter is deployed but disabled**, as configured by `data/backend-config.json`. The public React/Next.js source migration lives in a separate **private** branch of `Ghadiator/generic-agentic-validation` named `feature/generic-site-from-daia-frontend`, containing an exact 81-file DAiA frontend baseline plus the first generic navigation/architecture integrations. This does not claim a complete 1:1 production migration.

## Architecture boundaries

1. **User interface:** generic supplier validation language. Introduction and the modular Architecture are the first two navigation items. Scenario/theater is an internal Architecture view. No independent Pool Analytics or Scenario Showcase sidebar item.
2. **Presentation module:** original supplier review architecture, its 20-node flow and event semantics are immutable evidence artifacts. Mount unchanged under `/reference-architecture/` when moving the native DAiA React shell to Oracle.
3. **API adapter / BFF:** stable generic routes translate supplier invoices, contract checks, requests, cases, audits, scenarios, persona conversations and attacker trials to the existing validation engine. Keep the legacy insurance-domain API strictly on the **server side**; do not send insurer-specific field names or production credentials to browsers.
4. **Validation backend:** the Oracle-hosted generic validation agent is authoritative for document parsing, contract snapshots, LangGraph orchestration, the CoVe firewall, state transitions, provenance and human authorization. The browser's JS preflight is an **explicit non-authoritative approximation** of the published Python reference.
5. **Runtime / delivery:** same-origin reverse proxy is preferred, serving frontend assets, immutable /reference-architecture/ and authenticated /api/v1. Secure TLS termination, storage, HTTPOnly cookies, backups, logs, identity provider, CSRF, and model API keys stay in trusted infrastructure.

## Browser-side configuration

Published `/data/backend-config.json`:

```json
{
  "schemaVersion": 1,
  "enabled": false,
  "apiOrigin": null,
  "apiPrefix": "/api/v1",
  "authentication": "same-origin-cookie",
  "maxUploadBytes": 15000000,
  "timeoutMs": 12000
}
```

To enable a deployed server, change `enabled` to `true` and `apiOrigin` to the **public HTTPS application host**, for example `https://validation.example.org`. No API keys, tokens, secret environment variables or private IPs may be placed in this JSON. Cross-site cookie mode should only be used with explicitly allowed origins, CSRF protection and secure SameSite policies. Browser-facing APIs must not make arbitrary user-selected HTTP requests or proxy arbitrary hosts. A configured-but-offline backend **fails closed**; it does not silently save a local receipt pretending to be a live operation.

## Required API shape (version 1)

All responses should be JSON (except permitted SSE/file downloads). The first call checks capabilities and never uses a cached response to claim a backend is online.

| Method | Route | Required capability | Response contract |
| --- | --- | --- | --- |
| GET | `/api/v1/capabilities` | — | `{"service":"generic-validation","version":"1","display_name":"Generic validation agent","features":["requests","submissions","cases","personas","red_team","events","review"]}` |
| POST | `/api/v1/requests` | `requests` | `{"request_id":"...","status":"Draft"}` |
| POST | `/api/v1/submissions` | `submissions` | multipart file plus metadata → `{"submission_id":"...","status":"Received"}` |
| GET | `/api/v1/cases` | `cases` | paginated case collection with durable ID and latest state |
| GET | `/api/v1/cases/{case_id}/events` | `events` | immutable ordered ProcessEvent records, with actor and source |
| POST | `/api/v1/personas/{persona}/chat` | `personas` | `{"reply":"...","conversation_id":"...","source":"..."}` |
| POST | `/api/v1/red-team/campaigns` | `red_team` | `{"campaign_id":"...","status":"Queued"}` |
| GET | `/api/v1/red-team/campaigns/{campaign_id}` | `red_team` | campaign status, per-attempt evidence and verified defender outcomes |
| POST | `/api/v1/cases/{case_id}/review` | `review` | server-authorized decision; never initiated in offline UI |

### Mapping from DAiA backend

The existing DAiA FastAPI defines `/api/tickets`, `/api/tickets/{ticket_id}/submissions`, `/api/cases`, `/api/monitor/chat/personas`, `/api/monitor/chat/{persona}/open`, `/api/monitor/chat/{session}/send`, and `/api/monitor/redteam/run-live`. These are **not** the public generic API. An Oracle-hosted BFF must map domain types, authorization, session identities, and event schemas to the new `/api/v1` contract. No automatic compatibility is implied; do not turn `enabled` on until the actual proxy passes integration tests.

### Security / human oversight acceptance gates

- Use authentication via identity provider and HTTPOnly Secure cookies. Protect mutations with CSRF controls; use backend RBAC for every request, event, chat and HITL decision.
- Reject oversized, malformed, or dangerous uploads server-side even if a browser preflight succeeded. Treat supplier documents and source material as **untrusted input**.
- Pass authenticated case context to the Human Reviewer persona; it must not act outside an authorized decision workspace.
- Keep the deterministic numerical/contract gate and pre-/post-Judge CoVe intact. No LLM conclusion can bypass verification and named human approval.
- Provide durable, tamper-evident ProcessEvent storage, object storage, retries, metrics, incident logging, disaster recovery and retention controls before production use.
- Restrict live red teaming to authorized sandbox/test scope, with an immutable target allowlist, rate caps and audit of every attempted payload.
- Proxy any model API credentials or Oracle access credentials from the backend only; the frontend must receive capability/state metadata, **never secrets**.
- Do not represent fixture replays as live runs or claim a campaign succeeded until source-backed defender results exist.

## Oracle preparation

The user expects an Oracle-hosted image later; its actual image registry, image type, runtime, domain, authentication, ingress and storage have **not** been supplied. The adapter therefore remains **runtime-neutral** (OCI Container Instances / VM / Kubernetes all plausible). When image information is available, configure a reverse proxy to:

- serve native generic React frontend at `/`, with SPA/Next routing and caching;
- serve the original modular architecture artifact at `/reference-architecture/`;
- route `/api/v1/*` to an authenticated generic BFF, and translate to the agent's internal API;
- use persistent secrets in Oracle Vault or equivalent; store nothing sensitive in client JS;
- verify CORS, TLS, session affinity where needed, upload limits, SSE WebSocket upgrades, health probes and persistence.

## Acceptance tests before enabling backend

1. Capability probe returns `service="generic-validation"` and only installed features.
2. Request and upload mutations are authenticated, idempotent where feasible, return server IDs and never silently fall back to browser storage.
3. Imported invoice JSON rejects unknown fields and preserves exact Decimal precision on the Python side.
4. Server-derived evidence and timeline match the published workflow semantics including human-gate controls.
5. Persona and attacker outputs carry independent verification/provenance and proper authorization.
6. Architecture diagram is byte-identical to the original 20-node published reference artifact.
7. Visual comparison against DAiA frontend across all states, responsive widths, and keyboard navigation is complete. **This has not yet been verified.**
