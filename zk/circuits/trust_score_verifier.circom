pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

// Proven Range Proof
// Proves that:
// 1. I know 'score' and 'salt'
// 2. Poseidon(score, salt) == commitment (Public Input)
// 3. score >= threshold (Public Input)

template RangeProof() {
    // Private Inputs
    signal input score;
    signal input salt;

    // Public Inputs
    signal input commitment;
    signal input threshold;

    // Output (none, constraint only)

    // 1. Verify Commitment (Integrity of Score)
    component hasher = Poseidon(2);
    hasher.inputs[0] <== score;
    hasher.inputs[1] <== salt;
    
    commitment === hasher.out;

    // 2. Verify Range (score >= threshold)
    // using GreaterEqThan(n) where n is number of bits. 
    // Assuming score fits in 64 bits for safety (though scores are 0-100 usually)
    component ge = GreaterEqThan(64); 
    ge.in[0] <== score;
    ge.in[1] <== threshold;
    
    ge.out === 1;
}

component main {public [commitment, threshold]} = RangeProof();
