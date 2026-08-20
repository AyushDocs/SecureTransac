#!/usr/bin/env node
/**
 * Post-deploy contract synchronizer.
 *
 * Usage: node scripts/sync_contracts.js [networkId]
 *   e.g. node scripts/sync_contracts.js         (auto-detect local network)
 *        node scripts/sync_contracts.js 5777
 *        node scripts/sync_contracts.js 11155111  (Sepolia)
 *
 * Single source of truth: onchain/build/contracts/*.json (written by truffle migrate).
 *
 * This script propagates deployed addresses AND full ABIs to every consumer:
 *   1. frontend/src/contracts/*.json   (full artifact copy — ABI + networks)
 *   2. frontend/src/api/contractAddresses.generated.js
 *   3. frontend/Dockerfile             (ARG defaults)
 *   4. docker-compose.yml              (server env defaults)
 *   5. .env.example                    (root defaults)
 *
 * Run it AFTER `truffle migrate` — never hand-edit the consumers above.
 */
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '../build/contracts');
const FRONTEND_CONTRACTS_DIR = path.resolve(__dirname, '../../frontend/src/contracts');
const FRONTEND_GENERATED = path.resolve(__dirname, '../../frontend/src/api/contractAddresses.generated.js');
const FRONTEND_DOCKERFILE = path.resolve(__dirname, '../../frontend/Dockerfile');
const COMPOSE_FILE = path.resolve(__dirname, '../../docker-compose.yml');
const ROOT_ENV_EXAMPLE = path.resolve(__dirname, '../../.env.example');

// Pick the network to sync. Prefer an explicit arg, else local (1337 -> 5777 -> first).
function pickNetworkId() {
    if (process.argv[2]) return process.argv[2];
    const candidates = new Set();
    for (const file of fs.readdirSync(BUILD_DIR)) {
        if (!file.endsWith('.json')) continue;
        const artifact = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, file), 'utf8'));
        Object.keys(artifact.networks || {}).forEach((n) => candidates.add(n));
    }
    if (candidates.has('1337')) return '1337';
    if (candidates.has('5777')) return '5777';
    if (candidates.size > 0) return [...candidates].sort()[0];
    console.error(`No networks found in ${BUILD_DIR}. Run 'truffle migrate' first.`);
    process.exit(1);
}

// Contract -> display key used across env files / generated module
const MAIN_CONTRACTS = [
    { name: 'TrustRegistry', key: 'TrustRegistry', env: 'REGISTRY_ADDRESS', vite: 'VITE_TRUST_REGISTRY_TRUST_REGISTRY_ADDRESS' },
    { name: 'IdentityVault', key: 'IdentityVault', env: 'VAULT_ADDRESS', vite: 'VITE_IDENTITY_VAULT_ADDRESS' },
    { name: 'VerificationRegistry', key: 'VerificationRegistry', env: 'VERIFICATION_ADDRESS', vite: 'VITE_VERIFICATION_REGISTRY_ADDRESS' },
    { name: 'TrustDAO', key: 'TrustDAO', env: 'DAO_ADDRESS', vite: null },
    { name: 'SoulBoundToken', key: 'SoulBoundToken', env: 'SBT_ADDRESS', vite: null },
    { name: 'TransactionLogger', key: 'TransactionLogger', env: 'TRANSACTION_LOGGER_ADDRESS', vite: null },
    { name: 'AVToken', key: 'AVToken', env: null, vite: 'VITE_AV_TOKEN_ADDRESS' },
];

function loadDeployed(networkId) {
    const deployed = {};
    for (const file of fs.readdirSync(BUILD_DIR)) {
        if (!file.endsWith('.json')) continue;
        const artifact = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, file), 'utf8'));
        const network = artifact.networks && artifact.networks[networkId];
        if (network && network.address) {
            deployed[artifact.contractName] = { address: network.address, artifactPath: path.join(BUILD_DIR, file) };
        }
    }
    if (Object.keys(deployed).length === 0) {
        console.error(`No deployments found for network ${networkId} in ${BUILD_DIR}`);
        process.exit(1);
    }
    return deployed;
}

// key=value        (plain env assignment)
// ${KEY:-value}    (compose-style default — checked first so it keeps its syntax)
function replaceEnvValue(filePath, key, value) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(`\${${key}:-`)) {
        const updated = content.replace(new RegExp(`(\\$\\{${key}:-)[^}]*\\}`, 'g'), `$1${value}}`);
        fs.writeFileSync(filePath, updated);
        return;
    }
    if (content.includes(`${key}=`)) {
        const updated = content.replace(new RegExp(`(${key}=)[^\\r\\n]*`, 'g'), `$1${value}`);
        fs.writeFileSync(filePath, updated);
        return;
    }
    console.warn(`  ⚠ ${path.relative(process.cwd(), filePath)}: no entry for ${key} (skipped)`);
}

function main() {
    const networkId = pickNetworkId();
    const deployed = loadDeployed(networkId);
    const addresses = {};

    for (const c of MAIN_CONTRACTS) {
        if (deployed[c.name]) addresses[c.key] = deployed[c.name].address;
    }

    console.log(`\n=== Syncing deployment (network ${networkId}) ===\n`);

    // 1. Copy full artifacts -> frontend (only contracts deployed on this network)
    //    Scrub stale network entries so consumers can never resolve an outdated address.
    for (const [name, info] of Object.entries(deployed)) {
        const artifact = JSON.parse(fs.readFileSync(info.artifactPath, 'utf8'));
        const networkEntry = artifact.networks[networkId];
        artifact.networks = {};
        artifact.networks[networkId] = networkEntry;
        const dst = path.join(FRONTEND_CONTRACTS_DIR, `${name}.json`);
        fs.writeFileSync(dst, JSON.stringify(artifact, null, 2));
        console.log(`✓ frontend/src/contracts/${name}.json -> ${info.address}`);
    }

    // 2. Regenerate frontend/src/api/contractAddresses.generated.js
    const lines = [
        '// AUTO-GENERATED by onchain/scripts/sync_contracts.js — DO NOT EDIT.',
        `// Regenerate with \`npm run sync\` in /onchain after \`truffle migrate\`.`,
        `// Network: ${networkId}`,
        '',
        `export const DEPLOYED_NETWORK_ID = "${networkId}";`,
        '',
        'export const CONTRACT_ADDRESSES = {',
        ...Object.entries(addresses).map(([k, v]) => `  ${k}: "${v}",`),
        '};',
        '',
    ];
    fs.writeFileSync(FRONTEND_GENERATED, lines.join('\n'));
    console.log(`✓ frontend/src/api/contractAddresses.generated.js (${Object.keys(addresses).length} contracts)`);

    // 3. frontend/Dockerfile ARG defaults
    for (const c of MAIN_CONTRACTS) {
        if (!c.vite || !addresses[c.key]) continue;
        replaceEnvValue(FRONTEND_DOCKERFILE, c.vite, addresses[c.key]);
    }
    console.log('✓ frontend/Dockerfile ARG defaults');

    // 4. docker-compose.yml server env defaults
    for (const c of MAIN_CONTRACTS) {
        if (!c.env || !addresses[c.key]) continue;
        replaceEnvValue(COMPOSE_FILE, c.env, addresses[c.key]);
    }
    console.log('✓ docker-compose.yml defaults');

    // 5. root .env.example defaults
    for (const c of MAIN_CONTRACTS) {
        if (!addresses[c.key]) continue;
        if (c.env) replaceEnvValue(ROOT_ENV_EXAMPLE, c.env, addresses[c.key]);
        if (c.vite) replaceEnvValue(ROOT_ENV_EXAMPLE, c.vite, addresses[c.key]);
    }
    console.log('✓ .env.example defaults');

    console.log('\n=== All deployments ===');
    for (const [name, info] of Object.entries(deployed)) {
        console.log(`${name}: ${info.address}`);
    }
    console.log('\nNext: restart the backend if it is running (nodemon auto-restarts on artifact changes).');
}

main();
