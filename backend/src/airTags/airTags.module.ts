import {AirTagsController} from "./airTags.controller";
import {AirTagsService} from "./airTags.service";
import {User} from "../common/database/entities/user.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Module} from "@nestjs/common";
import {AirTag} from "../common/database/entities/airTag.entity";
import {UsersService} from "../users/users.service";
import {UserAirTagsService} from "./userAirTags/userAirTags.service";
import {UserAirTag} from "../common/database/entities/userAirTag.entity";
import {ReportsService} from "../reports/reports.service";
import {Report} from "../common/database/entities/report.entity"

@Module({
    imports: [TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([AirTag]),
        TypeOrmModule.forFeature([UserAirTag]),
        TypeOrmModule.forFeature([Report])],
    providers: [AirTagsService, UsersService, UserAirTagsService, ReportsService],
    controllers: [AirTagsController],
})
export class AirTagsModule {
}