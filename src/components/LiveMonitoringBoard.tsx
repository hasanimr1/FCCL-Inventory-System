import React, { useState } from 'react';
import {
  Asset,
  ChangeEvent,
  Plant,
  PlantId,
  WorkOrder,
} from '../types/inventory.ts';
import { formatPKT, formatPKR } from '../utils/inventoryRules.ts';
import {
  Radio,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCw,
  Zap,
  Server,
  Laptop,
  Monitor,
} from 'lucide-react';

interface LiveMonitoringBoardProps {
  assets: Asset[];
  plants: Plant[];
  changeEvents: ChangeEvent[];
  workOrders: WorkOrder[];
  selectedPlant: PlantId | 'all';
  onSimulateHeartbeat: (assetId: string) => void;
  onSimulateDisconnect: (assetId: string) => void;
  onSimulateHardwareChange: (assetId: string, field: string, oldValue: string, newValue: string) => void;
}

export const LiveMonitoringBoard: React.FC<LiveMonitoringBoardProps> = ({
  assets,
  plants,
  changeEvents,
  workOrders,
  selectedPlant,
  onSimulateHeartbeat,
  onSimulateDisconnect,
  onSimulateHardwareChange,
}) => {
  const [targetAssetId, setTargetAssetId] = useState<string>(assets[0]?.id || '');
  const [mutationType, setMutationType] = useState<'ram' | 'storage' | 'cpu'>('ram');
  const [filterState, setFilterState] = useState<'all' | 'Online' | 'Offline' | 'Unknown'>('all');

  const scopedAssets = assets.filter((a) => {
    if (selectedPlant !== 'all' && a.plantId !== selectedPlant) return false;
    if (filterState !== 'all' && a.liveStatus !== filterState) return false;
    return true;
  });

  const onlineAssets = scopedAssets.filter((a) => a.liveStatus === 'Online');
  const offlineAssets = scopedAssets.filter((a) => a.liveStatus === 'Offline');
  const unknownAssets = scopedAssets.filter((a) => a.liveStatus === 'Unknown');

  const selectedAsset = assets.find((a) => a.id === targetAssetId) || assets[0];

  const handleTriggerMutation = () => {
    if (!selectedAsset) return;
    if (mutationType === 'ram') {
      const currentRam = selectedAsset.customSpecs.ramGb || 16;
      const newRam = currentRam * 2;
      onSimulateHardwareChange(
        selectedAsset.id,
        'RAM Capacity',
        `${currentRam} GB`,
        `${newRam} GB`
      );
    } else if (mutationType === 'storage') {
      const currentStorage = selectedAsset.customSpecs.storageGb || 512;
      const newStorage = currentStorage + 512;
      onSimulateHardwareChange(
        selectedAsset.id,
        'Storage Capacity',
        `${currentStorage} GB`,
        `${newStorage} GB`
      );
    } else {
      onSimulateHardwareChange(
        selectedAsset.id,
        'CPU Model',
        selectedAsset.customSpecs.cpu || 'Intel Core i5',
        'Intel Core i9-13900 (Upgraded)'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Agent Telemetry &amp; Real-Time Socket Gateway</span>
            <span aria-hidden="true">·</span>
            <span>Go Background Daemon v1.4</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Live Device Telemetry &amp; Change Detection Board
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Real-time status board tracking 60-second PC and server heartbeats. Automatically classifies Online (&lt;3 min), Offline (&gt;3 min), and flags unauthorized hardware changes.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start md:self-auto">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterState === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({scopedAssets.length})
          </button>
          <button
            onClick={() => setFilterState('Online')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              filterState === 'Online' ? 'bg-white text-emerald-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Online ({onlineAssets.length})
          </button>
          <button
            onClick={() => setFilterState('Offline')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              filterState === 'Offline' ? 'bg-white text-amber-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Offline ({offlineAssets.length})
          </button>
          <button
            onClick={() => setFilterState('Unknown')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              filterState === 'Unknown' ? 'bg-white text-slate-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Unknown ({unknownAssets.length})
          </button>
        </div>
      </div>

      {/* Interactive Simulator Control Station */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Go Agent Telemetry &amp; Mutation Test Station
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Interactive Test Console for Evaluators
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Target Asset Selector */}
          <div className="md:col-span-5">
            <label className="block text-xs text-slate-300 font-medium mb-1.5">
              Select Device to Test Agent Ingestion
            </label>
            <select
              value={targetAssetId}
              onChange={(e) => setTargetAssetId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-100 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.liveStatus}] {a.assetTag} — {a.model} ({a.category})
                </option>
              ))}
            </select>
          </div>

          {/* Action 1: Force Heartbeat */}
          <div className="md:col-span-3">
            <button
              onClick={() => onSimulateHeartbeat(targetAssetId)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Send Heartbeat (Online)</span>
            </button>
          </div>

          {/* Action 2: Force Disconnect */}
          <div className="md:col-span-4">
            <button
              onClick={() => onSimulateDisconnect(targetAssetId)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Power Off (Offline)</span>
            </button>
          </div>
        </div>

        {/* Hardware Change Simulation Trigger */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 whitespace-nowrap">Hardware Mutation:</span>
            <select
              value={mutationType}
              onChange={(e) => setMutationType(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ram">RAM Upgrade (e.g. 16GB &rarr; 32GB)</option>
              <option value="storage">Storage Disk Expansion (+512GB NVMe)</option>
              <option value="cpu">Processor Swap (Core i5 &rarr; Core i9)</option>
            </select>
          </div>

          <button
            onClick={handleTriggerMutation}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Simulate Hardware Mutation &amp; Run Detection</span>
          </button>
        </div>
      </div>

      {/* Monitored Devices Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            <span>Real-Time Fleet Status Matrix</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Showing {scopedAssets.length} Monitored Endpoints
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scopedAssets.map((asset) => {
            const isOnline = asset.liveStatus === 'Online';
            const isOffline = asset.liveStatus === 'Offline';
            const plant = plants.find((p) => p.id === asset.plantId);

            return (
              <div
                key={asset.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {asset.assetTag}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {plant?.code}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800 line-clamp-1 mt-0.5">
                        {asset.model}
                      </span>
                    </div>

                    {/* Live status badge */}
                    <div className="flex items-center gap-1">
                      {isOnline && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE
                        </span>
                      )}
                      {isOffline && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          OFFLINE
                        </span>
                      )}
                      {!isOnline && !isOffline && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          UNKNOWN
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Room / Location:</span>
                      <span className="font-medium text-slate-800">{asset.locationRoom}</span>
                    </div>
                    {asset.customSpecs.ipAddress && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">IP Address:</span>
                        <span className="font-mono text-slate-700">{asset.customSpecs.ipAddress}</span>
                      </div>
                    )}
                    {asset.customSpecs.ramGb && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Hardware Baseline:</span>
                        <span className="font-mono text-slate-800">
                          {asset.customSpecs.ramGb}GB RAM · {asset.customSpecs.storageGb || 512}GB SSD
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Last Seen: <span className="font-mono text-slate-600">{formatPKT(asset.lastHeartbeatUtc)}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSimulateHeartbeat(asset.id)}
                      title="Ingest heartbeat now"
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Events & Work Order Correlation Log */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Hardware Change Detection &amp; Work Order Matching Audit
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {changeEvents.length} Recorded Mutated Observations
          </span>
        </div>

        {changeEvents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No hardware mutations reported yet.</p>
        ) : (
          <div className="space-y-2.5">
            {changeEvents.map((evt) => {
              const matchedOrder = workOrders.find((w) => w.id === evt.matchedWorkOrderId);

              return (
                <div
                  key={evt.id}
                  className={`p-3.5 rounded-lg border text-xs ${
                    evt.isAuthorized
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-amber-200 bg-amber-50/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {evt.assetTag}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {evt.fieldChanged}: {evt.oldValue} &rarr; <span className="text-slate-950 font-bold">{evt.newValue}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.isAuthorized ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Authorized Change
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3 text-rose-700" />
                          Unauthorized Mutation Alert
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    <span>
                      Observed at: <strong className="font-mono text-slate-700">{formatPKT(evt.timestampUtc)}</strong>
                    </span>
                    {evt.isAuthorized && matchedOrder && (
                      <span>
                        Linked Work Order: <strong className="font-mono text-slate-800">{matchedOrder.workOrderNumber}</strong> ({matchedOrder.title})
                      </span>
                    )}
                    {evt.technicianAttributed && (
                      <span>
                        Attributed Technician: <strong className="text-slate-800">{evt.technicianAttributed}</strong>
                      </span>
                    )}
                    {!evt.isAuthorized && (
                      <span className="text-rose-700 font-medium">
                        Flagged to Plant Administrator: Investigation required.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
