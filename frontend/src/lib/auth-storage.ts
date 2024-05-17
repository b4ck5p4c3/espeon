"use client";

import {exportKey, importKey, Key} from "@/lib/client-cryptography";

const ID_LOCAL_STORAGE_KEY = "id";
const KEY_LOCAL_STORAGE_KEY = "key";

export interface UserProfile {
    username: string;
}

export async function storeAuthData(id: string, key: Key): Promise<void> {
    window.localStorage.setItem(ID_LOCAL_STORAGE_KEY, id);
    window.localStorage.setItem(KEY_LOCAL_STORAGE_KEY, await exportKey(key));
}

export function clearAuthData() {
    window.localStorage.removeItem(ID_LOCAL_STORAGE_KEY);
    window.localStorage.removeItem(KEY_LOCAL_STORAGE_KEY);
}

export function getAuthId(): string | null {
    return window.localStorage.getItem(ID_LOCAL_STORAGE_KEY) ?? null;
}

export async function getAuthKey(): Promise<Key | null> {
    const exportedKey = window.localStorage.getItem(KEY_LOCAL_STORAGE_KEY);
    if (!exportedKey) {
        return null;
    }
    return await importKey(exportedKey);
}