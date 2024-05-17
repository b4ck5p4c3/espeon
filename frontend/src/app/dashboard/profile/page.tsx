"use client";

import React from "react";
import {z} from "zod";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getAuthId, getAuthKey, storeAuthData, UserProfile} from "@/lib/auth-storage";
import {UnauthorizedError} from "@/lib/utils";
import {AUTH_PROFILE_DATA_QUERY_KEY} from "@/lib/cache-keys";
import {
    apiGetAirTagsByUser,
    apiGetProfileFromUser,
    apiUpdateAirTag,
    apiUpdateEncryptedInUser,
    apiUpdateProfileInUser
} from "@/lib/api";
import {decrypt, encrypt, generateKey} from "@/lib/client-cryptography";
import {RawAirTagData} from "@/lib/types";

const MAX_AIRTAG_UPDATE_TRIES = 5;

const profileUpdateFormSchema = z.object({
    username: z.string().min(2).max(32),
});

type ProfileUpdateFormData = z.infer<typeof profileUpdateFormSchema>;

function ProfileUpdateBlock({onSubmit, loading, user}: {
    onSubmit: (data: ProfileUpdateFormData) => void,
    loading: boolean,
    user: UserProfile
}) {
    const form = useForm<ProfileUpdateFormData>({
        resolver: zodResolver(profileUpdateFormSchema),
        defaultValues: {
            username: user.username
        }
    });

    return <Card className={"w-full"}>
        <CardHeader>
            <CardTitle>Profile settings</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pt-4 min-w-max">
                <CardContent>
                    <FormField
                        control={form.control}
                        name="username"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input disabled={loading} placeholder="someusername" {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className={"mt-4"} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save"}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>;
}


const passwordUpdateFormSchema = z.object({
    password: z.string().min(8),
    repeatPassword: z.string().min(8)
}).superRefine(({password, repeatPassword}, ctx) => {
    if (repeatPassword !== password) {
        ctx.addIssue({
            path: ["password"],
            fatal: true,
            code: "custom",
            message: "Passwords do not match"
        });
        ctx.addIssue({
            path: ["repeatPassword"],
            fatal: true,
            code: "custom",
            message: "Passwords do not match"
        });
    }
});

type PasswordUpdateFormData = z.infer<typeof passwordUpdateFormSchema>;

function PasswordUpdateBlock({onSubmit, loading}: {
    onSubmit: (data: PasswordUpdateFormData) => void,
    loading: boolean
}) {
    const form = useForm<PasswordUpdateFormData>({
        resolver: zodResolver(passwordUpdateFormSchema)
    });

    return <Card className={"w-full"}>
        <CardHeader>
            <CardTitle>Update password</CardTitle>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pt-4 min-w-max">
                <CardContent className={"space-y-4"}>
                    <FormField
                        control={form.control}
                        name="password"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>New password</FormLabel>
                                <FormControl>
                                    <Input type={"password"} disabled={loading} {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="repeatPassword"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Repeat new password</FormLabel>
                                <FormControl>
                                    <Input type={"password"} disabled={loading} {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className={"mt-4"} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Update"}
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>;
}

export default function DashboardProfile() {
    const userProfile = useQuery({
        queryFn: async () => {
            const id = getAuthId();
            if (!id) {
                throw new UnauthorizedError();
            }
            return await apiGetProfileFromUser(id);
        },
        queryKey: [AUTH_PROFILE_DATA_QUERY_KEY]
    });

    const queryClient = useQueryClient();

    const updateUserProfile = useMutation({
        mutationFn: async (data: ProfileUpdateFormData) => {
            const id = getAuthId();
            if (!id) {
                throw new UnauthorizedError();
            }
            await apiUpdateProfileInUser(id, data);
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({queryKey: [AUTH_PROFILE_DATA_QUERY_KEY]});
        }
    });

    const updatePassword = useMutation({
        mutationFn: async (data: PasswordUpdateFormData) => {
            const id = getAuthId();
            const oldKey = await getAuthKey();
            if (!id || !oldKey) {
                throw new UnauthorizedError();
            }

            const airTags = await apiGetAirTagsByUser(id);

            const newKey = await generateKey(data.password);

            const newEncryptedId = await encrypt(newKey, id);
            const newAirTags: RawAirTagData[] = [];

            for (const airTag of airTags) {
                const data = await decrypt(oldKey, airTag.encryptedPrivateData);
                newAirTags.push({
                    ...airTag,
                    encryptedPrivateData: await encrypt(newKey, data)
                });
            }

            await apiUpdateEncryptedInUser(id, newEncryptedId);

            for (const airTag of newAirTags) {
                for (let tryIndex = 0; tryIndex < MAX_AIRTAG_UPDATE_TRIES; tryIndex++) {
                    try {
                        await apiUpdateAirTag(airTag.id, airTag.encryptedPrivateData);
                        break;
                    } catch (e) {
                        if (tryIndex != MAX_AIRTAG_UPDATE_TRIES - 1) {
                            console.error(e);
                            continue;
                        }
                        throw e;
                    }
                }
            }

            await storeAuthData(id, newKey);
        }
    });

    return <div className={"w-full p-4 sm:p-20 flex flex-col items-center"}>
        {userProfile.isLoading ?
            <Loader2 className={"h-16 w-16"}/> :
            <div className={"space-y-8 w-full"}>
                <ProfileUpdateBlock user={userProfile.data!} onSubmit={data => updateUserProfile.mutate(data)}
                                    loading={updateUserProfile.isPending}/>
                <PasswordUpdateBlock onSubmit={data => updatePassword.mutate(data)} loading={updatePassword.isPending}/>
            </div>
        }
    </div>;
}