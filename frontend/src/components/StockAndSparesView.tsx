import React, { useState } from 'react';
import {
  StockItem,
  Vendor,
  Plant,
  PlantId,
  Asset,
} from '../types/inventory.ts';
import { calculateStockHealth, formatPKR, formatPKT, getDeviceNumber } from '../utils/inventoryRules.ts';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Phone,
  PackageCheck,
  Building,
} from 'lucide-react';

interface StockAndSparesViewProps {
  stockItems: StockItem[];
  vendors: Vendor[];
  plants: Plant[];
  assets: Asset[];
  selectedPlant: PlantId | 'all';
  onIssueSpare: (stockId: string, quantity: number, assetTag: string, reason: string) => void;
  onRestockItem: (stockId: string, quantity: number, poNumber: string) => void;
  onAddNewStockItem: (newItem: Omit<StockItem, 'id' | 'status' | 'lastRestocked'>) => void;
  onNavigateToVendor: (vendorId: string) => void;
}

export const StockAndSparesView: React.FC<StockAndSparesViewProps> = ({
  stockItems,
  vendors,
  plants,
  assets,
  selectedPlant,
  onIssueSpare,
  onRestockItem,
  onAddNewStockItem,
  onNavigateToVendor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [issueModalItem, setIssueModalItem] = useState<StockItem | null>(null);
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [issueAssetTag, setIssueAssetTag] = useState('');
  const [issueReason, setIssueReason] = useState('Hardware maintenance upgrade');

  const [restockModalItem, setRestockModalItem] = useState<StockItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(5);
  const [restockPoNumber, setRestockPoNumber] = useState('PO-FCCL-2026-');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSku, setNewSku] = useState('SP-');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Memory (RAM)');
  const [newPlantId, setNewPlantId] = useState<PlantId>(selectedPlant === 'all' ? 'plant-1' : selectedPlant);
  const [newVendorId, setNewVendorId] = useState(vendors[0]?.id || '');
  const [newStock, setNewStock] = useState(10);
  const [newMin, setNewMin] = useState(4);
  const [newReorder, setNewReorder] = useState(8);
  const [newPrice, setNewPrice] = useState(25000);
  const [newLeadTime, setNewLeadTime] = useState(5);
  const [newShelf, setNewShelf] = useState('Bay A-01');

  // Filter items
  const scopedItems = stockItems.filter((item) => {
    if (selectedPlant !== 'all' && item.plantId !== selectedPlant) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchName = item.name.toLowerCase().includes(q);
      const matchShelf = item.shelfLocation.toLowerCase().includes(q);
      if (!matchSku && !matchName && !matchShelf) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(stockItems.map((s) => s.category)));

  // Aggregate stats
  const totalStockValuation = scopedItems.reduce(
    (acc, curr) => acc + curr.currentStock * curr.unitPricePKR,
    0
  );
  const criticalCount = scopedItems.filter((s) => s.status === 'Critical Reorder').length;
  const lowStockCount = scopedItems.filter((s) => s.status === 'Low Stock').length;
  const optimalCount = scopedItems.filter((s) => s.status === 'Optimal').length;

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalItem) return;
    onIssueSpare(issueModalItem.id, issueQuantity, issueAssetTag || 'Unspecified Asset', issueReason);
    setIssueModalItem(null);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem) return;
    onRestockItem(restockModalItem.id, restockQuantity, restockPoNumber);
    setRestockModalItem(null);
  };

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNewStockItem({
      sku: newSku,
      name: newName,
      category: newCategory,
      plantId: newPlantId,
      vendorId: newVendorId,
      currentStock: Number(newStock),
      minThreshold: Number(newMin),
      reorderPoint: Number(newReorder),
      unitPricePKR: Number(newPrice),
      leadTimeDays: Number(newLeadTime),
      shelfLocation: newShelf,
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Store Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Store &amp; Inventory Management</span>
            <span aria-hidden="true">·</span>
            <span>Spares &amp; Consumables</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Spare Parts &amp; Critical Stock Levels
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Store Officer portal for managing IT component buffers, min/reorder thresholds, and direct supplier replenishment.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Spare Part</span>
        </button>
      </div>

      {/* Stock Health KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Spares Value</span>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatPKR(totalStockValuation)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">In-store inventory valuation</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Critical Reorder Required</span>
          <div className="mt-2 text-xl font-bold font-mono text-rose-700 tabular-nums">
            {criticalCount}
          </div>
          <span className="text-xs text-rose-600 mt-1 block font-medium">Stock at or below minimum</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Low Stock Warning</span>
          <div className="mt-2 text-xl font-bold font-mono text-amber-700 tabular-nums">
            {lowStockCount}
          </div>
          <span className="text-xs text-amber-600 mt-1 block font-medium">Approaching reorder point</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Optimal Buffer</span>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {optimalCount}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block font-medium">Above reorder threshold</span>
        </div>
      </div>

      {/* Controls & Search Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by part number, name, shelf location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories ({stockItems.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Critical Reorder">Critical Reorder</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Optimal">Optimal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spares Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Part Number &amp; Name</th>
                <th className="py-3 px-4">Plant &amp; Location</th>
                <th className="py-3 px-4">Stock Level Gauge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4">Supplier &amp; Lead Time</th>
                <th className="py-3 px-4 text-center">Store Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scopedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No spare items match the selected criteria.
                  </td>
                </tr>
              ) : (
                scopedItems.map((item) => {
                  const vendor = vendors.find((v) => v.id === item.vendorId);
                  const plant = plants.find((p) => p.id === item.plantId);

                  // Calculate fill percentage for gauge (max at reorder * 1.5)
                  const maxGauge = Math.max(item.reorderPoint * 1.5, item.currentStock);
                  const fillPct = Math.min(100, Math.round((item.currentStock / maxGauge) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* SKU & Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-900">{item.sku}</div>
                        <div className="text-slate-600 font-medium max-w-xs">{item.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.category}</div>
                      </td>

                      {/* Plant & Shelf */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-900">{plant?.name || item.plantId}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                            {item.shelfLocation}
                          </span>
                        </div>
                      </td>

                      {/* Stock Level Gauge */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="flex items-center justify-between font-mono text-xs mb-1">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {item.currentStock} Units
                          </span>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            Min: {item.minThreshold} · Reorder: {item.reorderPoint}
                          </span>
                        </div>
                        {/* Gauge bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.status === 'Critical Reorder'
                                ? 'bg-rose-500'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(8, fillPct)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === 'Critical Reorder' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Critical Reorder
                          </span>
                        )}
                        {item.status === 'Low Stock' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Low Stock
                          </span>
                        )}
                        {item.status === 'Optimal' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Optimal Buffer
                          </span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {formatPKR(item.unitPricePKR)}
                      </td>

                      {/* Vendor Link & Lead Time */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {vendor ? (
                          <button
                            onClick={() => onNavigateToVendor(vendor.id)}
                            className="font-medium text-slate-800 hover:text-slate-900 hover:underline block text-left"
                          >
                            {vendor.name}
                          </button>
                        ) : (
                          <span>Unassigned Vendor</span>
                        )}
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          SLA Lead: {item.leadTimeDays} days
                        </span>
                      </td>

                      {/* Action buttons: Issue Spares / Restock */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setIssueModalItem(item);
                              setIssueQuantity(1);
                              setIssueAssetTag(assets[0]?.assetTag || '');
                            }}
                            disabled={item.currentStock <= 0}
                            className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Issue spare component to asset or work order"
                          >
                            Issue
                          </button>
                          <button
                            onClick={() => {
                              setRestockModalItem(item);
                              setRestockQuantity(item.reorderPoint);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                            title="Restock component from vendor"
                          >
                            Restock
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

      {/* Modal: Issue Spares */}
      {issueModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Issue Spare Part</h3>
                <span className="text-xs text-slate-500 font-mono">{issueModalItem.sku}</span>
              </div>
              <button
                onClick={() => setIssueModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">{issueModalItem.name}</p>

            <form onSubmit={handleConfirmIssue} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Quantity to Issue</label>
                <input
                  type="number"
                  min={1}
                  max={issueModalItem.currentStock}
                  value={issueQuantity}
                  onChange={(e) => setIssueQuantity(Math.max(1, Number(e.target.value)))}
                  className="flex-1 border border-slate-300 rounded px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Target Device</label>
                <select
                  value={issueAssetTag}
                  onChange={(e) => setIssueAssetTag(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">General Maintenance Workshop</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.serialNumber}>
                      Device #{getDeviceNumber(a, assets)} — {a.model} (SN: {a.serialNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Reason / Notes</label>
                <input
                  type="text"
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-3 py-1.5 focus:outline-none"
                  placeholder="e.g. Memory upgrade for analytics VM expansion"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIssueModalItem(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 font-medium"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restock Item */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Restock Component from Vendor</h3>
                <span className="text-xs text-slate-500 font-mono">{restockModalItem.sku}</span>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">{restockModalItem.name}</p>

            <form onSubmit={handleConfirmRestock} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Restock Units</label>
                <input
                  type="number"
                  min={1}
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(Math.max(1, Number(e.target.value)))}
                  className="flex-1 border border-slate-300 rounded px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-slate-800"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">PO Reference</label>
                <input
                  type="text"
                  value={restockPoNumber}
                  onChange={(e) => setRestockPoNumber(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-3 py-1.5 font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span className="font-mono font-medium">{formatPKR(restockModalItem.unitPricePKR)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Total Order Est:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatPKR(restockModalItem.unitPricePKR * restockQuantity)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 font-medium"
                >
                  Receive Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Stock SKU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register New Spare Part</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdd} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Part / Model Number</label>
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="Memory (RAM)">Memory (RAM)</option>
                  <option value="Storage Disks">Storage Disks</option>
                  <option value="Networking Transceivers">Networking Transceivers</option>
                  <option value="Cabling & Patch">Cabling & Patch</option>
                  <option value="Power Units">Power Units</option>
                  <option value="UPS Batteries">UPS Batteries</option>
                  <option value="Network Adapters">Network Adapters</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Part Description</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dell 16GB DDR4 ECC RDIMM 2666MHz"
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Plant Allocation</label>
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
                <label className="text-slate-700 font-medium w-36 shrink-0">Assigned Vendor</label>
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
                <label className="text-slate-700 font-medium w-36 shrink-0">Initial Stock</label>
                <input
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Min Threshold</label>
                <input
                  type="number"
                  min={1}
                  value={newMin}
                  onChange={(e) => setNewMin(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Reorder Point</label>
                <input
                  type="number"
                  min={1}
                  value={newReorder}
                  onChange={(e) => setNewReorder(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Unit Price (PKR)</label>
                <input
                  type="number"
                  min={1}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Lead Time (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={newLeadTime}
                  onChange={(e) => setNewLeadTime(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Shelf Bin</label>
                <input
                  type="text"
                  value={newShelf}
                  onChange={(e) => setNewShelf(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 font-medium"
                >
                  Save Spare Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
