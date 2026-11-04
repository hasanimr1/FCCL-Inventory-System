# Data Model and Business Rules

## 1. Purpose
This is a logical data model consolidated from the requirements specification, project summary and backend planning discussions. It is not a final SQL Server schema. Module context is in [[04-core-modules]]; the stack and consistency principles that will persist these records are in [[02-architecture-and-technology]].

## 2. Main records

### Plant
Represents a FCCL plant or head-office location.
Potential fields: Plant ID, name, code, city/location, site description and status.

### User
Represents a person who can sign in.
Potential fields: User ID, login identifier, password hash or identity-provider reference, role, active status and timestamps. Administrators create accounts; public self-registration is not part of the current plan.

### User Plant Access
Maps users to plants they may access.
Potential fields: User ID, Plant ID and access scope.

### Employee
Represents an employee who may hold equipment.
Fields described in the requirements include employee ID, name, department, job title, plant, status and work contact details. Store only the minimum data needed and follow FCCL policy.

### Asset
Potential fields: Asset ID, asset tag, serial number, type/category, brand, model, plant, location, vendor, lifecycle status, purchase date, purchase cost, warranty dates, assigned employee and notes.

### Asset Custom Specifications
Stores type-specific specifications such as CPU, RAM, storage, OS, MAC address, IP address, port count, VLAN range, power draw, weight, firmware, screen size and battery health.

### Asset Assignment
Represents custody of an asset by an employee.
Potential fields: Assignment ID, Asset ID, Employee ID, start/end dates, receipt confirmation, return confirmation, reason and actor. Preserve the full history.

### Stock Item
Potential fields: Stock Item ID, SKU, name, category, plant, vendor, current quantity, minimum threshold, reorder point, unit price, lead time, shelf location, status and last restocked date.

### Stock Transaction
Represents receipt, issue, return, transfer or approved adjustment.
Potential fields: Transaction ID, Stock Item ID, plant, transaction type, quantity, date/time, actor, reason, purchase-order reference and related asset/work order where applicable.

### Work Order
Potential fields: Work Order ID, work-order number, description, optional Asset ID, plant, location, priority, reporter, assigned responsible person, status, work type, created date, work performed, parts used, time, cost and closure information.

### Audit Log
Potential fields: Audit ID, actor/user or system actor, role, action, entity type, entity ID, plant scope, timestamp, old value, new value and change summary.

## 3. Main relationships

```text
Plant
  |-- Assets
  |-- Employees
  |-- Stock Items
  |-- Work Orders
  +-- Users (through User Plant Access)

Employee
  +-- Asset Assignments
          +-- Asset

Asset
  |-- Custom Specifications
  |-- Assignment History
  |-- Work Orders
  +-- Audit Events

Stock Item
  +-- Stock Transactions
          |-- User / Actor
          |-- Related Work Order (optional)
          +-- Related Asset (optional)

Important business records
  +-- Audit Trail Entries
```

## 4. Plant-scope rules
- Every plant-level record must be associated with a plant.
- Users may access only their authorized plant scope.
- Cross-plant access is limited to roles explicitly authorized for it.
- Backend authorization must validate plant scope.
- Never trust a client-supplied plant ID without checking the authenticated user's permissions.

## 5. Asset rules
- Asset tags are unique and never reused.
- Duplicate tags must be blocked.
- Serial-number uniqueness rule must be confirmed.
- Required fields must be validated.
- Asset lifecycle changes must be recorded.
- Assets are archived rather than permanently deleted.
- Disposal/scrapping requires System Admin approval.
- Assignment, transfer and return history must be retained.

## 6. Stock rules
- Quantities are maintained per plant.
- Issues must not exceed available stock.
- Every stock transaction records actor, date, quantity and reason.
- Receipts, issues, returns and transfers are recorded as transactions.
- Minimum stock levels are configurable.
- Low-stock warnings are generated at the configured threshold.
- Use transactions and concurrency-safe checks for stock updates.

## 7. Work-order rules
- A work order may be created without an asset link.
- An authorized user can link the asset later.
- Priority values must use the approved list.
- Status transitions must follow an explicit state machine.
- Work performed, parts, time and cost should be recorded.
- Asset status is updated when required.
- Overdue work orders are flagged.
- Closure requires the verification defined by FCCL.
- Reopening preserves prior history.

## 8. Audit rules
- Record relevant actions across modules.
- Identify actor, time, action and affected record.
- Store old/new values for changes where applicable.
- Mark automatic system actions.
- Users must not edit or delete audit entries.
- Record failed sign-ins and blocked access attempts.
- Audit Trail viewing/export must follow the approved permission policy; current FR-024 restricts it to System Admin.

## 9. Data consistency
- Use stable primary keys.
- Use foreign keys and unique constraints.
- Use transactions for multi-record operations.
- Use fixed-precision decimal types for money.
- Use consistent timestamp storage/display.
- Index commonly filtered fields such as plant, status, category, asset tag and SKU.
- Preserve stock transactions and asset assignment history.

## 10. Prototype versus production
The earlier [[project_summary]] contains TypeScript models and prototype-specific statuses. These are useful when mapping the UI to the backend but are not automatically the final schema. Reconcile asset statuses, work-order statuses, audit implementation, role names and monitoring fields before production implementation; each of those reconciliations is tracked in [[08-decisions-and-open-issues]].

## Related notes
- [[02-architecture-and-technology]] — EF Core, MSSQL and consistency principles.
- [[03-roles-and-access-control]] — plant scope and authorization.
- [[04-core-modules]] — where these records are used.
- [[06-workflows-and-diagrams]] — the operations that read and write them.
- [[inventory.ts]] — the current TypeScript types these models must align with.
