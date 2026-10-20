import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRackCollision,
  evaluateDeviceLiveStatus,
  detectHardwareDifferences,
  matchChangeWithWorkOrder,
  calculateStockHealth,
  formatPKR,
  computeRecordHash,
  verifyAuditHashChain,
} from './inventoryRules.ts';

test('checkRackCollision detects direct overlap in the same rack and face', () => {
  const existing = [
    {
      id: 'asset-1',
      assetTag: 'AST-SVR-001',
      rackId: 'rack-a',
      rackUnitStart: 10,
      rackUnitHeight: 2, // occupies 10.0 to 12.0
      rackFace: 'front' as const,
    },
  ];

  // Colliding candidate (overlaps 11 to 13)
  const colliding = checkRackCollision(existing, {
    rackId: 'rack-a',
    rackUnitStart: 11,
    rackUnitHeight: 2,
    rackFace: 'front',
  });
  assert.equal(colliding.hasCollision, true);
  assert.equal(colliding.collidingAssetTag, 'AST-SVR-001');

  // Non-colliding candidate in different U (12 to 14)
  const nonColliding = checkRackCollision(existing, {
    rackId: 'rack-a',
    rackUnitStart: 12,
    rackUnitHeight: 2,
    rackFace: 'front',
  });
  assert.equal(nonColliding.hasCollision, false);

  // Non-colliding candidate on rear face
  const rearFace = checkRackCollision(existing, {
    rackId: 'rack-a',
    rackUnitStart: 10,
    rackUnitHeight: 2,
    rackFace: 'rear',
  });
  assert.equal(rearFace.hasCollision, false);

  // Self update does not collide with self
  const selfUpdate = checkRackCollision(existing, {
    id: 'asset-1',
    rackId: 'rack-a',
    rackUnitStart: 10,
    rackUnitHeight: 2,
    rackFace: 'front',
  });
  assert.equal(selfUpdate.hasCollision, false);
});

test('checkRackCollision supports fractional 0.5U positions', () => {
  const existing = [
    {
      id: 'asset-switch',
      assetTag: 'AST-SW-001',
      rackId: 'rack-a',
      rackUnitStart: 5.0,
      rackUnitHeight: 0.5, // occupies 5.0 to 5.5
      rackFace: 'front' as const,
    },
  ];

  // 5.5 to 6.0 should not collide
  const adjacent = checkRackCollision(existing, {
    rackId: 'rack-a',
    rackUnitStart: 5.5,
    rackUnitHeight: 0.5,
    rackFace: 'front',
  });
  assert.equal(adjacent.hasCollision, false);

  // 5.2 to 5.7 should collide
  const overlap = checkRackCollision(existing, {
    rackId: 'rack-a',
    rackUnitStart: 5.2,
    rackUnitHeight: 0.5,
    rackFace: 'front',
  });
  assert.equal(overlap.hasCollision, true);
});

test('evaluateDeviceLiveStatus properly classifies Online, Offline, and Unknown', () => {
  const now = 1776500000000;

  // Heartbeat 60 seconds ago -> Online
  const recentHeartbeat = new Date(now - 60 * 1000).toISOString();
  assert.equal(evaluateDeviceLiveStatus(recentHeartbeat, now), 'Online');

  // Heartbeat exactly 2.5 minutes ago -> Online
  const twoHalfMins = new Date(now - 150 * 1000).toISOString();
  assert.equal(evaluateDeviceLiveStatus(twoHalfMins, now), 'Online');

  // Heartbeat 4 minutes ago -> Offline (> 3 min window)
  const fourMins = new Date(now - 240 * 1000).toISOString();
  assert.equal(evaluateDeviceLiveStatus(fourMins, now), 'Offline');

  // No heartbeat ever -> Unknown
  assert.equal(evaluateDeviceLiveStatus(undefined, now), 'Unknown');

  // Maintenance mode suppresses status
  assert.equal(evaluateDeviceLiveStatus(recentHeartbeat, now, { maintenanceMode: true }), 'Unknown');
});

test('detectHardwareDifferences detects mutations in CPU, RAM, and Storage', () => {
  const baseline = {
    cpu: 'Intel Xeon Gold 6248R',
    ramGb: 64,
    storageGb: 2000,
    macAddress: '00:1A:2B:3C:4D:5E',
  };

  const updated = {
    cpu: 'Intel Xeon Gold 6248R',
    ramGb: 128, // Upgraded RAM
    storageGb: 4000, // Doubled storage
    macAddress: '00:1A:2B:3C:4D:5E',
  };

  const diffs = detectHardwareDifferences(baseline, updated);
  assert.equal(diffs.length, 2);
  assert.equal(diffs[0].field, 'RAM Capacity');
  assert.equal(diffs[0].oldValue, '64 GB');
  assert.equal(diffs[0].newValue, '128 GB');
  assert.equal(diffs[1].field, 'Storage Capacity');
});

test('matchChangeWithWorkOrder verifies authorization against recent work order', () => {
  const now = 1776500000000;
  const workOrders = [
    {
      id: 'wo-1',
      workOrderNumber: 'WO-2026-088',
      title: 'Server RAM Upgrade to 128GB',
      assetId: 'ast-srv-1',
      assetTag: 'AST-SVR-001',
      technicianName: 'Tariq Mehmood',
      plantId: 'plant-1' as const,
      status: 'Approved' as const,
      priority: 'High' as const,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      authorizedHardwareChange: 'RAM Upgrade to 128GB',
      notes: 'Approved scheduled upgrade',
    },
  ];

  const ramDiff = { field: 'RAM Capacity', oldValue: '64 GB', newValue: '128 GB' };
  const authCheck = matchChangeWithWorkOrder('ast-srv-1', ramDiff, workOrders, now);
  assert.equal(authCheck.isAuthorized, true);
  assert.equal(authCheck.matchedWorkOrder?.workOrderNumber, 'WO-2026-088');

  // Unknown asset or no matching work order
  const unauthorized = matchChangeWithWorkOrder('ast-srv-999', ramDiff, workOrders, now);
  assert.equal(unauthorized.isAuthorized, false);
});

test('calculateStockHealth flags Critical Reorder, Low Stock, and Optimal', () => {
  // Min: 5, Reorder: 10
  assert.equal(calculateStockHealth(3, 5, 10), 'Critical Reorder');
  assert.equal(calculateStockHealth(5, 5, 10), 'Critical Reorder');
  assert.equal(calculateStockHealth(8, 5, 10), 'Low Stock');
  assert.equal(calculateStockHealth(10, 5, 10), 'Low Stock');
  assert.equal(calculateStockHealth(15, 5, 10), 'Optimal');
});

test('formatPKR formats currency correctly with PKR symbol', () => {
  assert.equal(formatPKR(1500000), 'PKR 1,500,000');
  assert.equal(formatPKR(25000), 'PKR 25,000');
});

test('verifyAuditHashChain validates intact chain and detects tampering', () => {
  const h0 = '0x000000000000';
  const h1 = computeRecordHash(h0, 1, 'AST-001', 'Created Asset');
  const h2 = computeRecordHash(h1, 2, 'AST-001', 'Assigned Asset');
  const h3 = computeRecordHash(h2, 3, 'AST-001', 'Decommissioned');

  const validChain = [
    { sequence: 1, previousHash: h0, recordHash: h1, entityId: 'AST-001', action: 'Created Asset' },
    { sequence: 2, previousHash: h1, recordHash: h2, entityId: 'AST-001', action: 'Assigned Asset' },
    { sequence: 3, previousHash: h2, recordHash: h3, entityId: 'AST-001', action: 'Decommissioned' },
  ];

  assert.equal(verifyAuditHashChain(validChain).isValid, true);

  // Tampered chain (altered action or broken hash link)
  const tamperedChain = [
    { sequence: 1, previousHash: h0, recordHash: h1, entityId: 'AST-001', action: 'Created Asset' },
    { sequence: 2, previousHash: h1, recordHash: '0xBADHASH999', entityId: 'AST-001', action: 'Assigned Asset' },
    { sequence: 3, previousHash: h2, recordHash: h3, entityId: 'AST-001', action: 'Decommissioned' },
  ];

  const verifyResult = verifyAuditHashChain(tamperedChain);
  assert.equal(verifyResult.isValid, false);
  assert.equal(verifyResult.brokenAtSequence, 2);
});
