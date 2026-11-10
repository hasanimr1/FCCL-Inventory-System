import React, { useState, useEffect } from 'react';
import {
  PlantId,
  UserRole,
  UserAccount,
  Asset,
  StockItem,
  Vendor,
  WorkOrder,
  ChangeEvent,
  AuditFinding,
  AuditLog,
  PurchaseRequest,
  PurchaseOrder,
  AssetLifecycleStatus,
  WorkOrderStatus,
} from './types/inventory.ts';
import {
  INITIAL_PLANTS,
  INITIAL_VENDORS,
  INITIAL_ASSETS,
  INITIAL_STOCK_ITEMS,
  INITIAL_RACKS,
  INITIAL_EMPLOYEES,
  INITIAL_WORK_ORDERS,
  INITIAL_CHANGE_EVENTS,
  INITIAL_AUDIT_FINDINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_PURCHASE_ORDERS,
} from '../../backend/data/mockInventoryData.ts';
import { INITIAL_USERS } from './utils/authService.ts';
import {
  calculateStockHealth,
  evaluateDeviceLiveStatus,
  detectHardwareDifferences,
  matchChangeWithWorkOrder,
  computeRecordHash,
  formatPKT,
} from './utils/inventoryRules.ts';
import { canAccessTab, authorizeAction } from './utils/rbac.ts';
import { completePurchaseOrder } from './utils/procurementService.ts';
import { LoginScreen } from './components/LoginScreen.tsx';
import { NavigationHeader } from './components/NavigationHeader.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { AssetInventoryView } from './components/AssetInventoryView.tsx';
import { StockAndSparesView } from './components/StockAndSparesView.tsx';
import { SupplierTrackingView } from './components/SupplierTrackingView.tsx';
import { PurchaseOrdersView } from './components/PurchaseOrdersView.tsx';
import { NavigationDrawer } from './components/NavigationDrawer.tsx';
import { RackVisualizerView } from './components/RackVisualizerView.tsx';
import { WorkOrdersView } from './components/WorkOrdersView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { PhysicalAuditScannerModal } from './components/PhysicalAuditScannerModal.tsx';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function App() {
  // Authentication State (Starts at Login Screen)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlant, setSelectedPlant] = useState<PlantId | 'all'>('all');
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Application Data State
  const [plants] = useState(INITIAL_PLANTS);
  const [racks] = useState(INITIAL_RACKS);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [changeEvents, setChangeEvents] = useState<ChangeEvent[]>(INITIAL_CHANGE_EVENTS);
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>(INITIAL_AUDIT_FINDINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Procurement (PR & PO) State
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(INITIAL_PURCHASE_REQUESTS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);

  // Real-time WebSocket simulator state
  const [isStreaming, setIsStreaming] = useState(true);
  const [liveHeartbeatCount, setLiveHeartbeatCount] = useState(148);
  const [pktTime, setPktTime] = useState('');
  const [isAuditScannerOpen, setIsAuditScannerOpen] = useState(false);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<string | undefined>(undefined);

  // Synchronize role change when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser]);

  // PKT Clock timer
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setPktTime(`${formatted} PKT`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live WebSocket Heartbeat Stream simulation
  useEffect(() => {
    if (!isStreaming) return;

    const streamInterval = setInterval(() => {
      setLiveHeartbeatCount((prev) => prev + 1);

      // Periodically refresh online asset heartbeat time
      setAssets((prevAssets) => {
        const onlineAssets = prevAssets.filter((a) => a.liveStatus === 'Online');
        if (onlineAssets.length === 0) return prevAssets;

        const randomAsset = onlineAssets[Math.floor(Math.random() * onlineAssets.length)];
        return prevAssets.map((a) =>
          a.id === randomAsset.id
            ? { ...a, lastHeartbeatUtc: new Date().toISOString() }
            : a
        );
      });
    }, 6000);

    return () => clearInterval(streamInterval);
  }, [isStreaming]);

  // Append entry to tamper-evident hash-chained audit log
  const appendAuditLog = (
    actor: string,
    actorRole: string,
    action: string,
    entityType: 'Asset' | 'Assignment' | 'StockItem' | 'Rack' | 'Vendor' | 'WorkOrder' | 'PurchaseRequest' | 'PurchaseOrder',
    entityId: string,
    changesSummary: string
  ) => {
    setAuditLogs((prevLogs) => {
      const last = prevLogs[prevLogs.length - 1];
      const previousHash = last ? last.recordHash : '0x0000000000000000';
      const sequence = (last ? last.sequence : 0) + 1;
      const recordHash = computeRecordHash(previousHash, sequence, entityId, action);

      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        sequence,
        timestampUtc: new Date().toISOString(),
        actor,
        actorRole,
        action,
        entityType,
        entityId,
        previousHash,
        recordHash,
        changesSummary,
      };

      return [...prevLogs, newLog];
    });
  };

  /* ==========================================================================
     Procurement Event Handlers (PR, PO, Admin Approval, Automatic Asset Inductions)
     ========================================================================== */

  const handleAddPR = (newPR: PurchaseRequest) => {
    setPurchaseRequests((prev) => [newPR, ...prev]);
    appendAuditLog(
      currentUser?.username || 'user@fccl.com.pk',
      currentRole,
      'Created Purchase Request',
      'PurchaseRequest',
      newPR.prNumber,
      `Submitted PR for ${newPR.items.length} line item(s). Total: PKR ${newPR.totalEstimatedCostPKR.toLocaleString()}. Routed to Admin dashboard.`
    );
  };

  const handleApprovePR = (prId: string, decision: 'Approved' | 'Rejected', comments?: string) => {
    const auth = authorizeAction(currentRole, 'APPROVE_PURCHASE_REQUEST');
    if (!auth.authorized) {
      alert(`Access Denied: ${auth.message}`);
      return;
    }

    const targetPR = purchaseRequests.find((p) => p.id === prId);
    if (!targetPR) return;

    setPurchaseRequests((prev) =>
      prev.map((pr) =>
        pr.id === prId
          ? {
              ...pr,
              status: decision,
              approvalDecision: {
                decision,
                decidedBy: currentUser?.fullName || 'Plant Admin',
                decidedAt: new Date().toISOString(),
                comments,
              },
            }
          : pr
      )
    );

    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      `Purchase Request ${decision}`,
      'PurchaseRequest',
      targetPR.prNumber,
      `Admin decision: ${decision}. ${comments || ''}`
    );
  };

  const handleAddPO = (newPO: PurchaseOrder, updatedPR: PurchaseRequest) => {
    setPurchaseOrders((prev) => [newPO, ...prev]);
    setPurchaseRequests((prev) =>
      prev.map((pr) => (pr.id === updatedPR.id ? updatedPR : pr))
    );

    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      'Generated Purchase Order',
      'PurchaseOrder',
      newPO.orderNo,
      `Generated PO from approved request ${updatedPR.prNumber} for supplier ${newPO.vendorName}. Total: PKR ${newPO.totalPKR.toLocaleString()}.`
    );
  };

  const handleCompletePO = (poId: string) => {
    const auth = authorizeAction(currentRole, 'COMPLETE_PURCHASE_ORDER');
    if (!auth.authorized) {
      alert(`Access Denied: ${auth.message}`);
      return;
    }

    const targetPO = purchaseOrders.find((p) => p.id === poId);
    if (!targetPO) return;

    // Execute automatic hardware inventory creation
    const result = completePurchaseOrder(
      targetPO,
      assets,
      currentUser?.fullName || 'Store Officer',
      currentRole
    );

    // Update PO state
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === poId ? result.updatedPO : po))
    );

    // Automatically add ordered items to Hardware Register (Assets)
    setAssets((prevAssets) => [...result.newAssets, ...prevAssets]);

    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      'Purchase Order Completed & Assets Inducted',
      'PurchaseOrder',
      targetPO.orderNo,
      result.summary
    );
  };

  // Heartbeat simulator
  const handleSimulateHeartbeat = (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const nowIso = new Date().toISOString();
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, lastHeartbeatUtc: nowIso, liveStatus: 'Online' }
          : a
      )
    );
    setLiveHeartbeatCount((prev) => prev + 1);

    if (target.liveStatus !== 'Online') {
      appendAuditLog(
        'Agent-Go-Daemon-v1.4',
        'Go Endpoint Agent',
        'State Transition: Online',
        'Asset',
        target.assetTag,
        `Device resumed heartbeat stream; live status transitioned from ${target.liveStatus} to Online.`
      );
    }
  };

  // Disconnect simulator
  const handleSimulateDisconnect = (assetId: string) => {
    const target = assets.find((a) => a.id === assetId);
    if (!target) return;

    const pastIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, lastHeartbeatUtc: pastIso, liveStatus: 'Offline' }
          : a
      )
    );

    appendAuditLog(
      'System-Telemetry-Monitor',
      'Go Endpoint Agent',
      'State Transition: Offline',
      'Asset',
      target.assetTag,
      `Device missed 3 consecutive 60s heartbeats. Marked Offline in Redis cache.`
    );
  };

  // Hardware change simulation
  const handleSimulateHardwareChange = (
    assetId: string,
    field: string,
    oldValue: string,
    newValue: string
  ) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    setAssets((prev) =>
      prev.map((a) => {
        if (a.id !== assetId) return a;
        const newSpecs = { ...a.customSpecs };
        if (field.includes('RAM')) {
          newSpecs.ramGb = parseInt(newValue, 10);
        } else if (field.includes('Storage')) {
          newSpecs.storageGb = parseInt(newValue, 10);
        } else if (field.includes('CPU')) {
          newSpecs.cpu = newValue;
        }
        return { ...a, customSpecs: newSpecs };
      })
    );

    const changeDiff = { field, oldValue, newValue };
    const authResult = matchChangeWithWorkOrder(asset.id, changeDiff, workOrders);

    const newChangeEvent: ChangeEvent = {
      id: `chg-${Date.now()}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      plantId: asset.plantId,
      timestampUtc: new Date().toISOString(),
      fieldChanged: field,
      oldValue,
      newValue,
      matchedWorkOrderId: authResult.matchedWorkOrder?.id,
      isAuthorized: authResult.isAuthorized,
      status: authResult.isAuthorized ? 'Auto-Resolved' : 'Requires Review',
      technicianAttributed: authResult.matchedWorkOrder?.technicianName || 'Unassigned (Agent Detection)',
    };

    setChangeEvents((prev) => [newChangeEvent, ...prev]);

    appendAuditLog(
      'Agent-Go-Daemon-v1.4',
      'Go Endpoint Agent',
      authResult.isAuthorized ? 'Authorized Hardware Change' : 'Unauthorized Hardware Mutation Alert',
      'Asset',
      asset.assetTag,
      `${field} mutated from ${oldValue} to ${newValue}.`
    );
  };

  // Store Officer: Issue Spare Part
  const handleIssueSpare = (
    stockId: string,
    quantity: number,
    assetTag: string,
    reason: string
  ) => {
    const item = stockItems.find((s) => s.id === stockId);
    if (!item) return;

    const newStock = Math.max(0, item.currentStock - quantity);
    const newStatus = calculateStockHealth(newStock, item.minThreshold, item.reorderPoint);

    setStockItems((prev) =>
      prev.map((s) =>
        s.id === stockId
          ? {
              ...s,
              currentStock: newStock,
              status: newStatus,
            }
          : s
      )
    );

    appendAuditLog(
      currentUser?.username || 'store@fccl.com.pk',
      currentRole,
      'Issued Spare Component',
      'StockItem',
      item.sku,
      `Issued ${quantity} unit(s) to ${assetTag}. Remaining stock: ${newStock}. Reason: ${reason}`
    );
  };

  // Store Officer: Restock Item
  const handleRestockItem = (stockId: string, quantity: number, poNumber: string, newMinThreshold?: number) => {
    const item = stockItems.find((s) => s.id === stockId);
    if (!item) return;

    const newStock = item.currentStock + quantity;
    const updatedThreshold = newMinThreshold !== undefined ? newMinThreshold : item.minThreshold;
    const newStatus = calculateStockHealth(newStock, updatedThreshold, item.reorderPoint);

    setStockItems((prev) =>
      prev.map((s) =>
        s.id === stockId
          ? {
              ...s,
              currentStock: newStock,
              minThreshold: updatedThreshold,
              status: newStatus,
              lastRestocked: new Date().toISOString().split('T')[0],
            }
          : s
      )
    );

    appendAuditLog(
      currentUser?.username || 'store@fccl.com.pk',
      currentRole,
      'Received Stock Replenishment',
      'StockItem',
      item.sku,
      `Restocked +${quantity} units via ${poNumber}. New stock: ${newStock}.`
    );
  };

  // Add new stock item
  const handleAddNewStockItem = (newItem: Omit<StockItem, 'id' | 'status' | 'lastRestocked'>) => {
    const status = calculateStockHealth(newItem.currentStock, newItem.minThreshold, newItem.reorderPoint);
    const fullItem: StockItem = {
      ...newItem,
      id: `stk-${Date.now()}`,
      status,
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    setStockItems((prev) => [fullItem, ...prev]);
    appendAuditLog(
      currentUser?.username || 'store@fccl.com.pk',
      currentRole,
      'Registered New Spare SKU',
      'StockItem',
      fullItem.sku,
      `Registered ${fullItem.name} with initial stock ${fullItem.currentStock} units.`
    );
  };

  // Register Asset
  const handleAddAsset = (newAssetData: Omit<Asset, 'id' | 'liveStatus'>) => {
    const nextNum = assets.length + 1;
    const newAsset: Asset = {
      ...newAssetData,
      id: `ast-${Date.now()}`,
      deviceNumber: newAssetData.deviceNumber || nextNum,
      liveStatus: newAssetData.monitoringEnabled ? 'Online' : 'Unknown',
      lastHeartbeatUtc: newAssetData.monitoringEnabled ? new Date().toISOString() : undefined,
    };

    setAssets((prev) => [newAsset, ...prev]);
    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      'Device Created',
      'Asset',
      newAsset.serialNumber,
      `Registered Device #${newAsset.deviceNumber} (${newAsset.model}) at ${newAsset.locationRoom}. Serial: ${newAsset.serialNumber}.`
    );
  };

  // Update Asset Lifecycle Status
  const handleUpdateAssetStatus = (assetId: string, status: AssetLifecycleStatus) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status } : a))
    );

    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      `Lifecycle Transition: ${status}`,
      'Asset',
      asset.assetTag,
      `Asset status updated from ${asset.status} to ${status}.`
    );
  };

  // Add Vendor
  const handleAddVendor = (vendorData: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = {
      ...vendorData,
      id: `ven-${Date.now()}`,
    };
    setVendors((prev) => [...prev, newVendor]);
    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      'Registered Supplier',
      'Vendor',
      newVendor.code,
      `Added supplier ${newVendor.name} with ${newVendor.slaHours}h SLA.`
    );
  };

  // Add Work Order
  const handleAddWorkOrder = (orderData: Omit<WorkOrder, 'id' | 'workOrderNumber' | 'createdAt'>) => {
    const num = `WO-HTR-2026-${Math.floor(Math.random() * 890 + 100)}`;
    const newOrder: WorkOrder = {
      ...orderData,
      id: `wo-${Date.now()}`,
      workOrderNumber: num,
      createdAt: new Date().toISOString(),
    };

    setWorkOrders((prev) => [newOrder, ...prev]);
    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      'Created Work Order',
      'WorkOrder',
      newOrder.workOrderNumber,
      `Created work order for ${newOrder.assetTag}: "${newOrder.title}".`
    );
  };

  // Update Work Order Status
  const handleUpdateWorkOrderStatus = (orderId: string, status: WorkOrderStatus) => {
    const order = workOrders.find((w) => w.id === orderId);
    if (!order) return;

    setWorkOrders((prev) =>
      prev.map((w) =>
        w.id === orderId
          ? {
              ...w,
              status,
              completedAt: status === 'Completed' ? new Date().toISOString() : w.completedAt,
            }
          : w
      )
    );

    appendAuditLog(
      currentUser?.username || 'technician@fccl.com.pk',
      currentRole,
      `Work Order Status: ${status}`,
      'WorkOrder',
      order.workOrderNumber,
      `Work order status transitioned to ${status}.`
    );
  };

  // Physical Audit Finding Recording
  const handleRecordAuditFinding = (findingData: Omit<AuditFinding, 'id' | 'scannedAt'>) => {
    const newFinding: AuditFinding = {
      ...findingData,
      id: `af-${Date.now()}`,
      scannedAt: new Date().toISOString(),
    };
    setAuditFindings((prev) => [newFinding, ...prev]);

    appendAuditLog(
      currentUser?.username || 'auditor@fccl.com.pk',
      currentRole,
      'Logged Audit Discrepancy',
      'Asset',
      findingData.assetTag,
      `Recorded audit discrepancy: ${findingData.discrepancyType}.`
    );
  };

  // Verify and correct audit finding
  const handleVerifyAndCorrectFinding = (findingId: string) => {
    const finding = auditFindings.find((f) => f.id === findingId);
    if (!finding) return;

    setAuditFindings((prev) =>
      prev.map((f) =>
        f.id === findingId ? { ...f, resolutionStatus: 'Verified & Corrected' } : f
      )
    );

    setAssets((prev) =>
      prev.map((a) =>
        a.assetTag === finding.assetTag
          ? {
              ...a,
              locationRoom: finding.scannedLocation,
              status: finding.scannedStatus,
            }
          : a
      )
    );

    appendAuditLog(
      currentUser?.username || 'admin@fccl.com.pk',
      currentRole,
      'Approved Audit Discrepancy Correction',
      'Asset',
      finding.assetTag,
      `Corrected master inventory for ${finding.assetTag} based on physical audit.`
    );
  };

  // Tamper simulation for cryptographic audit demo
  const handleSimulateTamper = () => {
    setAuditLogs((prev) => {
      if (prev.length < 2) return prev;
      const tampered = [...prev];
      tampered[1] = {
        ...tampered[1],
        recordHash: '0xBADCOFFEE9999',
        changesSummary: 'UNAUTHORIZED DATABASE TAMPER: Mutated purchase cost maliciously.',
      };
      return tampered;
    });
  };

  const handleRestoreChain = () => {
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  // If not authenticated, render Login Screen with Partial Password Authentication
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          setActiveTab('overview');
        }}
      />
    );
  }

  // Check RBAC permission for current tab
  const isTabAllowed = canAccessTab(currentRole, activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation Header */}
      <NavigationHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        selectedPlant={selectedPlant}
        onPlantChange={setSelectedPlant}
        currentRole={currentRole}
        pktTime={pktTime}
        currentUserName={currentUser.fullName}
        onSignOut={() => setCurrentUser(null)}
      />

      {/* Slide-out Left Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScannerModal={() => setIsAuditScannerOpen(true)}
        selectedPlant={selectedPlant}
        totalDevicesCount={assets.length}
        onlineDevicesCount={assets.filter((a) => a.liveStatus === 'Online').length}
        offlineDevicesCount={assets.filter((a) => a.liveStatus === 'Offline').length}
        currentRole={currentRole}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* RBAC Access Denied Fallback */}
        {!isTabAllowed ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">403 Access Denied (RBAC)</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your assigned role <strong className="font-semibold text-slate-800">&quot;{currentRole}&quot;</strong> does not possess clearance to view or perform actions on the{' '}
              <strong className="font-mono text-red-700 font-bold">{activeTab.toUpperCase()}</strong> workspace.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('overview')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#063d2a] hover:bg-[#0b6340] text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Overview Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <DashboardOverview
                plants={plants}
                assets={assets}
                stockItems={stockItems}
                workOrders={workOrders}
                changeEvents={changeEvents}
                purchaseRequests={purchaseRequests}
                currentRole={currentRole}
                selectedPlant={selectedPlant}
                onPlantChange={setSelectedPlant}
                onNavigate={setActiveTab}
                onOpenAuditScanner={() => setIsAuditScannerOpen(true)}
                onOpenNewAssetModal={() => setActiveTab('assets')}
                onApprovePR={handleApprovePR}
              />
            )}

            {activeTab === 'procurement' && (
              <PurchaseOrdersView
                purchaseRequests={purchaseRequests}
                purchaseOrders={purchaseOrders}
                vendors={vendors}
                assets={assets}
                selectedPlant={selectedPlant}
                currentRole={currentRole}
                currentUserName={currentUser.fullName}
                onAddPR={handleAddPR}
                onApprovePR={handleApprovePR}
                onAddPO={handleAddPO}
                onCompletePO={handleCompletePO}
                onNavigateToAssets={() => setActiveTab('assets')}
                onNavigateToVendor={(vId) => {
                  setSelectedVendorForDetail(vId);
                  setActiveTab('suppliers');
                }}
              />
            )}

            {activeTab === 'assets' && (
              <AssetInventoryView
                assets={assets}
                plants={plants}
                racks={racks}
                vendors={vendors}
                employees={employees}
                selectedPlant={selectedPlant}
                onAddAsset={handleAddAsset}
                onUpdateAssetStatus={handleUpdateAssetStatus}
                onAssignAsset={(assetId, empId) => {
                  setAssets((prev) =>
                    prev.map((a) => (a.id === assetId ? { ...a, assignedEmployeeId: empId } : a))
                  );
                }}
                onSimulateHeartbeat={handleSimulateHeartbeat}
                onSimulateDisconnect={handleSimulateDisconnect}
                onSimulateHardwareChange={handleSimulateHardwareChange}
              />
            )}

            {activeTab === 'stock' && (
              <StockAndSparesView
                stockItems={stockItems}
                vendors={vendors}
                plants={plants}
                assets={assets}
                selectedPlant={selectedPlant}
                onIssueSpare={handleIssueSpare}
                onRestockItem={handleRestockItem}
                onAddNewStockItem={handleAddNewStockItem}
                onNavigateToVendor={(vId) => {
                  setSelectedVendorForDetail(vId);
                  setActiveTab('suppliers');
                }}
              />
            )}

            {activeTab === 'suppliers' && (
              <SupplierTrackingView
                vendors={vendors}
                assets={assets}
                stockItems={stockItems}
                purchaseOrders={purchaseOrders}
                selectedVendorId={selectedVendorForDetail}
                onSelectVendor={setSelectedVendorForDetail}
                onAddVendor={handleAddVendor}
                onNavigateToAsset={() => setActiveTab('assets')}
                onNavigateToProcurement={(vendorId) => {
                  if (vendorId) setSelectedVendorForDetail(vendorId);
                  setActiveTab('procurement');
                }}
              />
            )}

            {activeTab === 'racks' && (
              <RackVisualizerView
                racks={racks}
                assets={assets}
                plants={plants}
                selectedPlant={selectedPlant}
                onInspectAsset={() => setActiveTab('assets')}
              />
            )}

            {activeTab === 'workorders' && (
              <WorkOrdersView
                workOrders={workOrders}
                assets={assets}
                plants={plants}
                selectedPlant={selectedPlant}
                onAddWorkOrder={handleAddWorkOrder}
                onUpdateStatus={handleUpdateWorkOrderStatus}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrailView
                auditLogs={auditLogs}
                onSimulateTamper={handleSimulateTamper}
                onRestoreChain={handleRestoreChain}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile QR Audit Scanner Modal */}
      <PhysicalAuditScannerModal
        isOpen={isAuditScannerOpen}
        onClose={() => setIsAuditScannerOpen(false)}
        assets={assets}
        plants={plants}
        auditFindings={auditFindings}
        onRecordFinding={handleRecordAuditFinding}
        onVerifyAndCorrect={handleVerifyAndCorrectFinding}
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            FCCL IT Asset &amp; Infrastructure Platform &copy; 2026 Fauji Cement Company Limited.
          </span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>PKT (UTC+5) Timezone</span>
            <span>·</span>
            <span>Partial-Password Split Auth Active</span>
            <span>·</span>
            <span>Server RBAC Enforced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
