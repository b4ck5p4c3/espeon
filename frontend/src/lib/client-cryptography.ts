import {fromBase64, toBase64} from "@/lib/base64";

export type Key = CryptoKey;

const AES_ALGORITHM = "AES-GCM";
const AES_KEY_LENGTH = 256;
const AES_IV_LENGTH = 96;

const PBKDF2_ITERATIONS = 1000000;

export async function generateKey(password: string): Promise<Key> {
    const passwordHash = await window.crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(password));
    const passwordSalt = await window.crypto.subtle
        .digest("SHA-512", new TextEncoder().encode(password));

    const passwordDerivationKey = await window.crypto.subtle
        .importKey("raw", passwordHash, "PBKDF2", false, ["deriveKey"]);

    return await window.crypto.subtle.deriveKey({
        name: "PBKDF2",
        hash: "SHA-256",
        salt: passwordSalt,
        iterations: PBKDF2_ITERATIONS
    }, passwordDerivationKey, {
        name: AES_ALGORITHM,
        length: AES_KEY_LENGTH
    }, true, ["decrypt", "encrypt"]);
}

export async function decrypt(key: Key, data: string): Promise<string> {
    const rawData = fromBase64(data);
    const iv = rawData.slice(0, AES_IV_LENGTH / 8);
    const rawEncryptedData = rawData.slice(AES_IV_LENGTH / 8);
    const result = await window.crypto.subtle.decrypt({
        name: AES_ALGORITHM,
        iv: iv
    }, key, rawEncryptedData);
    return new TextDecoder().decode(result);
}

export async function encrypt(key: Key, data: string): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH / 8));
    const result = await window.crypto.subtle.encrypt({
        name: AES_ALGORITHM,
        iv
    }, key, new TextEncoder().encode(data));
    const resultData = new Uint8Array(iv.length + result.byteLength);
    resultData.set(iv, 0);
    resultData.set(new Uint8Array(result), iv.length);
    return toBase64(resultData);
}

export async function exportKey(key: Key): Promise<string> {
    return JSON.stringify(await window.crypto.subtle.exportKey("jwk", key));
}

export async function importKey(exportedKey: string): Promise<Key> {
    return await window.crypto.subtle.importKey("jwk", JSON.parse(exportedKey),
        {
            name: AES_ALGORITHM,
            length: AES_KEY_LENGTH
        }, true, ["decrypt", "encrypt"]);
}