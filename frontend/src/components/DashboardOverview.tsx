import React from 'react';
import { Asset, Plant, StockItem, WorkOrder, ChangeEvent, PlantId } from '../types/inventory.ts';
import { formatPKR, formatPKT } from '../utils/inventoryRules.ts';
import {
  Activity, AlertTriangle, ArrowRight, Boxes, Building2, CheckCircle2,
  CircleDollarSign, ClipboardList, MonitorDot, Plus, QrCode, ShieldCheck,
} from 'lucide-react';

interface DashboardOverviewProps {
  plants: Plant[];
  assets: Asset[];
  stockItems: StockItem[];
  workOrders: WorkOrder[];
  changeEvents: ChangeEvent[];
  selectedPlant: PlantId | 'all';
  onPlantChange: (plant: PlantId | 'all') => void;
  onNavigate: (tab: string) => void;
  onOpenAuditScanner: () => void;
  onOpenNewAssetModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  plants, assets, stockItems, workOrders, changeEvents, selectedPlant,
  onPlantChange, onNavigate, onOpenAuditScanner, onOpenNewAssetModal,
}) => {
  const scopedAssets = selectedPlant === 'all' ? assets : assets.filter((asset) => asset.plantId === selectedPlant);
  const scopedStock = selectedPlant === 'all' ? stockItems : stockItems.filter((item) => item.plantId === selectedPlant);
  const scopedOrders = selectedPlant === 'all' ? workOrders : workOrders.filter((order) => order.plantId === selectedPlant);
  const scopedChanges = selectedPlant === 'all' ? changeEvents : changeEvents.filter((event) => event.plantId === selectedPlant);
  const totalValuation = scopedAssets.reduce((sum, asset) => sum + asset.costPKR, 0);
  const onlineCount = scopedAssets.filter((asset) => asset.liveStatus === 'Online').length;
  const offlineCount = scopedAssets.filter((asset) => asset.liveStatus === 'Offline').length;
  const lowStock = scopedStock.filter((item) => item.status !== 'Optimal');
  const criticalStock = scopedStock.filter((item) => item.status === 'Critical Reorder');
  const pendingChanges = scopedChanges.filter((event) => !event.isAuthorized);
  const activePlant = plants.find((plant) => plant.id === selectedPlant);

  const metricCards = [
    { label: 'Asset book value', value: formatPKR(totalValuation), detail: `${scopedAssets.length} registered assets`, icon: CircleDollarSign, tab: 'assets', tint: 'bg-[#e7f4ec] text-[#00783d]' },
    { label: 'Device live status', value: `${onlineCount} / ${scopedAssets.length}`, detail: `${offlineCount} need attention`, icon: MonitorDot, tab: 'assets', tint: 'bg-[#e8f0f4] text-[#15536d]' },
    { label: 'Spare parts inventory', value: `${scopedStock.length}`, detail: lowStock.length ? `${lowStock.length} below threshold` : 'All stock is healthy', icon: Boxes, tab: 'stock', tint: 'bg-[#fff4df] text-[#a76600]' },
    { label: 'Open work orders', value: `${scopedOrders.length}`, detail: pendingChanges.length ? `${pendingChanges.length} change review${pendingChanges.length > 1 ? 's' : ''}` : 'No unmatched changes', icon: ClipboardList, tab: 'workorders', tint: 'bg-[#f9e9e9] text-[#a22e2e]' },
  ];

  return (
    <div className="space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#063d2a] px-5 py-6 text-white shadow-sm sm:px-7">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-[#08783e]/45" />
        <div className="absolute right-20 bottom-0 h-20 w-44 bg-[#b62a2c] opacity-90 [clip-path:polygon(24%_0,100%_0,76%_100%,0_100%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a7e3bd]">Fauji Cement Company Limited</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Inventory command centre</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
              {activePlant ? `${activePlant.name}, ${activePlant.city}` : 'A consolidated view of operations across FCCL facilities'} — live device health, asset value and store readiness.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onOpenNewAssetModal} className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-[#063d2a] transition hover:bg-[#e7f4ec] cursor-pointer"><Plus className="h-4 w-4" /> Register device</button>
            <button onClick={onOpenAuditScanner} className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20 cursor-pointer"><QrCode className="h-4 w-4" /> Audit scan</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return <button key={metric.label} onClick={() => onNavigate(metric.tab)} className="group rounded-xl border border-[#dce7df] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0b7b43] hover:shadow-md cursor-pointer">
            <div className="flex items-start justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</span><span className={`rounded-lg p-2 ${metric.tint}`}><Icon className="h-4 w-4" /></span></div>
            <p className="mt-4 text-2xl font-bold tracking-tight text-[#173426]">{metric.value}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500"><span>{metric.detail}</span><ArrowRight className="h-4 w-4 text-[#00783d] transition group-hover:translate-x-1" /></div>
          </button>;
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-[#dce7df] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#00783d]" /><h2 className="font-bold text-[#173426]">Plant portfolio</h2></div><p className="mt-1 text-xs text-slate-500">Choose a plant to focus every view on that site.</p></div>
            <button onClick={() => onPlantChange('all')} className="text-xs font-semibold text-[#00783d] hover:text-[#063d2a] cursor-pointer">View all plants</button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {plants.map((plant) => {
              const plantAssets = assets.filter((asset) => asset.plantId === plant.id);
              const plantOnline = plantAssets.filter((asset) => asset.liveStatus === 'Online').length;
              const isSelected = selectedPlant === plant.id;
              return <button key={plant.id} onClick={() => onPlantChange(plant.id)} className={`group rounded-xl border p-4 text-left transition cursor-pointer ${isSelected ? 'border-[#00783d] bg-[#edf8f0] ring-1 ring-[#00783d]/20' : 'border-slate-200 hover:border-[#0b7b43] hover:bg-[#f7fbf8]'}`}>
                <div className="flex items-start justify-between gap-3"><div><span className="rounded bg-[#e7f4ec] px-2 py-1 font-mono text-[10px] font-bold text-[#00783d]">{plant.code}</span><h3 className="mt-2 text-sm font-bold text-[#173426]">{plant.name}</h3><p className="text-xs text-slate-500">{plant.city}</p></div><ArrowRight className={`h-4 w-4 text-[#00783d] transition ${isSelected ? 'translate-x-1' : 'group-hover:translate-x-1'}`} /></div>
                <div className="mt-4 grid grid-cols-3 border-t border-[#dce7df] pt-3 text-center"><div><span className="block text-[10px] uppercase text-slate-400">Assets</span><span className="text-sm font-bold text-[#173426]">{plantAssets.length}</span></div><div><span className="block text-[10px] uppercase text-slate-400">Online</span><span className="text-sm font-bold text-[#00783d]">{plantOnline}</span></div><div><span className="block text-[10px] uppercase text-slate-400">Racks</span><span className="text-sm font-bold text-[#173426]">{plant.rackCount}</span></div></div>
              </button>;
            })}
          </div>
        </div>

        <aside className="rounded-2xl border border-[#dce7df] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#b62a2c]" /><h2 className="font-bold text-[#173426]">Priority queue</h2></div><span className="rounded-full bg-[#f9e9e9] px-2 py-0.5 text-[10px] font-bold text-[#a22e2e]">{criticalStock.length + pendingChanges.length} items</span></div>
          <div className="mt-4 space-y-3">
            {criticalStock.slice(0, 2).map((item) => <button key={item.id} onClick={() => onNavigate('stock')} className="w-full rounded-lg border border-[#f1d3d3] bg-[#fffafa] p-3 text-left transition hover:border-[#b62a2c] cursor-pointer"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#173426]">{item.name}</span><Boxes className="h-4 w-4 text-[#b62a2c]" /></div><p className="mt-1 text-xs text-slate-500">{item.currentStock} on hand · minimum {item.minThreshold}</p></button>)}
            {pendingChanges.slice(0, 2).map((event) => <button key={event.id} onClick={() => onNavigate('assets')} className="w-full rounded-lg border border-[#f3e3bd] bg-[#fffdf6] p-3 text-left transition hover:border-[#c0841a] cursor-pointer"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#173426]">Unmatched device change</span><Activity className="h-4 w-4 text-[#a76600]" /></div><p className="mt-1 line-clamp-1 text-xs text-slate-500">{event.fieldChanged}: {event.oldValue} → {event.newValue}</p></button>)}
            {!criticalStock.length && !pendingChanges.length && <div className="rounded-lg bg-[#edf8f0] p-4 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-[#00783d]" /><p className="mt-2 text-xs font-semibold text-[#173426]">No critical actions</p><p className="mt-1 text-xs text-slate-500">Inventory and change controls are current.</p></div>}
          </div>
          <button onClick={() => onNavigate(criticalStock.length ? 'stock' : 'assets')} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#00783d] hover:text-[#063d2a] cursor-pointer">Open relevant workspace <ArrowRight className="h-4 w-4" /></button>
        </aside>
      </section>

      <section className="rounded-xl border border-[#dce7df] bg-white px-5 py-4 shadow-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-[#00783d]" /><span>Data scope: <strong className="text-[#173426]">{activePlant ? activePlant.name : 'All FCCL plants'}</strong></span></div><div className="text-xs text-slate-500">Latest activity: {scopedChanges[0] ? formatPKT(scopedChanges[0].timestampUtc) : 'No recent changes'}</div></div></section>
    </div>
  );
};
