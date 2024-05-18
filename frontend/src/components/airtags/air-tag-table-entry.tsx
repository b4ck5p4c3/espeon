import {AirTagData} from "@/lib/types";
import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {EditAirTagDialog, EditAirTagFormData} from "@/components/airtags/edit-air-tag-dialog";
import {getAuthKey} from "@/lib/auth-storage";
import {UnauthorizedError} from "@/lib/utils";
import {encrypt} from "@/lib/client-cryptography";
import {apiDeleteAirTag, apiUpdateAirTag} from "@/lib/api";
import {TableCell, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Loader2, Pencil, RotateCw, Trash} from "lucide-react";
import {AIRTAGS_QUERY_KEY, REPORTS_QUERY_KEY} from "@/lib/cache-keys";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {AppleEmoji} from "@/components/apple-emoji";


export function ConfirmDeleteAirTagDialog({airTag, onSubmit, onOpenChange, loading}: {
    airTag: AirTagData,
    onSubmit: () => void,
    onOpenChange: (value: boolean) => void,
    loading: boolean
}) {
    const [airTagName, setAirTagName] = useState("");

    return <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm deletion of <AppleEmoji unified={airTag.privateData.icon} className={"h-4 w-4 inline"}/> {airTag.privateData.name}</DialogTitle>
                <DialogDescription>
                    <div>Enter the name of AirTag to confirm deletion.</div>
                    <div>Once deleted, everything including the reports of this AirTag will be deleted</div>
                </DialogDescription>
            </DialogHeader>
            <Input value={airTagName} onChange={e => setAirTagName(e.target.value)}></Input>
            <DialogFooter>
                <Button type="submit" variant={"destructive"} className={"w-full mt-4"} onClick={() => onSubmit()}
                        disabled={airTagName !== airTag.privateData.name || loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}

export function AirTagTableEntry({airTag}: { airTag: AirTagData }) {
    const [editAirTagOpened, setEditAirTagOpened] = useState(false);
    const [confirmDeleteAirTagOpened, setConfirmDeleteAirTagOpened] = useState(false);

    const queryClient = useQueryClient();

    const editAirTag = useMutation({
        mutationFn: async (data: EditAirTagFormData) => {
            const key = await getAuthKey();
            if (!key) {
                throw new UnauthorizedError();
            }

            const airTagData = JSON.stringify({
                privateKey: airTag.privateData.privateKey,
                name: data.name,
                icon: data.icon,
                color: data.color
            });
            const encryptedAirTagData = await encrypt(key, airTagData);

            await apiUpdateAirTag(airTag.id, encryptedAirTagData);
        },
        onSuccess: async () => {
            setEditAirTagOpened(false);
            await queryClient.refetchQueries({queryKey: [AIRTAGS_QUERY_KEY]});
            await queryClient.refetchQueries({queryKey: [REPORTS_QUERY_KEY]});
        }
    });

    const deleteAirTag = useMutation({
        mutationFn: async () => {
            await apiDeleteAirTag(airTag.id);
        },
        onSuccess: async () => {
            setConfirmDeleteAirTagOpened(false);
            await queryClient.refetchQueries({queryKey: [AIRTAGS_QUERY_KEY]});
            await queryClient.refetchQueries({queryKey: [REPORTS_QUERY_KEY]});
        }
    })

    return <>
        <TableRow key={airTag.id}>
            <TableCell>
                {airTag.privateData.name}
            </TableCell>
            <TableCell>
                <AppleEmoji unified={airTag.privateData.icon} className={"min-w-10 max-w-10 min-h-10 max-h-10"}/>
            </TableCell>
            <TableCell>
                <div style={{backgroundColor: airTag.privateData.color}} className={"w-6 h-6 rounded-full"}/>
            </TableCell>
            <TableCell>
                {airTag.advertisementKey}
            </TableCell>
            <TableCell>
                {airTag.lastFetchTime ? airTag.lastFetchTime.toLocaleString() : "Never"}
            </TableCell>
            <TableCell>
                {airTag.lastReportTime ? airTag.lastReportTime.toLocaleString() : "Never"}
            </TableCell>
            <TableCell>
                <div className={"flex flex-row justify-end"}>
                    <Button variant={"outline"} className={"h-8 w-8 p-0 mr-2"}
                            onClick={() => setEditAirTagOpened(true)}>
                        <Pencil className={"h-4 w-4"}/>
                    </Button>
                    <Button variant={"outline"} className={"h-8 w-8 p-0 mr-2"}
                            onClick={() => setConfirmDeleteAirTagOpened(true)}>
                        <Trash className={"h-4 w-4"}/>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
        {editAirTagOpened ? <EditAirTagDialog airTag={airTag} loading={editAirTag.isPending} onOpenChange={value => {
            if (!value && !editAirTag.isPending) {
                setEditAirTagOpened(false);
            }
        }} onSubmit={data => editAirTag.mutate(data)}/> : ""}
        {confirmDeleteAirTagOpened ?
            <ConfirmDeleteAirTagDialog airTag={airTag} loading={deleteAirTag.isPending} onOpenChange={value => {
                if (!value && !deleteAirTag.isPending) {
                    setConfirmDeleteAirTagOpened(false);
                }
            }} onSubmit={() => deleteAirTag.mutate()}/> : ""}
    </>;
}