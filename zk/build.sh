#!/bin/bash
set -e

CIRCUIT="trust_score_verifier"
BUILD="build"
OUT="artifacts"
PTAU="pot10_final.ptau"

echo "=== ZK Build: $CIRCUIT ==="

# 1. Prereqs
command -v circom >/dev/null 2>&1 || { echo "ERROR: circom not installed. Run: cargo install circom"; exit 1; }
command -v npx   >/dev/null 2>&1 || { echo "ERROR: npx not found."; exit 1; }

# 2. Directories
mkdir -p "$BUILD" "$OUT"

# 3. Powers of Tau (local ceremony)
if [ ! -f "$BUILD/$PTAU" ]; then
  echo "[1/6] Powers of Tau ceremony..."
  npx snarkjs powersoftau new bn128 10 "$BUILD/pot10_0000.ptau" -v
  npx snarkjs powersoftau contribute "$BUILD/pot10_0000.ptau" "$BUILD/pot10_0001.ptau" \
    --name="SecureTransac" -v -e="$(date +%s)"
  npx snarkjs powersoftau prepare phase2 "$BUILD/pot10_0001.ptau" "$BUILD/$PTAU" -v
  rm "$BUILD/pot10_0000.ptau" "$BUILD/pot10_0001.ptau"
  echo "  Done."
else
  echo "[1/6] Powers of Tau exists, skipping."
fi

# 4. Compile
echo "[2/6] Compiling circuit..."
circom "circuits/${CIRCUIT}.circom" --r1cs --wasm --sym -l node_modules -o "$BUILD"
echo "  Done."

# 5. Witness
echo "[3/6] Generating witness..."
node scripts/gen_input.js "$BUILD"
node "$BUILD/${CIRCUIT}_js/generate_witness.js" \
  "$BUILD/${CIRCUIT}_js/${CIRCUIT}.wasm" \
  "$BUILD/input.json" \
  "$BUILD/witness.wtns"
echo "  Done."

# 6. Groth16 setup
echo "[4/6] Groth16 setup..."
npx snarkjs groth16 setup "$BUILD/${CIRCUIT}.r1cs" "$BUILD/$PTAU" "$BUILD/${CIRCUIT}_0000.zkey"
npx snarkjs zkey contribute "$BUILD/${CIRCUIT}_0000.zkey" "$BUILD/${CIRCUIT}_final.zkey" \
  --name="SecureTransac" -v -e="$(date +%s)"
echo "  Done."

# 7. Export keys
echo "[5/6] Exporting verification key + Solidity verifier..."
npx snarkjs zkey export verificationkey "$BUILD/${CIRCUIT}_final.zkey" "$OUT/verification_key.json"
npx snarkjs zkey export solidityverifier "$BUILD/${CIRCUIT}_final.zkey" "$OUT/TrustScoreVerifier.sol"
echo "  Done."

# 8. Copy runtime artifacts
echo "[6/6] Copying runtime artifacts..."
cp "$BUILD/${CIRCUIT}_js/${CIRCUIT}.wasm" "$OUT/"
cp "$BUILD/${CIRCUIT}_final.zkey"        "$OUT/"
echo "  Done."

# 9. Test proof
echo ""
echo "=== Test: generating + verifying sample proof ==="
npx snarkjs groth16 prove "$OUT/${CIRCUIT}_final.zkey" "$BUILD/witness.wtns" "$OUT/proof.json" "$OUT/public.json"
npx snarkjs groth16 verify "$OUT/verification_key.json" "$OUT/public.json" "$OUT/proof.json"
echo ""
echo "=== Build complete ==="
echo "Output: $OUT/"
ls -lh "$OUT/"
echo ""
echo "Next: npm run copy  (to deploy artifacts to frontend + contracts)"
