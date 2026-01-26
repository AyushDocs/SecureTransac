#!/bin/bash

# ZK Proof Generation Script for SecureTransac
# This script generates all required ZK proof files for the trust score verification system
# Run this on a VM with circom and snarkjs installed

set -e  # Exit on error

echo "=========================================="
echo "ZK Proof Generation Script"
echo "SecureTransac Trust Score Verification"
echo "=========================================="
echo ""

# Configuration
CIRCUIT_NAME="trust_score_verifier"
BUILD_DIR="build"
PTAU_FILE="pot10_final.ptau"

# Check prerequisites
echo "[1/9] Checking prerequisites..."
command -v circom >/dev/null 2>&1 || { echo "ERROR: circom not installed."; exit 1; }
command -v snarkjs >/dev/null 2>&1 || { echo "ERROR: snarkjs not installed."; exit 1; }
echo "✓ Prerequisites OK"
echo ""

# Create build directory
echo "[2/9] Creating build directory..."
mkdir -p $BUILD_DIR
echo "✓ Build directory created"
echo ""

# Generate local Powers of Tau (more reliable than downloading)
if [ ! -f "$BUILD_DIR/$PTAU_FILE" ]; then
    echo "[3/9] Generating local Powers of Tau ceremony..."
    echo "This is faster and more reliable than downloading from external mirrors."
    
    # 1. Start a new ceremony (10 = 1024 constraints, plenty for this circuit)
    snarkjs powersoftau new bn128 10 $BUILD_DIR/pot10_0000.ptau -v
    
    # 2. Contribute to the ceremony (using system time as entropy)
    snarkjs powersoftau contribute $BUILD_DIR/pot10_0000.ptau $BUILD_DIR/pot10_0001.ptau \
      --name="SecureTransac Contribution" -v -e="$(date +%s)"
    
    # 3. Prepare phase 2 (Finalize PTAU)
    snarkjs powersoftau prepare phase2 $BUILD_DIR/pot10_0001.ptau $BUILD_DIR/$PTAU_FILE -v
    
    # Cleanup intermediate files
    rm $BUILD_DIR/pot10_0000.ptau $BUILD_DIR/pot10_0001.ptau
    echo "✓ Local Powers of Tau generated"
else
    echo "[3/9] Local Powers of Tau file exists, skipping generation"
fi
echo ""

# Compile circuit
echo "[4/9] Compiling circuit..."
circom circuits/${CIRCUIT_NAME}.circom --r1cs --wasm --sym -l node_modules -o $BUILD_DIR
echo "✓ Circuit compiled successfully"
echo ""

# Generate witness (with sample input)
echo "[5/9] Generating witness with sample input..."
cat > $BUILD_DIR/input.json << EOF
{
  "trustScore": "750",
  "threshold": "600",
  "userSecret": "123456789"
}
EOF

node $BUILD_DIR/${CIRCUIT_NAME}_js/generate_witness.js \
  $BUILD_DIR/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm \
  $BUILD_DIR/input.json \
  $BUILD_DIR/witness.wtns
echo "✓ Witness generated"
echo ""

# Setup (Generate proving and verification keys)
echo "[6/9] Generating zkey (proving key)..."
snarkjs groth16 setup \
  $BUILD_DIR/${CIRCUIT_NAME}.r1cs \
  $BUILD_DIR/$PTAU_FILE \
  $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey
echo "✓ Initial zkey generated"
echo ""

# Contribute to ceremony (for production, do multiple contributions)
echo "[7/9] Contributing to ceremony..."
snarkjs zkey contribute \
  $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey \
  $BUILD_DIR/${CIRCUIT_NAME}_final.zkey \
  --name="SecureTransac Contribution" \
  -v -e="$(date +%s)"
echo "✓ Ceremony contribution complete"
echo ""

# Export verification key
echo "[8/9] Exporting verification key..."
snarkjs zkey export verificationkey \
  $BUILD_DIR/${CIRCUIT_NAME}_final.zkey \
  $BUILD_DIR/verification_key.json
echo "✓ Verification key exported"
echo ""

# Generate Solidity verifier
echo "[9/9] Generating Solidity verifier contract..."
snarkjs zkey export solidityverifier \
  $BUILD_DIR/${CIRCUIT_NAME}_final.zkey \
  $BUILD_DIR/TrustScoreVerifier.sol
echo "✓ Solidity verifier generated"
echo ""

# Generate proof with sample input (for testing)
echo "[BONUS] Generating sample proof for testing..."
snarkjs groth16 prove \
  $BUILD_DIR/${CIRCUIT_NAME}_final.zkey \
  $BUILD_DIR/witness.wtns \
  $BUILD_DIR/proof.json \
  $BUILD_DIR/public.json
echo "✓ Sample proof generated"
echo ""

# Verify the proof
echo "[VERIFICATION] Verifying sample proof..."
snarkjs groth16 verify \
  $BUILD_DIR/verification_key.json \
  $BUILD_DIR/public.json \
  $BUILD_DIR/proof.json
echo ""

# Summary
echo "=========================================="
echo "✅ ZK Proof Generation Complete!"
echo "=========================================="
echo ""
echo "Generated files in '$BUILD_DIR/':"
echo "  1. ${CIRCUIT_NAME}.r1cs          - Constraint system"
echo "  2. ${CIRCUIT_NAME}_js/           - WASM witness generator"
echo "  3. ${CIRCUIT_NAME}_final.zkey    - Proving key"
echo "  4. verification_key.json         - Verification key"
echo "  5. TrustScoreVerifier.sol        - Solidity verifier contract"
echo "  6. proof.json                    - Sample proof (for testing)"
echo "  7. public.json                   - Public signals (for testing)"
echo ""
echo "📋 Next Steps:"
echo "  1. Copy 'TrustScoreVerifier.sol' to your contracts folder"
echo "  2. Copy '${CIRCUIT_NAME}_js/' to your frontend for proof generation"
echo "  3. Copy 'verification_key.json' to your frontend"
echo "  4. Deploy the verifier contract"
echo ""
echo "🔒 Security Note:"
echo "  For production, perform multiple ceremony contributions"
echo "  and use a more secure random entropy source."
echo ""
