export type PlantId = 'plant-1' | 'plant-2' | 'plant-3' | 'plant-4';

export interface Plant {
  id: PlantId;
  name: string;
  code: string;
  city: string;
  siteDescription: string;
  totalAssets: number;
  rackCount: number;
  activeAlerts: number;
  status: 'Operational' | 'Maintenance' | 'Partial Link';
}

export type AssetCategory =
  | 'Server'
  | 'Network Switch'
  | 'Workstation PC'
  | 'Industrial Laptop'
  | 'Rack Cabinet'
  | 'UPS System'
  | 'SAN Storage'
  | 'Core Router';

export type AssetLifecycleStatus =
  | 'In Use'
  | 'Spare'
  | 'In Repair'
  | 'Decommissioned'
  | 'Scrapped';

export type DeviceLiveStatus = 'Online' | 'Offline' | 'Unknown';

export interface AssetCustomSpecs {
  cpu?: string;
  ramGb?: number;
  storageGb?: number;
  os?: string;
  macAddress?: string;
  ipAddress?: string;
  portCount?: number;
  vlanRange?: string;
  powerDrawWatts?: number;
  weightKg?: number;
  firmwareVersion?: string;
  screenSize?: string;
  batteryHealthPct?: number;
}

export interface Asset {
  id: string;
  deviceNumber?: number; // Simple numbering (Device #1, #2...)
  assetTag: string; // e.g. AST-SVR-00491
  serialNumber: string;
  model: string;
  category: AssetCategory;
  vendorId: string;
  plantId: PlantId;
  locationRoom: string;
  rackId?: string;
  rackUnitStart?: number; // e.g. 10.0, supports fractional 0.5U
  rackUnitHeight?: number; // e.g. 2.0 (2U)
  rackFace?: 'front' | 'rear';
  status: AssetLifecycleStatus;
  assignedEmployeeId?: string;
  purchaseDate: string; // YYYY-MM-DD
  warrantyEnd: string; // YYYY-MM-DD
  costPKR: number;
  monitoringEnabled: boolean;
  lastHeartbeatUtc?: string; // ISO string
  liveStatus: DeviceLiveStatus;
  customSpecs: AssetCustomSpecs;
  notes?: string;
  receiptConfirmed?: boolean;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating: number; // 1-5
  activeContracts: number;
  slaHours: number;
  supportHotline: string;
  suppliedCategories: AssetCategory[];
  totalSpendPKR: number;
}

export type StockStatus = 'Optimal' | 'Low Stock' | 'Critical Reorder';

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  plantId: PlantId;
  vendorId: string;
  currentStock: number;
  minThreshold: number;
  reorderPoint: number;
  unitPricePKR: number;
  leadTimeDays: number;
  status: StockStatus;
  shelfLocation: string;
  lastRestocked: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  plantId: PlantId;
  designation: string;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  assignedAssetTags: string[];
}

export type WorkOrderStatus = 'Open' | 'In Progress' | 'Completed' | 'Approved';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  assetId: string;
  assetTag: string;
  technicianName: string;
  plantId: PlantId;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  createdAt: string;
  completedAt?: string;
  authorizedHardwareChange?: string; // e.g. "RAM Upgrade to 32GB"
  notes: string;
}

export interface ChangeEvent {
  id: string;
  assetId: string;
  assetTag: string;
  plantId: PlantId;
  timestampUtc: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  matchedWorkOrderId?: string;
  isAuthorized: boolean;
  status: 'Auto-Resolved' | 'Requires Review' | 'Investigating';
  technicianAttributed?: string;
}

export interface Rack {
  id: string;
  plantId: PlantId;
  name: string;
  locationRoom: string;
  uHeight: 42 | 48;
  maxPowerWatts: number;
  maxWeightKg: number;
  direction: 'bottom-up' | 'top-down';
}

export interface AuditFinding {
  id: string;
  sessionId: string;
  assetTag: string;
  plantId: PlantId;
  expectedLocation: string;
  scannedLocation: string;
  expectedStatus: AssetLifecycleStatus;
  scannedStatus: AssetLifecycleStatus;
  discrepancyType: 'Location Mismatch' | 'Status Mismatch' | 'Unregistered Asset' | 'Missing Asset';
  resolutionStatus: 'Pending Review' | 'Verified & Corrected' | 'Escalated';
  scannedAt: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  sequence: number;
  timestampUtc: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: 'Asset' | 'Assignment' | 'StockItem' | 'Rack' | 'Vendor' | 'WorkOrder';
  entityId: string;
  previousHash: string;
  recordHash: string;
  changesSummary: string;
}

export type UserRole =
  | 'Super Admin'
  | 'Plant Admin'
  | 'Technician'
  | 'Store Officer'
  | 'Auditor'
  | 'Employee';
