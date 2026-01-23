pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template VerifyIdentity() {
    // Private inputs (User Secrets)
    signal private input secret;
    signal private input identityNullifier;

    // Public inputs (On-chain Checks)
    signal input root;
    signal input commitmentHash;

    // Output
    signal output nullifierHash;

    // Hashing
    component hasher = Poseidon(2);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== identityNullifier;

    // Constraint: Commitment must match
    commitmentHash === hasher.out;

    // Nullifier generation (to prevent double-spending this proof if needed)
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== identityNullifier;
    nullifierHash <== nullifierHasher.out;
}

component main {public [root, commitmentHash]} = VerifyIdentity();
