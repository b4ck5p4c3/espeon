export function generateMACAddress(): string {
    return [...Array(6)].map(() => Math.floor(256 * Math.random())
        .toString(16).toUpperCase().padStart(2, "0")).join(":");
}

export function isMACValid(mac: string): boolean {
    const parts = mac.split(":");
    if (parts.length != 6) {
        return false;
    }
    for (const part of parts) {
        if (!part.match(/^([0-9A-F]{2})$/)) {
            return false;
        }
    }
    return true;
}