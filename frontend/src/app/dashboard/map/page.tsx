"use client";

import {Clusterer, Map, Placemark, Polyline, useYMaps, YMaps} from "@pbe/react-yandex-maps";
import React, {useEffect} from "react";
import {Button} from "@/components/ui/button";
import {CalendarIcon, RefreshCw, RotateCw} from "lucide-react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {AIRTAGS_QUERY_KEY, REPORTS_QUERY_KEY} from "@/lib/cache-keys";
import {getAuthId, getAuthKey} from "@/lib/auth-storage";
import {cn, UnauthorizedError} from "@/lib/utils";
import {apiGetAirTagsByUser, apiGetReportsByAirTags} from "@/lib/api";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {addDays, format, startOfDay, subDays} from "date-fns";
import {DateRange} from "react-day-picker";
import {decryptReport, ReportData} from "@/lib/apple-cryptography";
import {decryptAirTags} from "@/lib/api-utils";
import {AirTagData} from "@/lib/types";

function MapComponent() {

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 14),
        to: new Date(),
    })

    const reports = useQuery({
        queryFn: async () => {
            const id = getAuthId();
            const key = await getAuthKey();
            if (!id || !key) {
                throw new UnauthorizedError();
            }

            const timeFrom = startOfDay(date?.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
            const timeTo = startOfDay(addDays(date?.to ?? new Date(), 1));

            const airTags = await decryptAirTags(await apiGetAirTagsByUser(id));
            const airTagReports = await apiGetReportsByAirTags(timeFrom.toISOString(),
                timeTo.toISOString(), airTags.map(airTag => airTag.id));

            const decryptedReports: {
                airTag: AirTagData,
                reports: { time: Date, data: ReportData }[]
            }[] = [];

            for (const airTag of airTags) {
                decryptedReports.push({
                    airTag,
                    reports: (await Promise.all(airTagReports[airTag.id].map((async report => {
                        return {
                            time: new Date(report.time),
                            data: await decryptReport(report.payload, airTag.privateData.privateKey)
                        };
                    })))).sort((a, b) => b.data.time.getTime() - a.data.time.getTime())
                });
            }

            return decryptedReports;
        },
        queryKey: [REPORTS_QUERY_KEY],
        retry: false
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        queryClient.refetchQueries({queryKey: [AIRTAGS_QUERY_KEY]}).catch(() => {
        });
    }, [reports.data, queryClient]);

    const yMaps = useYMaps(['templateLayoutFactory']);

    return <>{yMaps ? <Map defaultState={{center: [59.93, 30.31], zoom: 12}} width={"100%"} height={"100%"}>
        {
            reports.isFetching ? <></> : reports.data?.map((airTag, index) =>
                <Polyline key={airTag.airTag.id}
                          geometry={airTag.reports.map(item => ([item.data.lat, item.data.lon]))}
                          options={{
                              zIndex: index,
                              strokeColor: airTag.airTag.privateData.color,
                          }}
                />
            )
        }
        {
            reports.isFetching ? <></> : reports.data?.map((airTag, index) =>
                <Clusterer key={airTag.airTag.id} options={{
                    gridSize: 90,
                    zIndexHover: index,
                    clusterIconColor: airTag.airTag.privateData.color
                }}>
                    {airTag.reports.map(report =>
                        <Placemark
                            geometry={[report.data.lat, report.data.lon]} properties={{}}
                            key={`${airTag.airTag.id}-${report.data.time}`}
                            options={{
                                iconColor: airTag.airTag.privateData.color,
                                zIndex: index,
                                preset: 'islands#circleIcon'
                            }}
                        />
                    )}
                </Clusterer>
            )
        }
        {
            reports.isFetching ? <></> : reports.data?.filter(airTag => airTag.reports.length > 0)?.map((airTag, index) =>
                <Placemark key={airTag.airTag.id}
                           geometry={[airTag.reports[0].data.lat, airTag.reports[0].data.lon]}
                           options={{
                               zIndex: index + reports.data?.length,
                               iconLayout: yMaps!.templateLayoutFactory!.createClass(
                                   `<div style="font-size: 25px;
                                            background: white; width: 60px; height: 60px;
                                            position: absolute;
                                            left: -30px;
                                            top: -30px;
                                            border-radius: 50%;
                                            border: 8px solid $[properties.circleColor];
                                            display: flex; justify-content: center; align-items: center;">
                                            <div style="width: 60px; height: 60px; position: absolute;
                                            border-radius: 50%; border: 2px solid white"></div>
                                            <img style="width: 30px; height: 30px" 
                                            src="https://cdnjs.cloudflare.com/ajax/libs/emoji-datasource-apple/15.1.2/img/apple/64/$[properties.iconContent].png" 
                                            alt="Icon"/></div>`),
                           }}
                           properties={{
                               iconContent: airTag.airTag.privateData.icon,
                               circleColor: airTag.airTag.privateData.color
                           }}
                />
            )
        }
    </Map> : <></>}
        <div className={"absolute sm:right-6 sm:top-6 top-3 right-3 flex flex-row gap-4"}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "h-12 w-[250px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4"/>
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        max={30}
                    />
                </PopoverContent>
            </Popover>
            <Button disabled={reports.isFetching} onClick={() => reports.refetch()} className={"p-0 h-12 w-12"}
                    variant={"outline"}>
                <RotateCw className={`h-6 w-6 ${reports.isFetching ? "animate-spin" : ""}`}/>
            </Button>
        </div>
    </>;
}

export default function DashboardMap() {
    return <>
        <YMaps>
            <MapComponent/>
        </YMaps>
    </>;
}