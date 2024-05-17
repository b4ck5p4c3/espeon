"use client";

import React, {useState} from "react";
import {useToast} from "@/components/ui/use-toast";
import {useRouter} from "next/navigation";
import {UnauthorizedError} from "@/lib/utils";
import {MutationCache, QueryClient} from "@tanstack/query-core";
import {QueryCache, QueryClientProvider} from "@tanstack/react-query";

export function AppQueryClientProvider({children}: Readonly<{
    children: React.ReactNode;
}>) {
    const {toast} = useToast();
    const router = useRouter();

    function defaultErrorHandler(error: Error) {
        if (error instanceof UnauthorizedError) {
            router.push("/auth");
            return;
        }

        toast({
            title: "Error",
            description: "message" in error ? error.message : `${error}`,
            variant: "destructive"
        });
    }

    const [queryClient] = useState(new QueryClient({
        queryCache: new QueryCache({
            onError: defaultErrorHandler,
        }),
        mutationCache: new MutationCache({
            onError: defaultErrorHandler
        })
    }));

    return <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
}