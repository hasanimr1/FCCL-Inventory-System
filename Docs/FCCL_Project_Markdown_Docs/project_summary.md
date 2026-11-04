# FCCL IT Asset & Infrastructure Platform — Project Summary

> **Purpose:** Full technical overview for backend integration planning.
> **Stack:** React + TypeScript (Vite), Tailwind CSS (via CDN), pure-SVG charts — no external chart libraries.
> **Date:** October 2026

> [!warning] Historical snapshot
> This note inventories the frontend prototype as it stood in October 2026. It is useful for mapping UI to backend, but it is **not** the current specification. Current decisions: [[08-decisions-and-open-issues]]. Target stack: [[02-architecture-and-technology]]. Module scope: [[04-core-modules]].

---

## 1. Project Structure

```
FCCL-Inventory-System/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  ← Root: all state, handlers, routing
│   │   ├── main.tsx                 ← Vite entry point
│   │   ├── index.css
│   │   ├── types/
│   │   │   └── inventory.ts         ← All TypeScript interfaces & enums
│   │   ├── utils/
│   │   │   └── inventoryRules.ts    ← Business logic (pure functions)
│   │   └── components/
│   │       ├── NavigationHeader.tsx
│   │       ├── NavigationDrawer.tsx
│   │       ├── DashboardOverview.tsx
│   │       ├── AssetInventoryView.tsx
│   │       ├── StockAndSparesView.tsx
│   │       ├── SupplierTrackingView.tsx
│   │       ├── RackVisualizerView.tsx
│   │       ├── WorkOrdersView.tsx
│   │       ├── AuditTrailView.tsx
│   │       ├── PhysicalAuditScannerModal.tsx
│   │       └── DeviceStatusDonut.tsx
└── backend/
    └── data/
        └── mockInventoryData.ts     ← Seed data (replaces DB in dev)
```

---

## 2. All Screens (Tabs / Views)

| Tab Key | Component | Description |
|---|---|---|
| `overview` | [DashboardOverview](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/DashboardOverview.tsx#23-163) | Command centre — KPI cards, live device donut chart, plant selector, priority queue |
| `assets` | [AssetInventoryView](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/AssetInventoryView.tsx#47-996) | Full hardware registry with filtering, device detail modal, QR label, register device |
| [stock](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#295-325) | `StockAndSparesView` | Spare parts warehouse — issue, restock, add SKU, stock health indicators |
| `suppliers` | `SupplierTrackingView` | Vendor/supplier registry — add vendor, contracts, SLA, spend tracking |
| `racks` | `RackVisualizerView` | 2D rack diagram — physical U-slot layout per plant, plant/rack picker |
| `workorders` | `WorkOrdersView` | Maintenance work orders — create, update status, filter by priority/plant |
| `audit` | `AuditTrailView` | Immutable hash-chained audit log — tamper simulation, chain integrity check |
| *(modal)* | `PhysicalAuditScannerModal` | Mobile QR audit scanner — scan asset tags, record discrepancies, resolve findings |

---

## 3. Data Models (from [[inventory.ts]])

### [Plant](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#3-14)
```ts
{ id, name, code, city, siteDescription, totalAssets, rackCount, activeAlerts, status }
// status: 'Operational' | 'Maintenance' | 'Partial Link'
// 4 plants: plant-1 → plant-4
```

### [Asset](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#50-76) ← core entity
```ts
{ id, deviceNumber, assetTag, serialNumber, model, category, vendorId, plantId,
  locationRoom, rackId?, rackUnitStart?, rackUnitHeight?, rackFace?,
  status, assignedEmployeeId?, purchaseDate, warrantyEnd, costPKR,
  monitoringEnabled, lastHeartbeatUtc?, liveStatus, customSpecs, notes?, receiptConfirmed? }
// category: Server | Network Switch | Workstation PC | Industrial Laptop | Rack Cabinet | UPS System | SAN Storage | Core Router
// status (lifecycle): In Use | Spare | In Repair | Decommissioned | Scrapped
// liveStatus: Online | Offline | Unknown
```

### [AssetCustomSpecs](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#34-49)
```ts
{ cpu?, ramGb?, storageGb?, os?, macAddress?, ipAddress?, portCount?,
  vlanRange?, powerDrawWatts?, weightKg?, firmwareVersion?, screenSize?, batteryHealthPct? }
```

### [Vendor](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#77-93)
```ts
{ id, code, name, category, contactPerson, email, phone, address,
  rating, activeContracts, slaHours, supportHotline, suppliedCategories[], totalSpendPKR }
```

### [StockItem](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#96-112)
```ts
{ id, sku, name, category, plantId, vendorId, currentStock, minThreshold,
  reorderPoint, unitPricePKR, leadTimeDays, status, shelfLocation, lastRestocked }
// status: Optimal | Low Stock | Critical Reorder
```

### [Employee](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#113-125)
```ts
{ id, employeeNumber, name, department, plantId, designation, email, phone,
  status, assignedAssetTags[] }
```

### [WorkOrder](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#129-144)
```ts
{ id, workOrderNumber, title, assetId, assetTag, technicianName, plantId,
  status, priority, createdAt, completedAt?, authorizedHardwareChange?, notes }
// status: Open | In Progress | Completed | Approved
// priority: Low | Medium | High | Critical
```

### [ChangeEvent](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#145-159)
```ts
{ id, assetId, assetTag, plantId, timestampUtc, fieldChanged, oldValue, newValue,
  matchedWorkOrderId?, isAuthorized, status, technicianAttributed? }
// status: Auto-Resolved | Requires Review | Investigating
```

### [Rack](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#160-170)
```ts
{ id, plantId, name, locationRoom, uHeight (42|48), maxPowerWatts, maxWeightKg, direction }
```

### [AuditFinding](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#171-185)
```ts
{ id, sessionId, assetTag, plantId, expectedLocation, scannedLocation,
  expectedStatus, scannedStatus, discrepancyType, resolutionStatus, scannedAt, notes? }
// discrepancyType: Location Mismatch | Status Mismatch | Unregistered Asset | Missing Asset
// resolutionStatus: Pending Review | Verified & Corrected | Escalated
```

### [AuditLog](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#186-199) ← immutable, hash-chained
```ts
{ id, sequence, timestampUtc, actor, actorRole, action, entityType, entityId,
  previousHash, recordHash, changesSummary }
// entityType: Asset | Assignment | StockItem | Rack | Vendor | WorkOrder
```

### [UserRole](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#200-207)
```ts
'Super Admin' | 'Plant Admin' | 'Technician' | 'Store Officer' | 'Auditor' | 'Employee'
```

---

## 4. Business Logic (from [[inventoryRules.ts]])

| Function | Description |
|---|---|
| [evaluateDeviceLiveStatus(lastHeartbeatUtc)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#62-98) | Returns Online if heartbeat < 3 min ago, Offline if older, Unknown if never |
| [detectHardwareDifferences(baseline, current)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#105-157) | Compares RAM, CPU, Storage, MAC, OS — returns array of diffs |
| [matchChangeWithWorkOrder(assetId, diff, workOrders)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#158-196) | Matches hardware change to a work order within 48h window |
| [calculateStockHealth(stock, min, reorder)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#197-213) | Returns Optimal / Low Stock / Critical Reorder |
| [checkRackCollision(existingAssets, candidate)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#3-61) | Validates U-slot availability, supports fractional U |
| [computeRecordHash(prevHash, seq, entityId, action)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#241-254) | FNV-1a-style hash for audit chain integrity |
| [verifyAuditHashChain(logs)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#255-276) | Walks chain and returns first broken sequence if tampered |
| [formatPKR(amount)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#214-220) | Formats number as `PKR 1,234,567` |
| [formatPKT(utcIso)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#221-240) | Converts UTC to Asia/Karachi (UTC+5) display string |
| [getDeviceNumber(asset, allAssets)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/utils/inventoryRules.ts#277-299) | Resolves human-friendly device number (#1, #2…) |

---

## 5. App-Level State & Handlers (from [App.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx))

All application state lives in [App.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx) and is passed down as props. No global state library (no Redux/Zustand).

### State entities
| State | Type | Initial Source |
|---|---|---|
| `plants` | `Plant[]` | `INITIAL_PLANTS` (mock) |
| `racks` | `Rack[]` | `INITIAL_RACKS` (mock) |
| `assets` | `Asset[]` | `INITIAL_ASSETS` (mock) |
| `stockItems` | `StockItem[]` | `INITIAL_STOCK_ITEMS` (mock) |
| `vendors` | `Vendor[]` | `INITIAL_VENDORS` (mock) |
| `employees` | `Employee[]` | `INITIAL_EMPLOYEES` (mock) |
| `workOrders` | `WorkOrder[]` | `INITIAL_WORK_ORDERS` (mock) |
| `changeEvents` | `ChangeEvent[]` | `INITIAL_CHANGE_EVENTS` (mock) |
| `auditFindings` | `AuditFinding[]` | `INITIAL_AUDIT_FINDINGS` (mock) |
| `auditLogs` | `AuditLog[]` | `INITIAL_AUDIT_LOGS` (mock) |

### UI State
| State | Purpose |
|---|---|
| `activeTab` | Current screen/view |
| `selectedPlant` | Global plant filter (`'all'` or [PlantId](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/types/inventory.ts#1-2)) |
| `currentRole` | Active user role (no auth yet, UI switcher only) |
| `isDrawerOpen` | Side nav drawer open/close |
| `isAuditScannerOpen` | QR scanner modal |
| `isStreaming` | WebSocket simulator on/off |
| `liveHeartbeatCount` | Running counter of simulated heartbeats |
| `pktTime` | Live PKT clock (updates every 1s via `setInterval`) |

### Simulated Real-Time
- Every **6 seconds**, a random online asset's `lastHeartbeatUtc` is refreshed to simulate a WebSocket heartbeat stream.
- [handleSimulateHeartbeat(assetId)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#147-173) — sets device Online + logs audit entry
- [handleSimulateDisconnect(assetId)](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#174-198) — sets heartbeat to 10 mins ago → Offline + logs audit

### Action Handlers (→ future API calls)
| Handler | What it does |
|---|---|
| [handleAddAsset](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#347-368) | Creates new Asset record, writes audit log |
| [handleUpdateAssetStatus](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#369-387) | Lifecycle status change (In Use → Decommissioned etc.) |
| [handleSimulateHeartbeat](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#147-173) | Sets device Online |
| [handleSimulateDisconnect](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#174-198) | Sets device Offline |
| [handleSimulateHardwareChange](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#199-259) | Mutates specs, creates ChangeEvent, correlates with WorkOrders |
| [handleIssueSpare](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#260-294) | Reduces stock, recalculates health status |
| [handleRestockItem](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#295-325) | Increases stock + updates lastRestocked |
| [handleAddNewStockItem](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#326-346) | Adds new spare SKU |
| [handleAddVendor](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#388-404) | Creates new Vendor record |
| [handleAddWorkOrder](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#405-425) | Creates work order with auto-generated WO number |
| [handleUpdateWorkOrderStatus](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#426-452) | Transitions WO status, sets completedAt if Completed |
| [handleRecordAuditFinding](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#453-471) | Saves physical audit discrepancy |
| [handleVerifyAndCorrectFinding](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#472-505) | Resolves finding + updates Asset master record |
| [handleSimulateTamper](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#506-519) | Corrupts audit log hash (demo only) |
| [handleRestoreChain](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#520-523) | Resets audit log to initial state |

---

## 6. Screen-by-Screen Feature Detail

### 6.1 Dashboard Overview ([DashboardOverview.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/DashboardOverview.tsx))
- **KPI Cards (4):** Asset book value, Device live status count, Spare parts count, Open work orders count — all click to navigate to respective tabs
- **Live Device Health section:** Single SVG donut chart (green=online %, orange=offline %), legend with counts, dark card background
- **Plant Portfolio grid:** Per-plant card showing asset count, online count, rack count — clicking sets global plant filter
- **Priority Queue sidebar:** Critical stock items + unmatched change events requiring review
- **Data scope footer:** Shows active plant + last activity timestamp

### 6.2 Asset Inventory ([AssetInventoryView.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/AssetInventoryView.tsx))
- **Device Status Donut** (compact, 120px) — same SVG component above filter bar
- **Search & Filters:** Free-text search (device #, serial, model, room), connectivity filter (Online/Offline), category filter, lifecycle status filter
- **Data Table:** Device #, serial number, model/category, plant/location, rack position (U-slot), lifecycle badge, assigned employee, cost (PKR), inspect + QR buttons
- **Inspect Modal:** Full specs panel (CPU, RAM, storage, OS, IP, MAC), device status controls (set Online/Offline), lifecycle status dropdown
- **QR Label Modal:** Printable QR code label with device number, serial, model, plant
- **Register Device Modal:** Full form with serial number, category, model, vendor, plant, location, rack slot (collision checked), cost, warranty, monitoring toggle, custom specs (CPU/RAM/storage/OS/IP/MAC)
- **CSV Export:** Exports filtered device list as downloadable CSV
- **Hardware Change Simulation:** From inspect modal — mutates RAM/Storage, creates ChangeEvent, matches to work orders

### 6.3 Stock & Spares ([StockAndSparesView.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/StockAndSparesView.tsx))
- Stock health summary badges (Optimal / Low Stock / Critical Reorder)
- Issue spare parts (linked to asset tag, with reason)
- Restock with PO number
- Add new spare SKU (form with SKU, name, category, plant, vendor, quantities, unit price, lead time, shelf location)
- Per-item history and vendor link (navigates to supplier detail)

### 6.4 Supplier Tracking ([SupplierTrackingView.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/SupplierTrackingView.tsx))
- Vendor list with rating, SLA, active contracts, total spend PKR
- Vendor detail panel: contact info, supplied asset categories, asset list linked to that vendor
- Add Vendor form

### 6.5 Rack Visualizer ([RackVisualizerView.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/RackVisualizerView.tsx))
- Plant selector → Rack selector
- 2D vertical rack diagram — each U slot coloured by asset category
- Hover to see asset tag, model, U position
- Links to asset inspect on click

### 6.6 Work Orders ([WorkOrdersView.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/WorkOrdersView.tsx))
- Work order list with number, title, asset tag, technician, priority badge, status badge, dates
- Create work order form: asset, title, technician, priority, notes, authorizedHardwareChange field
- Update status: Open → In Progress → Completed → Approved
- Filter by plant, status, priority

### 6.7 Audit Trail ([AuditTrailView.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/AuditTrailView.tsx))
- Sequential log table: sequence #, timestamp (PKT), actor, role, action, entity, hash
- Chain integrity verification (green = valid, red = broken)
- "Simulate Tamper" button — corrupts entry #2's hash to demonstrate detection
- "Restore Chain" button — resets to clean state

### 6.8 Physical Audit Scanner Modal ([PhysicalAuditScannerModal.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/PhysicalAuditScannerModal.tsx))
- Opens from nav header or drawer
- Simulates QR scan by asset tag input
- Records discrepancy type (Location Mismatch, Status Mismatch, Unregistered, Missing)
- Lists open findings with "Verify & Correct" action (updates master record)

---

## 7. Navigation Components

### [NavigationHeader.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/NavigationHeader.tsx)
- FCCL logo + company name
- Tab buttons for all 8 screens (horizontal, scrollable on mobile)
- Plant filter dropdown (All Plants + 4 named plants)
- Role switcher (Super Admin / Plant Admin / Technician / Store Officer / Auditor / Employee)
- Live PKT clock
- Heartbeat stream counter + on/off toggle
- Burger menu to open `NavigationDrawer`

### [NavigationDrawer.tsx](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/components/NavigationDrawer.tsx)
- Slide-in left panel
- All screen links as list items with icons
- Live device count summary (online/total/offline)
- "Open Audit Scanner" shortcut

---

## 8. Backend Integration Plan

> All data currently comes from [backend/data/mockInventoryData.ts](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/backend/data/mockInventoryData.ts). Replace `useState(INITIAL_*)` with API fetch calls. Every handler in App.tsx maps to an API endpoint.

### Proposed REST API Endpoints

#### Plants
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/plants` | Initial load |
| GET | `/api/plants/:plantId/summary` | Per-plant KPIs |

#### Assets
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/assets?plantId=&category=&status=&liveStatus=` | `INITIAL_ASSETS` |
| POST | `/api/assets` | [handleAddAsset](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#347-368) |
| PATCH | `/api/assets/:id/status` | [handleUpdateAssetStatus](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#369-387) |
| PATCH | `/api/assets/:id/assign` | `onAssignAsset` |
| POST | `/api/assets/:id/heartbeat` | [handleSimulateHeartbeat](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#147-173) → real: Go daemon |
| POST | `/api/assets/:id/disconnect` | [handleSimulateDisconnect](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#174-198) → real: Go daemon |
| POST | `/api/assets/:id/hardware-change` | [handleSimulateHardwareChange](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#199-259) |

#### Stock & Spares
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/stock?plantId=` | `INITIAL_STOCK_ITEMS` |
| POST | `/api/stock` | [handleAddNewStockItem](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#326-346) |
| POST | `/api/stock/:id/issue` | [handleIssueSpare](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#260-294) |
| POST | `/api/stock/:id/restock` | [handleRestockItem](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#295-325) |

#### Vendors
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/vendors` | `INITIAL_VENDORS` |
| POST | `/api/vendors` | [handleAddVendor](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#388-404) |

#### Employees
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/employees?plantId=` | `INITIAL_EMPLOYEES` |

#### Racks
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/racks?plantId=` | `INITIAL_RACKS` |

#### Work Orders
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/work-orders?plantId=&status=` | `INITIAL_WORK_ORDERS` |
| POST | `/api/work-orders` | [handleAddWorkOrder](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#405-425) |
| PATCH | `/api/work-orders/:id/status` | [handleUpdateWorkOrderStatus](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#426-452) |

#### Change Events
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/change-events?plantId=` | `INITIAL_CHANGE_EVENTS` |
| POST | `/api/change-events` | Created inside [handleSimulateHardwareChange](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#199-259) |

#### Audit
| Method | Endpoint | Handler |
|---|---|---|
| GET | `/api/audit-logs?limit=&entityType=` | `INITIAL_AUDIT_LOGS` |
| POST | `/api/audit-logs` | [appendAuditLog](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#114-146) (called by all handlers) |
| GET | `/api/audit-findings?plantId=` | `INITIAL_AUDIT_FINDINGS` |
| POST | `/api/audit-findings` | [handleRecordAuditFinding](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#453-471) |
| PATCH | `/api/audit-findings/:id/resolve` | [handleVerifyAndCorrectFinding](file:///c:/Users/HT%20LAPTOP/Desktop/FCCL/Inventory%20Project/FCCL-Inventory-System/frontend/src/App.tsx#472-505) |

#### Live Status (WebSocket / SSE)
| Protocol | Endpoint | Replaces |
|---|---|---|
| WebSocket | `ws://api/live/heartbeats` | 6s `setInterval` simulator |
| WebSocket | `ws://api/live/alerts` | Manual disconnect simulation |

---

## 9. Key Architectural Notes

- **No routing library** — tab switching is a single `activeTab` state string in [[App.tsx]]. A router (React Router) should be added for direct URL access to each screen.
- **No auth** — role is a UI-only dropdown. Backend needs JWT/session auth with RBAC matching [[03-roles-and-access-control]]; [[inventory.ts]] still defines the older six-role set.
- **Plant isolation** — every entity has a `plantId`. Backend should enforce plant scope per [[05-data-model-and-business-rules#4. Plant-scope rules]].
- **Audit log** — currently computed client-side with FNV hash. Backend should compute and store the hash server-side to be tamper-evident.
- **Go Endpoint Agent** — referenced in audit log actors (`Agent-Go-Daemon-v1.4`). Deferred; see [[08-decisions-and-open-issues#2. Superseded information]].
- **Heartbeat threshold** — a device is considered Offline if `lastHeartbeatUtc` > 3 minutes ago. This evaluation ([[inventoryRules.ts|evaluateDeviceLiveStatus]]) should run server-side on a scheduled job and update `liveStatus` in the database.
- **Hardware change detection** — currently manually simulated. Real implementation: Go daemon reports WMI/SMBIOS specs on each heartbeat; backend [[inventoryRules.ts|detectHardwareDifferences]] compares to stored baseline.

## Related notes
- [[01-project-overview]] — current scope.
- [[02-architecture-and-technology]] — the target backend.
- [[04-core-modules]] — current module requirements.
- [[05-data-model-and-business-rules]] — the logical data model.
- [[08-decisions-and-open-issues]] — what in this note is superseded.
- [[inventory.ts]] · [[inventoryRules.ts]] · [[App.tsx]] — the code this note describes.
