---
epoch: 1794555543315
mode: agent
backendId: opencode
sessionId: "ses_e2ca826b5ffeXhpbo9HB68yxqM"
tags:
  - copilot-conversation
topic: "Backend setup plan based on requirements doc"
usage: '{"usedTokens":92810,"contextWindow":200000,"updatedAt":1794555867882}'
---

**user**: Create a backend setup plan for this project according to the requirements document
[Timestamp: 2026/11/13 12:39:03]

**ai**: I'll start by exploring the project to find the requirements document and understand the current state.I have the full picture. Now I'll write the plan as a note in the documentation pack.Created the backend setup plan and wired it into the vault.

## Main deliverable: [[09-backend-setup-plan]]

Placed in the documentation pack as note 09. It's built from the requirements spec (FR-001…024, NFR-001…011, AC-01…11, Appendix B), the confirmed decisions in notes 02/03/08, and what the repo actually contains today.

**What it covers**

| Section | Content |
|---|---|
| 1 | Precedence: spec governs *what*, the confirmed stack governs *how* — so ASP.NET Core + EF Core + MSSQL, not the spec's NestJS/PostgreSQL/Keycloak |
| 2 | Modular-monolith architecture + six non-negotiable rules (server-side authz, plant scope on every query, no enums for statuses…) |
| 3 | Toolchain: **.NET 10 LTS** (released Nov 2025, supported to Nov 2028 — .NET 8 support ended this week), EF Core 10, Identity + JWT, xUnit, Serilog |
| 4 | WP0 concrete scaffold: `git mv backend backend-legacy`, `dotnet new` commands, package list, dependency direction, definition of done |
| 5 | WP0–WP9 work packages mapped to FRs, Phase 1/2, with exit criteria — including a pilot-scope reality check |
| 6 | Draft MSSQL schema: 20+ tables, keys, indexes, filtered unique indexes, append-only constraints |
| 7 | API surface: `/api/v1` auth endpoints + module endpoint table with permissions and FR refs; error/pagination contract |
| 8 | Port table for the existing Express prototype — what survives, what must be dropped |
| 9 | 12 build gates (G-1…G-12) each with a proposed default so work isn't blocked |
| 10–12 | Plant-scope pattern, HMAC audit writer, stock concurrency, state machine, tokens; test strategy; frontend integration order |
| 13–16 | AC mapping, verification commands, setup-specific risks, next actions |

**Key findings baked into the plan** (evidence from the repo, not assumptions)

- `backend/server.ts` is a 319-line Express prototype: in-memory arrays, imports `frontend/src/utils/*`, authenticates by trusting an `x-user-role` header, issues fake tokens. It's archived in WP0 and treated as behavioural reference only.
- The 6-digit partial-password PIN scheme is flagged for replacement — FR-001 asks for two-step verification, and a 6-digit PIN is not a password system.
- The PR→PO procurement flow exists in code but in **no requirement**; the plan holds it instead of porting it.
- Plant isolation, lookup-table statuses, and append-only audit get built in WP1, not retrofitted (risk K-05).

## Supporting edits

- [[README]] — added the new note to the file list.
- [[02-architecture-and-technology]] — the proposed layout now points to the concrete plan.
- [[Project Map]] — changelog line recording the plan and that the 2026-11-06 snapshot is now stale in one respect (backend/auth/procurement additions); linked the plan from "backend foundation" next actions. Findings left intact per the note's own rules.
[Timestamp: 2026/11/13 12:39:03]