#!/usr/bin/env node
/**
 * Post-deploy address exporter.
 *
 * Usage: node scripts/export_addresses.js <networkId>
 *   e.g. node scripts/export_addresses.js 11155111  (Sepolia)
 *        node scripts/export_addresses.js 80002      (Polygon Amoy)
 *        node scripts/export_addresses.js 5777       (Ganache)
 *
 * 1. Reads deployed addresses from onchain/build/contracts/*.json
 * 2. Syncs the `networks` entry into frontend/src/contracts/*.json
 * 3. Prints the environment variables to set for the server (.env)
 */
const fs = require('fs');
const path = require('path');

const networkId = process.argv[2];
if (!networkId) {
    console.error('Usage: node scripts/export_addresses.js <networkId>');
    process.exit(1);
}

const BUILD_DIR = path.resolve(__dirname, '../build/contracts');
const FRONTEND_CONTRACTS_DIR = path.resolve(__dirname, '../../frontend/src/contracts');

// Contract -> env var mapping for the server
const SERVER_ENV = {
    TrustRegistry: 'REGISTRY_ADDRESS',
    IdentityVault: 'VAULT_ADDRESS',
    VerificationRegistry: 'VERIFICATION_ADDRESS',
    TrustDAO: 'DAO_ADDRESS',
    SoulBoundToken: 'SBT_ADDRESS',
    TransactionLogger: 'TRANSACTION_LOGGER_ADDRESS',
};

// Contract -> frontend VITE_ env var (matches frontend/src/api/config.js)
const FRONTEND_ENV = {
    TrustRegistry: 'VITE_TRUST_REGISTRY_TRUST_REGISTRY_ADDRESS',
    IdentityVault: 'VITE_IDENTITY_VAULT_ADDRESS',
    VerificationRegistry: 'VITE_VERIFICATION_REGISTRY_ADDRESS',
};

const deployed = {};
for (const file of fs.readdirSync(BUILD_DIR)) {
    if (!file.endsWith('.json')) continue;
    const artifact = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, file), 'utf8'));
    const network = artifact.networks && artifact.networks[networkId];
    if (network && network.address) {
        deployed[artifact.contractName] = network.address;
    }
}

if (Object.keys(deployed).length === 0) {
    console.error(`No deployments found for network ${networkId} in ${BUILD_DIR}`);
    process.exit(1);
}

// 1. Sync frontend contract artifacts
for (const file of fs.readdirSync(FRONTEND_CONTRACTS_DIR)) {
    if (!file.endsWith('.json')) continue;
    const artifactPath = path.join(FRONTEND_CONTRACTS_DIR, file);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const address = deployed[artifact.contractName];
    if (!address) continue;

    artifact.networks = artifact.networks || {};
    artifact.networks[networkId] = { address };
    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
    console.log(`✓ frontend/src/contracts/${file} -> ${address}`);
}

// 2. Print server env vars
console.log('\n=== Server .env (copy these) ===');
for (const [contract, envVar] of Object.entries(SERVER_ENV)) {
    if (deployed[contract]) {
        console.log(`${envVar}=${deployed[contract]}`);
    }
}

console.log('\n=== Frontend build args (docker-compose / VITE_) ===');
for (const [contract, envVar] of Object.entries(FRONTEND_ENV)) {
    if (deployed[contract]) {
        console.log(`${envVar}=${deployed[contract]}`);
    }
}

console.log('\n=== All deployments ===');
for (const [name, address] of Object.entries(deployed)) {
    console.log(`${name}: ${address}`);
}
