#!/bin/bash

# Quick Setup Script for Parrot OS
# This installs all prerequisites for ZK proof generation

echo "=========================================="
echo "ZK Prerequisites Setup for Parrot OS"
echo "=========================================="
echo ""

# Update system
echo "[1/5] Updating system packages..."
sudo apt update
echo "✓ System updated"
echo ""

# Install Node.js and npm (if not installed)
echo "[2/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✓ Node.js already installed: $(node --version)"
fi
echo ""

# Install Rust (required for Circom)
echo "[3/5] Installing Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "✓ Rust already installed: $(rustc --version)"
fi
echo ""

# Install Circom
echo "[4/5] Installing Circom..."
if ! command -v circom &> /dev/null; then
    cd /tmp
    git clone https://github.com/iden3/circom.git
    cd circom
    cargo build --release
    sudo cp target/release/circom /usr/local/bin/
    cd ~
    rm -rf /tmp/circom
else
    echo "✓ Circom already installed: $(circom --version)"
fi
echo ""

# Install snarkjs
echo "[5/5] Installing snarkjs..."
if ! command -v snarkjs &> /dev/null; then
    sudo npm install -g snarkjs
else
    echo "✓ snarkjs already installed"
fi
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Installed tools:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Rust: $(rustc --version)"
echo "  - Circom: $(circom --version)"
echo "  - snarkjs: $(snarkjs --version)"
echo ""
echo "Next step: Run ./generate_zk_proofs.sh"
echo ""
