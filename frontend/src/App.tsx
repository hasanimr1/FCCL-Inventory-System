import React, { useState, useEffect } from 'react';
import {
  PlantId,
  UserRole,
  Asset,
  StockItem,
  Vendor,
  WorkOrder,
  ChangeEvent,
  AuditFinding,
  AuditLog,
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
} from '../../backend/data/mockInventoryData.ts';
import {
  calculateStockHealth,
  evaluateDeviceLiveStatus,
  detectHardwareDifferences,
  matchChangeWithWorkOrder,
  computeRecordHash,
  formatPKT,
} from './utils/inventoryRules.ts';
import { NavigationHeader } from './components/NavigationHeader.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { AssetInventoryView } from './components/AssetInventoryView.tsx';
import { StockAndSparesView } from './components/StockAndSparesView.tsx';
import { SupplierTrackingView } from './components/SupplierTrackingView.tsx';
import { NavigationDrawer } from './components/NavigationDrawer.tsx';
import { RackVisualizerView } from './components/RackVisualizerView.tsx';
import { WorkOrdersView } from './components/WorkOrdersView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { PhysicalAuditScannerModal } from './components/PhysicalAuditScannerModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPlant, setSelectedPlant] = useState<PlantId | 'all'>('all');
  const [currentRole, setCurrentRole] = useState<UserRole>('Super Admin');
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

  // Real-time WebSocket simulator state
  const [isStreaming, setIsStreaming] = useState(true);
  const [liveHeartbeatCount, setLiveHeartbeatCount] = useState(148);
  const [pktTime, setPktTime] = useState('');
  const [isAuditScannerOpen, setIsAuditScannerOpen] = useState(false);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<string | undefined>(undefined);

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
    entityType: 'Asset' | 'Assignment' | 'StockItem' | 'Rack' | 'Vendor' | 'WorkOrder',
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

    // Set heartbeat to 10 mins ago to exceed 3 min threshold
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

  // Hardware change simulation (RAM / Storage mutation detection)
  const handleSimulateHardwareChange = (
    assetId: string,
    field: string,
    oldValue: string,
    newValue: string
  ) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    // Update specs
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

    // Correlate with work orders
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
      `${field} mutated from ${oldValue} to ${newValue}. ${
        authResult.isAuthorized
          ? `Matched with Work Order ${authResult.matchedWorkOrder?.workOrderNumber}.`
          : 'NO matching work order within 48h window. Unauthorized alert raised.'
      }`
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
      'zahid.store@fccl.com.pk',
      'Store Officer',
      'Issued Spare Component',
      'StockItem',
      item.sku,
      `Issued ${quantity} unit(s) to ${assetTag}. Remaining stock: ${newStock}. Reason: ${reason}`
    );
  };

  // Store Officer: Restock Item
  const handleRestockItem = (stockId: string, quantity: number, poNumber: string) => {
    const item = stockItems.find((s) => s.id === stockId);
    if (!item) return;

    const newStock = item.currentStock + quantity;
    const newStatus = calculateStockHealth(newStock, item.minThreshold, item.reorderPoint);

    setStockItems((prev) =>
      prev.map((s) =>
        s.id === stockId
          ? {
              ...s,
              currentStock: newStock,
              status: newStatus,
              lastRestocked: new Date().toISOString().split('T')[0],
            }
          : s
      )
    );

    appendAuditLog(
      'zahid.store@fccl.com.pk',
      'Store Officer',
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
      'zahid.store@fccl.com.pk',
      'Store Officer',
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
      'imran.ashraf@fccl.com.pk',
      'Plant Admin',
      'Device Created',
      'Asset',
      newAsset.serialNumber,
      `Registered Device #${newAsset.deviceNumber} (${newAsset.model}) at ${newAsset.locationRoom}. Serial: ${newAsset.serialNumber}.`
    );
  };

  // Update Asset Lifecycle Status (Soft delete / Decommission)
  const handleUpdateAssetStatus = (assetId: string, status: AssetLifecycleStatus) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status } : a))
    );

    appendAuditLog(
      'imran.ashraf@fccl.com.pk',
      'Plant Admin',
      `Lifecycle Transition: ${status}`,
      'Asset',
      asset.assetTag,
      `Asset status updated from ${asset.status} to ${status}. Soft-deletion preserved.`
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
      'imran.ashraf@fccl.com.pk',
      'Plant Admin',
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
      'imran.ashraf@fccl.com.pk',
      'Plant Admin',
      'Created Work Order',
      'WorkOrder',
      newOrder.workOrderNumber,
      `Created work order for ${newOrder.assetTag}: "${newOrder.title}". Assigned to ${newOrder.technicianName}.`
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
      'tariq.m@fccl.com.pk',
      'Technician',
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
      'auditor.waqas@fccl.com.pk',
      'Auditor',
      'Logged Audit Discrepancy',
      'Asset',
      findingData.assetTag,
      `Recorded physical audit discrepancy: ${findingData.discrepancyType}. Expected: ${findingData.expectedLocation}, Scanned: ${findingData.scannedLocation}.`
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

    // Update asset record to match ground truth
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
      'imran.ashraf@fccl.com.pk',
      'Plant Admin',
      'Approved Audit Discrepancy Correction',
      'Asset',
      finding.assetTag,
      `Corrected master inventory for ${finding.assetTag} to ${finding.scannedLocation} (${finding.scannedStatus}) based on audit walk-through.`
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
        onRoleChange={setCurrentRole}
        pktTime={pktTime}
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
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            plants={plants}
            assets={assets}
            stockItems={stockItems}
            workOrders={workOrders}
            changeEvents={changeEvents}
            selectedPlant={selectedPlant}
            onPlantChange={setSelectedPlant}
            onNavigate={setActiveTab}
            onOpenAuditScanner={() => setIsAuditScannerOpen(true)}
            onOpenNewAssetModal={() => setActiveTab('assets')}
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
            selectedVendorId={selectedVendorForDetail}
            onSelectVendor={setSelectedVendorForDetail}
            onAddVendor={handleAddVendor}
            onNavigateToAsset={() => setActiveTab('assets')}
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
            <span>PostgreSQL RLS Multi-Plant Isolation</span>
            <span>·</span>
            <span>Go Endpoint Daemon v1.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
