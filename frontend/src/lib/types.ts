export interface AirTagData {
    id: string,
    advertisementKey: string;
    lastFetchTime: Date | null;
    lastReportTime: Date | null;
    privateData: {
        name: string,
        icon: string,
        privateKey: string,
        color: string
    }
}

export interface RawAirTagData {
    id: string,
    advertisementKey: string;
    lastFetchTime: string | null;
    lastReportTime: string | null;
    encryptedPrivateData: string;
}