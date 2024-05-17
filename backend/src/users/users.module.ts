import {UsersController} from "./users.controller";
import {UsersService} from "./users.service";
import {User} from "../common/database/entities/user.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Module} from "@nestjs/common";
import {UserCleanerService} from "./userCleaner/userCleaner.service";
import {ConfigModule} from "@nestjs/config";

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([User])],
    providers: [UsersService, UserCleanerService],
    controllers: [UsersController]
})
export class UsersModule {
}