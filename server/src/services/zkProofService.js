import fs from "fs";
import path from "path";
import * as snarkjs from "snarkjs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WASM_PATH = path.resolve(__dirname, "../../../zk/build/trust_score_verifier_js/trust_score_verifier.wasm");
const ZKEY_PATH = path.resolve(__dirname, "../../../zk/build/trust_score_verifier_final.zkey");
const VKEY_PATH = path.resolve(__dirname, "../../../zk/build/verification_key.json");

class ZKProofService {
    async generateScoreProof(trustScore, threshold, userSecret) {
        console.log(`[ZK-Server] Generating proof for Score: ${trustScore} >= ${threshold}`);

        if (!fs.existsSync(WASM_PATH) || !fs.existsSync(ZKEY_PATH)) {
            throw new Error("ZK artifacts not found on server. Run `cd zk && npm run build` first.");
        }

        // Convert secret to numeric salt
        const salt = userSecret.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        try {
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                {
                    score: trustScore.toString(),
                    salt: salt.toString(),
                    threshold: threshold.toString(),
                },
                WASM_PATH,
                ZKEY_PATH
            );
            return { proof, publicSignals };
        } catch (error) {
            console.error("[ZK-Server] Proof failed:", error);
            throw new Error("Proof generation failed. Score likely assumes incorrect scale or threshold not met.");
        }
    }

    async verifyScoreProof(proof, publicSignals) {
        console.log("[ZK-Server] Verifying proof...");

        if (!fs.existsSync(VKEY_PATH)) {
            throw new Error("Verification key not found on server.");
        }

        const vKey = JSON.parse(fs.readFileSync(VKEY_PATH, 'utf8'));

        try {
            const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            return res;
        } catch (error) {
            console.error("[ZK-Server] Verification error:", error);
            return false;
        }
    }
}

export default new ZKProofService();
