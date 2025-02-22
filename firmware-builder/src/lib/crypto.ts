import {ec} from "elliptic";

export interface KeyPair {
    advertisement: string;
    advertisementHash: string;
    private: string;
    mac: string;
}

export function toBase64(buffer: ArrayBuffer): string {
    return btoa(Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join(''));
}

export async function generateKeyPair(): Promise<KeyPair> {
    while (true) {
        const curve = new ec("p224");
        const keyPair = curve.genKeyPair();
        const publicKey = new Uint8Array(keyPair.getPublic().encode("array", true).slice(1));
        const advertisementKey = toBase64(publicKey.buffer);
        const privateKey = toBase64(new Uint8Array(keyPair.getPrivate().toArray()).buffer);
        const advertisementHash = toBase64(await crypto.subtle.digest("sha-256", publicKey));

        if (advertisementHash.includes("/") || advertisementHash.includes("+")) {
            continue;
        }

        const mac = [
            publicKey[5],
            publicKey[4],
            publicKey[3],
            publicKey[2],
            publicKey[1],
            publicKey[0] | 0b11000000,
        ].map(b => b.toString(16).padStart(2, "0")).join(":").toUpperCase();

        return {
            advertisement: advertisementKey,
            advertisementHash: advertisementHash,
            private: privateKey,
            mac,
        };
    }
}

export function isKeyPairValid(keyPair: KeyPair): boolean {
    return !!keyPair.private && !!keyPair.advertisement;
}