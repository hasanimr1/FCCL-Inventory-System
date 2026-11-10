import {
  Asset,
  AssetCategory,
  PlantId,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequest,
  PurchaseRequestItem,
  UserRole,
  Vendor,
} from '../types/inventory.ts';
import { authorizeAction } from './rbac.ts';

function getCategoryCode(category: AssetCategory): string {
  switch (category) {
    case 'Server':
      return 'SVR';
    case 'Network Switch':
      return 'SW';
    case 'Workstation PC':
      return 'PC';
    case 'Industrial Laptop':
      return 'LAP';
    case 'Rack Cabinet':
      return 'RCK';
    case 'UPS System':
      return 'UPS';
    case 'SAN Storage':
      return 'SAN';
    case 'Core Router':
      return 'RTR';
    default:
      return 'AST';
  }
}

/**
 * Creates a new Purchase Request.
 * Role check: All roles permitted (Employees, Technicians, Store Officers, Admins).
 */
export function createPurchaseRequest(
  data: {
    title: string;
    department: string;
    plantId: PlantId;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    justification: string;
    items: Array<Omit<PurchaseRequestItem, 'id' | 'estimatedTotalPKR'>>;
    targetVendorId?: string;
  },
  requestedBy: string,
  requesterRole: UserRole
): PurchaseRequest {
  const auth = authorizeAction(requesterRole, 'CREATE_PURCHASE_REQUEST');
  if (!auth.authorized) {
    throw new Error(auth.message);
  }

  const timestamp = Date.now();
  const prItems: PurchaseRequestItem[] = data.items.map((item, idx) => ({
    ...item,
    id: `pri-${timestamp}-${idx + 1}`,
    estimatedTotalPKR: item.quantity * item.estimatedUnitPricePKR,
  }));

  const totalCost = prItems.reduce((acc, curr) => acc + curr.estimatedTotalPKR, 0);
  const plantCode = data.plantId.replace('plant-', 'P');

  return {
    id: `pr-${timestamp}`,
    prNumber: `PR-${plantCode}-2026-${Math.floor(100 + Math.random() * 900)}`,
    title: data.title,
    department: data.department,
    plantId: data.plantId,
    requestedBy,
    requesterRole,
    priority: data.priority,
    justification: data.justification,
    requestedDate: new Date().toISOString().split('T')[0],
    items: prItems,
    totalEstimatedCostPKR: totalCost,
    targetVendorId: data.targetVendorId,
    status: 'Pending Approval',
  };
}

/**
 * Approves or Rejects a Purchase Request.
 * Strict RBAC check: Only Super Admin and Admin can approve!
 */
export function approvePurchaseRequest(
  pr: PurchaseRequest,
  decision: 'Approved' | 'Rejected',
  decidedBy: string,
  deciderRole: UserRole,
  comments?: string
): PurchaseRequest {
  const auth = authorizeAction(deciderRole, 'APPROVE_PURCHASE_REQUEST');
  if (!auth.authorized) {
    throw new Error(auth.message);
  }

  if (pr.status !== 'Pending Approval') {
    throw new Error(`Cannot review PR in status "${pr.status}". Only "Pending Approval" requests can be reviewed.`);
  }

  return {
    ...pr,
    status: decision === 'Approved' ? 'Approved' : 'Rejected',
    approvalDecision: {
      decision,
      decidedBy,
      decidedAt: new Date().toISOString(),
      comments,
    },
  };
}

/**
 * Generates a Purchase Order from an Approved PR.
 * Strict RBAC check: Only Super Admin and Admin can generate POs!
 * Pre-fills Vendor details from the selected Vendor record.
 */
export function generatePurchaseOrderFromPR(
  pr: PurchaseRequest,
  vendor: Vendor,
  creatorName: string,
  creatorRole: UserRole,
  deliveryDetails?: {
    deliveryMethod?: string;
    notes?: string;
  }
): { purchaseOrder: PurchaseOrder; updatedPR: PurchaseRequest } {
  const auth = authorizeAction(creatorRole, 'GENERATE_PURCHASE_ORDER');
  if (!auth.authorized) {
    throw new Error(auth.message);
  }

  if (pr.status !== 'Approved') {
    throw new Error(`Cannot generate PO from Purchase Request ${pr.prNumber} because its status is "${pr.status}". Admin approval is strictly required first.`);
  }

  const timestamp = Date.now();
  const orderNo = `PO-${pr.prNumber.replace('PR-', '')}`;

  // Map PR items to PO items
  const poItems: PurchaseOrderItem[] = pr.items.map((item, idx) => ({
    itemNo: idx + 1,
    description: item.description,
    category: item.category,
    qty: item.quantity,
    price: item.estimatedUnitPricePKR,
    discount: 0,
    total: item.quantity * item.estimatedUnitPricePKR,
    suggestedModel: item.suggestedModel || item.description,
  }));

  const subtotalPKR = poItems.reduce((acc, curr) => acc + curr.total, 0);
  const taxPKR = Math.round(subtotalPKR * 0.18); // 18% standard GST
  const shippingPKR = 15000; // Flat courier / insured transport charge
  const totalPKR = subtotalPKR + taxPKR + shippingPKR;

  const purchaseOrder: PurchaseOrder = {
    id: `po-${timestamp}`,
    orderNo,
    prId: pr.id,
    date: new Date().toISOString().split('T')[0],
    // Customer Info (Receiving plant site)
    customerName: creatorName,
    company: 'Fauji Cement Company Limited',
    phoneNo: '+92 (51) 289-4000',
    email: 'procurement@fccl.com.pk',
    address: `${pr.plantId.toUpperCase()} Receiving Gate, Industrial Zone`,
    plantId: pr.plantId,
    // Vendor Info (Pre-filled automatically from Vendor record)
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorCompany: vendor.name,
    vendorPhone: vendor.phone,
    vendorEmail: vendor.email,
    vendorAddress: vendor.address,
    // Order Details Table
    items: poItems,
    subtotalPKR,
    taxPKR,
    shippingPKR,
    totalPKR,
    // Order Status
    orderStatus: 'Started',
    // Delivery Details
    deliveryMethod: deliveryDetails?.deliveryMethod || 'Air & Ground Insured Logistics',
    deliveryDate: new Date(Date.now() + vendor.slaHours * 24 * 3600 * 1000).toISOString().split('T')[0],
    trackingNo: `TRK-PK-${Math.floor(100000 + Math.random() * 900000)}`,
    notes: deliveryDetails?.notes || `Generated from approved request ${pr.prNumber}. Standard FCCL inspection terms apply.`,
  };

  const updatedPR: PurchaseRequest = {
    ...pr,
    status: 'Converted to PO',
    generatedPoId: purchaseOrder.id,
  };

  return { purchaseOrder, updatedPR };
}

/**
 * Marks a Purchase Order as COMPLETED.
 * When completed, its ordered items are AUTOMATICALLY added to the Hardware Register
 * as brand-new inventory records without any manual re-entry!
 */
export function completePurchaseOrder(
  po: PurchaseOrder,
  existingAssets: Asset[],
  completerName: string,
  completerRole: UserRole
): {
  updatedPO: PurchaseOrder;
  newAssets: Asset[];
  summary: string;
} {
  const auth = authorizeAction(completerRole, 'COMPLETE_PURCHASE_ORDER');
  if (!auth.authorized) {
    throw new Error(auth.message);
  }

  if (po.orderStatus === 'Completed') {
    throw new Error(`Purchase Order ${po.orderNo} is already marked Completed.`);
  }

  const nowIso = new Date().toISOString();
  const today = nowIso.split('T')[0];
  const warrantyEndDate = new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const generatedAssets: Asset[] = [];
  let currentMaxDeviceNumber = existingAssets.reduce(
    (max, a) => Math.max(max, a.deviceNumber || 0),
    existingAssets.length
  );

  po.items.forEach((item, itemIdx) => {
    for (let unit = 1; unit <= item.qty; unit++) {
      currentMaxDeviceNumber += 1;
      const catCode = getCategoryCode(item.category);
      const randomSerialHex = Math.floor(10000 + Math.random() * 90000);
      const assetTag = `AST-${catCode}-${String(currentMaxDeviceNumber).padStart(5, '0')}`;
      const serialNumber = `SN-${catCode}-${po.orderNo.replace('PO-', '')}-${unit}-${randomSerialHex}`;

      const newAsset: Asset = {
        id: `ast-po-${po.id}-${itemIdx + 1}-${unit}`,
        deviceNumber: currentMaxDeviceNumber,
        assetTag,
        serialNumber,
        model: item.suggestedModel || item.description,
        category: item.category,
        vendorId: po.vendorId,
        plantId: po.plantId,
        locationRoom: 'Central IT Depot / Incoming Store',
        status: 'Spare',
        purchaseDate: today,
        warrantyEnd: warrantyEndDate,
        costPKR: item.price,
        monitoringEnabled: false,
        liveStatus: 'Unknown',
        customSpecs: {
          os: item.category === 'Server' ? 'Red Hat Enterprise Linux 9' : undefined,
          cpu: item.category === 'Server' ? 'Intel Xeon Silver' : undefined,
          ramGb: item.category === 'Server' ? 64 : 16,
          storageGb: item.category === 'Server' ? 2000 : 512,
        },
        notes: `Automatically received and inducted into Hardware Register from PO ${po.orderNo}.`,
        receiptConfirmed: true,
      };

      generatedAssets.push(newAsset);
    }
  });

  const updatedPO: PurchaseOrder = {
    ...po,
    orderStatus: 'Completed',
    dateReceived: today,
    completedAt: nowIso,
    completedBy: completerName,
    generatedAssetIds: generatedAssets.map((a) => a.id),
  };

  const summary = `PO ${po.orderNo} completed. ${generatedAssets.length} asset(s) automatically registered into Hardware Register.`;

  return {
    updatedPO,
    newAssets: generatedAssets,
    summary,
  };
}
