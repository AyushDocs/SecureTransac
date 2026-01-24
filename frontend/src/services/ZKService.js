import * as snarkjs from "snarkjs";

/**
 * Service to handle client-side ZK-SNARK proof generation.
 * Enables privacy-preserving claims (e.g., "My score is > 700").
 */
const ZKService = {
  /**
   * Generates a proof that trustScore >= threshold
   * @param {number} trustScore Actual score from registry
   * @param {number} threshold The threshold to prove against
   * @param {string} userSecret A private entropy string known only to user
   */
  async generateScoreProof(trustScore, threshold, userSecret) {
    console.log(`[ZK] Generating proof for Score: ${trustScore} >= ${threshold}...`);
    
    // Convert secret string to a numeric field element (simplified for demo)
    const secretHash = userSecret.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const input = {
      trustScore: trustScore.toString(),
      threshold: threshold.toString(),
      userSecret: secretHash.toString()
    };

    try {
      // In Vite, we fetch assets from the public folder or imports
      // Using relative paths to the public directory where we should store ZK artifacts
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "/zk/trust_score_verifier.wasm",
        "/zk/trust_score_verifier_final.zkey"
      );

      console.log("[ZK] Proof generated successfully");
      return { proof, publicSignals };
    } catch (error) {
      console.error("[ZK] Proof generation failed:", error);
      throw error;
    }
  },

  /**
   * Verify a generated proof locally (off-chain)
   */
  async verifyScoreProofLocally(proof, publicSignals) {
    try {
      const vKeyRes = await fetch("/zk/verification_key.json");
      const vKey = await vKeyRes.json();
      
      const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      return res;
    } catch (error) {
      console.error("[ZK] Local verification failed:", error);
      return false;
    }
  }
};

export default ZKService;
