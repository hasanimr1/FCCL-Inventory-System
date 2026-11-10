import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPartialCredential,
  verifyPartialPassword,
  generatePositionChallenge,
  INITIAL_USERS,
} from './authService.ts';
import {
  hasPermission,
  authorizeAction,
  canAccessTab,
} from './rbac.ts';
import {
  createPurchaseRequest,
  approvePurchaseRequest,
  generatePurchaseOrderFromPR,
  completePurchaseOrder,
} from './procurementService.ts';
import {
  INITIAL_VENDORS,
  INITIAL_ASSETS,
} from '../../../backend/data/mockInventoryData.ts';
import { Asset, PurchaseRequest, UserRole, UserAccount } from '../types/inventory.ts';

/* ==========================================================================
   1. Partial Password Authentication Tests
   ========================================================================== */

test('Partial password: correct requested digit positions pass authentication', () => {
  // Test PIN: "841295"
  // Positions (1-indexed): 1='8', 2='4', 3='1', 4='2', 5='9', 6='5'
  const user: UserAccount = {
    id: 'test-user-1',
    username: 'test.admin@fccl.com.pk',
    fullName: 'Test Admin',
    role: 'Admin',
    plantId: 'plant-1',
    department: 'IT Infrastructure',
    ...createPartialCredential('841295', 'fixed_salt_123'),
    failedAttempts: 0,
  };

  // Challenge: positions 2, 4, 6
  const challenge = [2, 4, 6];
  const submittedDigits = {
    2: '4',
    4: '2',
    6: '5',
  };

  const result = verifyPartialPassword(user, challenge, submittedDigits);
  assert.equal(result.success, true);
  assert.equal(result.locked, false);
  assert.equal(user.failedAttempts, 0);
  assert.equal(result.message, 'Authentication successful.');
});

test('Partial password: wrong digits are rejected and decrement remaining attempts', () => {
  const user: UserAccount = {
    id: 'test-user-2',
    username: 'test.user@fccl.com.pk',
    fullName: 'Test User',
    role: 'Employee',
    plantId: 'plant-1',
    department: 'Plant Operations',
    ...createPartialCredential('628149', 'fixed_salt_456'),
    failedAttempts: 0,
  };

  // Challenge: positions 1, 3, 5
  // Correct digits: 1='6', 3='8', 5='4'
  const challenge = [1, 3, 5];
  const wrongSubmission = {
    1: '6',
    3: '9', // WRONG (should be 8)
    5: '4',
  };

  const result = verifyPartialPassword(user, challenge, wrongSubmission);
  assert.equal(result.success, false);
  assert.equal(result.locked, false);
  assert.equal(user.failedAttempts, 1);
  assert.equal(result.attemptsRemaining, 4);
  assert.match(result.message, /Incorrect digits entered/);
});

test('Partial password lockout: 5 consecutive failed attempts trigger account lockout', () => {
  const user: UserAccount = {
    id: 'test-user-3',
    username: 'lockout.target@fccl.com.pk',
    fullName: 'Lockout Target',
    role: 'Employee',
    plantId: 'plant-2',
    department: 'Maintenance',
    ...createPartialCredential('519374', 'fixed_salt_789'),
    failedAttempts: 0,
  };

  const challenge = [2, 4, 6];
  const wrongDigits = { 2: '0', 4: '0', 6: '0' };

  // Fail 4 times
  for (let i = 1; i <= 4; i++) {
    const res = verifyPartialPassword(user, challenge, wrongDigits);
    assert.equal(res.success, false);
    assert.equal(res.locked, false);
    assert.equal(user.failedAttempts, i);
  }

  // 5th failed attempt -> Must trigger lockout
  const lockoutResult = verifyPartialPassword(user, challenge, wrongDigits);
  assert.equal(lockoutResult.success, false);
  assert.equal(lockoutResult.locked, true);
  assert.equal(user.failedAttempts, 5);
  assert.ok(user.lockedUntil);
  assert.match(lockoutResult.message, /Maximum login attempts exceeded/);

  // Subsequent attempt while locked must be blocked immediately
  const blockedAttempt = verifyPartialPassword(user, challenge, { 2: '1', 4: '9', 6: '4' });
  assert.equal(blockedAttempt.success, false);
  assert.equal(blockedAttempt.locked, true);
  assert.match(blockedAttempt.message, /temporarily locked/);
});

/* ==========================================================================
   2. Role-Based Access Control (RBAC) Enforcement Tests
   ========================================================================== */

test('RBAC: Admin and Plant Admin have PR approval and PO generation authority', () => {
  const adminAuth = authorizeAction('Admin', 'APPROVE_PURCHASE_REQUEST');
  assert.equal(adminAuth.authorized, true);
  assert.equal(adminAuth.statusCode, 200);

  const plantAdminAuth = authorizeAction('Plant Admin', 'APPROVE_PURCHASE_REQUEST');
  assert.equal(plantAdminAuth.authorized, true);
  assert.equal(plantAdminAuth.statusCode, 200);

  const adminPoAuth = authorizeAction('Admin', 'GENERATE_PURCHASE_ORDER');
  assert.equal(adminPoAuth.authorized, true);
});

test('RBAC: Employee and Auditor cannot approve PRs or generate POs (Server-Side 403)', () => {
  // Employee cannot approve PR
  const employeeApproval = authorizeAction('Employee', 'APPROVE_PURCHASE_REQUEST');
  assert.equal(employeeApproval.authorized, false);
  assert.equal(employeeApproval.statusCode, 403);
  assert.match(employeeApproval.message!, /Access Denied/);

  // Employee cannot generate PO
  const employeePO = authorizeAction('Employee', 'GENERATE_PURCHASE_ORDER');
  assert.equal(employeePO.authorized, false);
  assert.equal(employeePO.statusCode, 403);

  // Auditor is strictly read-only
  const auditorApproval = authorizeAction('Auditor', 'APPROVE_PURCHASE_REQUEST');
  assert.equal(auditorApproval.authorized, false);
  assert.equal(auditorApproval.statusCode, 403);

  const auditorCreateAsset = authorizeAction('Auditor', 'CREATE_EDIT_ASSET');
  assert.equal(auditorCreateAsset.authorized, false);
  assert.equal(auditorCreateAsset.statusCode, 403);
});

test('RBAC tab navigation permissions', () => {
  // Employee can only access overview, procurement, and workorders
  assert.equal(canAccessTab('Employee', 'overview'), true);
  assert.equal(canAccessTab('Employee', 'procurement'), true);
  assert.equal(canAccessTab('Employee', 'workorders'), true);
  assert.equal(canAccessTab('Employee', 'assets'), false);
  assert.equal(canAccessTab('Employee', 'racks'), false);
  assert.equal(canAccessTab('Employee', 'audit'), false);

  // Auditor has read-only access to audit trail and assets
  assert.equal(canAccessTab('Auditor', 'audit'), true);
  assert.equal(canAccessTab('Auditor', 'assets'), true);
});

/* ==========================================================================
   3. PR-to-Approval-to-PO Sequence Tests
   ========================================================================== */

test('PR creation, Admin approval routing, and PO generation with vendor pre-fill', () => {
  const vendor = INITIAL_VENDORS[0]; // Dell Technologies Pakistan

  // Step 1: Employee creates Purchase Request
  const pr = createPurchaseRequest(
    {
      title: 'Hattar SCADA Monitoring Nodes',
      department: 'Kiln Automation',
      plantId: 'plant-1',
      priority: 'High',
      justification: 'Critical telemetry processing hardware replacement',
      items: [
        {
          description: 'Dell PowerEdge R660 1U Rack Server',
          category: 'Server',
          quantity: 2,
          estimatedUnitPricePKR: 800000,
          suggestedModel: 'Dell PowerEdge R660',
        },
      ],
      targetVendorId: vendor.id,
    },
    'Muhammad Tariq',
    'Employee'
  );

  assert.equal(pr.status, 'Pending Approval');
  assert.equal(pr.totalEstimatedCostPKR, 1600000);
  assert.ok(pr.prNumber.startsWith('PR-P1-2026-'));

  // Step 2: Attempting to generate PO before Admin approval MUST FAIL
  assert.throws(
    () => {
      generatePurchaseOrderFromPR(pr, vendor, 'Imran Ashraf', 'Admin');
    },
    {
      message: /Admin approval is strictly required first/,
    }
  );

  // Step 3: Unauthorized role (Employee) attempting to approve MUST FAIL
  assert.throws(
    () => {
      approvePurchaseRequest(pr, 'Approved', 'Muhammad Tariq', 'Employee');
    },
    {
      message: /Access Denied: Role "Employee"/,
    }
  );

  // Step 4: Admin approves the Purchase Request
  const approvedPR = approvePurchaseRequest(
    pr,
    'Approved',
    'Imran Ashraf',
    'Admin',
    'Approved against FY26 Capital Expenditure quota'
  );
  assert.equal(approvedPR.status, 'Approved');
  assert.equal(approvedPR.approvalDecision?.decision, 'Approved');
  assert.equal(approvedPR.approvalDecision?.decidedBy, 'Imran Ashraf');

  // Step 5: Admin generates Purchase Order from approved PR
  const { purchaseOrder, updatedPR } = generatePurchaseOrderFromPR(
    approvedPR,
    vendor,
    'Imran Ashraf',
    'Admin',
    { deliveryMethod: 'DHL Secure Logistics' }
  );

  // Verify PO fields and vendor pre-fill
  assert.equal(updatedPR.status, 'Converted to PO');
  assert.equal(purchaseOrder.orderStatus, 'Started');
  assert.equal(purchaseOrder.prId, pr.id);
  assert.equal(purchaseOrder.vendorId, vendor.id);
  assert.equal(purchaseOrder.vendorName, vendor.name);
  assert.equal(purchaseOrder.vendorCompany, vendor.name);
  assert.equal(purchaseOrder.vendorPhone, vendor.phone);
  assert.equal(purchaseOrder.vendorEmail, vendor.email);
  assert.equal(purchaseOrder.vendorAddress, vendor.address);
  assert.equal(purchaseOrder.items.length, 1);
  assert.equal(purchaseOrder.items[0].qty, 2);
  assert.equal(purchaseOrder.items[0].price, 800000);
  assert.equal(purchaseOrder.subtotalPKR, 1600000);
});

/* ==========================================================================
   4. Automatic Hardware Register (Inventory) Creation on PO Completion
   ========================================================================== */

test('When a Purchase Order is marked completed, ordered items are automatically added to the Hardware Register', () => {
  const vendor = INITIAL_VENDORS[0];
  const initialAssetCount = INITIAL_ASSETS.length;

  // Create an approved PO with 2 Servers and 1 Network Switch (total 3 units)
  const dummyPR: PurchaseRequest = {
    id: 'pr-test-seq',
    prNumber: 'PR-HTR-2026-999',
    title: 'Test Inductions',
    department: 'IT',
    plantId: 'plant-1',
    requestedBy: 'Engineer',
    requesterRole: 'Employee',
    priority: 'High',
    justification: 'Capacity expansion',
    requestedDate: '2026-11-09',
    totalEstimatedCostPKR: 1900000,
    status: 'Approved',
    items: [
      {
        id: 'pri-1',
        description: 'Dell PowerEdge R760 2U Compute Node',
        category: 'Server',
        quantity: 2,
        estimatedUnitPricePKR: 850000,
        estimatedTotalPKR: 1700000,
        suggestedModel: 'Dell PowerEdge R760',
      },
      {
        id: 'pri-2',
        description: 'Cisco Core Switch 48-Port',
        category: 'Network Switch',
        quantity: 1,
        estimatedUnitPricePKR: 200000,
        estimatedTotalPKR: 200000,
        suggestedModel: 'Cisco Catalyst 9300',
      },
    ],
  };

  const { purchaseOrder } = generatePurchaseOrderFromPR(
    dummyPR,
    vendor,
    'Imran Ashraf',
    'Admin'
  );

  // Complete the PO as Store Officer / Admin
  const completion = completePurchaseOrder(
    purchaseOrder,
    INITIAL_ASSETS,
    'Zahid Mehmood',
    'Admin'
  );

  assert.equal(completion.updatedPO.orderStatus, 'Completed');
  assert.ok(completion.updatedPO.dateReceived);
  assert.equal(completion.updatedPO.completedBy, 'Zahid Mehmood');

  // Exactly 3 new Asset records must be created automatically
  assert.equal(completion.newAssets.length, 3);

  // Verify Asset #1 (Server unit 1)
  const asset1 = completion.newAssets[0];
  assert.equal(asset1.category, 'Server');
  assert.equal(asset1.model, 'Dell PowerEdge R760');
  assert.equal(asset1.vendorId, vendor.id);
  assert.equal(asset1.plantId, 'plant-1');
  assert.equal(asset1.costPKR, 850000);
  assert.equal(asset1.status, 'Spare');
  assert.ok(asset1.assetTag.startsWith('AST-SVR-'));
  assert.ok(asset1.serialNumber.startsWith('SN-SVR-'));
  assert.match(asset1.notes!, /Automatically received and inducted into Hardware Register/);

  // Verify Asset #2 (Server unit 2)
  const asset2 = completion.newAssets[1];
  assert.equal(asset2.category, 'Server');
  assert.notEqual(asset1.assetTag, asset2.assetTag); // Must have unique asset tags
  assert.notEqual(asset1.serialNumber, asset2.serialNumber); // Unique serials

  // Verify Asset #3 (Switch)
  const asset3 = completion.newAssets[2];
  assert.equal(asset3.category, 'Network Switch');
  assert.ok(asset3.assetTag.startsWith('AST-SW-'));

  // Confirm total assets in register increases by 3 with no manual re-entry
  const combinedRegister = [...completion.newAssets, ...INITIAL_ASSETS];
  assert.equal(combinedRegister.length, initialAssetCount + 3);
});
