import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BlindSignatureService {
    constructor() {
        this.keyPath = path.join(__dirname, '../../data/private/blind_keys.json');
        this.keys = this._loadOrGenerateKeys();
    }

    _loadOrGenerateKeys() {
        if (fs.existsSync(this.keyPath)) {
            console.log("[BlindSig] Loading existing RSA keys from disk...");
            try {
                const data = JSON.parse(fs.readFileSync(this.keyPath, 'utf8'));
                return {
                    n: BigInt(data.n),
                    e: BigInt(data.e),
                    d: BigInt(data.d),
                    publicKey: data.publicKey
                };
            } catch (e) {
                console.error("[BlindSig] Failed to load keys, regenerating...", e);
            }
        }

        console.log("[BlindSig] Generating 2048-bit RSA Keys...");
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
        });

        const privJwk = privateKey.export({ format: 'jwk' });
        const pubJwk = publicKey.export({ format: 'jwk' });

        const keys = {
            n: this._base64urlToBigInt(privJwk.n),
            e: this._base64urlToBigInt(privJwk.e),
            d: this._base64urlToBigInt(privJwk.d),
            publicKey: pubJwk
        };

        // Persist for dev stability (Nodemon restarts)
        const dir = path.dirname(this.keyPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.keyPath, JSON.stringify({
            n: keys.n.toString(),
            e: keys.e.toString(),
            d: keys.d.toString(),
            publicKey: keys.publicKey
        }, null, 2));

        return keys;
    }

    _base64urlToBigInt(str) {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const buf = Buffer.from(base64, 'base64');
        return BigInt('0x' + buf.toString('hex'));
    }

    getPublicKeys() {
        return {
            n: this.keys.n.toString(),
            e: this.keys.e.toString()
        };
    }

    // Server Signs the Blinded Message: S' = (m')^d mod n
    signBlindedMessage(blindedMessageDecimalStr) {
        const m_prime = BigInt(blindedMessageDecimalStr);
        const { d, n } = this.keys;
        
        // Compute m' ^ d mod n
        const s_prime = this._modPow(m_prime, d, n);
        
        return s_prime.toString();
    }

    // Verify that unblinded signature s is valid for message hash m: s^e mod n == m
    verifySignature(m_decimal, s_decimal) {
        const m = BigInt(m_decimal);
        const s = BigInt(s_decimal);
        const { e, n } = this.keys;
        
        const verification = this._modPow(s, e, n);
        
        const isValid = verification === m;
        if (!isValid) {
            console.error("[BlindSig] Verification Failed!");
            console.error(`- M_actual:   ${m.toString().substring(0, 20)}...`);
            console.error(`- S^e mod n:  ${verification.toString().substring(0, 20)}...`);
        } else {
            console.log("[BlindSig] Verification Successful.");
        }
        return isValid;
    }
    
    // Modular Exponentiation: base^exp mod modulus
    _modPow(base, exp, modulus) {
        let result = 1n;
        base = base % modulus;
        while (exp > 0n) {
            if (exp % 2n === 1n) result = (result * base) % modulus;
            exp = exp / 2n;
            base = (base * base) % modulus;
        }
        return result;
    }
}

export default new BlindSignatureService();
