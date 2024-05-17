import {Body, Controller, HttpException, HttpStatus, OnModuleInit, Post} from '@nestjs/common';
import {AirTagsService} from "../airTags/airTags.service";
import {ReportsService} from "./reports.service";
import {IsISO8601, IsUUID} from "class-validator";
import {ConfigService} from "@nestjs/config";
import {UserAirTagsService} from "../airTags/userAirTags/userAirTags.service";
import {AppleFindMyService} from "../common/apple/appleFindMy.service";
import {ReportsPusherService} from "./reportsPusher/reportsPusher.service";
import {UserAirTag} from "../common/database/entities/userAirTag.entity";


class SearchMultipleAirTagsReportsDTO {
    @IsISO8601()
    from: string;

    @IsISO8601()
    to: string;

    @IsUUID(undefined, {each: true})
    airTagsIds: string[];
}

interface AirTagsReportsResults {
    [id: string]: {
        payload: string,
        time: string
    }[];
}

@Controller("reports")
export class ReportsController implements OnModuleInit {
    private maxAirTagsPerQuery: number;

    constructor(private airTagsService: AirTagsService,
                private reportsService: ReportsService,
                private userAirTagsService: UserAirTagsService,
                private appleFindMyService: AppleFindMyService,
                private reportsPusherService: ReportsPusherService,
                private configService: ConfigService) {
    }

    onModuleInit() {
        this.maxAirTagsPerQuery = parseInt(this.configService.getOrThrow("MAX_AIRTAGS_PER_QUERY"));
    }

    @Post("search/multiple")
    async getMultipleTagReports(@Body() data: SearchMultipleAirTagsReportsDTO) {
        let timeTo: Date = new Date(data.to);
        let timeFrom: Date = new Date(data.from);

        if (timeTo.getTime() - timeFrom.getTime() < 0) {
            throw new HttpException("from must be < to", HttpStatus.BAD_REQUEST);
        }

        if (timeTo.getTime() - timeFrom.getTime() > 30 * 24 * 60 * 60 * 1000) {
            throw new HttpException("to - from must be no longer than month", HttpStatus.BAD_REQUEST);
        }

        if (data.airTagsIds.length > this.maxAirTagsPerQuery) {
            throw new HttpException("Too many AirTags in one query", HttpStatus.BAD_REQUEST);
        }

        const airTags: UserAirTag[] = [];

        for (const id of data.airTagsIds) {
            const airTag = await this.userAirTagsService.findUserAirTagById(id, true);
            airTags.push(airTag);
        }

        const reports = await this.appleFindMyService.getReports(airTags.map(airTag =>
            airTag.airTag.advertisementKey));

        for (const airTag of airTags) {
            const key = airTag.airTag.advertisementKey;

            const airTagReports = reports[key];

            await this.reportsPusherService.pushReports(airTag.airTag, airTagReports.map(report => ({
                payload: report.payload,
                time: report.dataPublished
            })));

            await this.airTagsService.updateLastFetchTime(airTag.airTag, new Date());
        }

        const results: AirTagsReportsResults = {};

        for (const airTag of airTags) {
            const localAirTagReports = await this.reportsService.findReportsByAirTag(airTag.airTag, timeFrom, timeTo);

            results[airTag.id] = localAirTagReports.map(report => ({
                payload: report.payload,
                time: report.time.toISOString()
            }));
        }

        return results;
    }
}
