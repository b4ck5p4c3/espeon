import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {User} from "./entities/user.entity";
import {AirTag} from "./entities/airTag.entity";
import {Report} from "./entities/report.entity";
import {UserAirTag} from "./entities/userAirTag.entity";

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                url: configService.getOrThrow("DATABASE_URL"),
                entities: [User, AirTag, Report, UserAirTag],
                synchronize: true
            }),
            inject: [ConfigService]
        })
    ]
})
export class DatabaseModule {}