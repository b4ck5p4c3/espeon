import {AirTagsService} from "../airTags/airTags.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Module} from "@nestjs/common";
import {AirTag} from "../common/database/entities/airTag.entity";
import {Report} from "../common/database/entities/report.entity";
import {ReportsController} from "./reports.controller";
import {ReportsService} from "./reports.service";
import {ReportFetcherService} from "./reportFetcher/reportFetcher.service";
import {ConfigModule} from "@nestjs/config";
import {ReportsPusherService} from "./reportsPusher/reportsPusher.service";
import {UserAirTag} from "../common/database/entities/userAirTag.entity";
import {AppleFindMyService} from "../common/apple/appleFindMy.service";
import {UserAirTagsService} from "../airTags/userAirTags/userAirTags.service";

@Module({
    imports: [TypeOrmModule.forFeature([AirTag]),
        TypeOrmModule.forFeature([Report]),
        TypeOrmModule.forFeature([UserAirTag]),
        ConfigModule],
    providers: [AirTagsService, ReportsService, UserAirTagsService,
        ReportFetcherService, ReportsPusherService, AppleFindMyService],
    controllers: [ReportsController],
})
export class ReportsModule {
}