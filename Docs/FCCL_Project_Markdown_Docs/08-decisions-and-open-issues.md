# Decisions, Open Issues and Project History

> For a dated comparison of these decisions against what the prototype actually implements — including the FR-024 misquote that affects the audit-access decision — see [[Project Map]].

## 1. Current decisions

| Area | Current direction | Status |
|---|---|---|
| Project | FCCL IT Asset & Infrastructure Management Platform | Current |
| Application | Centralized web platform | Current |
| Frontend | React + TypeScript + Vite | Current |
| Backend | ASP.NET Core Web API + C# | Current |
| ORM | Entity Framework Core | Current |
| Database | MSSQL Server | Current; supersedes PostgreSQL |
| Authentication | JWT | Current direction |
| Authorization | RBAC | Current direction |
| Account creation | Admin-created accounts; no public self-registration | Current direction |
| Plant access | Strict server-side plant isolation | Current direction |
| Development | Local first | Current direction |
| Integration | Backend first, then frontend integration | Current direction |
| UI | Retain existing UI where practical | Current direction |
| Live monitoring | Deferred | Current direction |
| Go endpoint agent | Deferred / not planned in immediate scope | Current direction |
| Roles | System Admin, Admin, Employee, Auditor (Read Only) | User-confirmed |
| Core modules | Asset Inventory, Spare Parts, Work Orders, Audit Trail | User-confirmed |
| Diagrams | Separate use-case and sequence diagram per core module | User-confirmed |
| Current Markdown docs | Text only; no pictures | User-confirmed |

Area-by-area detail: [[01-project-overview]] (scope and delivery), [[02-architecture-and-technology]] (stack), [[03-roles-and-access-control]] (roles and permissions), [[04-core-modules]] (module scope), [[05-data-model-and-business-rules]] (records and rules), [[06-workflows-and-diagrams]] (diagrams), [[07-backup-deployment-and-recovery]] (hosting and recovery).

## 2. Superseded information

### Database
An earlier backend plan selected PostgreSQL. The user later changed the database requirement to MSSQL Server. Use MSSQL Server for current implementation planning. See [[02-architecture-and-technology]].

### Roles
Older prototype/requirements material included Super Admin, Plant Admin, Technician and Store Officer. These are no longer separate roles. Use only System Admin, Admin, Employee and Auditor (Read Only). See [[03-roles-and-access-control]], and note that [[inventory.ts]] still defines the old set.

### Audit implementation
The frontend prototype uses a hash-chained audit log and tamper simulation. The earlier backend planning decision was to use standard server-generated audit logs rather than hash-chain verification. Production must still meet the approved tamper-detection and integrity requirements. The prototype is described in [[project_summary]] and the current module rules are in [[04-core-modules#5. Audit Trail]].

### Live monitoring
The prototype contains simulated heartbeats and live device status. Live monitoring and the Go endpoint agent were deferred from immediate backend scope. See [[02-architecture-and-technology#7. Deferred monitoring]].

### Technology proposals in requirements
The requirements specification proposed Next.js, NestJS, PostgreSQL, Keycloak, Redis, WebSockets, BullMQ, Docker and NGINX. These are not the current confirmed implementation stack. The current stack is in [[02-architecture-and-technology]]; the earlier blueprint that proposed some of these is [[Inital Plan]].

### Work-order statuses
The prototype uses a simplified set; the requirements specify a more detailed workflow. The final status state machine requires confirmation. Both sets are compared in [[04-core-modules#4. Work Orders]] and [[06-workflows-and-diagrams#5. Work Orders workflow: report, process and close]].

### Asset statuses
The prototype and requirements document use different lifecycle values. Confirm the final list before implementing database constraints and UI dropdowns. The two lists are in [[04-core-modules#2. Asset Inventory]].

## 3. Open role and permission decisions
- Confirm exact Admin permissions for Asset Inventory.
- Confirm Admin's Spare Parts permissions.
- Confirm whether Admin performs Technician activities.
- Confirm Auditor visibility in each core module.
- Confirm whether Auditor can view Audit Trail despite FR-024.
- Confirm whether Employees can see submitted work-order status.
- Confirm whether work-order approval is exclusive to System Admin.

## 4. Open Asset Inventory decisions
- Final asset lifecycle status list.
- Asset-tag format.
- Serial-number uniqueness rule.
- Mandatory fields for each asset type.
- Actions requiring approval.
- Whether prototype rack/device-number fields remain in scope.

## 5. Open Spare Parts decisions
- Who can create stock items?
- Who can receive stock?
- Who can issue stock?
- Who can approve adjustments and inter-plant transfers?
- Minimum-stock thresholds and alert recipients.
- Whether every issue must reference an asset or work order.

## 6. Open Work Orders decisions
- Final status transitions.
- Who approves work orders?
- Who assigns work?
- Who records work performed, parts, time and cost?
- Who verifies completion and closes work?
- Whether Admin is the operational replacement for Technician.

## 7. Open Audit Trail decisions
- Exact events that must always be logged.
- Retention period.
- Export formats.
- Whether only System Admin can search, view and export audit records.
- Approved tamper-detection approach.

## 8. Open backup and deployment decisions
- SQL Server edition and version.
- Hosting location and server specifications.
- RPO and RTO.
- Backup retention period.
- Backup storage location and off-site/immutable policy.
- Deployment owner and support owner.
- Network, certificate, firewall and email requirements.

## 9. Requirements specification issues
The supplied requirements specification contains unresolved or older content:
- Its introduction/scope refers to 26 modules, while the detailed module table contains 21 entries.
- Its roles section and Appendix B contain older role names.
- Its technical overview conflicts with the later user-selected stack.
- FR-024 restricts Audit Trail search/view/export to System Admin, creating a question about Auditor access.
- Work-order requirements refer to Technician, which is no longer a separate role.
- Asset lifecycle values differ from the frontend prototype.
- Hosting, notifications, asset-tag format, inventory size, RPO and RTO remain open.

## 10. Previous planning work
The project conversations included:
- Preparing a detailed project brief and technology-stack explanation.
- Reviewing the existing React frontend and mock-data structure.
- Planning an ASP.NET Core backend and database.
- Selecting JWT and role-based access.
- Requiring strict plant-level data isolation.
- Selecting administrator-created accounts.
- Choosing backend-first development.
- Planning local development followed by deployment to an organization-controlled server.
- Deferring live monitoring and the Go agent.
- Preparing non-technical module questionnaires with suggested answers.
- Discussing backup and recovery.
- Preparing use-case and sequence-diagram plans.
- Updating roles to four roles.
- Narrowing diagram scope to four core modules.

## 11. Questionnaire planning history
An earlier questionnaire exercise covered:
- Asset Inventory / Asset Records.
- Work Orders.
- Audit Trail.
- Asset Movement between plants.
- Spare Parts and Critical Stock Levels.
- Supplier and Hardware Vendor Tracking.
- Server Racks / Rack Visualizers.

Suggested answers were recommendations, not confirmed FCCL requirements. Only explicit answers from the user or FCCL should be treated as confirmed requirements.

## 12. Backup planning history
A previous backup discussion recommended nightly full backups, differential backups every six hours, transaction-log backups every 15–30 minutes when using SQL Server Full recovery model, separate backup storage, an off-site or isolated copy, offline/immutable protection, a 3-2-1 approach, backing up uploaded files and configuration, and regular restore testing. These are recommendations pending FCCL approval.

## 13. Documentation maintenance rule
When a project decision changes:
1. Update the relevant Markdown file.
2. Update the decision table in this file.
3. Mark the old decision as superseded rather than silently deleting history.
4. Update diagrams, API contracts, database design and implementation notes affected by the change.
5. Do not allow older requirements documents or prototype code to override newer user-confirmed decisions.

## Related notes
- [[01-project-overview]] — scope the decisions apply to.
- [[02-architecture-and-technology]] — stack decisions and superseded choices.
- [[03-roles-and-access-control]] — role and permission decisions.
- [[04-core-modules]] — module scope and status sets.
- [[05-data-model-and-business-rules]] — schema decisions.
- [[06-workflows-and-diagrams]] — diagram deliverables.
- [[07-backup-deployment-and-recovery]] — hosting and recovery decisions.
- [[Obsidian Linking Guide]] — how these notes reference each other.
