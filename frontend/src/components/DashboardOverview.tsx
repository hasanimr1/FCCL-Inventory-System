import React from 'react';
import {
  Asset,
  Plant,
  StockItem,
  WorkOrder,
  ChangeEvent,
  PlantId,
  PurchaseRequest,
  UserRole,
} from '../types/inventory.ts';
import { formatPKR, formatPKT } from '../utils/inventoryRules.ts';
import { hasPermission } from '../utils/rbac.ts';
import { DeviceStatusDonut } from './DeviceStatusDonut.tsx';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  MonitorDot,
  Plus,
  QrCode,
  ShieldCheck,
  FileText,
  Check,
  X,
  Clock,
  Layers,
  Truck,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Zap,
  Server,
} from 'lucide-react';

interface DashboardOverviewProps {
  plants: Plant[];
  assets: Asset[];
  stockItems: StockItem[];
  workOrders: WorkOrder[];
  changeEvents: ChangeEvent[];
  purchaseRequests?: PurchaseRequest[];
  currentRole?: UserRole;
  selectedPlant: PlantId | 'all';
  onPlantChange: (plant: PlantId | 'all') => void;
  onNavigate: (tab: string) => void;
  onOpenAuditScanner: () => void;
  onOpenNewAssetModal: () => void;
  onApprovePR?: (prId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  plants,
  assets,
  stockItems,
  workOrders,
  changeEvents,
  purchaseRequests = [],
  currentRole = 'Admin',
  selectedPlant,
  onPlantChange,
  onNavigate,
  onOpenAuditScanner,
  onOpenNewAssetModal,
  onApprovePR,
}) => {
  const scopedAssets =
    selectedPlant === 'all' ? assets : assets.filter((asset) => asset.plantId === selectedPlant);
  const scopedStock =
    selectedPlant === 'all' ? stockItems : stockItems.filter((item) => item.plantId === selectedPlant);
  const scopedOrders =
    selectedPlant === 'all' ? workOrders : workOrders.filter((order) => order.plantId === selectedPlant);
  const scopedPRs =
    selectedPlant === 'all'
      ? purchaseRequests
      : purchaseRequests.filter((pr) => pr.plantId === selectedPlant);

  const pendingPRs = scopedPRs.filter((pr) => pr.status === 'Pending Approval');
  const totalValuation = scopedAssets.reduce((sum, asset) => sum + asset.costPKR, 0);
  const onlineCount = scopedAssets.filter((asset) => asset.liveStatus === 'Online').length;
  const offlineCount = scopedAssets.filter((asset) => asset.liveStatus === 'Offline').length;
  const lowStock = scopedStock.filter((item) => item.status !== 'Optimal');
  const criticalStock = scopedStock.filter((item) => item.status === 'Critical Reorder');
  const activePlant = plants.find((plant) => plant.id === selectedPlant);

  const canApprove = hasPermission(currentRole, 'APPROVE_PURCHASE_REQUEST');

  const metricCards = [
    {
      label: 'Asset Book Value',
      value: formatPKR(totalValuation),
      detail: `${scopedAssets.length} registered hardware assets`,
      icon: CircleDollarSign,
      tab: 'assets',
      tint: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      label: 'Infrastructure Live Health',
      value: `${onlineCount} / ${scopedAssets.length}`,
      detail: offlineCount > 0 ? `${offlineCount} device(s) offline` : '100% active check-in',
      icon: MonitorDot,
      tab: 'assets',
      tint: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      label: 'Warehouse Spares & Stock',
      value: `${scopedStock.length} SKUs`,
      detail: lowStock.length > 0 ? `${lowStock.length} below minimum threshold` : 'All inventory healthy',
      icon: Boxes,
      tab: 'stock',
      tint: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      label: 'Procurement & Approvals',
      value: `${pendingPRs.length} Pending PR${pendingPRs.length === 1 ? '' : 's'}`,
      detail: `${scopedOrders.length} active maintenance orders`,
      icon: ShoppingBag,
      tab: 'procurement',
      tint: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* ── 1. Top Executive Banner ─────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#063d2a] via-[#084b34] to-[#0d2a1f] p-5 sm:p-6 text-white shadow-sm border border-[#0b6340]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a7e3bd] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60">
                Fauji Cement Company Limited
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Scope: <strong className="text-white">{activePlant ? activePlant.name : 'All 4 Plants'}</strong>
              </span>
            </div>
            <h1 className="mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight">
              Enterprise Inventory Command Centre
            </h1>
            <p className="mt-1 text-xs text-slate-200 max-w-2xl leading-relaxed">
              Consolidated real-time operational status across FCCL manufacturing plants. Monitor telemetry health, verify warehouse stock, review purchase requisitions, and audit capital equipment.
            </p>
          </div>

          {/* Instant Quick-Action Triggers */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewAssetModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-[#063d2a] shadow-sm transition hover:bg-slate-100 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register Device</span>
            </button>

            <button
              onClick={() => onNavigate('procurement')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer border border-emerald-500/40"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Create Purchase Request</span>
            </button>

            <button
              onClick={onOpenAuditScanner}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5 text-emerald-300" />
              <span>Audit Scan</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Top 4 Core KPI Summary Cards ───────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <button
              key={metric.label}
              onClick={() => onNavigate(metric.tab)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-[#0b7b43] hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {metric.label}
                </span>
                <span className={`rounded-lg p-2 border ${metric.tint}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-black tracking-tight text-slate-900 font-mono">
                {metric.value}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                <span>{metric.detail}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#00783d] transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </section>

      {/* ── 3. Unified Operational Command Center (Zero Hunting, Everything Visible) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8/12): Admin Approvals & All Plants Status */}
        <div className="lg:col-span-8 space-y-5">
          {/* Section A: Purchase Requests & Admin Approval Queue */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-[#00783d]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-sm">
                      Purchase Requests Awaiting Approval
                    </h2>
                    {pendingPRs.length > 0 && (
                      <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold font-mono">
                        {pendingPRs.length} Action Needed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Requisitions submitted by plant engineers routed for administrative review
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('procurement')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#00783d] hover:text-[#063d2a] cursor-pointer"
              >
                <span>Full Procurement Hub</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              {pendingPRs.length === 0 ? (
                <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-[#00783d]" />
                  <p className="mt-1 text-xs font-bold text-slate-800">
                    All Purchase Requests Reviewed
                  </p>
                  <p className="text-[11px] text-slate-500">
                    No requisitions are currently awaiting administrative sign-off for {activePlant ? activePlant.name : 'the selected plant scope'}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPRs.map((pr) => (
                    <div
                      key={pr.id}
                      className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 transition hover:bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-200">
                            {pr.prNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                            {pr.status}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              pr.priority === 'Critical'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {pr.priority}
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900 ml-1">
                            {formatPKR(pr.totalEstimatedCostPKR)}
                          </span>
                        </div>

                        <h3 className="font-bold text-xs text-slate-900">{pr.title}</h3>
                        <p className="text-[11px] text-slate-600">
                          By <strong className="text-slate-800">{pr.requestedBy}</strong> ({pr.department}) · {pr.items.length} line item(s)
                        </p>
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          &quot;{pr.justification}&quot;
                        </p>
                      </div>

                      {/* Instant 1-Click Action Buttons right in front of Admin */}
                      <div className="flex items-center gap-2 shrink-0">
                        {canApprove ? (
                          <>
                            <button
                              onClick={() =>
                                onApprovePR &&
                                onApprovePR(pr.id, 'Rejected', 'Rejected by Admin via Dashboard')
                              }
                              className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                              title="Reject request"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() =>
                                onApprovePR &&
                                onApprovePR(
                                  pr.id,
                                  'Approved',
                                  'Approved by Admin via Dashboard Action Center'
                                )
                              }
                              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
                              title="Approve request to allow PO generation"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve PR</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                            Admin Approval Required
                          </span>
                        )}

                        <button
                          onClick={() => onNavigate('procurement')}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section B: All 4 Manufacturing Plants At-A-Glance (1-Click Filtering) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">
                    Plant Sites &amp; Facilities (Click to Switch Scope)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Direct access to site telemetry, registered assets, and server racks
                  </p>
                </div>
              </div>

              {selectedPlant !== 'all' && (
                <button
                  onClick={() => onPlantChange('all')}
                  className="text-xs font-bold text-[#00783d] hover:underline cursor-pointer"
                >
                  Reset to All Plants
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plants.map((plant) => {
                const plantAssets = assets.filter((asset) => asset.plantId === plant.id);
                const plantOnline = plantAssets.filter((asset) => asset.liveStatus === 'Online').length;
                const isSelected = selectedPlant === plant.id;

                return (
                  <div
                    key={plant.id}
                    onClick={() => onPlantChange(plant.id)}
                    className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00783d] bg-emerald-50/70 ring-1 ring-[#00783d]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 border border-slate-200">
                            {plant.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{plant.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{plant.city}</p>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          plant.status === 'Operational'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {plant.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
                      <div>
                        <span className="block text-[10px] uppercase text-slate-400 font-semibold">
                          Assets
                        </span>
                        <span className="font-mono font-bold text-slate-800">{plantAssets.length}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase text-slate-400 font-semibold">
                          Online
                        </span>
                        <span className="font-mono font-bold text-emerald-700">{plantOnline}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase text-slate-400 font-semibold">
                          Racks
                        </span>
                        <span className="font-mono font-bold text-slate-800">{plant.rackCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column (4/12): Infrastructure Telemetry & Quick Action Hub */}
        <div className="lg:col-span-4 space-y-5">
          {/* Live Device Health Donut */}
          <section className="rounded-2xl bg-[#0f172a] p-5 text-white shadow-sm border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MonitorDot className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Live Telemetry Ring</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <DeviceStatusDonut
                online={onlineCount}
                offline={offlineCount}
                total={scopedAssets.length}
                size={140}
              />

              <div className="mt-3 w-full grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/80 text-center text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400">Online</span>
                  <span className="font-mono font-bold text-emerald-400">{onlineCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Offline</span>
                  <span className="font-mono font-bold text-orange-400">{offlineCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Total</span>
                  <span className="font-mono font-bold text-slate-200">{scopedAssets.length}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Urgent Alerts / Low Stock & Spares */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Inventory Alerts</h2>
              </div>
              <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold font-mono">
                {lowStock.length} items
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {lowStock.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('stock')}
                  className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Stock: <strong className="text-amber-900 font-mono">{item.currentStock}</strong> / Min: {item.minThreshold}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                    {item.status}
                  </span>
                </div>
              ))}

              {lowStock.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-500">
                  All spare parts are above replenishment thresholds.
                </div>
              )}
            </div>
          </section>

          {/* Module Direct Launchpad */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Direct Module Launchpad
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('assets')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0b6340] hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer transition"
              >
                <Server className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold text-slate-800">Devices</span>
              </button>

              <button
                onClick={() => onNavigate('stock')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0b6340] hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer transition"
              >
                <Boxes className="w-4 h-4 text-amber-700" />
                <span className="font-semibold text-slate-800">Parts &amp; Spares</span>
              </button>

              <button
                onClick={() => onNavigate('procurement')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0b6340] hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer transition"
              >
                <ShoppingBag className="w-4 h-4 text-blue-700" />
                <span className="font-semibold text-slate-800">PR &amp; PO</span>
              </button>

              <button
                onClick={() => onNavigate('racks')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0b6340] hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer transition"
              >
                <Layers className="w-4 h-4 text-purple-700" />
                <span className="font-semibold text-slate-800">Datacenter Racks</span>
              </button>

              <button
                onClick={() => onNavigate('workorders')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0b6340] hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer transition"
              >
                <ClipboardList className="w-4 h-4 text-rose-700" />
                <span className="font-semibold text-slate-800">Work Orders</span>
              </button>

              <button
                onClick={() => onNavigate('suppliers')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0b6340] hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer transition"
              >
                <Truck className="w-4 h-4 text-teal-700" />
                <span className="font-semibold text-slate-800">Suppliers</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
