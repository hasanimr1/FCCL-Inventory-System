import React from 'react';
import {
  Asset,
  Plant,
  StockItem,
  WorkOrder,
  ChangeEvent,
  PlantId,
} from '../types/inventory.ts';
import { formatPKR, formatPKT, getDeviceNumber } from '../utils/inventoryRules.ts';
import {
  Server,
  Activity,
  AlertTriangle,
  Boxes,
  Wrench,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Building,
  QrCode,
  RefreshCw,
} from 'lucide-react';

interface DashboardOverviewProps {
  plants: Plant[];
  assets: Asset[];
  stockItems: StockItem[];
  workOrders: WorkOrder[];
  changeEvents: ChangeEvent[];
  selectedPlant: PlantId | 'all';
  onNavigate: (tab: string) => void;
  onOpenAuditScanner: () => void;
  onOpenNewAssetModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  plants,
  assets,
  stockItems,
  workOrders,
  changeEvents,
  selectedPlant,
  onNavigate,
  onOpenAuditScanner,
  onOpenNewAssetModal,
}) => {
  // Filter assets by selected plant scope
  const scopedAssets = selectedPlant === 'all'
    ? assets
    : assets.filter((a) => a.plantId === selectedPlant);

  const scopedStock = selectedPlant === 'all'
    ? stockItems
    : stockItems.filter((s) => s.plantId === selectedPlant);

  const scopedWorkOrders = selectedPlant === 'all'
    ? workOrders
    : workOrders.filter((w) => w.plantId === selectedPlant);

  // Computations
  const totalValuation = scopedAssets.reduce((acc, curr) => acc + curr.costPKR, 0);
  const onlineCount = scopedAssets.filter((a) => a.liveStatus === 'Online').length;
  const offlineCount = scopedAssets.filter((a) => a.liveStatus === 'Offline').length;
  const unknownCount = scopedAssets.filter((a) => a.liveStatus === 'Unknown').length;

  const lowStockCount = scopedStock.filter(
    (s) => s.status === 'Critical Reorder' || s.status === 'Low Stock'
  ).length;

  const criticalStockItems = scopedStock.filter((s) => s.status === 'Critical Reorder');
  const pendingChangeAlerts = changeEvents.filter((c) => !c.isAuthorized);

  return (
    <div className="space-y-6">
      {/* Top Banner / Scope Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>FCCL Industrial Operations</span>
              <span aria-hidden="true">·</span>
              <span>
                {selectedPlant === 'all' ? 'Consolidated All 4 Plants' : plants.find(p => p.id === selectedPlant)?.name}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              IT Asset &amp; Stock Intelligence Console
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Real-time hardware inventory, Go endpoint heartbeats, spare parts replenishment, and immutable audit trails across FCCL plant facilities.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewAssetModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Register Device</span>
            </button>
            <button
              onClick={() => onNavigate('stock')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5 text-slate-600" />
              <span>Manage Spares</span>
            </button>
            <button
              onClick={onOpenAuditScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-600" />
              <span>QR Audit Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Strip (60-30-10 neutral color discipline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Capital Asset Valuation in PKR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Asset Book Value</span>
            <span className="text-[11px] font-mono text-slate-400">PKR Base</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatPKR(totalValuation)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{scopedAssets.length} active managed records</span>
          </div>
        </div>

        {/* KPI 2: Real-time Online / Offline Agent Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Device Live Status</span>
            <button
              onClick={() => onNavigate('assets')}
              className="text-[11px] text-slate-600 hover:text-slate-900 underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              View Devices <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">{onlineCount}</span>
                <span className="text-xs font-semibold text-emerald-700">online</span>
              </div>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-orange-700 tabular-nums">{offlineCount}</span>
                <span className="text-xs font-semibold text-orange-700">offline</span>
              </div>
            </div>
            <span className="text-slate-300">/</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-slate-500 tabular-nums">{unknownCount}</span>
              <span className="text-xs text-slate-400">standby</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Color coded: Green (Online) &amp; Orange (Offline)</span>
          </div>
        </div>

        {/* KPI 3: Spare Parts & Low Stock Thresholds */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Spare Parts Inventory</span>
            <button
              onClick={() => onNavigate('stock')}
              className="text-[11px] text-slate-600 hover:text-slate-900 underline flex items-center gap-0.5 cursor-pointer"
            >
              Store Bay <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {scopedStock.length}
            </span>
            <span className="text-xs text-slate-500">parts tracked</span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5">
            {lowStockCount > 0 ? (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockCount} items below threshold
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All stock optimal
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Work Orders & Change Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Maintenance &amp; Change</span>
            <button
              onClick={() => onNavigate('workorders')}
              className="text-[11px] text-slate-600 hover:text-slate-900 underline flex items-center gap-0.5 cursor-pointer"
            >
              Work Orders <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {scopedWorkOrders.length}
            </span>
            <span className="text-xs text-slate-500">active orders</span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5">
            {pendingChangeAlerts.length > 0 ? (
              <span className="text-rose-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingChangeAlerts.length} unauthorized change alerts
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Change detection synchronized
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Plant Infrastructure Grid + Critical Spares Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Plant Status & Isolation Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-600" />
              <span>Plant Network Infrastructure Isolation</span>
            </h2>
            <span className="text-xs text-slate-500">4 Operational Sites</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plants.map((plant) => {
              const plantAssets = assets.filter((a) => a.plantId === plant.id);
              const plantOnline = plantAssets.filter((a) => a.liveStatus === 'Online').length;
              const plantOffline = plantAssets.filter((a) => a.liveStatus === 'Offline').length;

              return (
                <div
                  key={plant.id}
                  className={`bg-white border rounded-xl p-4 transition-all shadow-sm ${
                    selectedPlant === plant.id
                      ? 'border-slate-900 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {plant.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{plant.name}</h3>
                      <p className="text-xs text-slate-500">{plant.city}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {plant.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{plant.siteDescription}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Assets</span>
                      <span className="font-mono font-semibold text-slate-800">{plantAssets.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Racks</span>
                      <span className="font-mono font-semibold text-slate-800">{plant.rackCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Live Agent</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {plantOnline}/{plantAssets.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: High Priority Alerts & Critical Spares Reorder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Spares &amp; Security Alerts</span>
            </h2>
            <span className="text-xs text-slate-500">Live Action Queue</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            {/* Critical Reorder Spares */}
            <div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Critical Spare Reorders</span>
                <span className="text-[10px] font-mono text-rose-600 font-bold">
                  {criticalStockItems.length} Immediate
                </span>
              </div>

              {criticalStockItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No critical spare shortages currently.</p>
              ) : (
                <div className="space-y-2">
                  {criticalStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 flex items-start justify-between gap-2"
                    >
                      <div className="text-xs">
                        <span className="font-mono font-semibold text-slate-900 block">Part #: {item.sku}</span>
                        <span className="text-slate-600 line-clamp-1">{item.name}</span>
                        <div className="text-[11px] text-rose-700 font-medium mt-1">
                          Current Stock: <span className="font-mono font-bold">{item.currentStock}</span> (Min: {item.minThreshold})
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate('stock')}
                        className="text-[11px] font-medium text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded transition-colors whitespace-nowrap shrink-0"
                      >
                        Order
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unauthorized Hardware Changes */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Agent Hardware Alerts</span>
                <span className="text-[10px] font-mono text-amber-600 font-bold">
                  {pendingChangeAlerts.length} Unmatched
                </span>
              </div>

              {pendingChangeAlerts.length === 0 ? (
                <p className="text-xs text-slate-500 py-1">No unauthorized hardware mutations detected.</p>
              ) : (
                <div className="space-y-2">
                  {pendingChangeAlerts.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {(() => {
                            const dev = assets.find((a) => a.id === evt.assetId || a.assetTag === evt.assetTag);
                            return dev ? `Device #${getDeviceNumber(dev, assets)} (SN: ${dev.serialNumber})` : evt.assetTag;
                          })()}
                        </span>
                        <span className="text-[10px] text-amber-800 font-medium">Unlinked Change</span>
                      </div>
                      <p className="text-slate-700 mt-1">
                        {evt.fieldChanged}: {evt.oldValue} &rarr; <span className="font-semibold">{evt.newValue}</span>
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">{formatPKT(evt.timestampUtc)}</span>
                        <button
                          onClick={() => onNavigate('assets')}
                          className="text-[11px] text-slate-900 font-semibold underline cursor-pointer"
                        >
                          Review in Devices
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
