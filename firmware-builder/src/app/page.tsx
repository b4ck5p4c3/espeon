"use client";

import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Copy, Loader2} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useCallback, useEffect, useState} from "react";
import {Octokit} from "octokit";
import {useQuery} from "@tanstack/react-query";
import {Badge} from "@/components/ui/badge";
import {useToast} from "@/hooks/use-toast";
import {KeyPair, generateKeyPair, isKeyPairValid, getMacAddress, getAdvertisementKeyData} from "@/lib/crypto";
import {BLE_DATA_TEMPLATE_BLOB} from "@/lib/firmware/templates";
import {patchFirmware} from "@/lib/firmware/patcher";

const octokit = new Octokit();

function downloadArray(data: Uint8Array, fileName: string, mimeType: string) {
    const blob = new Blob([data], {
        type: mimeType
    });
    const url = window.URL.createObjectURL(blob);
    downloadUrl(url, fileName);
}

function downloadUrl(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.style.display = "none";
    a.click();
    a.remove();
}

function macToString(mac: number[]): string {
    return mac.map(octet => octet.toString(16).padStart(2, "0")).join(":");
}

async function downloadAndBuild(
    release: string,
    keyPair: KeyPair,
    setStatus: (status: string) => void
): Promise<void> {
    setStatus("Fetching firmware binary...");
    const firmwareResponse = await fetch(`${process.env.NEXT_PUBLIC_FIRMWARE_DOWNLOAD_URL
    }/firmware-${release}.bin`);
    if (!firmwareResponse.ok) {
        throw new Error(`Failed to download firmware binary: ${firmwareResponse.status}`)
    }
    const firmwareBinary = new Uint8Array(await firmwareResponse.arrayBuffer());
    setStatus("Patching firmware binary...");

    const keyData = getAdvertisementKeyData(keyPair);

    const mac = getMacAddress(keyPair);
    const dataBlobMac = mac.slice(0).reverse();

    const bleDataBlob = new Uint8Array([
        ...dataBlobMac,
        0x1E, 0xFF, 0x4C, 0x00, 0x12, 0x19, 0x00,
        ...keyData.slice(6, 28), keyData[0] >> 6, 0x00
    ]);

    if (bleDataBlob.length !== BLE_DATA_TEMPLATE_BLOB.length) {
        throw new Error(`Failed to generate data blob, wrong length: ${bleDataBlob.length} != ${
            BLE_DATA_TEMPLATE_BLOB.length}`);
    }

    try {
        patchFirmware(firmwareBinary, BLE_DATA_TEMPLATE_BLOB, bleDataBlob);
    } catch (e) {
        throw new Error(`Failed to patch BLE data blob: ${e}`);
    }

    downloadArray(firmwareBinary, `firmware-${release}-${
        macToString(mac).replaceAll(":", "_")}.bin`, "application/octet-steam");
}

export default function Home() {
    const [keyPair, setKeyPair] = useState<KeyPair>({
        advertisement: "",
        advertisementHash: "",
        private: ""
    });
    const [selectedRelease, setSelectedRelease] = useState<string>("");
    const [isBuilding, setIsBuilding] = useState<boolean>(false);
    const [buildStatus, setBuildStatus] = useState<string>("");

    const {toast} = useToast();

    const releases = useQuery({
        queryFn: async () => {
            return (await octokit.rest.repos.listReleases({
                owner: process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER ?? "",
                repo: process.env.NEXT_PUBLIC_GITHUB_REPO_NAME ?? ""
            })).data;
        },
        retry: false,
        queryKey: ["releases"]
    });

    useEffect(() => {
        generateKeyPair()
            .then(keyPair => setKeyPair(keyPair));
    }, []);

    const copy = useCallback((text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                toast({
                    title: "Copied"
                })
            })
            .catch(error => {
                toast({
                    title: "Failed to copy",
                    description: "message" in error ? error.message : `${error}`,
                    variant: "destructive"
                });
            });
    }, [toast]);

    return (<main className={"w-6/12 m-auto flex flex-col mt-5 gap-5"}>
        <h1 className={"text-2xl"}>AirWCH firmware builder</h1>
        <Separator/>
        <div className={"flex flex-col gap-5"}>
            <Button disabled={isBuilding} onClick={() => generateKeyPair()
                .then(keyPair => setKeyPair(keyPair))}>Generate new key</Button>
            <div className={"flex flex-col gap-2"}>
                <div className={"flex flex-row items-center"}>
                    <div className={"min-w-[180px]"}>Private:</div>
                    <Input type={"text"} className={"rounded-r-none font-mono"} disabled={true} readOnly={true}
                           value={keyPair.private}/>
                    <Button className={"rounded-l-none"} onClick={() => copy(keyPair.private)}><Copy/></Button>
                </div>
                <div className={"flex flex-row items-center"}>
                    <div className={"min-w-[180px]"}>Advertisement:</div>
                    <Input type={"text"} className={"rounded-r-none font-mono"} disabled={true} readOnly={true}
                           value={keyPair.advertisement}/>
                    <Button className={"rounded-l-none"} onClick={() => copy(keyPair.advertisement)}><Copy/></Button>
                </div>
                <div className={"flex flex-row items-center"}>
                    <div className={"min-w-[180px]"}>Advertisement hash:</div>
                    <Input type={"text"} className={"rounded-r-none font-mono"} disabled={true} readOnly={true}
                           value={keyPair.advertisementHash}/>
                    <Button className={"rounded-l-none"}
                            onClick={() => copy(keyPair.advertisementHash)}><Copy/></Button>
                </div>
            </div>
        </div>
        <Separator/>
        <div className={"flex flex-row items-center"}>
            <div className={"min-w-[180px]"}>MAC address:</div>
            <Input disabled={true} readOnly={true} type={"text"} className={"rounded-r-none font-mono"}
                   value={macToString(getMacAddress(keyPair))}/>
            <Button className={"rounded-l-none"}
                    onClick={() => copy(macToString(getMacAddress(keyPair)))}><Copy/></Button>
        </div>
        <Separator/>
        <div className={"flex flex-row items-center"}>
            <div className={"min-w-[180px]"}>Firmware version:</div>
            <Select disabled={releases.isPending || releases.data?.length === 0 || isBuilding}
                    value={selectedRelease}
                    onValueChange={release => setSelectedRelease(release)}>
                <SelectTrigger>
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {
                        releases.data ? releases.data.map(release => <SelectItem key={release.tag_name}
                                                                                 value={release.tag_name}>
                            {release.tag_name} {release.prerelease ?
                            <Badge variant={"secondary"}>Prerelease</Badge> : <></>}</SelectItem>) : <></>
                    }
                </SelectContent>
            </Select>
        </div>
        <Button
            disabled={!isKeyPairValid(keyPair) || !selectedRelease || isBuilding}
            onClick={() => {
                setIsBuilding(true);
                setBuildStatus("Building...");
                downloadAndBuild(selectedRelease, keyPair,
                    status => setBuildStatus(status))
                    .catch(error => {
                        toast({
                            title: "Build failed",
                            description: "message" in error ? error.message : `${error}`,
                            variant: "destructive"
                        });
                    })
                    .finally(() => {
                        setIsBuilding(false)
                    });
            }}>
            {isBuilding ? <><Loader2 className={"animate-spin"}></Loader2>&nbsp;{buildStatus}</> : "Build!"}
        </Button>
    </main>);
}
