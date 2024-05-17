import {UserProfile} from "@/lib/auth-storage";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function callApi<TRequest, TResponse>(method: string, url: string, data: TRequest): Promise<TResponse> {
    const response = await fetch(`${BASE_URL}${url}`, {
        method,
        body: JSON.stringify(data),
        headers: data ? {
            "Content-Type": "application/json"
        } : {}
    });

    const responseData = await response.json();

    if (response.ok) {
        return responseData;
    }

    throw new Error(responseData.message);
}

export async function apiRegisterUser(username: string, registerToken: string): Promise<{ id: string }> {
    return await callApi("POST", "/users/register", {
        username,
        registerToken
    });
}

export async function apiLoginUser(username: string): Promise<{ encryptedId: string }> {
    return await callApi("POST", "/users/login", {
        username
    });
}

export async function apiUpdateEncryptedInUser(id: string, encryptedId: string): Promise<{}> {
    return await callApi("PATCH", `/users/${encodeURIComponent(id)}/encrypted`, {
        encryptedId
    });
}

export async function apiUpdateProfileInUser(id: string, profile: UserProfile): Promise<{}> {
    return await callApi("PATCH", `/users/${encodeURIComponent(id)}/profile`, profile);
}

export async function apiGetEncryptedFromUser(id: string): Promise<{ encryptedId: string }> {
    return await callApi("GET", `/users/${encodeURIComponent(id)}/encrypted`, undefined);
}

export async function apiGetProfileFromUser(id: string): Promise<UserProfile> {
    return await callApi("GET", `/users/${encodeURIComponent(id)}/profile`, undefined);
}

export async function apiAddAirTag(userId: string, advertisementKey: string, encryptedPrivateData: string): Promise<{
    id: string,
    advertisementKey: string,
    encryptedPrivateData: string,
    lastFetchTime: string
}> {
    return await callApi("POST", `/airtags/add`, {
        userId,
        advertisementKey,
        encryptedPrivateData
    });
}

export async function apiGetAirTagsByUser(userId: string): Promise<{
    id: string,
    advertisementKey: string,
    encryptedPrivateData: string,
    lastFetchTime: string | null,
    lastReportTime: string | null,
}[]> {
    return await callApi("GET", `/airtags/user/${encodeURIComponent(userId)}`, undefined);
}

export async function apiUpdateAirTag(id: string, encryptedPrivateData: string): Promise<{}> {
    return await callApi("PATCH", `/airtags/${encodeURIComponent(id)}/encrypted`, {
        encryptedPrivateData
    });
}

export async function apiDeleteAirTag(id: string): Promise<{}> {
    return await callApi("DELETE", `/airtags/${encodeURIComponent(id)}`, {});
}

export async function apiGetReportsByAirTags(from: string, to: string, airTagsIds: string[]): Promise<{
    [id: string]: {
        payload: string,
        time: string
    }[]
}> {
    return await callApi("POST", "/reports/search/multiple", {
        from,
        to,
        airTagsIds
    });
}