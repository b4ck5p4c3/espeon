"use client";

import React, {useState} from "react";
import {PageCentered} from "@/components/page-centered";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {decrypt, encrypt, generateKey} from "@/lib/client-cryptography";
import {apiGetProfileFromUser, apiLoginUser, apiRegisterUser, apiUpdateEncryptedInUser} from "@/lib/api";
import {useToast} from "@/components/ui/use-toast";
import {useRouter} from "next/navigation";
import {storeAuthData} from "@/lib/auth-storage";
import {LoginForm, LoginFormData} from "@/components/auth/login-form";
import {RegisterForm, RegisterFormData} from "@/components/auth/register-form";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {AUTH_PROFILE_DATA_QUERY_KEY} from "@/lib/cache-keys";

export default function Auth() {
    const [currentTab, setCurrentTab] = useState("login");

    const router = useRouter();

    const {toast} = useToast();

    const queryClient = useQueryClient();

    const login = useMutation({
        mutationFn: async (data: LoginFormData) => {
            const {encryptedId} = await apiLoginUser(data.username);
            const key = await generateKey(data.password);
            let decryptedId: string;
            try {
                decryptedId = await decrypt(key, encryptedId);
            } catch (e) {
                throw new Error("Wrong password");
            }
            return {
                id: decryptedId,
                key
            }
        },
        onSuccess: async (data, inputData) => {
            toast({
                title: `Logged in successfully`
            });

            await storeAuthData(data.id, data.key);
            await queryClient.refetchQueries();
            router.push("/");
        }
    });

    const register = useMutation({
        mutationFn: async (data: RegisterFormData) => {
            const {id} = await apiRegisterUser(data.username, data.registerToken);
            const key = await generateKey(data.password);
            const encryptedId = await encrypt(key, id);
            await apiUpdateEncryptedInUser(id, encryptedId);
        },
        onSuccess: async () => {
            toast({
                title: `Registered successfully`
            });
            setCurrentTab("login");
        }
    })

    return (
        <PageCentered>
            <Tabs className={"w-max sm:min-w-96"} value={currentTab} onValueChange={tab => setCurrentTab(tab)}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" disabled={login.isPending || register.isPending}>Login</TabsTrigger>
                    <TabsTrigger value="register" disabled={login.isPending || register.isPending}>Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <LoginForm onSubmit={data => login.mutate(data)} loading={login.isPending}/>
                </TabsContent>
                <TabsContent value="register">
                    <RegisterForm onSubmit={data => register.mutate(data)} loading={register.isPending}/>
                </TabsContent>
            </Tabs>
        </PageCentered>
    )
}