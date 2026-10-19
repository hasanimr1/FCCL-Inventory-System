import type { Asset, AssetCustomSpecs, DeviceLiveStatus, StockStatus, WorkOrder } from '../types/inventory.ts';

/**
 * Validates rack occupancy and detects collisions.
 * Supports standard whole U and fractional U (e.g. 0.5U, 0.1U).
 */
export function checkRackCollision(
  existingAssets: Pick<Asset, 'id' | 'assetTag' | 'rackId' | 'rackUnitStart' | 'rackUnitHeight' | 'rackFace'>[],
  candidate: {
    id?: string;
    rackId: string;
    rackUnitStart: number;
    rackUnitHeight: number;
    rackFace?: 'front' | 'rear';
  },
  maxRackU: number = 42
): { hasCollision: boolean; collidingAssetTag?: string; error?: string } {
  const candidateFace = candidate.rackFace || 'front';
  const candStart = Math.round(candidate.rackUnitStart * 10) / 10;
  const candEnd = Math.round((candidate.rackUnitStart + candidate.rackUnitHeight) * 10) / 10;

  if (candStart < 1) {
    return { hasCollision: true, error: 'Rack unit start must be >= 1.0U' };
  }

  if (candEnd > maxRackU + 1) {
    return {
      hasCollision: true,
      error: `Asset extends to ${candEnd}U, exceeding maximum rack height of ${maxRackU}U`,
    };
  }

  for (const asset of existingAssets) {
    // Skip comparing against self when updating
    if (candidate.id && asset.id === candidate.id) continue;
    if (asset.rackId !== candidate.rackId) continue;
    if (asset.rackUnitStart === undefined || asset.rackUnitHeight === undefined) continue;

    const existingFace = asset.rackFace || 'front';
    // Collsion only occurs on the same face (front vs rear)
    if (existingFace !== candidateFace) continue;

    const existStart = Math.round(asset.rackUnitStart * 10) / 10;
    const existEnd = Math.round((asset.rackUnitStart + asset.rackUnitHeight) * 10) / 10;

    // Check overlap: max(start1, start2) < min(end1, end2)
    const overlapStart = Math.max(candStart, existStart);
    const overlapEnd = Math.min(candEnd, existEnd);

    if (overlapStart < overlapEnd) {
      return {
        hasCollision: true,
        collidingAssetTag: asset.assetTag,
        error: `Collision detected with ${asset.assetTag} occupying U${existStart} to U${existEnd}`,
      };
    }
  }

  return { hasCollision: false };
}

/**
 * Evaluates whether a device is Online, Offline, or Unknown.
 * Specification: A device seen within previous 3 minutes (180,000 ms) is Online.
 * If seen previously but not within 3 mins: Offline.
 * If never reported: Unknown.
 */
export function evaluateDeviceLiveStatus(
  lastHeartbeatUtc: string | undefined,
  currentTimestampUtc: number = Date.now(),
  options?: {
    isQuietHour?: boolean;
    maintenanceMode?: boolean;
  }
): DeviceLiveStatus {
  if (options?.maintenanceMode) {
    return 'Unknown';
  }

  if (!lastHeartbeatUtc) {
    return 'Unknown';
  }

  const heartbeatTime = new Date(lastHeartbeatUtc).getTime();
  if (isNaN(heartbeatTime)) {
    return 'Unknown';
  }

  const diffMs = currentTimestampUtc - heartbeatTime;
  const THREE_MINUTES_MS = 3 * 60 * 1000;

  if (diffMs <= THREE_MINUTES_MS) {
    return 'Online';
  }

  return 'Offline';
}

export interface DetectedDiff {
  field: string;
  oldValue: string;
  newValue: string;
}

/**
 * Compares incoming hardware specs with recorded baseline.
 * Volatile values (ipAddress) are not counted as hardware mutations.
 */
export function detectHardwareDifferences(
  baseline: AssetCustomSpecs,
  current: AssetCustomSpecs
): DetectedDiff[] {
  const diffs: DetectedDiff[] = [];

  if (current.ramGb !== undefined && baseline.ramGb !== undefined && current.ramGb !== baseline.ramGb) {
    diffs.push({
      field: 'RAM Capacity',
      oldValue: `${baseline.ramGb} GB`,
      newValue: `${current.ramGb} GB`,
    });
  }

  if (current.cpu && baseline.cpu && current.cpu !== baseline.cpu) {
    diffs.push({
      field: 'CPU Model',
      oldValue: baseline.cpu,
      newValue: current.cpu,
    });
  }

  if (current.storageGb !== undefined && baseline.storageGb !== undefined && current.storageGb !== baseline.storageGb) {
    diffs.push({
      field: 'Storage Capacity',
      oldValue: `${baseline.storageGb} GB`,
      newValue: `${current.storageGb} GB`,
    });
  }

  if (current.macAddress && baseline.macAddress && current.macAddress !== baseline.macAddress) {
    diffs.push({
      field: 'MAC Address (NIC swap)',
      oldValue: baseline.macAddress,
      newValue: current.macAddress,
    });
  }

  if (current.os && baseline.os && current.os !== baseline.os) {
    diffs.push({
      field: 'Operating System',
      oldValue: baseline.os,
      newValue: current.os,
    });
  }

  return diffs;
}

/**
 * Matches detected change with approved or in-progress work orders within 48 hours.
 */
export function matchChangeWithWorkOrder(
  assetId: string,
  changeDiff: DetectedDiff,
  workOrders: WorkOrder[],
  changeTimestampUtc: number = Date.now()
): { matchedWorkOrder?: WorkOrder; isAuthorized: boolean } {
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  const candidateWorkOrder = workOrders.find((wo) => {
    if (wo.assetId !== assetId) return false;
    // Status must be In Progress, Completed, or Approved
    if (wo.status === 'Open') return false;

    const woCreated = new Date(wo.createdAt).getTime();
    const isWithin48h = Math.abs(changeTimestampUtc - woCreated) <= FORTY_EIGHT_HOURS_MS;
    if (!isWithin48h) return false;

    // Check if the work order mentions the field or change
    if (wo.authorizedHardwareChange) {
      const auth = wo.authorizedHardwareChange.toLowerCase();
      if (changeDiff.field.toLowerCase().includes('ram') && auth.includes('ram')) return true;
      if (changeDiff.field.toLowerCase().includes('cpu') && auth.includes('cpu')) return true;
      if (changeDiff.field.toLowerCase().includes('storage') && (auth.includes('storage') || auth.includes('ssd') || auth.includes('disk'))) return true;
      if (changeDiff.field.toLowerCase().includes('mac') && (auth.includes('nic') || auth.includes('network'))) return true;
    }

    return true;
  });

  if (candidateWorkOrder) {
    return { matchedWorkOrder: candidateWorkOrder, isAuthorized: true };
  }

  return { isAuthorized: false };
}

/**
 * Calculates stock level status for spare parts inventory.
 */
export function calculateStockHealth(
  currentStock: number,
  minThreshold: number,
  reorderPoint: number
): StockStatus {
  if (currentStock <= minThreshold) {
    return 'Critical Reorder';
  }
  if (currentStock <= reorderPoint) {
    return 'Low Stock';
  }
  return 'Optimal';
}

/**
 * Formats monetary amounts in PKR.
 */
export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-US')}`;
}

/**
 * Formats a UTC ISO timestamp into Pakistan Standard Time (PKT, UTC+5).
 */
export function formatPKT(utcIsoString?: string | null): string {
  if (!utcIsoString) return '—';
  const date = new Date(utcIsoString);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date) + ' PKT';
}

/**
 * Simple deterministic SHA-like hash generator for tamper-evident audit demonstration.
 */
export function computeRecordHash(previousHash: string, sequence: number, entityId: string, action: string): string {
  let str = `${previousHash}:${sequence}:${entityId}:${action}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `0x${hex}${sequence.toString(16).padStart(4, '0')}`;
}

/**
 * Verifies that the audit chain is unbroken.
 */
export function verifyAuditHashChain(
  logs: { sequence: number; previousHash: string; recordHash: string; entityId: string; action: string }[]
): { isValid: boolean; brokenAtSequence?: number } {
  for (let i = 0; i < logs.length; i++) {
    const current = logs[i];
    const expectedHash = computeRecordHash(current.previousHash, current.sequence, current.entityId, current.action);
    if (current.recordHash !== expectedHash) {
      return { isValid: false, brokenAtSequence: current.sequence };
    }
    if (i > 0) {
      const prev = logs[i - 1];
      if (current.previousHash !== prev.recordHash) {
        return { isValid: false, brokenAtSequence: current.sequence };
      }
    }
  }
  return { isValid: true };
}

/**
 * Resolves a simple human-friendly numbering for a device (#1, #2, ...).
 */
export function getDeviceNumber(
  asset: { deviceNumber?: number; id?: string },
  allAssets?: { id?: string }[]
): number {
  if (asset.deviceNumber !== undefined && asset.deviceNumber > 0) {
    return asset.deviceNumber;
  }
  if (asset.id && allAssets && allAssets.length > 0) {
    const idx = allAssets.findIndex((a) => a.id === asset.id);
    if (idx !== -1) return idx + 1;
    const match = asset.id.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  if (asset.id) {
    const match = asset.id.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return 1;
}

/**
 * Returns formatted label e.g. "Device #1"
 */
export function formatDeviceName(
  asset: { deviceNumber?: number; id?: string },
  allAssets?: { id?: string }[]
): string {
  return `Device #${getDeviceNumber(asset, allAssets)}`;
}

