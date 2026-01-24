# ZK Proof Generation for SecureTransac

This directory contains the Zero-Knowledge proof system for privacy-preserving trust score verification.

## Overview

The ZK proof system allows users to prove their trust score is above a threshold without revealing the exact score.

## Prerequisites

### Install Circom
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh

# Install Circom
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

### Install snarkjs
```bash
npm install -g snarkjs
```

## Quick Start

1. **Copy this folder to your VM**:
   ```bash
   scp -r zk/ user@your-vm:/path/to/destination/
   ```

2. **SSH into your VM**:
   ```bash
   ssh user@your-vm
   cd /path/to/destination/zk
   ```

3. **Make the script executable**:
   ```bash
   chmod +x generate_zk_proofs.sh
   ```

4. **Run the generation script**:
   ```bash
   ./generate_zk_proofs.sh
   ```

5. **Copy generated files back**:
   ```bash
   # On your local machine
   scp -r user@your-vm:/path/to/destination/zk/build ./
   ```

## Generated Files

After running the script, you'll have:

- `build/TrustScoreVerifier.sol` - Solidity verifier contract (copy to `onchain/contracts/`)
- `build/trust_score_verifier_js/` - WASM witness generator (copy to `frontend/src/zk/`)
- `build/verification_key.json` - Verification key (copy to `frontend/src/zk/`)
- `build/trust_score_verifier_final.zkey` - Proving key (copy to `frontend/src/zk/`)

## Manual Steps (if script fails)

```bash
# 1. Create build directory
mkdir -p build

# 2. Download Powers of Tau
wget -O build/powersOfTau28_hez_final_12.ptau \
  https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

# 3. Compile circuit
circom circuits/trust_score_verifier.circom --r1cs --wasm --sym -o build

# 4. Generate zkey
snarkjs groth16 setup \
  build/trust_score_verifier.r1cs \
  build/powersOfTau28_hez_final_12.ptau \
  build/trust_score_verifier_0000.zkey

# 5. Contribute to ceremony
snarkjs zkey contribute \
  build/trust_score_verifier_0000.zkey \
  build/trust_score_verifier_final.zkey \
  --name="Contribution" -v

# 6. Export verification key
snarkjs zkey export verificationkey \
  build/trust_score_verifier_final.zkey \
  build/verification_key.json

# 7. Generate Solidity verifier
snarkjs zkey export solidityverifier \
  build/trust_score_verifier_final.zkey \
  build/TrustScoreVerifier.sol
```

## Integration

### 1. Deploy Verifier Contract
```bash
# Copy to contracts
cp build/TrustScoreVerifier.sol ../onchain/contracts/

# Deploy (add to migrations)
truffle migrate --network development
```

### 2. Frontend Integration
```bash
# Copy ZK artifacts
mkdir -p ../frontend/src/zk
cp -r build/trust_score_verifier_js ../frontend/src/zk/
cp build/verification_key.json ../frontend/src/zk/
cp build/trust_score_verifier_final.zkey ../frontend/src/zk/
```

### 3. Generate Proofs in Frontend
```javascript
import { groth16 } from 'snarkjs';

async function generateProof(trustScore, threshold, userSecret) {
  const input = {
    trustScore: trustScore.toString(),
    threshold: threshold.toString(),
    userSecret: userSecret.toString()
  };

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    '/zk/trust_score_verifier_js/trust_score_verifier.wasm',
    '/zk/trust_score_verifier_final.zkey'
  );

  return { proof, publicSignals };
}
```

## Troubleshooting

### "circom: command not found"
Install Circom following the prerequisites section.

### "snarkjs: command not found"
```bash
npm install -g snarkjs
```

### "Powers of Tau download failed"
Manually download from: https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

### Circuit compilation errors
Check that `circuits/trust_score_verifier.circom` exists and is valid.

## Security Notes

- For production, perform multiple trusted setup contributions
- Use secure random entropy for ceremony contributions
- Keep the proving key (`_final.zkey`) secure
- The verification key can be public

## Resources

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Documentation](https://github.com/iden3/snarkjs)
- [ZK-SNARKs Explained](https://z.cash/technology/zksnarks/)
