"use client";

import {Button} from "@/components/ui/button";
import {Globe, Loader2, LogOut, Radio, Settings, User} from "lucide-react";
import React from "react";
import {clearAuthData, getAuthId} from "@/lib/auth-storage";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {usePathname, useRouter} from "next/navigation";
import {Separator} from "@/components/ui/separator";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {UnauthorizedError} from "@/lib/utils";
import {AUTH_AUTHORIZED_QUERY_KEY, AUTH_PROFILE_DATA_QUERY_KEY} from "@/lib/cache-keys";
import {apiGetProfileFromUser} from "@/lib/api";
import {YMaps} from "@pbe/react-yandex-maps";

function NavEntry({onClick, selected, children}: { onClick: () => void, selected: boolean } & Readonly<{
    children: React.ReactNode;
}>) {
    return <Button variant={selected ? "default" : "ghost"} className={"justify-start"} onClick={() => onClick()}>
        {children}
    </Button>;
}

function Nav({onLogout, onProfileSettings, children}: {
    onLogout: () => void,
    onProfileSettings: () => void
} & Readonly<{
    children: React.ReactNode;
}>) {
    const username = useQuery({
        queryFn: async () => {
            const id = getAuthId();
            if (!id) {
                throw new UnauthorizedError();
            }
            return await apiGetProfileFromUser(id);
        },
        retry: false,
        queryKey: [AUTH_PROFILE_DATA_QUERY_KEY]
    });

    return <div className={"flex flex-col w-full h-full"}>
        <div className={"flex flex-col pb-2 sm:pb-4 sm:pt-8 p-4 space-y-2"}>
            {children}
        </div>
        <div className={"flex-1"}/>
        <div className={"flex flex-col pt-0 sm:pt-4 p-4 sm:pb-8 space-y-2"}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"} className={"justify-start"}>
                        <User className="h-4 w-4 mr-2"></User>
                        {username.data?.username ?? <Loader2/>}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                    <DropdownMenuItem className={"cursor-pointer"} onClick={() => onProfileSettings()}>
                        <Settings className="mr-2 h-4 w-4"/>
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem className={"cursor-pointer"} onClick={() => onLogout()}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>;
}

export default function Dashboard({children}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const path = usePathname();
    const queryClient = useQueryClient();

    const logout = useMutation({
        mutationFn: () => {
            clearAuthData();
            return Promise.resolve();
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({queryKey: [AUTH_PROFILE_DATA_QUERY_KEY]});
            await queryClient.refetchQueries({queryKey: [AUTH_AUTHORIZED_QUERY_KEY]});
        }
    });

    function onProfileSettings() {
        router.push("/dashboard/profile")
    }

    return <div className={"w-full h-screen flex flex-col-reverse sm:flex-row"}>
        <div className={"min-w-72"}>
            <Nav onLogout={() => logout.mutate()} onProfileSettings={onProfileSettings}>
                <NavEntry onClick={() => router.push("/dashboard/map")} selected={path === "/dashboard/map"}>
                    <Globe className="h-4 w-4 mr-2"></Globe>
                    Map
                </NavEntry>
                <NavEntry onClick={() => router.push("/dashboard/airtags")} selected={path === "/dashboard/airtags"}>
                    <Radio className="h-4 w-4 mr-2"></Radio>
                    My AirTags
                </NavEntry>
            </Nav>
        </div>
        <Separator orientation="vertical" className={"h-[1px] w-full sm:h-full sm:w-[1px]"}/>
        <div className={"w-full flex-1 overflow-auto"}>
            <YMaps>
                {children}
            </YMaps>
        </div>
    </div>;
}