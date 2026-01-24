/**
 * RBAC Role Assignment Script
 * Use this to assign roles to wallets for testing multi-dashboard access
 * 
 * Usage:
 *   node src/scripts/assignRoles.js <walletAddress> <role1> [role2] [role3]
 * 
 * Examples:
 *   node src/scripts/assignRoles.js 0x1234... admin creator viewer
 *   node src/scripts/assignRoles.js 0x5678... deployer admin
 */

const rbacService = require('../services/rbacService');

const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node assignRoles.js <walletAddress> <role1> [role2] [role3]');
    console.log('');
    console.log('Available roles:', Object.values(rbacService.ROLES).join(', '));
    console.log('');
    console.log('Examples:');
    console.log('  node assignRoles.js 0x1234567890abcdef... admin creator viewer');
    console.log('  node assignRoles.js 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 deployer admin creator viewer');
    process.exit(1);
}

const [walletAddress, ...rolesToAssign] = args;

// Validate wallet address format
if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    console.error('Error: Invalid wallet address format. Must be 0x followed by 40 hex characters.');
    process.exit(1);
}

// Validate roles
const invalidRoles = rolesToAssign.filter(r => !Object.values(rbacService.ROLES).includes(r));
if (invalidRoles.length > 0) {
    console.error('Error: Invalid roles:', invalidRoles.join(', '));
    console.log('Available roles:', Object.values(rbacService.ROLES).join(', '));
    process.exit(1);
}

try {
    const result = rbacService.assignRoles(walletAddress, rolesToAssign);
    
    console.log('');
    console.log('✅ Roles assigned successfully!');
    console.log('');
    console.log('Wallet:', walletAddress);
    console.log('Roles:', result.roles.join(', '));
    console.log('Active Role:', result.activeRole);
    console.log('');
    console.log('The user can now:');
    console.log('  1. Connect with MetaMask using this wallet');
    console.log('  2. After login, they will see the dashboard selector');
    console.log('  3. Switch between dashboards without reconnecting');
    console.log('');
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
