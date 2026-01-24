/**
 * RBAC Service - Role-Based Access Control
 * Manages user roles and permissions for multi-dashboard access
 */

// Role definitions
const ROLES = {
    ADMIN: 'admin',
    CREATOR: 'creator', // Same as 'company' for backward compatibility
    VIEWER: 'viewer',   // Same as 'user' for backward compatibility
    DEPLOYER: 'deployer'
};

// Role hierarchy (higher = more permissions)
const ROLE_HIERARCHY = {
    [ROLES.DEPLOYER]: 4,
    [ROLES.ADMIN]: 3,
    [ROLES.CREATOR]: 2,
    [ROLES.VIEWER]: 1
};

// Dashboard route permissions
const DASHBOARD_PERMISSIONS = {
    '/admin': [ROLES.ADMIN, ROLES.DEPLOYER],
    '/creator': [ROLES.CREATOR, ROLES.ADMIN, ROLES.DEPLOYER],
    '/app': [ROLES.VIEWER, ROLES.CREATOR, ROLES.ADMIN, ROLES.DEPLOYER]
};

// Map legacy roles to RBAC roles
const LEGACY_ROLE_MAP = {
    'admin': ROLES.ADMIN,
    'deployer': ROLES.DEPLOYER,
    'company': ROLES.CREATOR,
    'user': ROLES.VIEWER
};

// Reverse map for backward compatibility
const RBAC_TO_LEGACY = {
    [ROLES.ADMIN]: 'admin',
    [ROLES.DEPLOYER]: 'deployer',
    [ROLES.CREATOR]: 'company',
    [ROLES.VIEWER]: 'user'
};

// In-memory role assignments (in production, use database)
// Format: { walletAddress: { roles: ['admin', 'creator'], activeRole: 'admin' } }
const userRoles = new Map();

// Test wallets with all roles (for development)
// Add your test wallet addresses here (lowercase)
const TEST_WALLETS = [
    '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'.toLowerCase(), // Ganache default
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase(), // Hardhat default / User requested
];

/**
 * Initialize test wallets with all roles
 */
function initializeTestData() {
    const allRoles = [ROLES.ADMIN, ROLES.CREATOR, ROLES.VIEWER, ROLES.DEPLOYER];
    
    TEST_WALLETS.forEach(wallet => {
        userRoles.set(wallet, {
            roles: allRoles,
            activeRole: ROLES.ADMIN
        });
        console.log('[RBAC] Test wallet initialized with all roles:', wallet);
    });
}

/**
 * Get user roles by wallet address
 * @param {string} walletAddress 
 * @returns {object} { roles: string[], activeRole: string }
 */
function getUserRoles(walletAddress) {
    if (!walletAddress) return { roles: [], activeRole: null };
    
    const address = walletAddress.toLowerCase();
    const userData = userRoles.get(address);
    
    if (userData) {
        return userData;
    }
    
    // Default: single VIEWER role for new users (backward compatible)
    return { roles: [ROLES.VIEWER], activeRole: ROLES.VIEWER };
}

/**
 * Assign roles to a user
 * @param {string} walletAddress 
 * @param {string[]} roles 
 * @returns {object}
 */
function assignRoles(walletAddress, roles) {
    if (!walletAddress) throw new Error('Wallet address required');
    if (!Array.isArray(roles) || roles.length === 0) {
        throw new Error('At least one role required');
    }
    
    // Validate roles
    const validRoles = roles.filter(r => Object.values(ROLES).includes(r));
    if (validRoles.length === 0) {
        throw new Error('No valid roles provided');
    }
    
    const address = walletAddress.toLowerCase();
    const existingData = userRoles.get(address) || { roles: [], activeRole: null };
    
    userRoles.set(address, {
        roles: validRoles,
        activeRole: existingData.activeRole || validRoles[0]
    });
    
    console.log(`[RBAC] Roles assigned to ${address}:`, validRoles);
    return getUserRoles(address);
}

/**
 * Add a role to existing user
 * @param {string} walletAddress 
 * @param {string} role 
 */
function addRole(walletAddress, role) {
    if (!Object.values(ROLES).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
    }
    
    const address = walletAddress.toLowerCase();
    const userData = getUserRoles(address);
    
    if (!userData.roles.includes(role)) {
        userData.roles.push(role);
    }
    
    if (!userData.activeRole) {
        userData.activeRole = role;
    }
    
    userRoles.set(address, userData);
    return userData;
}

/**
 * Remove a role from user
 * @param {string} walletAddress 
 * @param {string} role 
 */
function removeRole(walletAddress, role) {
    const address = walletAddress.toLowerCase();
    const userData = getUserRoles(address);
    
    userData.roles = userData.roles.filter(r => r !== role);
    
    // If active role was removed, switch to first available
    if (userData.activeRole === role) {
        userData.activeRole = userData.roles[0] || null;
    }
    
    userRoles.set(address, userData);
    return userData;
}

/**
 * Set the active dashboard/role for a user
 * @param {string} walletAddress 
 * @param {string} role 
 */
function setActiveRole(walletAddress, role) {
    const address = walletAddress.toLowerCase();
    const userData = getUserRoles(address);
    
    if (!userData.roles.includes(role)) {
        throw new Error(`User does not have role: ${role}`);
    }
    
    userData.activeRole = role;
    userRoles.set(address, userData);
    
    console.log(`[RBAC] Active role set for ${address}:`, role);
    return userData;
}

/**
 * Check if user has permission for a route
 * @param {string} walletAddress 
 * @param {string} requiredRole 
 * @returns {boolean}
 */
function hasPermission(walletAddress, requiredRole) {
    const userData = getUserRoles(walletAddress);
    
    // Check if user has the required role or a higher role
    return userData.roles.some(userRole => {
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
        return userLevel >= requiredLevel;
    });
}

/**
 * Check if user's active role matches required role(s)
 * @param {string} walletAddress 
 * @param {string|string[]} requiredRoles 
 * @returns {boolean}
 */
function hasActiveRole(walletAddress, requiredRoles) {
    const userData = getUserRoles(walletAddress);
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return roles.includes(userData.activeRole);
}

/**
 * Get legacy role from RBAC role (backward compatibility)
 * @param {string} role 
 * @returns {string}
 */
function toLegacyRole(role) {
    return RBAC_TO_LEGACY[role] || role;
}

/**
 * Get RBAC role from legacy role
 * @param {string} legacyRole 
 * @returns {string}
 */
function fromLegacyRole(legacyRole) {
    return LEGACY_ROLE_MAP[legacyRole] || legacyRole;
}

/**
 * Migrate legacy single-role user to RBAC
 * @param {string} walletAddress 
 * @param {string} legacyRole 
 */
function migrateLegacyUser(walletAddress, legacyRole) {
    const rbacRole = fromLegacyRole(legacyRole);
    const userData = getUserRoles(walletAddress);
    
    if (userData.roles.length === 0 || 
        (userData.roles.length === 1 && userData.roles[0] === ROLES.VIEWER)) {
        return assignRoles(walletAddress, [rbacRole]);
    }
    
    return userData;
}

// Initialize test data on module load
initializeTestData();

module.exports = {
    ROLES,
    ROLE_HIERARCHY,
    DASHBOARD_PERMISSIONS,
    getUserRoles,
    assignRoles,
    addRole,
    removeRole,
    setActiveRole,
    hasPermission,
    hasActiveRole,
    toLegacyRole,
    fromLegacyRole,
    migrateLegacyUser,
    initializeTestData
};
