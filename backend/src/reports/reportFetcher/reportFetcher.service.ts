import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {AirTagsService} from "../../airTags/airTags.service";
import {Cron, CronExpression} from "@nestjs/schedule";
import {ConfigService} from "@nestjs/config";
import {AppleFindMyService} from "../../common/apple/appleFindMy.service";
import {ReportsPusherService} from "../reportsPusher/reportsPusher.service";

@Injectable()
export class ReportFetcherService implements OnModuleInit {
    private readonly logger = new Logger(ReportFetcherService.name);
    private maxAirTagsPerQuery: number;
    private airTagsStallInterval: number;

    constructor(private airTagsService: AirTagsService,
                private reportsPusherService: ReportsPusherService,
                private appleFindMyService: AppleFindMyService,
                private configService: ConfigService) {
    }

    onModuleInit() {
        this.maxAirTagsPerQuery = parseInt(this.configService.getOrThrow("MAX_AIRTAGS_PER_QUERY"));
        this.airTagsStallInterval = parseInt(this.configService.get("AIRTAG_FETCH_INTERVAL") ?? (6 * 24 * 60 * 60 * 1000).toString());
    }

    @Cron(CronExpression.EVERY_HOUR)
    async fetchReports() {
        const airTags = await this.airTagsService.findAirTagsWithUpdatesOlderThan(
            new Date(Date.now() - this.airTagsStallInterval));

        for (let i = 0; i < airTags.length; i += this.maxAirTagsPerQuery) {
            const airTagsToFetch = airTags.slice(i, this.maxAirTagsPerQuery);

            this.logger.debug(`Fetching AirTag data for ${airTagsToFetch.map(airTag => airTag.advertisementKey).join(', ')}`);

            const reports = await this.appleFindMyService.getReports(airTagsToFetch.map(airTag =>
                airTag.advertisementKey));

            for (const airTag of airTagsToFetch) {
                const key = airTag.advertisementKey;

                const airTagReports = reports[key];

                await this.reportsPusherService.pushReports(airTag, airTagReports.map(report => ({
                    payload: report.payload,
                    time: report.dataPublished
                })));

                await this.airTagsService.updateLastFetchTime(airTag, new Date());
            }
        }
    }
}