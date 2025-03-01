import {ec} from "elliptic";

export interface KeyPair {
    advertisement: string;
    advertisementHash: string;
    private: string;
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

        return {
            advertisement: advertisementKey,
            advertisementHash: advertisementHash,
            private: privateKey
        };
    }
}

export function isKeyPairValid(keyPair: KeyPair): boolean {
    return !!keyPair.private && !!keyPair.advertisement;
}

export function getMacAddress(keyPair: KeyPair): number[] {
    const keyData = getAdvertisementKeyData(keyPair);

    return [keyData[0] | 0b11000000, ...keyData.slice(1, 6)];
}

export function getAdvertisementKeyData(keyPair: KeyPair): number[] {
    return [...atob(keyPair.advertisement)].map(octet => octet.charCodeAt(0));
}