# ZK Proof Generation - Parrot OS Guide

## Quick Start on Parrot OS

### Step 1: Copy to VM
```bash
# On your Windows machine, use SCP or copy via shared folder
# Example with SCP:
scp -r zk/ user@parrot-vm-ip:/home/user/
```

### Step 2: SSH into Parrot OS
```bash
ssh user@parrot-vm-ip
cd ~/zk
```

### Step 3: Install Prerequisites (One-Time Setup)
```bash
chmod +x setup_parrot.sh
./setup_parrot.sh
```

This will install:
- Node.js & npm
- Rust
- Circom
- snarkjs

### Step 4: Generate ZK Proofs
```bash
chmod +x generate_zk_proofs.sh
./generate_zk_proofs.sh
```

### Step 5: Copy Files Back to Windows
```bash
# On your Windows machine:
scp -r user@parrot-vm-ip:/home/user/zk/build ./
```

## What You'll Get

After running the script, the `build/` folder will contain:

1. **TrustScoreVerifier.sol** - Copy to `onchain/contracts/`
2. **trust_score_verifier_js/** - Copy to `frontend/src/zk/`
3. **verification_key.json** - Copy to `frontend/src/zk/`
4. **trust_score_verifier_final.zkey** - Copy to `frontend/src/zk/`

## Manual Installation (if setup script fails)

### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Install Circom
```bash
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
sudo cp target/release/circom /usr/local/bin/
```

### Install snarkjs
```bash
sudo npm install -g snarkjs
```

## Troubleshooting

### Permission Denied
```bash
chmod +x *.sh
```

### wget not found
```bash
sudo apt install wget
```

### Node.js version issues
```bash
# Use Node 16 or 18
nvm install 18
nvm use 18
```

### Circom compilation slow
This is normal. The first compilation can take 5-10 minutes depending on your VM resources.

## Expected Runtime

- Setup (first time): ~10-15 minutes
- ZK generation: ~5-10 minutes
- Total: ~20-25 minutes

## VM Requirements

- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: 2+ cores
- **Disk**: 2GB free space
- **OS**: Parrot OS (Debian-based)
