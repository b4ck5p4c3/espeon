import {AirTagData, RawAirTagData} from "@/lib/types";
import {getAuthKey} from "@/lib/auth-storage";
import {UnauthorizedError} from "@/lib/utils";
import {decrypt} from "@/lib/client-cryptography";

export async function decryptAirTags(rawAirTags: RawAirTagData[]): Promise<AirTagData[]> {
    const key = await getAuthKey();
    if (!key) {
        throw new UnauthorizedError();
    }
    const resultAirTags: AirTagData[] = [];
    for (const airTag of rawAirTags) {
        resultAirTags.push({
            id: airTag.id,
            advertisementKey: airTag.advertisementKey,
            privateData: JSON.parse(await decrypt(key, airTag.encryptedPrivateData)),
            lastFetchTime: airTag.lastFetchTime ? new Date(airTag.lastFetchTime) : null,
            lastReportTime: airTag.lastReportTime ? new Date(airTag.lastReportTime) : null
        });
    }
    return resultAirTags;
}