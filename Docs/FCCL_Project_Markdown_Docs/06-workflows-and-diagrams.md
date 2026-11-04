# Workflows and Diagram Specification

## 1. Diagram deliverables
Create eight separate diagrams:
- Asset Inventory — Use-Case Diagram.
- Asset Inventory — Sequence Diagram.
- Spare Parts — Use-Case Diagram.
- Spare Parts — Sequence Diagram.
- Work Orders — Use-Case Diagram.
- Work Orders — Sequence Diagram.
- Audit Trail — Use-Case Diagram.
- Audit Trail — Sequence Diagram.

Use the four updated roles: System Admin, Admin, Employee and Auditor (Read Only). Do not reintroduce Plant Admin, Technician, Store Officer or Super Admin.

Do not use the module list in Section 2 of the requirements document as the diagram scope. The four modules above are the selected scope. Module definitions are in [[04-core-modules]] and actor definitions in [[03-roles-and-access-control]].

## 2. UML conventions

### Use-Case Diagrams
Each module has its own system boundary. Show the module name, relevant actors, use cases and actor associations. Use `include` and `extend` only where meaningful and supported by requirements. Mark unconfirmed role permissions as provisional.

### Sequence Diagrams
Show relevant interactions between:
- Human actor.
- Frontend/browser UI.
- Backend API.
- Authentication/authorization.
- Relevant business service.
- Database.
- Audit service.
- Notification service where needed.

Show navigation, form input, API request, authentication, role and plant checks, business validation, database read/write, audit event, notification where relevant, response and updated UI.

Use `alt`, `opt`, `loop` and `break` fragments for success, failure and optional paths where useful. Keep technology-specific participant names out until the final stack is reflected consistently. The current stack is defined in [[02-architecture-and-technology]]; once a diagram is aligned with it, participants may name the API and database explicitly.

## 3. Asset Inventory workflow: create/update asset

1. Admin opens Asset Inventory.
2. Admin chooses Add Asset or selects an existing asset.
3. Frontend displays the asset form.
4. Admin enters or updates asset details.
5. Frontend submits the request.
6. Backend authenticates the user and checks role permissions.
7. Backend validates plant scope.
8. Backend validates required and type-specific fields.
9. Backend checks asset-tag and serial-number uniqueness.
10. Backend saves the asset.
11. Backend records the action in Audit Trail.
12. API returns the saved record.
13. Frontend displays the updated asset.

### Asset Inventory alternative flows
- Duplicate tag or serial number: reject and return a validation message.
- Missing required field: reject and identify the invalid field.
- Unauthorized role: block the request.
- Out-of-scope plant: deny access.
- Retired asset: archive and preserve history.
- Disposal/scrapping: require System Admin approval.

Other use cases include search/filter, view details, view own assigned assets, edit permitted fields, change status, assignment/return, history, archive and disposal request.

## 4. Spare Parts workflow: issue a spare part

1. Admin opens Spare Parts.
2. Admin selects a stock item and plant.
3. Admin enters issue quantity, recipient or related work order where applicable, and reason.
4. Frontend submits the request.
5. Backend authenticates the user.
6. Backend checks role and plant scope.
7. Backend verifies item existence and available quantity.
8. Backend creates a stock transaction.
9. Backend reduces stock in a database transaction.
10. Backend records the issue in Audit Trail.
11. Backend compares the new balance with the minimum threshold.
12. If threshold is reached, the system generates a low-stock warning.
13. API returns the updated quantity.
14. Frontend displays the result.

### Spare Parts alternative flows
- Insufficient stock: reject the issue and leave the balance unchanged.
- Unknown stock item: return not found.
- Unauthorized user or plant: block the transaction.
- Concurrent issue: reject if remaining quantity is no longer sufficient.
- Minimum threshold reached: generate a warning for authorized recipients.

Other use cases include catalogue viewing, stock by plant, add SKU, receipt/restock, return, transfer, threshold configuration, history and low-stock warnings.

## 5. Work Orders workflow: report, process and close

1. Employee or authorized user opens the work-order request screen.
2. User enters problem description, location and work type.
3. Asset identification is optional at initial reporting.
4. Frontend submits the request.
5. Backend validates and creates a work order with its initial status.
6. Backend saves the record.
7. Backend records creation in Audit Trail.
8. Admin reviews the request and links an asset if needed.
9. System Admin approves the work order according to requirements.
10. Admin/assigned responsible person updates progress.
11. Work performed, parts, time and cost are recorded.
12. Backend updates work-order and relevant asset status.
13. System Admin verifies completion.
14. Work order is closed.
15. Status changes and closure are audited.
16. Frontend displays the current status.

### Work Orders alternative flows
- No asset known: create the work order first and link later.
- On Hold: retain the work order and record the reason.
- Overdue: flag for follow-up.
- Completion not verified: do not close.
- Reopened: return to active workflow and retain history.
- External vendor repair: record sent date, expected return, cost and result.

The requirements list statuses New, Approved, Assigned, In Progress, On Hold, Resolved, Closed and Reopened. The older prototype has a simpler status set. Final transitions must be confirmed.

### Work Orders role issue
The old requirements refer to a Technician role. The current role model does not contain Technician. Confirm whether Admin performs those actions or technicians are represented under the Admin role.

## 6. Audit Trail workflow: record and review action

1. Admin performs an authorized business action.
2. Frontend sends the request.
3. Backend authenticates the user.
4. Backend checks role and plant scope.
5. Backend validates the request.
6. Backend commits the business change.
7. Backend sends actor, time, action, record identifier and old/new values to Audit Service.
8. Audit Service appends the audit entry.
9. API returns the business result.
10. System Admin opens Audit Trail.
11. System Admin searches or filters entries.
12. Backend verifies System Admin permission.
13. Backend retrieves matching entries.
14. Frontend displays read-only results or provides authorized export.

### Audit Trail alternative flows
- Validation fails: no business change is committed.
- Authorization fails: deny and record blocked access where applicable.
- Sign-in fails: record failed sign-in.
- Audit write fails: treat as an integrity/operational issue; do not silently claim full audit success.
- Tampering detected: raise the approved integrity alert/investigation.
- User attempts to edit/delete an entry: reject.

### Audit visibility conflict
FR-024 states only System Admin may search, view and export Audit Trail. Auditor's general read-only role does not automatically grant this permission. Until FCCL changes FR-024, show only System Admin accessing Audit Trail search/view/export.

## 7. Cross-module relationships
- Asset Inventory links to Work Orders through the affected asset.
- Work Orders link to Spare Parts through parts used.
- Asset changes, stock transactions and work-order changes generate Audit Trail entries.
- Stock issues may reference a work order and/or asset.
- All API operations enforce authentication, role authorization and plant scope.

## Related notes
- [[03-roles-and-access-control]] — actors used in the diagrams.
- [[04-core-modules]] — module scope.
- [[05-data-model-and-business-rules]] — the records behind each step.
- [[02-architecture-and-technology]] — participants named in sequence diagrams.
- [[Asset_Management_Requirements_Specification]] — the original sequence and use-case sections.
