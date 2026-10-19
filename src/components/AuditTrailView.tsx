import React, { useState } from 'react';
import { AuditLog } from '../types/inventory.ts';
import { formatPKT, verifyAuditHashChain } from '../utils/inventoryRules.ts';
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AuditTrailViewProps {
  auditLogs: AuditLog[];
  onSimulateTamper: () => void;
  onRestoreChain: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditLogs,
  onSimulateTamper,
  onRestoreChain,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const verificationResult = verifyAuditHashChain(auditLogs);

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q) ||
      log.recordHash.toLowerCase().includes(q) ||
      log.changesSummary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Cryptographic Security &amp; Compliance</span>
            <span aria-hidden="true">·</span>
            <span>Section 11 Append-Only Ledger</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Tamper-Evident Hash-Chained Audit Trail
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Append-only record of every create, update, assignment, and decommissioning action with cryptographic previous-block hash linkage.
          </p>
        </div>

        {/* Cryptographic Verification Status Banner */}
        <div className="flex items-center gap-2">
          {verificationResult.isValid ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Chain Integrity: 100% Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Tampering Detected at Block #{verificationResult.brokenAtSequence}</span>
            </div>
          )}

          {verificationResult.isValid ? (
            <button
              onClick={onSimulateTamper}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Test tamper detection by injecting an unauthorized mutation into block #2"
            >
              Simulate DB Tamper
            </button>
          ) : (
            <button
              onClick={onRestoreChain}
              className="px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Restore Hash Chain
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by user, action, serial number, or change description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Seq #</th>
                <th className="py-3 px-4">Timestamp (PKT)</th>
                <th className="py-3 px-4">Actor &amp; Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Block Hash (Chained)</th>
                <th className="py-3 px-4">Changes &amp; Before/After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isTamperedRow = !verificationResult.isValid && log.sequence === verificationResult.brokenAtSequence;

                return (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isTamperedRow
                        ? 'bg-rose-50/70 border-l-4 border-rose-500'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Sequence */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{log.sequence}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatPKT(log.timestampUtc)}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{log.actor}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.action}
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-medium">
                        {log.entityId}
                      </span>
                    </td>

                    {/* Cryptographic Hashes */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-slate-900 font-bold">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        <span>{log.recordHash}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        Prev: {log.previousHash}
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-4 text-slate-600 max-w-sm">
                      {log.changesSummary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
