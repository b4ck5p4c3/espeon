import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {LessThan, Repository} from "typeorm";
import {AirTag} from "../common/database/entities/airTag.entity";

@Injectable()
export class AirTagsService {
    constructor(@InjectRepository(AirTag) private airTagsRepository: Repository<AirTag>) {
    }

    async createAirTag(advertisementKey: string): Promise<AirTag> {
        const airTag = this.airTagsRepository.create({
            advertisementKey
        });
        await this.airTagsRepository.save(airTag);
        return airTag;
    }

    async findAirTagByAdvertisementKey(advertisementKey: string): Promise<AirTag> {
        return this.airTagsRepository.findOneBy({
            advertisementKey
        });
    }

    async findAirTagsWithUpdatesOlderThan(time: Date): Promise<AirTag[]> {
        return this.airTagsRepository.findBy({
            lastFetchTime: LessThan(time)
        });
    }

    async deleteAirTag(airTag: AirTag): Promise<void> {
        await this.airTagsRepository.remove(airTag);
    }

    async updateLastFetchTime(airTag: AirTag, lastFetchTime: Date): Promise<void> {
        airTag.lastFetchTime = lastFetchTime;
        await this.airTagsRepository.save(airTag);
    }
}