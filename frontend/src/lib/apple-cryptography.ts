import {ec, ec as EC} from "elliptic";
import {fromBase64, toBase64} from "@/lib/base64";

export async function getAdvertisementKey(privateKey: string): Promise<string> {
    const advertisementKey = getPublicKey(privateKey);
    const crypto = window.crypto.subtle;
    const advertisementKeyHash = new Uint8Array(await crypto.digest("SHA-256", advertisementKey));
    return toBase64(advertisementKeyHash);
}

export function getPublicKey(privateKey: string): ArrayBuffer {
    const curve = new EC("p224");
    const key = fromBase64(privateKey);
    const ki = curve.keyFromPrivate(key);
    return new Uint8Array(ki.getPublic().encode("array", true).slice(1)).buffer;
}

export function getMacAddress(privateKey: string): number[] {
    const keyData = [...new Uint8Array(getPublicKey(privateKey))];

    return [keyData[0] | 0b11000000, ...keyData.slice(1, 6)];
}

export interface ReportData {
    time: Date,
    lat: number,
    lon: number,
    accuracy: number,
    confidence: number
}

async function deriveX963(
    secret: Uint8Array,
    sharedInfo: Uint8Array,
    keyDataLength: number = 32
): Promise<Uint8Array> {
    const hashLength = 32;
    if (keyDataLength > hashLength) {
        throw new Error("Key data length exceeds hash length");
    }

    const buffer = new Uint8Array(secret.length + 4 + sharedInfo.length);
    const result = new Uint8Array(keyDataLength);

    let offset = 0;
    for (let counter = 1; offset < keyDataLength; counter++) {
        const counterView = new DataView(new ArrayBuffer(4));
        counterView.setUint32(0, counter, false);

        buffer.set(secret);
        buffer.set(new Uint8Array(counterView.buffer), secret.length);
        buffer.set(sharedInfo, secret.length + 4);

        const digest = await crypto.subtle.digest("SHA-256", buffer);
        const digestArray = new Uint8Array(digest);

        const length = Math.min(hashLength, keyDataLength - offset);
        result.set(digestArray.slice(0, length), offset);
        offset += length;
    }

    return result;
}

export async function decryptReport(report: string, privateKey: string): Promise<ReportData> {
    const reportData = fromBase64(report);
    const timestamp = new DataView(reportData.buffer).getUint32(0, false);
    const ephemeralKeyData = reportData.slice(reportData.length - 16 - 10 - 57, reportData.length - 16 - 10);
    const encryptedPayload = reportData.slice(reportData.length - 16 - 10, reportData.length - 16);
    const aeadTag = reportData.slice(reportData.length - 16, reportData.length);

    const time = new Date("2001-01-01T00:00:00.000Z");
    time.setUTCSeconds(timestamp);

    const curve = new EC("p224");

    const ecdhKey = curve.keyFromPrivate(fromBase64(privateKey));
    const ephemeralKey = curve.keyFromPublic(ephemeralKeyData);
    const sharedKey = ecdhKey.derive(ephemeralKey.getPublic());

    const aeadData = await deriveX963(new Uint8Array(sharedKey.toArray("be", 28)), ephemeralKeyData);

    const aeadIv = aeadData.slice(16);
    const aeadKey = await window.crypto.subtle.importKey(
        "raw",
        aeadData.slice(0, 16),
        "AES-GCM",
        false,
        ["decrypt"]
    );

    const cipherText = new Uint8Array(encryptedPayload.length + aeadTag.length);
    cipherText.set(encryptedPayload);
    cipherText.set(aeadTag, encryptedPayload.length);

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: aeadIv,
            tagLength: aeadTag.length * 8,
        },
        aeadKey,
        cipherText
    );

    const decryptedDataView = new DataView(decrypted);
    const lat = decryptedDataView.getUint32(0, false) / 10000000;
    const lon = decryptedDataView.getUint32(4, false) / 10000000;
    const accuracy = decryptedDataView.getUint8(8);
    const confidence = reportData[4];

    return {
        time,
        lat,
        lon,
        accuracy,
        confidence
    };
}