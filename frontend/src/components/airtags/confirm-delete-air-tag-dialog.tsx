import {AirTagData} from "@/lib/types";
import React, {useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {AppleEmoji} from "@/components/apple-emoji";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";

export function ConfirmDeleteAirTagDialog({airTag, onSubmit, onOpenChange, loading}: {
    airTag: AirTagData,
    onSubmit: () => void,
    onOpenChange: (value: boolean) => void,
    loading: boolean
}) {
    const [airTagName, setAirTagName] = useState("");

    return <Dialog open={true} onOpenChange={onOpenChange} modal={false}>
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