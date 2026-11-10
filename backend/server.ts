import express, { Request, Response, NextFunction } from 'express';
import {
  INITIAL_USERS,
  generatePositionChallenge,
  verifyPartialPassword,
} from '../frontend/src/utils/authService.ts';
import {
  authorizeAction,
  hasPermission,
  Permission,
} from '../frontend/src/utils/rbac.ts';
import {
  createPurchaseRequest,
  approvePurchaseRequest,
  generatePurchaseOrderFromPR,
  completePurchaseOrder,
} from '../frontend/src/utils/procurementService.ts';
import {
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_VENDORS,
  INITIAL_ASSETS,
} from './data/mockInventoryData.ts';
import { UserRole } from '../frontend/src/types/inventory.ts';

const app = express();
app.use(express.json());

// In-memory state for backend runtime
let users = [...INITIAL_USERS];
let purchaseRequests = [...INITIAL_PURCHASE_REQUESTS];
let purchaseOrders = [...INITIAL_PURCHASE_ORDERS];
let vendors = [...INITIAL_VENDORS];
let assets = [...INITIAL_ASSETS];

// Session challenge cache: token -> { username, positions, expiresAt }
const challengeStore = new Map<string, { username: string; positions: number[]; expiresAt: number }>();

// Simple Bearer token / header authentication simulation
interface AuthenticatedRequest extends Request {
  userRole?: UserRole;
  userName?: string;
  userId?: string;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const roleHeader = req.headers['x-user-role'] as string;
  const userHeader = req.headers['x-user-name'] as string;

  if (roleHeader) {
    req.userRole = roleHeader as UserRole;
    req.userName = userHeader || 'System User';
  }
  next();
}

app.use(authMiddleware);

// RBAC Middleware Helper
function requirePermission(perm: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.userRole;
    if (!role) {
      res.status(401).json({ error: 'Unauthorized: Missing user authentication credentials.' });
      return;
    }

    const auth = authorizeAction(role, perm);
    if (!auth.authorized) {
      res.status(403).json({
        error: 'Forbidden: Insufficient Permissions (RBAC)',
        message: auth.message,
        requiredPermission: perm,
        userRole: role,
      });
      return;
    }

    next();
  };
}

/* ==========================================================================
   1. Partial Password Authentication Endpoints
   ========================================================================== */

/**
 * Step 1: Request Partial Password Challenge
 * Server picks 3 random digit positions (e.g. [2, 4, 6])
 */
app.post('/api/auth/challenge', (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: 'Username or email is required.' });
    return;
  }

  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  // Check lockout
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    const remainingSec = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000);
    res.status(423).json({
      locked: true,
      remainingSeconds: remainingSec,
      message: `Account is temporarily locked due to repeated failed attempts. Please wait ${Math.ceil(remainingSec / 60)} minutes.`,
    });
    return;
  }

  const positions = generatePositionChallenge(3, 6);
  const challengeToken = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  challengeStore.set(challengeToken, {
    username: user.username,
    positions,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
  });

  res.json({
    challengeToken,
    positions,
    userFullName: user.fullName,
    role: user.role,
    department: user.department,
  });
});

/**
 * Step 2: Verify Submitted Digits
 * Validates only requested digits against stored per-digit hashes
 */
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { challengeToken, username, submittedDigits } = req.body;

  const challenge = challengeStore.get(challengeToken);
  if (!challenge || challenge.expiresAt < Date.now() || challenge.username.toLowerCase() !== String(username).toLowerCase()) {
    res.status(400).json({ error: 'Invalid or expired challenge token. Please request a new challenge.' });
    return;
  }

  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const result = verifyPartialPassword(user, challenge.positions, submittedDigits);
  challengeStore.delete(challengeToken);

  if (!result.success) {
    const statusCode = result.locked ? 423 : 401;
    res.status(statusCode).json(result);
    return;
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      plantId: user.plantId,
    },
    token: `fccl_jwt_${user.id}_${Date.now()}`,
  });
});

/* ==========================================================================
   2. Purchase Request (PR) & Purchase Order (PO) Endpoints with Server RBAC
   ========================================================================== */

// List PRs
app.get('/api/procurement/prs', (req: AuthenticatedRequest, res: Response) => {
  res.json(purchaseRequests);
});

// Create PR (Employee, Plant Admin, Admin)
app.post(
  '/api/procurement/prs',
  requirePermission('CREATE_PURCHASE_REQUEST'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const pr = createPurchaseRequest(req.body, req.userName || 'Employee', req.userRole || 'Employee');
      purchaseRequests = [pr, ...purchaseRequests];
      res.status(201).json(pr);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Approve PR (STRICTLY Admin or Plant Admin)
app.post(
  '/api/procurement/prs/:id/approve',
  requirePermission('APPROVE_PURCHASE_REQUEST'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { decision, comments } = req.body;

    const prIndex = purchaseRequests.findIndex((p) => p.id === id);
    if (prIndex === -1) {
      res.status(404).json({ error: 'Purchase Request not found.' });
      return;
    }

    try {
      const updatedPR = approvePurchaseRequest(
        purchaseRequests[prIndex],
        decision || 'Approved',
        req.userName || 'Admin',
        req.userRole || 'Admin',
        comments
      );
      purchaseRequests[prIndex] = updatedPR;
      res.json(updatedPR);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// List POs
app.get('/api/procurement/pos', (req: AuthenticatedRequest, res: Response) => {
  res.json(purchaseOrders);
});

// Generate PO from Approved PR (STRICTLY Admin or Super Admin)
app.post(
  '/api/procurement/pos',
  requirePermission('GENERATE_PURCHASE_ORDER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { prId, vendorId, deliveryDetails } = req.body;

    const prIndex = purchaseRequests.findIndex((p) => p.id === prId);
    if (prIndex === -1) {
      res.status(404).json({ error: 'Purchase Request not found.' });
      return;
    }

    const pr = purchaseRequests[prIndex];
    const vendor = vendors.find((v) => v.id === (vendorId || pr.targetVendorId));
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found.' });
      return;
    }

    try {
      const { purchaseOrder, updatedPR } = generatePurchaseOrderFromPR(
        pr,
        vendor,
        req.userName || 'Admin',
        req.userRole || 'Admin',
        deliveryDetails
      );

      purchaseRequests[prIndex] = updatedPR;
      purchaseOrders = [purchaseOrder, ...purchaseOrders];

      res.status(201).json({ purchaseOrder, updatedPR });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Complete PO -> AUTOMATICALLY creates records in Hardware Register!
app.post(
  '/api/procurement/pos/:id/complete',
  requirePermission('COMPLETE_PURCHASE_ORDER'),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const poIndex = purchaseOrders.findIndex((p) => p.id === id);
    if (poIndex === -1) {
      res.status(404).json({ error: 'Purchase Order not found.' });
      return;
    }

    try {
      const result = completePurchaseOrder(
        purchaseOrders[poIndex],
        assets,
        req.userName || 'Admin',
        req.userRole || 'Admin'
      );

      purchaseOrders[poIndex] = result.updatedPO;
      assets = [...result.newAssets, ...assets];

      res.json({
        purchaseOrder: result.updatedPO,
        newlyCreatedAssets: result.newAssets,
        message: result.summary,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Hardware Register Assets
app.get('/api/assets', (req: Request, res: Response) => {
  res.json(assets);
});

export { app, users, purchaseRequests, purchaseOrders, assets, vendors };

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`FCCL Backend API & RBAC Server listening on port ${PORT}`);
  });
}
