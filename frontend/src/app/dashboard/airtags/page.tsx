"use client";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import React, {useState} from "react";
import {getAdvertisementKey} from "@/lib/apple-cryptography";
import {getAuthId, getAuthKey} from "@/lib/auth-storage";
import {encrypt} from "@/lib/client-cryptography";
import {apiAddAirTag, apiGetAirTagsByUser} from "@/lib/api";
import {AddAirTagDialog, AddAirTagFormData} from "@/components/airtags/add-air-tag-dialog";
import {Loader2, Plus} from "lucide-react";
import {UnauthorizedError} from "@/lib/utils";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {decryptAirTags} from "@/lib/api-utils";
import {AIRTAGS_QUERY_KEY, REPORTS_QUERY_KEY} from "@/lib/cache-keys";
import {AirTagTableEntry} from "@/components/airtags/air-tag-table-entry";

export default function DashboardAirTags() {
    const airTags = useQuery({
        queryKey: [AIRTAGS_QUERY_KEY],
        queryFn: async () => {
            const userId = getAuthId();
            if (!userId) {
                throw new UnauthorizedError();
            }
            return decryptAirTags(await apiGetAirTagsByUser(userId));
        }
    });

    const queryClient = useQueryClient();

    const addAirTag = useMutation({
        mutationFn: async (data: AddAirTagFormData) => {
            const userId = getAuthId();
            const key = await getAuthKey();
            if (!userId || !key) {
                throw new UnauthorizedError();
            }

            const advertisementKey = await getAdvertisementKey(data.privateKey);
            const airTagData = JSON.stringify({
                privateKey: data.privateKey,
                name: data.name,
                icon: data.icon,
                color: data.color
            });
            const encryptedAirTagData = await encrypt(key, airTagData);

            await apiAddAirTag(userId, advertisementKey, encryptedAirTagData);
        },
        onSuccess: async () => {
            setAddAirTagOpened(false);
            await queryClient.refetchQueries({queryKey: [AIRTAGS_QUERY_KEY]});
            await queryClient.refetchQueries({queryKey: [REPORTS_QUERY_KEY]});
        },
    })

    const [addAirTagOpened, setAddAirTagOpened] = useState(false);

    return <div className={"sm:p-20 sm:pt-10 p-4"}>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>
                        Name
                    </TableHead>
                    <TableHead>
                        Icon
                    </TableHead>
                    <TableHead>
                        Color
                    </TableHead>
                    <TableHead>
                        MAC address
                    </TableHead>
                    <TableHead>
                        Private key
                    </TableHead>
                    <TableHead>
                        Advertisement key hash
                    </TableHead>
                    <TableHead>
                        Last fetch
                    </TableHead>
                    <TableHead>
                        Last report
                    </TableHead>
                    <TableHead>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {airTags.isLoading || airTags.error || airTags.data?.length === 0 ?
                    <TableRow>
                        <TableCell className="h-24" colSpan={7}>
                            <div className={"flex flex-row justify-center"}>
                                {airTags.isLoading ?
                                    <Loader2 className="mr-2 h-8 w-8 animate-spin"/> :
                                    (airTags.error ? `Error: ${airTags.error}` : "Add at least one to show there...")}
                            </div>
                        </TableCell>
                    </TableRow> : airTags.data?.slice(0)?.sort((a, b) => a.id > b.id ? 1 : -1)
                        .map(airTag => <AirTagTableEntry key={airTag.id} airTag={airTag}/>)}
            </TableBody>
        </Table>
        <div className={"flex flex-row justify-center"}>
            <Button variant={"outline"} className={"mt-4"} onClick={() => setAddAirTagOpened(true)}><Plus
                className={"mr-2"}/>Add</Button>
        </div>
        {addAirTagOpened ? <AddAirTagDialog loading={addAirTag.isPending} onSubmit={data => addAirTag.mutate(data)}
                                            onOpenChange={value => {
                                                if (!value && !addAirTag.isPending) {
                                                    setAddAirTagOpened(false);
                                                }
                                            }}/> : <></>}
    </div>;
}