"use client";

import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {useQuery} from "@tanstack/react-query";
import {getAuthId, getAuthKey} from "@/lib/auth-storage";
import {UnauthorizedError} from "@/lib/utils";
import {AUTH_AUTHORIZED_QUERY_KEY} from "@/lib/cache-keys";

export default function Index() {
    const router = useRouter();
    const auth = useQuery({
        queryFn: async () => {
            const id = getAuthId();
            const key = await getAuthKey();
            if (!id || !key) {
                throw new UnauthorizedError();
            }
            return true;
        },
        retry: false,
        queryKey: [AUTH_AUTHORIZED_QUERY_KEY]
    });
    useEffect(() => {
        if (auth.data) {
            router.push("/dashboard/map");
        }
    }, [auth.data, router]);
    return <></>;
}