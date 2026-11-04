# Core Modules

## 1. Current module scope
The user selected exactly four core modules for the current diagram work:
1. Asset Inventory
2. Spare Parts
3. Work Orders
4. Audit Trail

Each module must have a separate Use-Case Diagram and a separate Sequence Diagram. Do not derive the diagram scope from the broad module list in Section 2 of the supplied requirements document. The eight deliverables and their UML conventions are specified in [[06-workflows-and-diagrams]], and the actor names must come from [[03-roles-and-access-control]].

## 2. Asset Inventory

### Purpose
Maintain the central register of FCCL IT equipment, including identity, specifications, location, custody, lifecycle status and history.

### Main asset fields
- Asset tag.
- Serial number.
- Asset type.
- Brand and model.
- Lifecycle status.
- Plant and location.
- Assigned employee, where applicable.
- Vendor, where applicable.
- Purchase date and cost in PKR.
- Warranty start/end dates.
- MAC address, hostname and IP address where required.
- Type-specific custom specifications.
- Notes and supporting documents.

The existing prototype also contains device number, rack placement, monitoring fields, live status and specifications such as CPU, RAM, storage, OS, MAC, IP, port count, VLAN range, power draw, weight, firmware, screen size and battery health. These are prototype fields and must be retained only where approved. The prototype models are described in [[project_summary]] and defined in [[inventory.ts]].

### Validation and lifecycle
- Asset tags must be unique and never reused.
- Duplicate tags and serial numbers must be detected.
- Required fields and type-specific fields must be validated.
- Assets must not be permanently deleted.
- Retired assets should be archived with history.
- Disposal/scrapping requires System Admin approval.
- Assignment, transfer, return and status history must be retained.

### Requirements status values
The requirements document lists: In Use, In Stock, Under Repair, Damaged, Missing and Disposed.

The earlier prototype used: In Use, Spare, In Repair, Decommissioned and Scrapped. These sets differ. Use the final FCCL-approved status set consistently.

### Main operations
- Register an asset.
- Search and filter assets.
- View asset details.
- Edit permitted fields.
- Change asset status.
- Assign or unassign an employee.
- View asset history.
- Archive an asset.
- Request/record disposal with approval.

### Access notes
System Admin has highest authority. Admin is the provisional operational asset administrator. Employee can view their own assigned devices and perform confirmed receipt/return actions. Auditor is read-only. All actions must respect plant scope.

## 3. Spare Parts

### Purpose
Track spare-parts and consumable quantities by item and plant, including stock movements and minimum-stock warnings.

### Main stock item fields
- Stock item name.
- SKU/item code.
- Category.
- Plant.
- Vendor.
- Current quantity.
- Minimum threshold.
- Reorder point, if used.
- Unit price in PKR.
- Lead time, if used.
- Shelf location.
- Last restocked date.
- Stock status.

### Stock operations
- Receipt/restock.
- Issue.
- Return.
- Transfer between plants.
- Adjustment, if approved and defined.

Each movement should record the item, plant, quantity, actor, date/time, reason and related purchase order, asset or work order where applicable.

### Business rules
- Quantities are maintained per plant.
- An issue must not reduce stock below zero.
- Stock movements must be recorded as transactions.
- History must not be lost by simply overwriting the quantity.
- Updated quantity is compared with the configured minimum.
- Low-stock warnings are generated when the threshold is reached.
- Concurrent issues must be handled safely.

The existing prototype uses stock health labels Optimal, Low Stock and Critical Reorder. Final thresholds and meanings must be confirmed.

### Access notes
There is no longer a separate Store Officer role. Admin is the provisional replacement for the operational stock role. Auditor read-only visibility must be confirmed.

## 4. Work Orders

### Purpose
Record maintenance, repair and installation requests and track them through resolution and closure.

### Main fields
- Work-order number.
- Description/title.
- Related asset, if known.
- Plant and location.
- Priority.
- Reporter.
- Date reported.
- Work type.
- Assigned responsible person.
- Status.
- Work performed.
- Parts used.
- Time spent.
- Cost.
- External vendor information where applicable.
- Completion and closure information.

### Priority values
- Low.
- Medium.
- High.
- Critical.

Target response times should be configured after FCCL confirms them.

### Requirements statuses
- New.
- Approved.
- Assigned.
- In Progress.
- On Hold.
- Resolved.
- Closed.
- Reopened.

The prototype uses a simpler set: Open, In Progress, Completed and Approved. Do not mix the two status models without approval.

### Main workflow
1. Employee or authorized user reports a problem.
2. A work order is created.
3. Asset may be linked later if unknown at reporting time.
4. Request is reviewed and approved according to policy.
5. Work is assigned.
6. Progress and work performed are recorded.
7. Parts, time and cost are recorded.
8. Asset status is updated where required.
9. Overdue work orders are flagged.
10. System Admin verifies completion before closure, according to the requirements.
11. Work-order history is retained.

### Special cases
- Problem reported without asset identification.
- Work placed On Hold with reason.
- Overdue work.
- Reopened work order.
- External vendor repair with sent date, expected return, cost and result.

### Access notes
The older requirements use a Technician role for work execution. The current role model has no Technician role. Confirm whether Admin performs these actions or technicians are represented under the Admin role. Employee may report a problem. Auditor is read-only.

## 5. Audit Trail

### Purpose
Maintain a permanent record of important system actions for accountability, investigation and change verification.

### Events to record
- Create and edit actions.
- Archive actions.
- Assignments and transfers.
- Approvals.
- Sign-ins and failed sign-ins.
- Blocked access attempts.
- Relevant automatic/system actions.

### Audit entry fields
- Actor/user.
- Actor role.
- Date and time.
- Action.
- Entity/record type.
- Entity/record ID.
- Plant scope.
- Old value.
- New value.
- Change summary.
- System-action indicator.

### Integrity and permissions
- Users must not be able to edit or delete audit entries.
- Tampering must be detectable.
- Automatic actions must be marked as system actions.
- FR-024 says only System Admin may search, view and export Audit Trail.
- Auditor read-only status does not automatically override FR-024; FCCL must resolve the conflict.

### Prototype distinction
The frontend prototype demonstrates a hash-chained log. The earlier backend planning decision was to use standard server-generated audit logs rather than hash-chain verification. The production design must still satisfy approved integrity and tamper-detection requirements. See [[project_summary]] for the prototype mechanism, [[inventoryRules.ts]] for the hash-chain implementation, and [[08-decisions-and-open-issues#2. Superseded information]] for why it is not the production design.

## 6. Cross-module relationships
- Asset Inventory connects to Work Orders because a work order may reference an asset and affect its status.
- Work Orders connect to Spare Parts because parts may be recorded as used during maintenance.
- Spare Parts connects to Audit Trail because receipts, issues, returns and transfers must be traceable.
- Asset Inventory connects to Audit Trail because asset creation, edits, status changes, assignments, archiving and disposal must be recorded.
- Work Orders connect to Audit Trail because creation, approval, assignment, status changes and closure must be recorded.
- All four modules must enforce roles and plant-level access.

## Related notes
- [[03-roles-and-access-control]] — actors and permissions for each module.
- [[05-data-model-and-business-rules]] — records and validation rules behind these modules.
- [[06-workflows-and-diagrams]] — use-case and sequence workflows.
- [[08-decisions-and-open-issues]] — unresolved status lists and permissions.
- [[project_summary]] — the prototype screens implementing these modules.
