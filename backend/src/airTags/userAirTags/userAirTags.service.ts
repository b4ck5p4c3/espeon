import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {AirTag} from "../../common/database/entities/airTag.entity";
import {In, Repository} from "typeorm";
import {UserAirTag} from "../../common/database/entities/userAirTag.entity";
import {User} from "../../common/database/entities/user.entity";

@Injectable()
export class UserAirTagsService {
    constructor(@InjectRepository(UserAirTag) private userAirTagsRepository: Repository<UserAirTag>) {
    }

    async createUserAirTag(user: User, airTag: AirTag, encryptedPrivateData: string): Promise<UserAirTag> {
        const userAirTag = this.userAirTagsRepository.create({
            user,
            airTag,
            encryptedPrivateData
        });
        await this.userAirTagsRepository.save(userAirTag);
        return userAirTag;
    }

    async findUserAirTagsByUser(user: User): Promise<UserAirTag[]> {
        return this.userAirTagsRepository.find({
            where: {
                user
            },
            relations: {
                airTag: true
            }
        });
    }

    async findUserAirTagById(id: string, includeAirTag: boolean): Promise<UserAirTag | null> {
        return this.userAirTagsRepository.findOne({
            where: {
                id
            },
            relations: includeAirTag ? {
                airTag: true
            } : {}
        });
    }

    async findManyByIds(ids: string[]): Promise<UserAirTag[]> {
        return this.userAirTagsRepository.find({
            where: {
                id: In(ids)
            },
            relations: {
                airTag: true,
            }
        });
    }

    async deleteUserAirTag(userAirTag: UserAirTag): Promise<void> {
        await this.userAirTagsRepository.remove([userAirTag]);
    }

    async userAirTagsExistByAirTag(airTag: AirTag): Promise<boolean> {
        return this.userAirTagsRepository.exists({
            where: {
                airTag
            }
        });
    }

    async updateUserAirTag(userAirTag: UserAirTag): Promise<void> {
        await this.userAirTagsRepository.save(userAirTag);
    }

    async findUserAirTagByUserAndAirTag(user: User, airTag: AirTag): Promise<UserAirTag | null> {
        return await this.userAirTagsRepository.findOneBy({
            user,
            airTag
        });
    }
}