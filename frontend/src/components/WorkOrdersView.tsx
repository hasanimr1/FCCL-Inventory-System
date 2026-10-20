import React, { useState } from 'react';
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  Asset,
  Plant,
  PlantId,
} from '../types/inventory.ts';
import { formatPKT, getDeviceNumber } from '../utils/inventoryRules.ts';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Filter,
  Search,
} from 'lucide-react';

interface WorkOrdersViewProps {
  workOrders: WorkOrder[];
  assets: Asset[];
  plants: Plant[];
  selectedPlant: PlantId | 'all';
  onAddWorkOrder: (order: Omit<WorkOrder, 'id' | 'workOrderNumber' | 'createdAt'>) => void;
  onUpdateStatus: (orderId: string, status: WorkOrderStatus) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  workOrders,
  assets,
  plants,
  selectedPlant,
  onAddWorkOrder,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newAssetId, setNewAssetId] = useState(assets[0]?.id || '');
  const [newTech, setNewTech] = useState('Muhammad Tariq');
  const [newPriority, setNewPriority] = useState<WorkOrderPriority>('High');
  const [newAuthChange, setNewAuthChange] = useState('RAM Upgrade from 16GB to 32GB');
  const [newNotes, setNewNotes] = useState('');

  const scopedOrders = workOrders.filter((wo) => {
    if (selectedPlant !== 'all' && wo.plantId !== selectedPlant) return false;
    if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        wo.workOrderNumber.toLowerCase().includes(q) ||
        wo.title.toLowerCase().includes(q) ||
        wo.assetTag.toLowerCase().includes(q) ||
        wo.technicianName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === newAssetId) || assets[0];
    onAddWorkOrder({
      title: newTitle,
      assetId: asset.id,
      assetTag: asset.assetTag,
      technicianName: newTech,
      plantId: asset.plantId,
      status: 'Open',
      priority: newPriority,
      authorizedHardwareChange: newAuthChange,
      notes: newNotes,
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Maintenance &amp; Change Authorization</span>
            <span aria-hidden="true">·</span>
            <span>Technician Attributed Work Orders</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            IT Infrastructure Maintenance Orders
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Authorize hardware changes to automatically correlate with Go agent hardware detections and suppress false unauthorized alerts.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Work Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search work orders by number, title, serial number, technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses ({workOrders.length})</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scopedOrders.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
            No work orders match the selected filters.
          </div>
        ) : (
          scopedOrders.map((order) => {
            const plant = plants.find((p) => p.id === order.plantId);

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        {order.workOrderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {plant?.name || order.plantId}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.priority === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : order.priority === 'High'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.priority}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-2">
                    {order.title}
                  </h3>

                  <div className="mt-2.5 p-2 rounded bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Device:</span>
                      <span className="font-semibold text-slate-900">
                        {(() => {
                          const target = assets.find((a) => a.id === order.assetId || a.assetTag === order.assetTag);
                          return target ? `Device #${getDeviceNumber(target, assets)} (SN: ${target.serialNumber})` : order.assetTag;
                        })()}
                      </span>
                    </div>
                    {order.authorizedHardwareChange && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Authorized Change:</span>
                        <span className="font-semibold text-emerald-800">{order.authorizedHardwareChange}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Technician:</span>
                      <span className="font-medium text-slate-800">{order.technicianName}</span>
                    </div>
                  </div>

                  {order.notes && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
                      "{order.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatPKT(order.createdAt)}
                  </span>

                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as WorkOrderStatus)}
                    className="border border-slate-300 rounded px-2 py-1 font-semibold text-xs bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Work Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Create Authorized Work Order</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Work Order Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. SCADA Server RAM Upgrade"
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Target Device</label>
                <select
                  value={newAssetId}
                  onChange={(e) => setNewAssetId(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      Device #{getDeviceNumber(a, assets)} — {a.model} (SN: {a.serialNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Technician</label>
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as WorkOrderPriority)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Authorized Hardware Change</label>
                <input
                  type="text"
                  value={newAuthChange}
                  onChange={(e) => setNewAuthChange(e.target.value)}
                  placeholder="e.g. RAM Upgrade from 16GB to 32GB"
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="flex items-start gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0 pt-1">Maintenance Instructions</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Special instructions or safety procedures..."
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-slate-900 text-white font-medium hover:bg-slate-800"
                >
                  Authorize Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
