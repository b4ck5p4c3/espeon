import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query} from '@nestjs/common';
import {AirTagsService} from "./airTags.service";
import {IsBase64, IsNotEmpty, IsString, IsUUID} from "class-validator";
import {UsersService} from "../users/users.service";
import {UserAirTagsService} from "./userAirTags/userAirTags.service";
import {ReportsService} from "../reports/reports.service";

class AddAirTagDTO {
    @IsUUID()
    userId: string;

    @IsNotEmpty()
    @IsBase64()
    advertisementKey: string;

    @IsNotEmpty()
    @IsBase64()
    encryptedPrivateData: string;
}

class UpdateAirTagEncryptedPrivateDataDto {
    @IsNotEmpty()
    @IsBase64()
    encryptedPrivateData: string;
}

@Controller("airtags")
export class AirTagsController {
    constructor(private usersService: UsersService,
                private airTagsService: AirTagsService,
                private userAirTagsService: UserAirTagsService,
                private reportsService: ReportsService) {
    }

    @Get("user/:userId")
    async getAirTags(@Param("userId") userId: string) {
        const user = await this.usersService.findUserById(userId);
        if (!user) {
            throw new HttpException("User does not exist", HttpStatus.NOT_FOUND);
        }

        const userAirTags = await this.userAirTagsService.findUserAirTagsByUser(user);
        return await Promise.all(userAirTags.map(async userAirTag => ({
            id: userAirTag.id,
            advertisementKey: userAirTag.airTag.advertisementKey,
            encryptedPrivateData: userAirTag.encryptedPrivateData,
            lastFetchTime: userAirTag.airTag.lastFetchTime?.toISOString() ?? null,
            lastReportTime: (await this.reportsService.findLastReportByAirTag(userAirTag.airTag))?.time ?? null
        })));
    }

    @Post("add")
    async addAirTag(@Body() addAirTagDto: AddAirTagDTO) {
        const user = await this.usersService.findUserById(addAirTagDto.userId);
        if (!user) {
            throw new HttpException("User does not exist", HttpStatus.NOT_FOUND);
        }

        const airTag = await this.airTagsService.findAirTagByAdvertisementKey(addAirTagDto.advertisementKey)
            ?? await this.airTagsService.createAirTag(addAirTagDto.advertisementKey);

        const existingUserAirTag = await this.userAirTagsService.findUserAirTagByUserAndAirTag(user, airTag);

        if (existingUserAirTag) {
            throw new HttpException("AirTag is already added", HttpStatus.BAD_REQUEST);
        }

        const userAirTag = await this.userAirTagsService.createUserAirTag(user, airTag, addAirTagDto.encryptedPrivateData);

        return {
            id: userAirTag.id,
            advertisementKey: airTag.advertisementKey,
            encryptedPrivateData: addAirTagDto.encryptedPrivateData,
            lastFetchTime: airTag.lastFetchTime?.toISOString() ?? null
        };
    }

    @Patch(":id/encrypted")
    async updateAirTagEncryptedPrivateData(@Param("id") id: string,
                                           @Body() updateAirTagEncryptedPrivateDataDto: UpdateAirTagEncryptedPrivateDataDto) {
        const userAirTag = await this.userAirTagsService.findUserAirTagById(id, false);

        if (!userAirTag) {
            throw new HttpException("AirTag not found", HttpStatus.NOT_FOUND)
        }

        userAirTag.encryptedPrivateData = updateAirTagEncryptedPrivateDataDto.encryptedPrivateData;
        await this.userAirTagsService.updateUserAirTag(userAirTag);

        return {};
    }

    @Delete(":id")
    async deleteUserAirTag(@Param("id") id: string): Promise<{}> {
        const userAirTag = await this.userAirTagsService.findUserAirTagById(id, true);

        if (!userAirTag) {
            throw new HttpException("AirTag not found", HttpStatus.NOT_FOUND);
        }

        const airTag = userAirTag.airTag;

        await this.userAirTagsService.deleteUserAirTag(userAirTag);

        const exist = await this.userAirTagsService.userAirTagsExistByAirTag(airTag);

        if (!exist) {
            await this.airTagsService.deleteAirTag(airTag);
        }

        return {};
    }
}
