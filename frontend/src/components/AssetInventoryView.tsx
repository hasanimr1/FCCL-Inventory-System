import React, { useState } from 'react';
import {
  Asset,
  AssetCategory,
  AssetLifecycleStatus,
  Plant,
  PlantId,
  Rack,
  Vendor,
  Employee,
} from '../types/inventory.ts';
import { formatPKR, checkRackCollision, getDeviceNumber, formatDeviceName } from '../utils/inventoryRules.ts';
import { DeviceStatusDonut } from './DeviceStatusDonut.tsx';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Eye,
  QrCode,
  AlertTriangle,
  Server,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Activity,
  Radio,
  Cpu,
} from 'lucide-react';

interface AssetInventoryViewProps {
  assets: Asset[];
  plants: Plant[];
  racks: Rack[];
  vendors: Vendor[];
  employees: Employee[];
  selectedPlant: PlantId | 'all';
  onAddAsset: (asset: Omit<Asset, 'id' | 'liveStatus'>) => void;
  onUpdateAssetStatus: (assetId: string, status: AssetLifecycleStatus) => void;
  onAssignAsset: (assetId: string, employeeId: string) => void;
  onSimulateHeartbeat?: (assetId: string) => void;
  onSimulateDisconnect?: (assetId: string) => void;
  onSimulateHardwareChange?: (assetId: string, field: string, oldValue: string, newValue: string) => void;
}

export const AssetInventoryView: React.FC<AssetInventoryViewProps> = ({
  assets,
  plants,
  racks,
  vendors,
  employees,
  selectedPlant,
  onAddAsset,
  onUpdateAssetStatus,
  onAssignAsset,
  onSimulateHeartbeat,
  onSimulateDisconnect,
  onSimulateHardwareChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [connectivityFilter, setConnectivityFilter] = useState<'all' | 'Online' | 'Offline'>('all');

  // Detail / QR / Add modal states
  const [inspectAsset, setInspectAsset] = useState<Asset | null>(null);
  const [qrModalAsset, setQrModalAsset] = useState<Asset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states for new device
  const nextDeviceNum = assets.length + 1;
  const [newSerial, setNewSerial] = useState(`SN-${Math.floor(Math.random() * 899999 + 100000)}`);
  const [newModel, setNewModel] = useState('');
  const [newCategory, setNewCategory] = useState<AssetCategory>('Server');
  const [newVendorId, setNewVendorId] = useState(vendors[0]?.id || '');
  const [newPlantId, setNewPlantId] = useState<PlantId>(selectedPlant === 'all' ? 'plant-1' : selectedPlant);
  const [newLocation, setNewLocation] = useState('Datacenter Room 101');
  const [newRackId, setNewRackId] = useState<string>('');
  const [newRackUnitStart, setNewRackUnitStart] = useState<number>(1);
  const [newRackUnitHeight, setNewRackUnitHeight] = useState<number>(2);
  const [newRackFace, setNewRackFace] = useState<'front' | 'rear'>('front');
  const [newCost, setNewCost] = useState<number>(3500000);
  const [newWarranty, setNewWarranty] = useState('2028-06-30');
  const [newMonitoring, setNewMonitoring] = useState(true);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  // Custom technical specs
  const [customCpu, setCustomCpu] = useState('Intel Xeon Gold 6338');
  const [customRam, setCustomRam] = useState(64);
  const [customStorage, setCustomStorage] = useState(3840);
  const [customOs, setCustomOs] = useState('Red Hat Enterprise Linux 9');
  const [customIp, setCustomIp] = useState('10.14.10.');
  const [customMac, setCustomMac] = useState('00:15:5D:');

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    if (selectedPlant !== 'all' && asset.plantId !== selectedPlant) return false;
    if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
    if (connectivityFilter !== 'all' && asset.liveStatus !== connectivityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const devNum = getDeviceNumber(asset, assets).toString();
      const matchDeviceNum = devNum.includes(q) || `device #${devNum}`.includes(q) || `#${devNum}`.includes(q);
      const matchSerial = asset.serialNumber.toLowerCase().includes(q);
      const matchModel = asset.model.toLowerCase().includes(q);
      const matchLocation = asset.locationRoom.toLowerCase().includes(q);
      if (!matchDeviceNum && !matchSerial && !matchModel && !matchLocation) return false;
    }
    return true;
  });

  // Scoped counts for donut (based on plant filter but ignoring other filters for accuracy)
  const scopedForDonut = selectedPlant === 'all' ? assets : assets.filter((a) => a.plantId === selectedPlant);
  const donutOnline  = scopedForDonut.filter((a) => a.liveStatus === 'Online').length;
  const donutOffline = scopedForDonut.filter((a) => a.liveStatus === 'Offline').length;
  const donutTotal   = scopedForDonut.length;

  // Export to CSV functionality (Clean: Device Number & Serial Number, no asset tag)
  const handleExportCSV = () => {
    const headers = [
      'DeviceNumber',
      'SerialNumber',
      'Model',
      'Category',
      'Plant',
      'LocationRoom',
      'Rack',
      'Status',
      'OnlineStatus',
      'PurchaseDate',
      'WarrantyEnd',
      'CostPKR',
    ];

    const rows = filteredAssets.map((a) => [
      getDeviceNumber(a, assets),
      a.serialNumber,
      `"${a.model.replace(/"/g, '""')}"`,
      a.category,
      a.plantId,
      `"${a.locationRoom.replace(/"/g, '""')}"`,
      a.rackId || 'None',
      a.status,
      a.liveStatus,
      a.purchaseDate,
      a.warrantyEnd,
      a.costPKR,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fccl_devices_${selectedPlant}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Validate rack collision on change
  const handleRackChange = (rackId: string, uStart: number, uHeight: number, face: 'front' | 'rear') => {
    setNewRackId(rackId);
    setNewRackUnitStart(uStart);
    setNewRackUnitHeight(uHeight);
    setNewRackFace(face);

    if (!rackId) {
      setCollisionWarning(null);
      return;
    }

    const collision = checkRackCollision(assets, {
      rackId,
      rackUnitStart: uStart,
      rackUnitHeight: uHeight,
      rackFace: face,
    });

    if (collision.hasCollision) {
      setCollisionWarning(collision.error || 'Rack unit collision detected!');
    } else {
      setCollisionWarning(null);
    }
  };

  const handleCreateAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (collisionWarning) {
      return;
    }

    onAddAsset({
      deviceNumber: nextDeviceNum,
      assetTag: `AST-DEV-${String(nextDeviceNum).padStart(4, '0')}`,
      serialNumber: newSerial,
      model: newModel,
      category: newCategory,
      vendorId: newVendorId,
      plantId: newPlantId,
      locationRoom: newLocation,
      rackId: newRackId || undefined,
      rackUnitStart: newRackId ? Number(newRackUnitStart) : undefined,
      rackUnitHeight: newRackId ? Number(newRackUnitHeight) : undefined,
      rackFace: newRackFace,
      status: 'In Use',
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyEnd: newWarranty,
      costPKR: Number(newCost),
      monitoringEnabled: newMonitoring,
      receiptConfirmed: true,
      customSpecs: {
        cpu: customCpu,
        ramGb: Number(customRam),
        storageGb: Number(customStorage),
        os: customOs,
        ipAddress: customIp,
        macAddress: customMac,
      },
    });

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Hardware Registry</span>
            <span aria-hidden="true">·</span>
            <span>Identified by Serial Number</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Devices &amp; Hardware Inventory
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Complete list of plant hardware with simple numbering, serial numbers, locations, and live status indicators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Device</span>
          </button>
        </div>
      </div>

      {/* ── Device Status Donut Summary ──────────────────────── */}
      <div className="rounded-2xl bg-[#0f172a] px-6 py-4 flex flex-wrap items-center gap-10">
        {/* Single combined donut */}
        <DeviceStatusDonut
          online={donutOnline}
          offline={donutOffline}
          total={donutTotal}
          size={120}
        />
        <div className="flex flex-col gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span><strong className="text-white">{donutOnline}</strong> online</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span><strong className="text-white">{donutOffline}</strong> offline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
            <span><strong className="text-white">{donutTotal - donutOnline - donutOffline}</strong> standby</span>
          </div>
        </div>
      </div>

      {/* Structured Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by serial number (e.g. SRV-DL-889421), device # (e.g. 1), model, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Online / Offline Color Filter */}
            <select
              value={connectivityFilter}
              onChange={(e) => setConnectivityFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Connection States</option>
              <option value="Online">🟢 Online Only</option>
              <option value="Offline">🟠 Offline Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Equipment Types</option>
              <option value="Server">Servers</option>
              <option value="Network Switch">Network Switches</option>
              <option value="Workstation PC">Workstation PCs</option>
              <option value="Industrial Laptop">Industrial Laptops</option>
              <option value="UPS System">UPS Systems</option>
              <option value="SAN Storage">SAN Storage</option>
            </select>

            {/* Lifecycle Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Lifecycle States</option>
              <option value="In Use">In Use</option>
              <option value="Spare">Spare</option>
              <option value="In Repair">In Repair</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Table (Simple Numbering + Serial Number + Green/Orange Status) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Device &amp; Status</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Model &amp; Category</th>
                <th className="py-3 px-4">Plant &amp; Location</th>
                <th className="py-3 px-4">Rack Position</th>
                <th className="py-3 px-4">Lifecycle</th>
                <th className="py-3 px-4">Assigned Custody</th>
                <th className="py-3 px-4 text-right">Cost (PKR)</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No devices match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const plant = plants.find((p) => p.id === asset.plantId);
                  const employee = employees.find((e) => e.id === asset.assignedEmployeeId);
                  const deviceNum = getDeviceNumber(asset, assets);

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Simple Device Numbering + Online (Green) / Offline (Orange) Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            #{deviceNum}
                          </span>

                          {/* Online (Green) and Offline (Orange) Colors Beside the Device */}
                          {asset.liveStatus === 'Online' ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
                              title="Device Online — Active connection"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          ) : asset.liveStatus === 'Offline' ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 shadow-xs"
                              title="Device Offline — Missed check-in"
                            >
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              Offline
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                              title="Standby — Unmonitored"
                            >
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Standby
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hardware Identifier: Serial Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {asset.serialNumber}
                      </td>

                      {/* Model & Category */}
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="font-medium text-slate-900">{asset.model}</div>
                        <div className="text-[11px] text-slate-500">{asset.category}</div>
                      </td>

                      {/* Plant & Location Room */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-900">{plant?.name || asset.plantId}</div>
                        <div className="text-[11px] text-slate-500">{asset.locationRoom}</div>
                      </td>

                      {/* Rack Position */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {asset.rackId && asset.rackUnitStart ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                            U{asset.rackUnitStart} - U{asset.rackUnitStart + (asset.rackUnitHeight || 1)} ({asset.rackFace || 'front'})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unmounted</span>
                        )}
                      </td>

                      {/* Lifecycle Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            asset.status === 'In Use'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : asset.status === 'Spare'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : asset.status === 'In Repair'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      {/* Assigned Employee */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {employee ? (
                          <div>
                            <div className="font-medium text-slate-900">{employee.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {employee.employeeNumber} · {employee.department}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unassigned Pool</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {formatPKR(asset.costPKR)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setInspectAsset(asset)}
                            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            title="Inspect Details & Specifications"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQrModalAsset(asset)}
                            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                            title="Print Device Label & QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Detail & Specifications Modal */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm bg-slate-900 text-white px-2.5 py-0.5 rounded">
                    Device #{getDeviceNumber(inspectAsset, assets)}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{inspectAsset.model}</h3>

                  {/* Online / Offline Status Badge */}
                  {inspectAsset.liveStatus === 'Online' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Offline
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 font-mono mt-1 font-semibold">
                  Serial Number: <span className="text-slate-900">{inspectAsset.serialNumber}</span> · Category: {inspectAsset.category}
                </div>
              </div>
              <button
                onClick={() => setInspectAsset(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General & Location Information */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Plant Allocation</span>
                <span className="font-semibold text-slate-800">{inspectAsset.plantId}</span>
                <span className="text-[11px] text-slate-500 block">{inspectAsset.locationRoom}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Book Value</span>
                <span className="font-mono font-bold text-slate-900">{formatPKR(inspectAsset.costPKR)}</span>
                <span className="text-[11px] text-slate-500 block">Warranty to {inspectAsset.warrantyEnd}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lifecycle Status</span>
                <span className="font-semibold text-slate-800">{inspectAsset.status}</span>
                <span className="text-[11px] text-slate-500 block">Rack: {inspectAsset.rackId ? `U${inspectAsset.rackUnitStart}` : 'Unmounted'}</span>
              </div>
            </div>

            {/* Technical Hardware Details */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-600" />
                <span>Technical Specifications</span>
              </h4>

              <div className="bg-slate-900 rounded-lg p-3.5 text-slate-200 font-mono text-xs space-y-1.5">
                {inspectAsset.customSpecs.cpu && (
                  <div><span className="text-slate-400">Processor (CPU):</span> {inspectAsset.customSpecs.cpu}</div>
                )}
                {inspectAsset.customSpecs.ramGb && (
                  <div><span className="text-slate-400">RAM:</span> {inspectAsset.customSpecs.ramGb} GB</div>
                )}
                {inspectAsset.customSpecs.storageGb && (
                  <div><span className="text-slate-400">Storage:</span> {inspectAsset.customSpecs.storageGb} GB</div>
                )}
                {inspectAsset.customSpecs.os && (
                  <div><span className="text-slate-400">Operating System:</span> {inspectAsset.customSpecs.os}</div>
                )}
                {inspectAsset.customSpecs.ipAddress && (
                  <div><span className="text-slate-400">IP Address:</span> {inspectAsset.customSpecs.ipAddress}</div>
                )}
                {inspectAsset.customSpecs.macAddress && (
                  <div><span className="text-slate-400">MAC Address:</span> {inspectAsset.customSpecs.macAddress}</div>
                )}
                {inspectAsset.customSpecs.portCount && (
                  <div><span className="text-slate-400">Port Count:</span> {inspectAsset.customSpecs.portCount} Ports</div>
                )}
                {inspectAsset.customSpecs.powerDrawWatts && (
                  <div><span className="text-slate-400">Power Consumption:</span> {inspectAsset.customSpecs.powerDrawWatts} W</div>
                )}
              </div>
            </div>

            {/* Quick Testing Controls (Replaces separate monitoring screen cleanly) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-bold text-slate-800 block mb-2">Device Status Controls</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSimulateHeartbeat) onSimulateHeartbeat(inspectAsset.id);
                    setInspectAsset({ ...inspectAsset, liveStatus: 'Online' });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  Set Online (Green)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSimulateDisconnect) onSimulateDisconnect(inspectAsset.id);
                    setInspectAsset({ ...inspectAsset, liveStatus: 'Offline' });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  Set Offline (Orange)
                </button>
              </div>
            </div>

            {/* Lifecycle Status Modification */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Update Lifecycle:</span>
                <select
                  value={inspectAsset.status}
                  onChange={(e) => {
                    onUpdateAssetStatus(inspectAsset.id, e.target.value as AssetLifecycleStatus);
                    setInspectAsset({ ...inspectAsset, status: e.target.value as AssetLifecycleStatus });
                  }}
                  className="text-xs border border-slate-300 rounded px-2.5 py-1 font-medium bg-white"
                >
                  <option value="In Use">In Use</option>
                  <option value="Spare">Spare</option>
                  <option value="In Repair">In Repair</option>
                  <option value="Decommissioned">Decommissioned</option>
                  <option value="Scrapped">Scrapped</option>
                </select>
              </div>

              <button
                onClick={() => setInspectAsset(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Printable Label Modal */}
      {qrModalAsset && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Device Hardware Label</h3>
              <button
                onClick={() => setQrModalAsset(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-center space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                FAUJI CEMENT CO. LTD. — IT INFRASTRUCTURE
              </span>

              {/* QR Code matrix in SVG */}
              <div className="mx-auto w-32 h-32 bg-white p-2 border border-slate-200 rounded shadow-sm flex items-center justify-center">
                <svg className="w-28 h-28" viewBox="0 0 100 100">
                  <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="18" width="9" height="9" fill="#0f172a" />

                  <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="73" y="18" width="9" height="9" fill="#0f172a" />

                  <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="73" width="9" height="9" fill="#0f172a" />

                  <rect x="45" y="15" width="8" height="8" fill="#0f172a" />
                  <rect x="42" y="42" width="16" height="16" fill="#0f172a" />
                  <rect x="65" y="45" width="6" height="12" fill="#0f172a" />
                  <rect x="45" y="65" width="10" height="8" fill="#0f172a" />
                  <rect x="70" y="70" width="12" height="12" fill="#0f172a" />
                </svg>
              </div>

              <div className="font-bold text-base text-slate-900 tracking-wide">
                Device #{getDeviceNumber(qrModalAsset, assets)}
              </div>
              <div className="font-mono font-semibold text-xs text-slate-800">
                SN: {qrModalAsset.serialNumber}
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-1">{qrModalAsset.model}</p>
              <div className="text-[10px] text-slate-400 font-mono">
                Plant: {qrModalAsset.plantId} · Room: {qrModalAsset.locationRoom}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setQrModalAsset(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 cursor-pointer"
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Device Modal (Simple Numbering + Serial Number) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Register New Device</h3>
                <span className="text-xs text-slate-500">
                  Assigned Number: <strong className="text-slate-900 font-bold">Device #{nextDeviceNum}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssetSubmit} className="space-y-3 text-xs">

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Device Number</label>
                <input
                  type="text"
                  value={`Device #${nextDeviceNum}`}
                  disabled
                  className="flex-1 border border-slate-200 bg-slate-50 text-slate-600 rounded px-2.5 py-1.5 font-bold"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Serial Number (Primary ID)</label>
                <input
                  type="text"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  placeholder="e.g. SN-892104"
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-semibold"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Equipment Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="Server">Server</option>
                  <option value="Network Switch">Network Switch</option>
                  <option value="Workstation PC">Workstation PC</option>
                  <option value="Industrial Laptop">Industrial Laptop</option>
                  <option value="UPS System">UPS System</option>
                  <option value="SAN Storage">SAN Storage</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Model Name</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="e.g. Dell PowerEdge R650"
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Supplier</label>
                <select
                  value={newVendorId}
                  onChange={(e) => setNewVendorId(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Plant Location</label>
                <select
                  value={newPlantId}
                  onChange={(e) => setNewPlantId(e.target.value as PlantId)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Room / Floor Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              {/* Rack Placement (Optional) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-semibold text-slate-900 block">Rack Mounting (Optional)</span>
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-slate-600 w-36 shrink-0">Rack Cabinet</label>
                  <select
                    value={newRackId}
                    onChange={(e) => handleRackChange(e.target.value, newRackUnitStart, newRackUnitHeight, newRackFace)}
                    className="flex-1 border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="">None (Standalone)</option>
                    {racks.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-slate-600 w-36 shrink-0">Start U Position</label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={42}
                    value={newRackUnitStart}
                    onChange={(e) => handleRackChange(newRackId, Number(e.target.value), newRackUnitHeight, newRackFace)}
                    className="flex-1 border border-slate-300 rounded px-2 py-1 font-mono bg-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-slate-600 w-36 shrink-0">Height (U)</label>
                  <input
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={8}
                    value={newRackUnitHeight}
                    onChange={(e) => handleRackChange(newRackId, newRackUnitStart, Number(e.target.value), newRackFace)}
                    className="flex-1 border border-slate-300 rounded px-2 py-1 font-mono bg-white"
                  />
                </div>

                {collisionWarning && (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{collisionWarning}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Purchase Cost (PKR)</label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Warranty End Date</label>
                <input
                  type="date"
                  value={newWarranty}
                  onChange={(e) => setNewWarranty(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(collisionWarning)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium disabled:opacity-50 cursor-pointer"
                >
                  Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Import Device Inventory</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Upload existing equipment spreadsheets. Maps serial numbers, plant assignments, and locations automatically.
            </p>

            <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center bg-slate-50">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <span className="text-xs text-slate-700 font-semibold block">Click to upload .csv or .xlsx</span>
              <span className="text-[11px] text-slate-400 mt-1 block">Maximum 20,000 device rows per batch</span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ingestion Ready
              </div>
              <p className="text-[11px]">Validates serial numbers and room locations before saving.</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Device template spreadsheet loaded successfully.');
                  setIsImportModalOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 cursor-pointer"
              >
                Simulate Ingestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
