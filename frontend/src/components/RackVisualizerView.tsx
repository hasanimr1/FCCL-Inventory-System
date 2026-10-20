import React, { useState } from 'react';
import {
  Asset,
  Plant,
  PlantId,
  Rack,
} from '../types/inventory.ts';
import { checkRackCollision, formatPKR, getDeviceNumber } from '../utils/inventoryRules.ts';
import {
  Layers,
  Server,
  Zap,
  Weight,
  ShieldAlert,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface RackVisualizerViewProps {
  racks: Rack[];
  assets: Asset[];
  plants: Plant[];
  selectedPlant: PlantId | 'all';
  onInspectAsset: (asset: Asset) => void;
}

export const RackVisualizerView: React.FC<RackVisualizerViewProps> = ({
  racks,
  assets,
  plants,
  selectedPlant,
  onInspectAsset,
}) => {
  const scopedRacks = racks.filter((r) => {
    if (selectedPlant !== 'all' && r.plantId !== selectedPlant) return false;
    return true;
  });

  const [activeRackId, setActiveRackId] = useState<string>(scopedRacks[0]?.id || racks[0]?.id || '');
  const [activeFace, setActiveFace] = useState<'front' | 'rear'>('front');

  const currentRack = racks.find((r) => r.id === activeRackId) || racks[0];
  const rackAssets = assets.filter((a) => a.rackId === currentRack?.id && (a.rackFace || 'front') === activeFace);

  // Compute total power and weight in rack
  const totalPowerWatts = rackAssets.reduce(
    (acc, curr) => acc + (curr.customSpecs.powerDrawWatts || 250),
    0
  );
  const totalWeightKg = rackAssets.reduce(
    (acc, curr) => acc + (curr.customSpecs.weightKg || 15),
    0
  );

  const powerPct = Math.min(100, Math.round((totalPowerWatts / (currentRack?.maxPowerWatts || 8000)) * 100));
  const weightPct = Math.min(100, Math.round((totalWeightKg / (currentRack?.maxWeightKg || 900)) * 100));

  // Build 42U or 48U slot mapping
  const uSlots: number[] = [];
  const maxU = currentRack?.uHeight || 42;
  for (let u = maxU; u >= 1; u--) {
    uSlots.push(u);
  }

  // Find asset occupying a given U
  const getAssetAtU = (u: number): Asset | undefined => {
    return rackAssets.find((a) => {
      const start = a.rackUnitStart || 1;
      const height = a.rackUnitHeight || 1;
      return u >= start && u < start + height;
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Datacenter Infrastructure</span>
            <span aria-hidden="true">·</span>
            <span>Physical Elevation Layout</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            42U / 48U Interactive Rack Visualizer
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Visual rack elevation mapping front and rear equipment faces, occupied U-positions, real-time power draw, and collision prevention.
          </p>
        </div>

        {/* Rack Selector & Face Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeRackId}
            onChange={(e) => setActiveRackId(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none"
          >
            {scopedRacks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.uHeight}U)
              </option>
            ))}
          </select>

          {/* Front / Rear Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setActiveFace('front')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeFace === 'front'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Face
            </button>
            <button
              onClick={() => setActiveFace('rear')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeFace === 'rear'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rear Face
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Rack Specs + Visual Elevation Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Rack Telemetry & Capacity */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {currentRack.plantId}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{currentRack.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{currentRack.locationRoom}</p>
            </div>

            {/* Power Load Gauge */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Power Load
                </span>
                <span className="font-mono text-slate-900">
                  {totalPowerWatts}W / {currentRack.maxPowerWatts}W ({powerPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    powerPct > 85 ? 'bg-rose-500' : powerPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${powerPct}%` }}
                />
              </div>
            </div>

            {/* Weight Load Gauge */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-600 flex items-center gap-1">
                  <Weight className="w-3.5 h-3.5 text-slate-500" /> Structural Weight
                </span>
                <span className="font-mono text-slate-900">
                  {totalWeightKg.toFixed(1)}kg / {currentRack.maxWeightKg}kg ({weightPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    weightPct > 85 ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                  style={{ width: `${weightPct}%` }}
                />
              </div>
            </div>

            {/* Occupancy Summary */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mounted Assets</span>
                <span className="font-mono font-bold text-slate-900 text-base">{rackAssets.length}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total U-Height</span>
                <span className="font-mono font-bold text-slate-900 text-base">{currentRack.uHeight}U</span>
              </div>
            </div>

            {/* Collision Validation Note */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Collision Prevention Active
              </div>
              <p className="text-[11px] text-emerald-700">
                Fractional U logic prevents dual-device overlapping on the same face.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Interactive 42U Elevation Diagram */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-300 text-xs pb-3 border-b border-slate-800">
              <span className="font-mono font-semibold uppercase tracking-wider">
                Elevation: {currentRack.name} ({activeFace.toUpperCase()})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Units 1 to {maxU} · Standard 19" EIA-310 Enclosure
              </span>
            </div>

            {/* Rack Cabinet Frame */}
            <div className="mt-4 border-2 border-slate-700 rounded-lg p-2 bg-slate-950 max-h-[680px] overflow-y-auto space-y-0.5">
              {uSlots.map((u) => {
                const asset = getAssetAtU(u);
                const isStartU = asset && asset.rackUnitStart === u;
                const isInsideAsset = asset && asset.rackUnitStart !== u;

                // If this slot is inside an asset that started higher up, don't duplicate render if we render the block
                if (isInsideAsset) {
                  return null; // The start U rendered the multi-U block
                }

                if (isStartU) {
                  const height = asset.rackUnitHeight || 1;
                  const pixelHeight = Math.max(34, height * 34);

                  return (
                    <div
                      key={`u-${u}`}
                      onClick={() => onInspectAsset(asset)}
                      style={{ minHeight: `${pixelHeight}px` }}
                      className="rounded border border-slate-600 bg-slate-800/90 hover:bg-slate-800 cursor-pointer p-2 flex items-center justify-between text-xs transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] font-bold text-amber-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                          U{u}{height > 1 ? `-U${u + height - 1}` : ''}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs bg-slate-900 px-1.5 py-0.5 rounded">
                              Device #{getDeviceNumber(asset, assets)}
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium">{asset.model}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SN: {asset.serialNumber} · {asset.category} · {asset.customSpecs.powerDrawWatts || 250}W
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {asset.liveStatus === 'Online' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ONLINE
                          </span>
                        ) : asset.liveStatus === 'Offline' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            OFFLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            STANDBY
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatPKR(asset.costPKR)}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Empty U slot
                return (
                  <div
                    key={`u-${u}`}
                    className="h-7 border border-dashed border-slate-800 rounded bg-slate-900/30 hover:bg-slate-800/20 px-2 flex items-center justify-between text-[11px] text-slate-500"
                  >
                    <span className="font-mono text-[10px] text-slate-600">U{u}</span>
                    <span className="text-[10px] text-slate-600 italic">Available Slot</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
