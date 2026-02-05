import elliptic from 'elliptic';
import { Web3 } from 'web3';
const { ec: EC } = elliptic;
const ec = new EC('secp256k1');
const web3 = new Web3();

class StealthService {
    /**
     * Generates a Stealth Address for a given Receiver Public Key.
     * Uses the standard scheme: P_stealth = P_receiver + G * Hash(r * P_receiver)
     * @param {string} [receiverPublicKeyHex] - Optional receiver public key (hex). If null, generates one.
     */
    generateStealthMeta(receiverPublicKeyHex) {
        try {
            // 1. Receiver Key (P)
            let P;
            if (receiverPublicKeyHex) {
                // Remove 0x prefix if present
                const cleanKey = receiverPublicKeyHex.replace('0x', '');
                P = ec.keyFromPublic(cleanKey, 'hex').getPublic();
            } else {
                // Demo Mode: Generate a random receiver keypair to simulate "My Public Key"
                const rK = ec.genKeyPair();
                P = rK.getPublic();
            }

            // 2. Sender Ephemeral Key (r, R)
            // r = random private, R = r * G (Ephemeral Public Key)
            const ephemeral = ec.genKeyPair();
            const R = ephemeral.getPublic(); 

            // 3. Shared Secret S = r * P (ECDH)
            const S_point = P.mul(ephemeral.getPrivate());
            // Use X coordinate as pre-image for shared secret
            const S_hex = S_point.getX().toString(16).padStart(64, '0');

            // 4. Hash Shared Secret: s = Keccak(S)
            // This 's' serves as the "blinding factor" / ONE-TIME PRIVATE KEY SHIFT
            const s_hash = web3.utils.sha3("0x" + S_hex).slice(2); 
            const s_scalar = ec.keyFromPrivate(s_hash, 'hex').getPrivate();

            // 5. Stealth Public Key: P_stealth = P + G*s
            // This allows the receiver to derive the private key: d_stealth = d_receiver + s
            const Gs = ec.g.mul(s_scalar);
            const P_stealth_point = P.add(Gs);

            // 6. Derive Ethereum Address from Stealth Public Key
            // Eth address = Last 20 bytes of Keccak256(Uncompressed_Pub_Key_Excluding_Prefix)
            const pubUncompressed = P_stealth_point.encode('hex', false); // '04' + X + Y
            const pubNoPrefix = pubUncompressed.slice(2); // Remove '04'
            
            const hash = web3.utils.sha3("0x" + pubNoPrefix);
            const address = web3.utils.toChecksumAddress("0x" + hash.slice(-40));

            return {
                ephemeralPublicKey: R.encode('hex'), // Sender publishes this
                stealthAddress: address,             // Sender sends funds/data here
                scheme: "secp256k1/keccak",
                // Demo info
                sharedSecretPreview: S_hex.slice(0, 10) + "..."
            };
        } catch (error) {
            console.error("Stealth Gen Error:", error);
            throw new Error("Failed to generate stealth address: " + error.message);
        }
    }
}

export default new StealthService();
