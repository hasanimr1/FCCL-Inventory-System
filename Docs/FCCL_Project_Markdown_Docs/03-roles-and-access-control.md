# Roles and Access Control

## 1. Current four-role model

The user explicitly updated the platform to exactly four roles. This replaces older role names in previous prototype and requirements material.

| Hierarchy | Role | Description |
|---:|---|---|
| 1 – Highest | System Admin | Highest-level system authority. |
| 2 | Admin | Second-level administrative role. |
| 3 | Employee | Standard employee-level role. |
| 4 | Auditor | Read-only role. |

Use these exact names in current documentation, diagrams, backend authorization and UI role selection. These four roles are the actors in the modules described in [[04-core-modules]] and the diagrams specified in [[06-workflows-and-diagrams]].

## 2. System Admin
System Admin is the highest role. The requirements assign system-wide responsibilities to this role, including:
- Manage user accounts.
- Create, disable and re-enable accounts.
- Change user roles.
- Manage plants and system-level configuration.
- Manage asset types and settings.
- View all plants where authorized.
- Approve disposal or scrapping of assets.
- Approve inter-plant asset movement.
- Approve work orders and verify completed work before closure, as specified.
- Search, view and export Audit Trail entries under FR-024.

## 3. Admin
Admin is the second-highest role and replaces the older Plant Admin, Technician and Store Officer labels in the current four-role structure.

The exact permission matrix has not yet been fully confirmed. Admin is expected to be the operational administrative role, potentially covering:
- Maintaining asset records.
- Managing spare-parts operations.
- Creating and updating work orders.
- Recording maintenance progress.
- Managing plant-level operational records within authorized scope.

These module-level permissions remain provisional until FCCL confirms them.

## 4. Employee
Employee is the third role. The requirements support:
- Viewing the employee's own assigned devices.
- Confirming receipt of an assigned device.
- Confirming return of a device.
- Reporting a problem that may become a work order.

Do not grant access to other employees' records or plant-wide administration unless approved.

## 5. Auditor (Read Only)
Auditor is the fourth role and must be read-only. It must not create, edit, delete, approve or otherwise modify system records.

**Important conflict:** Requirements FR-024 says only System Admin may search, view and export the Audit Trail. The Auditor role being read-only does not automatically grant access to Audit Trail. Until FCCL changes FR-024, keep Audit Trail search/view/export restricted to System Admin. This conflict is tracked in [[08-decisions-and-open-issues#7. Open Audit Trail decisions]] and in the Audit Trail workflow in [[06-workflows-and-diagrams]].

## 6. Removed role names
Older versions contained:
- Super Admin.
- Plant Admin.
- Technician.
- Store Officer.

These are no longer separate roles. Their responsibilities must be mapped to the current four-role permission model. Do not reintroduce them as separate user roles. The prototype still defines all six in [[inventory.ts]] and exposes them in the role switcher in [[NavigationHeader.tsx]], so the UI must be reconciled with this note before backend integration.

## 7. Authorization principles
- Use server-side RBAC.
- Enforce plant-level scope in backend authorization and database queries.
- UI visibility rules are for usability only; backend authorization remains mandatory.
- Changing a URL, record ID or plant ID must not allow access to another plant.
- Record relevant failed sign-ins and blocked access attempts.
- Auditor is read-only.
- Define permissions explicitly; do not assume hierarchy alone grants every permission of a higher role.

## 8. Provisional permission matrix

| Activity | System Admin | Admin | Employee | Auditor |
|---|---|---|---|---|
| Manage users and roles | Confirmed | Not confirmed | No | No |
| Manage plants and settings | Confirmed | Not confirmed | No | Read-only only if approved |
| Create/edit assets | System-wide authority | Provisional | No | View only |
| View own assigned assets | Yes | Within scope, subject to policy | Confirmed | If authorized |
| Confirm own receipt/return | Can act on behalf in specified cases | Not fully defined | Confirmed | No write action |
| Manage spare parts | System-wide administration implied; detail to confirm | Provisional | No | Read-only visibility provisional |
| Create/update work orders | Yes | Provisional | May report a problem | View only |
| Approve work orders | Confirmed | Not confirmed | No | No |
| Record work performed | Administrative authority; operational mapping to confirm | Provisional | No | No |
| Search/view/export Audit Trail | Confirmed | No unless policy changes | No | No unless FR-024 changes |
| Edit/delete audit entries | Not permitted for users | No | No | No |

## 9. Questions to confirm
1. Does Admin have full add/edit access to assets within assigned plants?
2. Does Admin manage spare-part receipts, issues, returns, transfers and minimum levels?
3. Does Admin perform the Technician activities from the older requirements?
4. Which records can Auditor view in each core module?
5. Should Auditor view Audit Trail despite FR-024?
6. Can Employee see the status of work orders they submit?
7. Is work-order approval exclusive to System Admin?

The consolidated list of open questions, including those raised by FR-024, is kept in [[08-decisions-and-open-issues#3. Open role and permission decisions]].

## Related notes
- [[04-core-modules]] — what each role can do in each module.
- [[06-workflows-and-diagrams]] — roles as diagram actors.
- [[08-decisions-and-open-issues]] — unconfirmed permissions.
- [[05-data-model-and-business-rules#4. Plant-scope rules]] — how plant scope is enforced.
- [[inventory.ts]] — the role type currently used by the frontend.
