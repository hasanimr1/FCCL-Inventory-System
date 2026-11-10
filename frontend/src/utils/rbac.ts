import { UserRole } from '../types/inventory.ts';

export type Permission =
  | 'VIEW_OVERVIEW'
  | 'VIEW_ASSETS'
  | 'CREATE_EDIT_ASSET'
  | 'DELETE_DECOMMISSION_ASSET'
  | 'VIEW_STOCK'
  | 'MANAGE_STOCK'
  | 'VIEW_RACKS'
  | 'VIEW_WORK_ORDERS'
  | 'CREATE_WORK_ORDER'
  | 'APPROVE_WORK_ORDER'
  | 'VIEW_SUPPLIERS'
  | 'MANAGE_SUPPLIERS'
  | 'VIEW_PURCHASE_REQUESTS'
  | 'CREATE_PURCHASE_REQUEST'
  | 'APPROVE_PURCHASE_REQUEST'
  | 'VIEW_PURCHASE_ORDERS'
  | 'GENERATE_PURCHASE_ORDER'
  | 'COMPLETE_PURCHASE_ORDER'
  | 'VIEW_AUDIT_TRAIL'
  | 'TAMPER_AUDIT_DEMO';

export interface RoleConfig {
  role: UserRole;
  displayName: string;
  description: string;
  allowedTabs: string[];
  permissions: Permission[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleConfig> = {
  'Admin': {
    role: 'Admin',
    displayName: 'Admin',
    description: 'System-wide executive administration: full access to devices, spares, PR approval, PO generation, and audit.',
    allowedTabs: ['overview', 'assets', 'stock', 'procurement', 'racks', 'workorders', 'suppliers', 'audit'],
    permissions: [
      'VIEW_OVERVIEW',
      'VIEW_ASSETS',
      'CREATE_EDIT_ASSET',
      'DELETE_DECOMMISSION_ASSET',
      'VIEW_STOCK',
      'MANAGE_STOCK',
      'VIEW_RACKS',
      'VIEW_WORK_ORDERS',
      'CREATE_WORK_ORDER',
      'APPROVE_WORK_ORDER',
      'VIEW_SUPPLIERS',
      'MANAGE_SUPPLIERS',
      'VIEW_PURCHASE_REQUESTS',
      'CREATE_PURCHASE_REQUEST',
      'APPROVE_PURCHASE_REQUEST',
      'VIEW_PURCHASE_ORDERS',
      'GENERATE_PURCHASE_ORDER',
      'COMPLETE_PURCHASE_ORDER',
      'VIEW_AUDIT_TRAIL',
      'TAMPER_AUDIT_DEMO',
    ],
  },
  'Plant Admin': {
    role: 'Plant Admin',
    displayName: 'Plant Admin',
    description: 'Plant-level operational management, inventory control, and work order tracking.',
    allowedTabs: ['overview', 'assets', 'stock', 'procurement', 'racks', 'workorders', 'suppliers'],
    permissions: [
      'VIEW_OVERVIEW',
      'VIEW_ASSETS',
      'CREATE_EDIT_ASSET',
      'VIEW_STOCK',
      'MANAGE_STOCK',
      'VIEW_RACKS',
      'VIEW_WORK_ORDERS',
      'CREATE_WORK_ORDER',
      'VIEW_SUPPLIERS',
      'VIEW_PURCHASE_REQUESTS',
      'CREATE_PURCHASE_REQUEST',
      'APPROVE_PURCHASE_REQUEST',
      'VIEW_PURCHASE_ORDERS',
      'GENERATE_PURCHASE_ORDER',
      'COMPLETE_PURCHASE_ORDER',
    ],
  },
  'Employee': {
    role: 'Employee',
    displayName: 'Employee',
    description: 'General employee: view dashboard, submit work orders, and raise purchase requisitions.',
    allowedTabs: ['overview', 'procurement', 'workorders'],
    permissions: [
      'VIEW_OVERVIEW',
      'VIEW_WORK_ORDERS',
      'CREATE_WORK_ORDER',
      'VIEW_PURCHASE_REQUESTS',
      'CREATE_PURCHASE_REQUEST',
    ],
  },
  'Auditor': {
    role: 'Auditor',
    displayName: 'Auditor',
    description: 'Independent audit scrutiny: read-only access to asset registry, suppliers, orders, and tamper-evident audit logs.',
    allowedTabs: ['overview', 'assets', 'stock', 'procurement', 'racks', 'workorders', 'suppliers', 'audit'],
    permissions: [
      'VIEW_OVERVIEW',
      'VIEW_ASSETS',
      'VIEW_STOCK',
      'VIEW_RACKS',
      'VIEW_WORK_ORDERS',
      'VIEW_SUPPLIERS',
      'VIEW_PURCHASE_REQUESTS',
      'VIEW_PURCHASE_ORDERS',
      'VIEW_AUDIT_TRAIL',
    ],
  },
};

/**
 * Checks whether a given role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const config = ROLE_DEFINITIONS[role];
  if (!config) return false;
  return config.permissions.includes(permission);
}

/**
 * Validates server-side/service-layer action authorization.
 */
export function authorizeAction(
  role: UserRole,
  permission: Permission
): { authorized: boolean; statusCode: 200 | 403; message?: string } {
  if (hasPermission(role, permission)) {
    return { authorized: true, statusCode: 200 };
  }
  return {
    authorized: false,
    statusCode: 403,
    message: `Access Denied: Role "${role}" is not authorized to execute permission "${permission}".`,
  };
}

/**
 * Checks whether a role can navigate to a tab.
 */
export function canAccessTab(role: UserRole, tabId: string): boolean {
  const config = ROLE_DEFINITIONS[role];
  if (!config) return false;
  return config.allowedTabs.includes(tabId);
}
