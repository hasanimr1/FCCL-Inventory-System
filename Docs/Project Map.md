---
title: Project Map
status: living
last_verified: 2026-11-06
review_trigger: any commit touching Docs/ or frontend/; any new FCCL decision; before every client demo
scope: Docs/, frontend/, backend/
---

# Project Map

> **What this note is.** A dated, evidence-based map of the project's *artefacts* — what the documents claim, what the code actually does, and where the two disagree. It is not a requirements document (those are [[01-project-overview]] to [[08-decisions-and-open-issues]]) and it is not the client-facing status report. It is the internal truth source the status report should be written from.

**Read this first if** you are about to start the backend, demo the prototype, or answer an FCCL question about what is "already done".

---

## 0. How this note stays true

This note is expected to be wrong within a month. That is the design. Five rules keep it useful anyway:

1. **Never rewrite a finding.** If something is fixed, change its status and add a line to [[#11. Changelog]]. Keep the row — the history is the value.
2. **Every claim carries evidence** — a `file:line`, a command and its output, or a quoted sentence. No evidence, no entry.
3. **Re-run [[#9. Metrics and verification]] before changing `last_verified`.** A date without a re-run is a lie with a timestamp.
4. **Docs and code are both evidence; neither wins by default.** Where they disagree, [[#5. Drift register]] records both and [[#8. Decisions that block the build]] decides.
5. **New findings get the next free ID.** Do not renumber; other notes will start linking to these IDs.

**Review triggers:** a commit touching `Docs/` or `frontend/`; a new FCCL decision; a new person joining the project; before any demo or acceptance meeting.

| Mark | Meaning |
|---|---|
| ✅ | Implemented and verified |
| 🟡 | Partly implemented, or implemented only in one layer |
| ⚠️ | Mock / simulation — looks real, stores nothing |
| ❌ | Absent |
| 🔁 | Drifted — docs and code disagree |

---

## 1. Snapshot — 2026-11-06

| Item | State | Evidence |
|---|---|---|
| Phase | Documentation + clickable prototype | — |
| Branch / HEAD | `main` / `bb62ad1` "Shifted all documentation to obsidian vault and .md files" | `git log` |
| Working tree | Clean except Obsidian/Copilot config (4 files) | `git status --porcelain` |
| Documentation | 13 notes, ~2,703 lines, all tracked | `Docs/` |
| Frontend | React 18.3 · TypeScript 5.8 · Vite 6.4 · Tailwind 4 | `frontend/package.json` |
| Frontend source | 17 files, ~6,080 lines | `frontend/src` |
| Components | 12, of which 1 is orphaned | `frontend/src/components` |
| Type check | ✅ `tsc --noEmit` exit 0 | `npx tsc --noEmit` |
| Production build | ✅ exit 0 · 319 kB JS (83 kB gzip) · 46 kB CSS · 6.1 s | `npm run build` |
| Unit tests | ✅ 8 / 8 pass | `npx tsx --test src/utils/inventoryRules.test.ts` |
| Backend | ❌ No project. One 957-line mock-data file in `backend/data/` | `backend/` |
| Database | ❌ None | — |
| API calls | ❌ Zero (`fetch`/`axios` matches: 0) | grep |
| Auth | ❌ None | — |
| Persistence | ❌ None (`localStorage` matches: 0) | grep |
| Routing | ❌ None (tab state only) | `App.tsx` |

**One-line summary:** a well-shaped, type-clean React prototype of the *screens*, with a thin layer of real business logic, no backend, and documentation that is more advanced than the code but not yet consistent with it.

---

## 2. What actually exists

| Layer | Reality | Where |
|---|---|---|
| Screens | 8 working views: Dashboard, Assets, Stock, Suppliers, Racks, Work Orders, Audit Trail, Scanner modal | `frontend/src/components` |
| Domain model | 10 entity interfaces, 6 union types | [[inventory.ts]] |
| Business rules | 9 pure functions: rack collision, heartbeat status, hardware diff, work-order match, stock health, currency, PKT format, device number, hash chain | [[inventoryRules.ts]] |
| Tests | 8 unit tests, `node:test` style, no npm script | [[inventoryRules.test.ts]] |
| Demo data | 10 `INITIAL_*` arrays, 957 lines | [[mockInventoryData.ts]] |
| Audit integrity | Client-side FNV-1a chain over 4 fields | `inventoryRules.ts` |
| Live monitoring | Simulated heartbeat/mutation console | `App.tsx` |
| Real integration | None | — |

**Important framing:** the prototype is a *demo of intent*, not a slice of the product. Every number on screen comes from a constant or from in-memory state that dies on refresh. Nothing in the UI has ever talked to a server.

---

## 3. Merits

### 3.1 Documentation

- **The pack separates current truth from source material.** Notes 01–08 are "current"; `project_summary`, `Inital Plan` and the requirements spec are explicitly marked as source material via warning callouts. Most project packs blur this and rot within weeks.
- **There is a real superseded-decisions log.** [[08-decisions-and-open-issues]] records not just what was decided but what was *rejected* (Node/NestJS, PostgreSQL/Prisma, Go agent). This is the single most useful note in the pack.
- **Open questions are written down, not carried in someone's head.** ~40 items, grouped by domain. A new developer can see what is unsettled before designing around it.
- **Consistent shape across notes:** purpose → decisions → detail → open questions → related notes. Predictable to navigate.
- **The role model is stated once and cross-referenced**, instead of being re-described in every module note.
- **The README is a genuine entry point** — file list, current direction, source-material warning, and reading order.
- **Requirements are preserved verbatim** for traceability rather than paraphrased into oblivion.
- **Links are Obsidian-native** (wikilinks, heading anchors, backlinks), so the pack is navigable rather than a folder of orphans.

### 3.2 Code

- **Business logic is extracted from components.** [[inventoryRules.ts]] is framework-free and directly testable — the reason 8 tests exist at all.
- **The domain model is unusually complete for a prototype.** Racks with fractional U, front/rear faces, plant scoping, audit findings, change events, stock thresholds — the shape of the real problem is captured.
- **TypeScript is used properly.** Two `as any` in ~6,000 lines; discriminated unions for statuses; no `@ts-ignore`.
- **The build is clean and small.** No TypeScript errors, 83 kB gzipped JS, 6-second build.
- **Real unit tests exist for the hard parts:** collision detection, hash-chain verification, stock thresholds, work-order matching.
- **Visual design is coherent.** One palette, one spacing system, lucide icons throughout, responsive down to mobile with a drawer.
- **Accessibility is not an afterthought everywhere** — 16 `aria-*`/`role` attributes, Escape-to-close on the drawer, labels on the main controls, `aria-label` on the status donut.
- **No XSS surface.** No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`.
- **Naming is consistent and readable.** A new developer can follow `handleIssueSpare` → `calculateStockHealth` without a map.

### 3.3 Process

- **The docs were written before the backend**, which is the right order for a system with this many unresolved permission questions.
- **The spec is being treated as evidence, not gospel** — conflicts are called out instead of silently resolved.
- **Work is committed.** The documentation move is in `bb62ad1`, not sitting untracked.

---

## 4. Flaws

Severity: **Critical** = would mislead acceptance or block the build; **High** = wrong behaviour or a false claim; **Medium** = maintainability/UX debt; **Low** = polish.

### 4.1 Documentation

| ID | Finding | Evidence | Severity |
|---|---|---|---|
| D-01 | **The pack misquotes FR-024 and builds a "conflict" on the misquote.** Five notes say FR-024 restricts Audit Trail to System Admin. FR-024 actually says *"Everyone shall search, view and export the audit trail."* | spec:293 vs `03:53`, `04:202`, `05:121`, `06:148`, `08:57,106` | Critical |
| D-02 | **The pack's audit-access conclusion contradicts the spec's own Appendix B too.** Appendix B gives Auditor `V` and Plant Admin `V (own plant)`, Employee `—`. So the pack's "System Admin only" is a third position supported by neither source. | spec:814 vs spec:293 | Critical |
| D-03 | **The spec is internally inconsistent and the pack never says so.** FR-024 ("Everyone") vs Appendix B (Employee: no access); NFR-003 says backups go in **MySQL**; NFR-006 (marked *Confirmed*) says times are **stored** in PKT, while the current decision is store UTC / display PKT. | spec:293, 814, 307, 310 | High |
| D-04 | **20 broken image references.** Every `media/*.png` in the spec points at a folder that does not exist. The README simultaneously claims "text only; no pictures are included". | 20 `media/` refs; `Docs/.../media` absent; README:3 | High |
| D-05 | **Roles are described inaccurately as history.** The spec's roles are System Admin, **Plant Admin**, Auditor, Employee. The pack describes the old set as "Super Admin, Plant Admin, Technician, Store Officer" — Plant Admin is current in the spec, not retired, and Super Admin appears in neither. | spec:207, 271, 802 vs `03` | High |
| D-06 | **No document control.** No version, date, author, approver or status on any note except the decision dates inside 08. An FCCL reviewer cannot tell which draft they are reading. | all notes | High |
| D-07 | **No traceability.** Requirements have IDs (FR-001…), but nothing maps FR → module → screen → test. Acceptance will be argued from memory. | spec, 04 | High |
| D-08 | **Open questions have no owner or due date.** 08 lists ~40 items; none says who must answer or by when, so none can be chased. | `08` | Medium |
| D-09 | **`project_summary` still contains `file:///c:/Users/...` links** to one machine's disk. Unusable for anyone else and a small information leak. | `project_summary` | Medium |
| D-10 | **Structural errors left in the spec.** §1.3 points to "section 5.2" for modules (they are in 5.1); "10.4 Racks Visualizer" sits inside §11; FR-002 is a broken sentence ("…Auditor (read only) and."). | spec:126, 271, ~§10/11 | Medium |
| D-11 | **Duplicated content across three layers** (spec → 01–08 → project_summary) with no single source of truth, so every decision must be edited in several places. Drift is already visible (D-01). | whole pack | Medium |
| D-12 | **No diagrams, only prose descriptions of diagrams.** 06 specifies what the diagrams must contain but contains no rendered diagram; there are zero Mermaid blocks. Stakeholder sign-off on architecture is hard without a picture. | `06`; mermaid count = 0 | Medium |

### 4.2 Code

#### Critical / High

| ID | Finding | Evidence | Severity |
|---|---|---|---|
| C-01 | **No backend, no API, no persistence.** All state is `useState`; refresh resets everything. Zero `fetch`/`axios` calls. | `App.tsx`; grep = 0 | Critical |
| C-02 | **Authorization does not exist.** `currentRole` is never read for a permission check. The role switcher changes a label and nothing else. | `App.tsx` | Critical |
| C-03 | **Audit attribution is hard-coded to five real-looking FCCL emails** regardless of selected role, and logs removed role names ("Plant Admin", "Store Officer", "Technician"). | `App.tsx:286,317,338,360,379,396,417,444,463,497` | Critical |
| C-04 | **The "cryptographic" audit chain is neither cryptographic nor complete.** FNV-1a over 4 fields (`id`, `action`, `entityId`, `timestamp`); `actor`, `changesSummary` and `changes` are outside the hash. Editing the payload alone is undetectable. The UI claims "100% Verified". | `inventoryRules.ts` `computeRecordHash`; `AuditTrailView` | High |
| C-05 | **Issuing more spares than exist silently clamps to zero.** `Math.max(0, stock - qty)` — no rejection, no shortfall, and the audit log records the full issue as if it succeeded. | `App.tsx` `handleIssueSpare` | High |
| C-06 | **No stock transaction records.** Only an audit-log string. The documented per-item issue/restock history does not exist. | `App.tsx`, `StockAndSparesView` | High |
| C-07 | **Asset assignment is not audited, and has no UI.** `onAssignAsset` is passed into `AssetInventoryView` and never used; the handler in `App.tsx` updates state without an audit entry. | `AssetInventoryView.tsx:41,56`; `App.tsx:578` | High |
| C-08 | **Rack height is hard-coded to 42U in the add-asset form and in the collision check**, while the estate contains 48U racks (Rack P01). Equipment above U42 in a 48U rack cannot be registered. | `AssetInventoryView.tsx:874,177`; `inventoryRules.ts` default `maxRackU=42`; runtime shows 48U rack | High |
| C-09 | **CSV "import" is fake.** The drop zone is a `<div>` with no file input; the handler only calls `alert('Device template spreadsheet loaded successfully.')`. | `AssetInventoryView.tsx:982` | High |
| C-10 | **The QR label is decorative, not scannable.** A fixed SVG of rectangles is rendered instead of encoding the asset tag, so the physical-audit story cannot be demonstrated end-to-end. | `AssetInventoryView.tsx:~700` | High |
| C-11 | **CSV export deliberately omits the asset tag** and writes raw `plant-1` IDs. Comment in source: "no asset tag". Export is not itself audited. | `AssetInventoryView.tsx:122–144` | High |
| C-12 | **Work orders require an asset**, although the spec allows reporting a fault before the asset is identified. With no assets, `assets[0]` is `undefined`. | `WorkOrdersView.tsx:45,68`; spec FR-013 | High |
| C-13 | **Every new work order is pre-authorized for a RAM upgrade.** `authorizedHardwareChange` defaults to "RAM Upgrade from 16GB to 32GB" and is submitted unless the user clears it — which then makes hardware changes auto-resolve. | `WorkOrdersView.tsx:48` | High |
| C-14 | **Work-order matching is effectively unconditional.** `matchChangeWithWorkOrder` returns `true` for any work order within ±48 h even when no authorization text matches; `Math.abs` also accepts a work order created *after* the change. | `inventoryRules.ts` | High |
| C-15 | **Every new device receives identical server specs** (Xeon Gold 6338 / 64 GB / 3840 GB / RHEL 9) regardless of category — a laptop is registered as a server. The spec fields exist in state but have no inputs in the form. | `AssetInventoryView.tsx:90,217` | High |
| C-16 | **Plant isolation is UI-only and partial.** Suppliers and the audit scanner ignore the selected plant; several filter counts use global lists; no layer enforces the boundary. | `SupplierTrackingView`, `PhysicalAuditScannerModal`, `StockAndSparesView` | High |
| C-17 | **The frontend imports the "backend" mock data directly**, and the header imports it *instead of using its `plants` prop*. Any future API swap breaks both. | `App.tsx:26`; `NavigationHeader.tsx:6` | High |
| C-18 | **The footer states the opposite of the architecture decisions:** "PostgreSQL RLS Multi-Plant Isolation" and "Go Endpoint Daemon v1.4" — MSSQL was chosen and the agent was deferred. | `App.tsx:668–670` | High |

#### Medium

| ID | Finding | Evidence |
|---|---|---|
| C-19 | **Power telemetry is fabricated and clamped.** Unspecified devices default to 250 W / 15 kg; Rack A01 renders 11,010 W against an 8,000 W budget as "100%" with no overload state. | `RackVisualizerView`; runtime |
| C-20 | **Rack visualizer does not re-scope its active rack** when the plant filter changes, so it can display a rack outside the selected plant. | `RackVisualizerView.tsx:40` |
| C-21 | **IDs come from `Date.now()` (7 places) and work-order numbers from `Math.random()`**; device numbers come from `assets.length + 1`, so deleting a device causes duplicate numbers. | `App.tsx`; `AssetInventoryView.tsx:199` |
| C-22 | **`PhysicalAuditScannerModal` returns `null` before calling five hooks** — a rules-of-hooks violation. It did *not* crash in browser testing, but it is one refactor away from "Rendered more hooks than during the previous render". | `PhysicalAuditScannerModal.tsx:41` |
| C-23 | **The scanner can only "scan" one hard-coded rogue tag**; it cannot detect assets that were *not* scanned (missing-asset audit), and the session ID is a constant. | `PhysicalAuditScannerModal.tsx:60` |
| C-24 | **Filters do not cover the type union.** Category filter omits Rack Cabinet and Core Router; status filter omits Scrapped; connectivity filter casts with `as any`. | `AssetInventoryView.tsx:319,333–352` |
| C-25 | **Modals lack `role="dialog"`, focus trap and Escape handling** (verified: 0 dialogs exposed to the a11y tree when the scanner is open). | runtime; components |
| C-26 | **Clickable `<div>`s are not keyboard reachable** (vendor cards, logo, several rows). | components |
| C-27 | **No pagination or virtualization anywhere**; hash verification recomputes over all logs on every keystroke. | `AuditTrailView.tsx:27` |
| C-28 | **No error boundary, no loading states, no request layer** — fine today, but the first API call will have nowhere to put its errors. | `App.tsx` |
| C-29 | **`LiveMonitoringBoard.tsx` (420 lines) is imported by nothing.** Dead code that still compiles and ships in the repo. | grep: no imports |
| C-30 | **Tooling is incomplete:** no test script, no test runner dependency, no ESLint/Prettier config, `lint` is just `tsc`, and `clean` uses `rm -rf` (fails on this Windows machine). | `package.json` |
| C-31 | **Unused dependencies** from the AI Studio origin: `@google/genai`, `express`, `dotenv`, `@types/express`. Root `metadata.json` still declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`. | `package.json`, `metadata.json` |

#### Low

| ID | Finding | Evidence |
|---|---|---|
| C-32 | Inconsistent rendering of `Unknown` as "Offline" in several views. | `AssetInventoryView`, `SupplierTrackingView` |
| C-33 | Raw plant IDs shown to users (`plant-1`) in modals and drawer footer. | components |
| C-34 | Restock defaults to exactly the reorder point, leaving the item still "Low Stock". | `StockAndSparesView.tsx:377` |
| C-35 | New stock SKU defaults to `"SP-"` with no uniqueness check. | `StockAndSparesView` |
| C-36 | Dashboard "Open work orders" counts all work orders, not open ones; "Asset book value" sums purchase cost, not book value. | `DashboardOverview.tsx` |
| C-37 | The 1-second clock re-renders the whole tree; it made automated clicking unreliable during verification. | runtime |
| C-38 | One 404 on page load (unidentified; likely a favicon). | runtime |

### 4.3 Delivery gaps (not code defects)

| ID | Gap | Why it matters |
|---|---|---|
| P-01 | No data-migration plan for the existing spreadsheets/registers | FCCL has assets today; day one needs a load strategy |
| P-02 | No UAT plan or acceptance criteria per FR | "Done" will be opinion, not evidence |
| P-03 | No deployment target, environment or CI/CD decided | 07 describes policy, not an environment |
| P-04 | No backup restore drill or RPO/RTO validation | The note states targets; nothing proves them |
| P-05 | No training/rollout plan for four plants | Adoption risk, not technology risk |
| P-06 | No performance targets tied to data volume | 42U racks are easy; 10 years of audit logs are not |
| P-07 | No security review of the auth design | JWT + RBAC is stated, never threat-modelled |
| P-08 | Single-person knowledge | Bus factor of one on both docs and code |

---

## 5. Drift register

The core of this note. Every row is a place where a reader would be misled depending on which artefact they opened first.

| # | Topic | Docs say | Spec says | Code does | Status |
|---|---|---|---|---|---|
| R-01 | Audit Trail access | System Admin only (`03:53`) | "Everyone shall search, view and export" (`293`); Appendix B: Auditor V, Employee — (`814`) | No gating at all — every role sees it | 🔁 |
| R-02 | Roles | 4: System Admin, Admin, Employee, Auditor | 4: System Admin, **Plant Admin**, Auditor, Employee | 6 in `UserRole`; 5 in the switcher | 🔁 |
| R-03 | Database | MSSQL Server | PostgreSQL/Prisma (stack table); MySQL (NFR-003) | None | 🔁 |
| R-04 | Backend | ASP.NET Core + EF Core | NestJS | None | 🔁 |
| R-05 | Auth | JWT + RBAC | Keycloak SSO + 2FA | None | 🔁 |
| R-06 | Plant isolation | Enforced server-side | Enforced in the database | Partial UI filtering; suppliers/scanner ignore it | 🔁 |
| R-07 | Asset identifier | Asset tag, unique, never reused | Asset tag | Serial number is primary; tag hidden from UI and CSV | 🔁 |
| R-08 | Lifecycle statuses | 6 (In Use, In Stock, Under Repair, Damaged, Missing, Disposed) | Same 6 (FR-006) | 5 different values (In Use, Spare, In Repair, Decommissioned, Scrapped) | 🔁 |
| R-09 | Time handling | Store UTC, display PKT | Store PKT, display PKT (NFR-006, Confirmed) | No storage; `formatPKT` converts from ISO | 🔁 |
| R-10 | Live monitoring | Deferred | In scope (ping/SNMP collectors) | Fully simulated UI + agent console | 🔁 |
| R-11 | Work orders | May exist without an asset | FR-013 allows unidentified asset | `assetId` required | 🔁 |
| R-12 | Audit immutability | DB-enforced, append-only | Tampering detectable | Client-side FNV chain over 4 fields; "Restore chain" wipes real entries | 🔁 |
| R-13 | QR labels | FR-020 printable, scannable | FR-020 | Decorative SVG | 🔁 |
| R-14 | Export auditing | Every export recorded (FR-022) | FR-022 | CSV export writes no audit entry | 🔁 |
| R-15 | Module scope | 4 core modules for diagrams | 21 modules in the table; 26 in the intro | 8 screens | 🔁 |

**How to use this table:** when a row is resolved, do not delete it. Change `Status` to ✅ and add a changelog line naming the commit that fixed it.

---

## 6. Case study: FR-024, or why this note exists

This is the cleanest example of how a small misreading becomes a project risk.

1. **The source (spec:293)** says: *"Everyone shall search, view and export the audit trail."*
2. **The source contradicts itself (spec:814):** Appendix B gives System Admin `V (all)`, Plant Admin `V (own plant)`, Auditor `V`, Employee `—`.
3. **The pack asserts a third thing (03:53):** *"FR-024 says only System Admin may search, view and export the Audit Trail"* — and calls it an "Important conflict" with the Auditor role. The same claim is repeated in 04, 05, 06 and 08.
4. **The code does a fourth thing:** no role check anywhere, so every role can read the audit trail.

Four artefacts, four positions. If FCCL signs off on the pack, the acceptance test for FR-024 is undefined; if they sign off on the spec, the pack is wrong; if they test the prototype, it passes by accident.

**Resolution needed before backend design:** decide (a) who may read the audit trail, (b) whether "everyone" in FR-024 was intentional, and (c) whether Appendix B supersedes it. Record the answer in [[08-decisions-and-open-issues]] and correct all five notes in the same commit.

---

## 7. Risk register

| ID | Risk | Likelihood | Impact | Early warning | Mitigation |
|---|---|---|---|---|---|
| K-01 | Backend starts before FR-024 / role model is settled | High | High | First EF model contains a role enum | Settle §8 items 1–3 first |
| K-02 | Drift compounds; docs and code describe different systems | High | High | This register grows faster than it closes | Every PR updates the affected row |
| K-03 | The prototype is mistaken for delivered functionality | Medium | High | A demo shows CSV import or QR scanning | Label mocks in the UI, or remove them |
| K-04 | Audit "tamper-proof" claim reaches FCCL and fails review | Medium | High | Someone asks for the hash algorithm | Replace FNV with HMAC-SHA-256 server-side |
| K-05 | Plant isolation implemented late and retrofitted | Medium | High | First API endpoint lacks a plant filter | Make plant scope a query-filter convention from endpoint #1 |
| K-06 | No migration path for existing asset registers | Medium | Medium | Go-live date appears before a load plan | Draft the load plan with FCCL during design |
| K-07 | Status sets change again after schema design | Medium | Medium | New status appears in a meeting | Keep statuses in a lookup table, not an enum |
| K-08 | Bus factor of one | High | High | No second person can run the build | Pair on the backend scaffold; keep this note current |

---

## 8. Decisions that block the build

Pulled from [[08-decisions-and-open-issues]]; these are the ones that must be answered *before* the first EF Core migration.

1. **Audit Trail access** — see [[#6. Case study: FR-024, or why this note exists]]. Blocks the audit module and the role matrix.
2. **Role names and count** — is "Admin" the same as the spec's "Plant Admin"? Blocks every authorization attribute.
3. **Lifecycle status set** — the 6 spec statuses or the 5 prototype statuses? Blocks the asset table and every report.
4. **Asset identifier** — tag, serial, or both? Blocks the schema and the QR design.
5. **Plant scope mechanism** — global query filter, per-request claim, or row-level security? Blocks every endpoint.
6. **Time storage** — UTC (decision) vs PKT (NFR-006, marked Confirmed). Blocks every timestamp column.
7. **Work order without an asset** — allowed or not? Blocks the work-order schema.
8. **Live monitoring in or out of v1** — blocks the agent contract and the ChangeEvent model.

---

## 9. Metrics and verification

Run these before changing `last_verified`. Record the date, not just the result.

```powershell
cd frontend
npx tsc --noEmit                                  # expect exit 0
npm run build                                     # expect exit 0
npx tsx --test src/utils/inventoryRules.test.ts   # expect 8 pass
```

```powershell
# structural facts
(Get-ChildItem src -Recurse -Include *.ts,*.tsx | Measure-Object -Property Length -Sum)
Select-String -Path src/*.tsx,src/components/*.tsx -Pattern 'fetch\(|axios' | Measure-Object
Select-String -Path src/*.tsx,src/components/*.tsx -Pattern 'localStorage' | Measure-Object
```

| Metric | Baseline 2026-11-06 | Target | How |
|---|---|---|---|
| Type errors | 0 | 0 | `tsc --noEmit` |
| Build | pass, 319 kB / 83 kB gzip | pass | `npm run build` |
| Unit tests | 8 | ≥ 8, plus API tests | `tsx --test` |
| Test coverage | utils only | rules ≥ 90 % | add coverage tool |
| `any` casts | 2 | 0 | grep |
| Components | 12 (1 orphan) | 0 orphans | grep imports |
| Drift rows open | 15 | 0 | this note |
| Backend endpoints | 0 | — | — |
| Docs with version/owner | 0 / 13 | 13 / 13 | frontmatter check |

---

## 10. Next actions

Ordered; tick as they land. Do not delete completed items — the history is the point.

**Now — documentation (1–2 days)**
- [ ] Resolve FR-024 and correct notes 03, 04, 05, 06, 08 (D-01, D-02)
- [ ] Add a document-control block (version, date, owner, status) to 01–08 (D-06)
- [ ] Fix or remove the 20 broken `media/` references (D-04)
- [ ] Add the spec's MySQL / PKT / Appendix-B contradictions to [[08-decisions-and-open-issues]] (D-03)
- [ ] Add owners and due dates to the open-questions list (D-08)
- [ ] Convert `project_summary` `file:///` links to wikilinks (D-09)

**Next — prototype honesty (2–3 days)**
- [ ] Remove or label the fake CSV import and decorative QR (C-09, C-10)
- [ ] Fix the footer's PostgreSQL/Go-agent claims (C-18)
- [ ] Delete `LiveMonitoringBoard.tsx` or wire it up (C-29)
- [ ] Fix the 42U hard-code and pass the selected rack's height (C-08)
- [ ] Remove the pre-filled hardware authorization (C-13)
- [ ] Add a `test` script and an ESLint config (C-30)

**Then — backend foundation**
- [ ] Settle §8 items 1–8
- [ ] Scaffold ASP.NET Core + EF Core with one vertical slice (assets, plant-scoped)
- [ ] Replace the mock import with an API client; delete the direct `backend/data` import
- [ ] Add an audit writer that records actor from the token, not a constant

---

## 11. Changelog

Newest first. One line per change; link the commit when there is one.

| Date | Change |
|---|---|
| 2026-11-06 | Initial audit. Read the full spec, all 17 source files, ran type check, build, tests and a browser pass; created this note and linked it from the README. |

---

## 12. Related notes

- [[README]] — entry point to the documentation pack.
- [[08-decisions-and-open-issues]] — what is settled and what is not.
- [[02-architecture-and-technology]] — the current stack this note measures the code against.
- [[03-roles-and-access-control]] — the role model, including the FR-024 error.
- [[05-data-model-and-business-rules]] — the rules the code only partly implements.
- [[Obsidian Linking Guide]] — how the notes are wired together.
- [[inventoryRules.ts]] — the only layer with tests.
- [[inventory.ts]] — the domain model as the code sees it.
