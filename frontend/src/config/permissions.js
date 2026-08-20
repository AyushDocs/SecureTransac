/**
 * Role Permissions Configuration
 * Centralized configuration for role-based access control across the frontend
 */

// All available roles
export const ROLES = {
  USER: 'user',
  VIEWER: 'viewer',
  COMPANY: 'company',
  ADMIN: 'admin',
  DEPLOYER: 'deployer',
};

// Role groups for easier permission checking
export const ROLE_GROUPS = {
  ALL: [ROLES.USER, ROLES.VIEWER, ROLES.COMPANY, ROLES.ADMIN, ROLES.DEPLOYER],
  REGULAR_USERS: [ROLES.USER, ROLES.VIEWER],
  BUSINESS: [ROLES.COMPANY],
  ADMINS: [ROLES.ADMIN, ROLES.DEPLOYER],
  ELEVATED: [ROLES.COMPANY, ROLES.ADMIN, ROLES.DEPLOYER],
};

// Route-level permissions
export const ROUTE_PERMISSIONS = {
  '/': ROLE_GROUPS.ALL,
  '/dashboard': ROLE_GROUPS.ALL,
  '/search': ROLE_GROUPS.ELEVATED,
  '/registry': ROLE_GROUPS.ELEVATED,
  '/identity': ROLE_GROUPS.ALL,
  '/kyb': ROLE_GROUPS.ELEVATED,
  '/reports': ROLE_GROUPS.ALL,
  '/privacy': ROLE_GROUPS.ALL,
  '/analytics': ROLE_GROUPS.ADMINS,
  '/ecosystem': ROLE_GROUPS.ELEVATED,
  '/bridge': ROLE_GROUPS.ADMINS,
  '/war-room': ROLE_GROUPS.ADMINS,
  '/dao': ROLE_GROUPS.ALL,
};

// Feature-level permissions
export const FEATURE_PERMISSIONS = {
  // Search features
  canSearch: ROLE_GROUPS.ELEVATED,
  canViewAddressDetails: ROLE_GROUPS.ELEVATED,
  
  // Identity Vault features
  canManageAuthorities: [...ROLE_GROUPS.BUSINESS, ...ROLE_GROUPS.ADMINS],
  canViewDecryptionRequests: ROLE_GROUPS.ADMINS,
  canApproveDecryption: ROLE_GROUPS.ADMINS,
  
  // Registry features
  canViewRegistry: ROLE_GROUPS.ELEVATED,
  canAddToRegistry: ROLE_GROUPS.ADMINS,
  
  // KYB features
  canAccessKYB: ROLE_GROUPS.ELEVATED,
  canVerifyUsers: [...ROLE_GROUPS.BUSINESS, ...ROLE_GROUPS.ADMINS],
  
  // Analytics features
  canViewAnalytics: ROLE_GROUPS.ADMINS,
  canViewAdvancedMetrics: ROLE_GROUPS.ADMINS,
  
  // Bridge features
  canUseBridge: ROLE_GROUPS.ADMINS,
  canSyncCrossChain: ROLE_GROUPS.ADMINS,
  
  // War Room features
  canAccessWarRoom: ROLE_GROUPS.ADMINS,
  canManualOverride: ROLE_GROUPS.ADMINS,
  
  // Report features
  canFileReport: ROLE_GROUPS.ALL,
  canReviewReports: ROLE_GROUPS.ELEVATED,
  
  // DAO features
  canVote: ROLE_GROUPS.ALL,
  canCreateProposal: ROLE_GROUPS.ELEVATED,
  
  // Privacy features
  canUsePrivacy: ROLE_GROUPS.ALL,
  canAggregateData: ROLE_GROUPS.ADMINS,
  
  // Ecosystem features
  canViewEcosystem: ROLE_GROUPS.ELEVATED,
  canOnboardPartner: ROLE_GROUPS.ADMINS,
};

/**
 * Check if a role has permission for a feature
 * @param {string} role - Current user role
 * @param {string} feature - Feature key from FEATURE_PERMISSIONS
 * @returns {boolean}
 */
export function hasFeaturePermission(role, feature) {
  const allowedRoles = FEATURE_PERMISSIONS[feature];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Check if a role has permission for a route
 * @param {string} role - Current user role
 * @param {string} route - Route path
 * @returns {boolean}
 */
export function hasRoutePermission(role, route) {
  const allowedRoles = ROUTE_PERMISSIONS[route];
  if (!allowedRoles) return true; // Default allow for undefined routes
  return allowedRoles.includes(role);
}

/**
 * Check if role is an admin-level role
 * @param {string} role 
 * @returns {boolean}
 */
export function isAdmin(role) {
  return ROLE_GROUPS.ADMINS.includes(role);
}

/**
 * Check if role is a business-level role
 * @param {string} role 
 * @returns {boolean}
 */
export function isBusiness(role) {
  return ROLE_GROUPS.BUSINESS.includes(role);
}

/**
 * Check if role is a regular user
 * @param {string} role 
 * @returns {boolean}
 */
export function isRegularUser(role) {
  return ROLE_GROUPS.REGULAR_USERS.includes(role);
}

/**
 * Get display name for role
 * @param {string} role 
 * @returns {string}
 */
export function getRoleName(role) {
  const names = {
    [ROLES.USER]: 'User',
    [ROLES.VIEWER]: 'Viewer',
    [ROLES.COMPANY]: 'Company',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.DEPLOYER]: 'Deployer',
  };
  return names[role] || 'Unknown';
}

/**
 * Get role badge color
 * @param {string} role 
 * @returns {string}
 */
export function getRoleColor(role) {
  const colors = {
    [ROLES.USER]: 'bg-blue-500/20 text-blue-400',
    [ROLES.VIEWER]: 'bg-gray-500/20 text-gray-400',
    [ROLES.COMPANY]: 'bg-green-500/20 text-green-400',
    [ROLES.ADMIN]: 'bg-purple-500/20 text-purple-400',
    [ROLES.DEPLOYER]: 'bg-red-500/20 text-red-400',
  };
  return colors[role] || 'bg-gray-500/20 text-gray-400';
}

export default {
  ROLES,
  ROLE_GROUPS,
  ROUTE_PERMISSIONS,
  FEATURE_PERMISSIONS,
  hasFeaturePermission,
  hasRoutePermission,
  isAdmin,
  isBusiness,
  isRegularUser,
  getRoleName,
  getRoleColor,
};
