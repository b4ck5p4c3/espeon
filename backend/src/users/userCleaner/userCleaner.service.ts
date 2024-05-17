import {Cron, CronExpression} from "@nestjs/schedule";
import {Injectable, Logger} from "@nestjs/common";
import {UsersService} from "../users.service";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class UserCleanerService {
    private readonly logger = new Logger(UserCleanerService.name);

    constructor(private usersService: UsersService) {
    }

    @Cron(CronExpression.EVERY_HOUR)
    async cleanUsers() {
        this.logger.debug(`Cleaning not registered users`);
        await this.usersService.deleteNotRegisteredUsers(60 * 60);
    }
}