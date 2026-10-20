import React, { useState } from 'react';
import {
  Asset,
  AuditFinding,
  Plant,
  PlantId,
  AssetLifecycleStatus,
} from '../types/inventory.ts';
import { formatPKT, getDeviceNumber } from '../utils/inventoryRules.ts';
import {
  QrCode,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Building,
  RotateCcw,
  X,
  MapPin,
  ClipboardCheck,
} from 'lucide-react';

interface PhysicalAuditScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  plants: Plant[];
  auditFindings: AuditFinding[];
  onRecordFinding: (finding: Omit<AuditFinding, 'id' | 'scannedAt'>) => void;
  onVerifyAndCorrect: (findingId: string) => void;
}

export const PhysicalAuditScannerModal: React.FC<PhysicalAuditScannerModalProps> = ({
  isOpen,
  onClose,
  assets,
  plants,
  auditFindings,
  onRecordFinding,
  onVerifyAndCorrect,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'scan' | 'findings'>('scan');
  const [selectedTag, setSelectedTag] = useState<string>(assets[0]?.assetTag || '');
  const [observedLocation, setObservedLocation] = useState<string>('Store & Spare Receiving Bay');
  const [observedStatus, setObservedStatus] = useState<AssetLifecycleStatus>('In Use');
  const [lastScanResult, setLastScanResult] = useState<{
    matched: boolean;
    tag: string;
    details: string;
  } | null>(null);

  const matchedAsset = assets.find((a) => a.assetTag === selectedTag);

  const handleExecuteScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedAsset) {
      // Unregistered asset
      onRecordFinding({
        sessionId: 'AUD-HTR-2026-Q3',
        assetTag: selectedTag,
        plantId: 'plant-1',
        expectedLocation: 'Unknown',
        scannedLocation: observedLocation,
        expectedStatus: 'Spare',
        scannedStatus: observedStatus,
        discrepancyType: 'Unregistered Asset',
        resolutionStatus: 'Pending Review',
        notes: 'Tag scanned during plant floor walk-through not present in master inventory.',
      });
      setLastScanResult({
        matched: false,
        tag: selectedTag,
        details: 'Unregistered tag! Finding recorded for Plant Administrator audit review.',
      });
      return;
    }

    const isLocationMismatch = matchedAsset.locationRoom.trim().toLowerCase() !== observedLocation.trim().toLowerCase();
    const isStatusMismatch = matchedAsset.status !== observedStatus;

    if (!isLocationMismatch && !isStatusMismatch) {
      setLastScanResult({
        matched: true,
        tag: matchedAsset.assetTag,
        details: `100% Physical Match confirmed at ${matchedAsset.locationRoom}. Asset record marked verified.`,
      });
    } else {
      const discrepancy = isLocationMismatch ? 'Location Mismatch' : 'Status Mismatch';
      onRecordFinding({
        sessionId: 'AUD-HTR-2026-Q3',
        assetTag: matchedAsset.assetTag,
        plantId: matchedAsset.plantId,
        expectedLocation: matchedAsset.locationRoom,
        scannedLocation: observedLocation,
        expectedStatus: matchedAsset.status,
        scannedStatus: observedStatus,
        discrepancyType: discrepancy,
        resolutionStatus: 'Pending Review',
        notes: `Physical walk-through discrepancy: expected [${matchedAsset.locationRoom} / ${matchedAsset.status}], scanned [${observedLocation} / ${observedStatus}].`,
      });

      setLastScanResult({
        matched: false,
        tag: matchedAsset.assetTag,
        details: `Discrepancy logged: ${discrepancy}. Finding created for Plant Admin review without silent database overwrite.`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Scan className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Mobile QR Physical Audit Terminal
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              html5-qrcode simulation for plant floor walk-through inspections (Section 10.1).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Scan vs Discrepancies */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'scan' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Simulate Barcode Scan</span>
          </button>
          <button
            onClick={() => setActiveTab('findings')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'findings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Audit Findings ({auditFindings.length})</span>
          </button>
        </div>

        {activeTab === 'scan' ? (
          <div className="space-y-4">
            {/* Viewfinder simulation */}
            <div className="relative bg-slate-950 rounded-xl p-6 text-center text-white border border-slate-800">
              <div className="w-40 h-40 mx-auto border-2 border-emerald-400 border-dashed rounded-lg flex flex-col items-center justify-center p-4 relative">
                <QrCode className="w-16 h-16 text-slate-600 mb-2" />
                <span className="text-[10px] font-mono text-emerald-400">READY TO SCAN</span>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_#34d399]" />
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Align laser or camera viewfinder over asset barcode label (e.g. AST-PC-01204)
              </p>
            </div>

            {/* Scan form simulation */}
            <form onSubmit={handleExecuteScan} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-40 shrink-0">
                  Scanned Barcode / Serial
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => {
                    setSelectedTag(e.target.value);
                    const a = assets.find((x) => x.assetTag === e.target.value);
                    if (a) {
                      setObservedLocation(a.locationRoom);
                      setObservedStatus(a.status);
                    }
                  }}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-medium text-xs bg-white"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.assetTag}>
                      Device #{getDeviceNumber(a, assets)} — {a.model} (SN: {a.serialNumber})
                    </option>
                  ))}
                  <option value="AST-ROGUE-99999">[Test Unregistered Serial Number]</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-40 shrink-0">
                  Observed Physical Room
                </label>
                <input
                  type="text"
                  value={observedLocation}
                  onChange={(e) => setObservedLocation(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-40 shrink-0">
                  Observed Physical Status
                </label>
                <select
                  value={observedStatus}
                  onChange={(e) => setObservedStatus(e.target.value as AssetLifecycleStatus)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                >
                  <option value="In Use">In Use</option>
                  <option value="Spare">Spare</option>
                  <option value="In Repair">In Repair</option>
                  <option value="Decommissioned">Decommissioned</option>
                  <option value="Scrapped">Scrapped</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Record Audit Verification
                </button>
              </div>
            </form>

            {/* Scan Feedback Banner */}
            {lastScanResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  lastScanResult.matched
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {lastScanResult.matched ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {lastScanResult.matched ? 'Physical Verification Confirmed' : 'Audit Discrepancy Logged'}
                  </div>
                  <p className="mt-0.5 text-[11px]">{lastScanResult.details}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Discrepancies Review List */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Plant Admin Discrepancy Review Queue</span>
              <span>Section 10.1 Workflow</span>
            </div>

            {auditFindings.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No audit discrepancies recorded.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {auditFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {(() => {
                          const dev = assets.find((a) => a.assetTag === finding.assetTag);
                          return dev ? `Device #${getDeviceNumber(dev, assets)} (SN: ${dev.serialNumber})` : `Serial: ${finding.assetTag}`;
                        })()}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                        {finding.discrepancyType}
                      </span>
                    </div>

                    <div className="text-slate-600 text-[11px]">
                      Expected: <strong className="text-slate-800">{finding.expectedLocation}</strong> ({finding.expectedStatus}) &rarr;
                      Scanned: <strong className="text-slate-800">{finding.scannedLocation}</strong> ({finding.scannedStatus})
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-400">{formatPKT(finding.scannedAt)}</span>
                      {finding.resolutionStatus === 'Pending Review' ? (
                        <button
                          onClick={() => onVerifyAndCorrect(finding.id)}
                          className="text-[11px] font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 px-2.5 py-0.5 rounded transition-colors"
                        >
                          Approve Correction
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
