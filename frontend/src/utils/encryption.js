import EthCrypto from "eth-crypto";

/**
 * Encrypts data for a target address using ECIES.
 * Note: Requires the target's public key. 
 * For this demo, we can derive the public key from a signature or assume a shared scheme.
 * For true ECIES, we'd need the user's public key registered or provided.
 */
export async function encryptForAddress(publicKey, data) {
    try {
        const encrypted = await EthCrypto.encryptWithPublicKey(
            publicKey,
            JSON.stringify(data)
        );
        return EthCrypto.cipher.stringify(encrypted);
    } catch (error) {
        console.error("Encryption failed:", error);
        throw error;
    }
}

/**
 * Decrypts data using a private key.
 */
export async function decryptWithPrivateKey(privateKey, encryptedString) {
    try {
        const encryptedObject = EthCrypto.cipher.parse(encryptedString);
        const decrypted = await EthCrypto.decryptWithPrivateKey(
            privateKey,
            encryptedObject
        );
        return JSON.parse(decrypted);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw error;
    }
}

/**
 * Since MetaMask doesn't easily expose the public key without a signature,
 * we can derive it from the auth signature if we have it, or use a simpler 
 * symmetric encryption (AES) with a key derived from signing a specific string.
 * Let's use AES with a key derived from signing "SECURE_TRANSAC_DATA_KEY" for simplicity 
 * and UX (user only signs once).
 */
import CryptoJS from "crypto-js";

export async function getSymmetricKey(provider, address) {
    const message = "SECURE_TRANSAC_DATA_KEY_V1";
    // This will prompt MetaMask
    const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
    });
    return CryptoJS.SHA256(signature).toString();
}

export function encryptSymmetric(data, key) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

export function decryptSymmetric(ciphertext, key) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
