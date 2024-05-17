import {Module} from '@nestjs/common';
import {UsersModule} from "./users/users.module";
import {AirTagsModule} from "./airTags/airTags.module";
import {ReportsModule} from "./reports/reports.module";
import {ScheduleModule} from "@nestjs/schedule";
import {DatabaseModule} from "./common/database/database.module";
import {AppConfigModule} from "./common/config/appConfig.module";

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        ScheduleModule.forRoot(),
        UsersModule,
        AirTagsModule,
        ReportsModule
    ]
})
export class AppModule {
}
