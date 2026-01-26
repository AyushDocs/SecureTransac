const fs = require('fs');
const path = require('path');

const files = [
    'TrustRegistry.json',
    'IdentityVault.json',
    'VerificationRegistry.json',
    'TrustDAO.json',
    'SecureTransacToken.json',
    'TransactionLogger.json'
];

const srcDir = path.resolve(__dirname, '../../onchain/build/contracts');
const destDir = path.resolve(__dirname, '../../frontend/src/contracts');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

files.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    try {
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied ${file}`);
        } else {
            console.log(`Skipped ${file} (Source not found)`);
        }
    } catch (e) {
        console.error(`Error copying ${file}: ${e.message}`);
    }
});
console.log("Artifacts sync complete.");
