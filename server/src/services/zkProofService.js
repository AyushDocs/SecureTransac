const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

const WASM_PATH = path.resolve(__dirname, "../../../zk/build/trust_score_verifier_js/trust_score_verifier.wasm");
const ZKEY_PATH = path.resolve(__dirname, "../../../zk/build/trust_score_verifier_final.zkey");

class ZKProofService {
    async generateScoreProof(trustScore, threshold, userSecret) {
        console.log(`[ZK-Server] Generating proof for Score: ${trustScore} >= ${threshold}`);

        if (!fs.existsSync(WASM_PATH) || !fs.existsSync(ZKEY_PATH)) {
            throw new Error("ZK artifacts not found on server. Please ensure ZK build exists.");
        }

        // Convert secret to numeric entropy
        const secretHash = userSecret.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const input = {
            trustScore: trustScore.toString(),
            threshold: threshold.toString(),
            userSecret: secretHash.toString()
        };

        try {
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                WASM_PATH,
                ZKEY_PATH
            );
            return { proof, publicSignals };
        } catch (error) {
            console.error("[ZK-Server] Proof failed:", error);
            throw new Error("Proof generation failed. Score likely assumes incorrect scale or threshold not met.");
        }
    }
}

module.exports = new ZKProofService();
