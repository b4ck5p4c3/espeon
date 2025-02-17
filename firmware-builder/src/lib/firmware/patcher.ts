export function patchFirmware(firmware: Uint8Array, from: Uint8Array, to: Uint8Array): void {
    if (from.length < to.length) {
        throw new Error("to > from");
    }
    let startIndex = -1;
    for (let i = 0; i < firmware.length - from.length; i++) {
        let matches = true;
        for (let j = 0; j < from.length; j++) {
            if (firmware[i + j] != from[j]) {
                matches = false;
                break;
            }
        }
        if (matches) {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) {
        throw new Error("from not found");
    }

    for (let i = 0; i < to.length; i++) {
        firmware[startIndex + i] = to[i];
    }
}